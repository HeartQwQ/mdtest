import type { WebContents } from 'electron'
import { isBundledAdbPresent } from './adb-path'
import { createAdbTracker, type AdbTracker } from './adb-server'
import { mergeWithCache, upsertFromLive } from './device-registry'
import { listDevicesOrThrow } from './manager'
import { log, logWarn } from '../log'
import type { DeviceInfo, DevicePlatform } from './types'

export type WatchPlatform = DevicePlatform

export const DEVICES_CHANGED_CHANNEL = 'devices:changed'

const POLL_MS: Record<Exclude<WatchPlatform, 'windows'>, number> = {
  android: 3000,
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
  return JSON.stringify(
    devices.map((d) => ({ id: d.id, status: d.status, name: d.name, details: d.details }))
  )
}

function mergeList(platform: WatchPlatform, live: DeviceInfo[]): DeviceInfo[] {
  if (platform === 'windows') return live
  return mergeWithCache(platform, live)
}

/**
 * 主进程统一设备监测：
 * - 安卓：adb host:track-devices 长连接
 * - 鸿蒙 / iOS：定时刷新
 * - PC：仅读缓存/手动路径，全量扫描由用户触发
 */
class DeviceMonitor {
  private subscribers = new Map<WatchPlatform, Set<WebContents>>()
  private mechanisms = new Map<WatchPlatform, Mechanism>()
  private lastDevices = new Map<WatchPlatform, DeviceInfo[]>()
  private lastSnapshot = new Map<WatchPlatform, string>()
  private busy = new Set<WatchPlatform>()
  private pendingForce = new Set<WatchPlatform>()
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

    if (platform === 'android' && isBundledAdbPresent()) {
      const tracker: AdbTracker = createAdbTracker(() => void this.refresh('android'))
      this.mechanisms.set('android', tracker)
      return
    }

    const timer = setInterval(() => void this.refresh(platform), POLL_MS[platform as Exclude<WatchPlatform, 'windows'>])
    this.mechanisms.set(platform, { stop: () => clearInterval(timer) })
  }

  private async doRefresh(platform: WatchPlatform, force = false): Promise<void> {
    if (this.busy.has(platform)) {
      if (force) this.pendingForce.add(platform)
      return
    }
    this.busy.add(platform)
    try {
      const live = await listDevicesOrThrow(platform)
      if (platform !== 'windows') upsertFromLive(live)
      const devices = mergeList(platform, live)
      const snap = snapshot(devices)
      if (force || snap !== this.lastSnapshot.get(platform)) {
        this.lastSnapshot.set(platform, snap)
        this.lastDevices.set(platform, devices)
        log('devices', `refresh ${platform} count=${devices.length}`)
        this.broadcast(platform, devices)
      }
    } catch (err) {
      logWarn('devices', `refresh ${platform} 失败`, err)
      if (!this.lastDevices.has(platform)) {
        this.lastDevices.set(platform, [])
        this.lastSnapshot.set(platform, snapshot([]))
        this.broadcast(platform, [])
      }
    } finally {
      this.busy.delete(platform)
      if (this.pendingForce.delete(platform)) {
        void this.doRefresh(platform, true)
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
}

export const deviceMonitor = new DeviceMonitor()
