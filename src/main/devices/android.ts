import type { DeviceAdapter, DeviceInfo, DeviceStatus } from './types'
import { isAdbAvailable, runAdb } from './adb-path'

function mapStatus(state: string): DeviceStatus {
  switch (state) {
    case 'device':
      return 'online'
    case 'unauthorized':
      return 'unauthorized'
    case 'offline':
      return 'offline'
    default:
      return 'unknown'
  }
}

/**
 * 安卓设备接入：通过 adb devices -l 发现设备。
 * adb 路径见 adb-path.ts（ADB_PATH / ANDROID_HOME / 默认 SDK 目录 / PATH）。
 */
export const androidAdapter: DeviceAdapter = {
  platform: 'android',

  async isAvailable(): Promise<boolean> {
    return isAdbAvailable()
  },

  async listDevices(): Promise<DeviceInfo[]> {
    const out = await runAdb(['devices', '-l'])
    const lines = out.split(/\r?\n/).slice(1)
    const devices: DeviceInfo[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const [serial, state, ...rest] = trimmed.split(/\s+/)
      if (!serial || !state) continue

      const details: Record<string, string> = {}
      for (const kv of rest) {
        const idx = kv.indexOf(':')
        if (idx > 0) {
          details[kv.slice(0, idx)] = kv.slice(idx + 1)
        }
      }

      devices.push({
        id: serial,
        platform: 'android',
        name: details['model'] ?? details['device'] ?? serial,
        status: mapStatus(state),
        details
      })
    }

    return devices
  }
}
