import type { WebContents } from 'electron'
import { ensureAdbServer, isAdbPathResolvable } from './adb-path'
import { createAdbTracker, type AdbTracker } from './adb-server'
import { mergeWithCache, upsertFromLive } from './device-registry'
import { listDevicesOrThrow } from './manager'
import { log, logWarn } from '../log'
import type { DeviceInfo, DevicePlatform } from './types'

export type WatchPlatform = DevicePlatform

export const DEVICES_CHANGED_CHANNEL = 'devices:changed'

/** 鸿蒙 / iOS 暂无稳定长连接事件，主进程定时刷新；安卓仅用 track-devices，无定时器。 */
const POLL_MS: Partial<Record<Exclude<WatchPlatform, 'windows' | 'android'>, number>> = {
  harmony: 2500,
  ios: 3000
}

export interface DevicesChangedPayload {
  platform: WatchPlatform
  devices: DeviceInfo[]
}

interface Mechanism {
  stop: () => void
}

function snapshot(devices: DeviceInfo[]): string {
  // 只比对稳定字段：id + status + name。
  // 排除 details —— ideviceinfo 每次轮询可能返回微小差异的字段，
  // 导致 snapshot 每次不同从而触发无意义的 broadcast。
  return JSON.stringify(
    devices.map((d) => ({ id: d.id, status: d.status, name: d.name }))
  )
}

function mergeList(platform: WatchPlatform, live: DeviceInfo[], confirmedEmpty = false): DeviceInfo[] {
  if (platform === 'windows') return live
  return mergeWithCache(platform, live, { confirmedEmpty })
}

/**
 * 主进程统一设备监测：
 * - 安卓：adb host:track-devices 长连接，变化时 listDevices 取详情（零定时轮询）
 * - 鸿蒙 / iOS：主进程定时刷新（工具链暂无稳定事件 API）
 * - PC：仅读缓存/手动路径，全量扫描由用户触发
 */
class DeviceMonitor {
  private subscribers = new Map<WatchPlatform, Set<WebContents>>()
  private mechanisms = new Map<WatchPlatform, Mechanism>()
  private lastDevices = new Map<WatchPlatform, DeviceInfo[]>()
  private lastSnapshot = new Map<WatchPlatform, string>()
  private busy = new Set<WatchPlatform>()
  private pendingRefresh = new Set<WatchPlatform>()
  private pendingForce = new Set<WatchPlatform>()
  private lastErrorLog = new Map<WatchPlatform, { signature: string; at: number }>()
  /** 同一 WebContents 订阅多端时只注册一次 destroyed，避免 MaxListenersExceededWarning。 */
  private destroyBound = new WeakSet<WebContents>()

  start(platform: WatchPlatform, wc: WebContents): void {
    let set = this.subscribers.get(platform)
    if (!set) {
      set = new Set()
      this.subscribers.set(platform, set)
    }
    set.add(wc)
    this.ensureDestroyListener(wc)
    log('devices', `start watch ${platform}`)

    if (!this.mechanisms.has(platform)) {
      this.createMechanism(platform)
    }

    const known = this.lastDevices.get(platform)
    if (known) this.sendTo(wc, platform, known)

    void this.refresh(platform, true)
  }

  stop(platform: WatchPlatform, wc: WebContents): void {
    const set = this.subscribers.get(platform)
    if (!set) return
    set.delete(wc)
    if (set.size === 0) {
      log('devices', `stop watch ${platform}`)
      this.subscribers.delete(platform)
      this.mechanisms.get(platform)?.stop()
      this.mechanisms.delete(platform)
    }
  }

  /** 外部变更（如添加/删除 PC 目录）后强制刷新。 */
  refresh(platform: WatchPlatform, force = false): Promise<void> {
    return this.doRefresh(platform, force)
  }

  private ensureDestroyListener(wc: WebContents): void {
    if (this.destroyBound.has(wc)) return
    this.destroyBound.add(wc)
    wc.once('destroyed', () => this.detach(wc))
  }

  private detach(wc: WebContents): void {
    for (const platform of [...this.subscribers.keys()]) {
      this.stop(platform, wc)
    }
  }

  private createMechanism(platform: WatchPlatform): void {
    if (platform === 'windows') {
      this.mechanisms.set('windows', { stop: () => {} })
      return
    }

    if (platform === 'android' && isAdbPathResolvable()) {
      const tracker: AdbTracker = createAdbTracker(() => {
        void this.doRefresh('android', false)
      })
      this.mechanisms.set('android', { stop: () => tracker.stop() })
      return
    }

    const intervalMs = POLL_MS[platform as keyof typeof POLL_MS]
    if (!intervalMs) return

    const timer = setInterval(() => void this.doRefresh(platform, false), intervalMs)
    this.mechanisms.set(platform, { stop: () => clearInterval(timer) })
  }

  private async doRefresh(platform: WatchPlatform, force = false): Promise<void> {
    if (this.busy.has(platform)) {
      if (force) this.pendingForce.add(platform)
      else this.pendingRefresh.add(platform)
      return
    }
    this.busy.add(platform)
    try {
      const live = await listDevicesOrThrow(platform)
      this.lastErrorLog.delete(platform)
      if (platform !== 'windows') upsertFromLive(live)
      // live 为空且未抛错 = 工具链确认无设备，才合并历史离线；扫描失败会抛错并保留上次列表
      const confirmedEmpty = platform !== 'windows' && live.length === 0
      const devices = mergeList(platform, live, confirmedEmpty)
      const snap = snapshot(devices)
      if (force || snap !== this.lastSnapshot.get(platform)) {
        this.lastSnapshot.set(platform, snap)
        this.lastDevices.set(platform, devices)
        log('devices', `refresh ${platform} live=${live.length} merged=${devices.length}`)
        this.broadcast(platform, devices)
      }
    } catch (err) {
      this.logRefreshError(platform, err)
      if (!this.lastDevices.has(platform)) {
        this.lastDevices.set(platform, [])
        this.lastSnapshot.set(platform, snapshot([]))
        this.broadcast(platform, [])
      }
    } finally {
      this.busy.delete(platform)
      const rerunForce = this.pendingForce.delete(platform)
      const rerunNormal = this.pendingRefresh.delete(platform)
      if (rerunForce || rerunNormal) {
        void this.doRefresh(platform, rerunForce)
      }
    }
  }

  private broadcast(platform: WatchPlatform, devices: DeviceInfo[]): void {
    const set = this.subscribers.get(platform)
    if (!set) return
    for (const wc of set) this.sendTo(wc, platform, devices)
  }

  private sendTo(wc: WebContents, platform: WatchPlatform, devices: DeviceInfo[]): void {
    if (!wc.isDestroyed()) {
      wc.send(DEVICES_CHANGED_CHANNEL, { platform, devices } satisfies DevicesChangedPayload)
    }
  }

  private logRefreshError(platform: WatchPlatform, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err)
    const signature = message.split(/\r?\n/).slice(0, 2).join('\n')
    const now = Date.now()
    const previous = this.lastErrorLog.get(platform)

    if (previous && previous.signature === signature && now - previous.at < 30000) {
      return
    }

    this.lastErrorLog.set(platform, { signature, at: now })
    logWarn('devices', `refresh ${platform} 失败`, err)
  }
}

export const deviceMonitor = new DeviceMonitor()

/** 应用启动时预热 adb server，避免首次 track 冷启动。 */
export function initDeviceMonitoring(): void {
  if (isAdbPathResolvable()) {
    void ensureAdbServer()
  }
}
