import type { WebContents } from 'electron'
import { isBundledAdbPresent } from './adb-path'
import { createAdbTracker, type AdbTracker } from './adb-server'
import { listDevicesOrThrow } from './manager'
import type { DeviceInfo } from './types'

/** 仅手机三端支持自动监测；Windows(PC) 暂不在此。 */
export type WatchPlatform = 'android' | 'harmony' | 'ios'

export const DEVICES_CHANGED_CHANNEL = 'devices:changed'

const POLL_MS: Record<WatchPlatform, number> = {
  android: 3000, // 仅当 adb 不可用时退化为轮询
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

/**
 * 主进程统一设备监测：
 * - 安卓：adb host:track-devices 真事件长连接作为变化触发器
 * - 鸿蒙 / iOS：主进程内自适应定时监测
 * 变化时通过 IPC 事件推送给订阅的渲染进程，渲染层无需任何轮询。
 */
class DeviceMonitor {
  private subscribers = new Map<WatchPlatform, Set<WebContents>>()
  private mechanisms = new Map<WatchPlatform, Mechanism>()
  private lastDevices = new Map<WatchPlatform, DeviceInfo[]>()
  private lastSnapshot = new Map<WatchPlatform, string>()
  private busy = new Set<WatchPlatform>()

  start(platform: WatchPlatform, wc: WebContents): void {
    let set = this.subscribers.get(platform)
    if (!set) {
      set = new Set()
      this.subscribers.set(platform, set)
    }
    set.add(wc)
    wc.once('destroyed', () => this.detach(wc))

    if (!this.mechanisms.has(platform)) {
      this.createMechanism(platform)
    }

    // 已有缓存的新订阅者立即获得当前列表，避免空窗。
    const known = this.lastDevices.get(platform)
    if (known) this.sendTo(wc, platform, known)

    void this.refresh(platform, true)
  }

  stop(platform: WatchPlatform, wc: WebContents): void {
    const set = this.subscribers.get(platform)
    if (!set) return
    set.delete(wc)
    if (set.size === 0) {
      this.subscribers.delete(platform)
      this.mechanisms.get(platform)?.stop()
      this.mechanisms.delete(platform)
    }
  }

  private detach(wc: WebContents): void {
    for (const platform of [...this.subscribers.keys()]) {
      this.stop(platform, wc)
    }
  }

  private createMechanism(platform: WatchPlatform): void {
    if (platform === 'android' && isBundledAdbPresent()) {
      const tracker: AdbTracker = createAdbTracker(() => void this.refresh('android'))
      this.mechanisms.set('android', tracker)
      return
    }

    const timer = setInterval(() => void this.refresh(platform), POLL_MS[platform])
    this.mechanisms.set(platform, { stop: () => clearInterval(timer) })
  }

  private async refresh(platform: WatchPlatform, force = false): Promise<void> {
    if (this.busy.has(platform)) return
    this.busy.add(platform)
    try {
      const devices = await listDevicesOrThrow(platform)
      const snap = snapshot(devices)
      if (force || snap !== this.lastSnapshot.get(platform)) {
        this.lastSnapshot.set(platform, snap)
        this.lastDevices.set(platform, devices)
        this.broadcast(platform, devices)
      }
    } catch {
      // 调用失败：保留上次列表，避免闪断。
      // 仅当从未成功过时，发一次空列表以解除界面 loading。
      if (!this.lastDevices.has(platform)) {
        this.lastDevices.set(platform, [])
        this.lastSnapshot.set(platform, snapshot([]))
        this.broadcast(platform, [])
      }
    } finally {
      this.busy.delete(platform)
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
