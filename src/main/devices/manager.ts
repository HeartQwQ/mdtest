import type { DeviceAdapter, DeviceInfo, DevicePlatform } from './types'
import { androidAdapter } from './android'
import { windowsAdapter } from './windows'
import { iosAdapter } from './ios'
import { harmonyAdapter } from './harmony'

const adapters: Record<DevicePlatform, DeviceAdapter> = {
  android: androidAdapter,
  windows: windowsAdapter,
  ios: iosAdapter,
  harmony: harmonyAdapter
}

export async function listDevices(platform: DevicePlatform): Promise<DeviceInfo[]> {
  const adapter = adapters[platform]
  if (!adapter) return []
  try {
    return await adapter.listDevices()
  } catch (err) {
    console.error(`[devices] listDevices(${platform}) failed:`, err)
    return []
  }
}

/**
 * 与 listDevices 相同，但不吞错。用于设备监测，区分「确实没有设备」（返回 []）
 * 与「调用失败」（抛错，监测层保留上次列表，避免闪断）。
 */
export async function listDevicesOrThrow(platform: DevicePlatform): Promise<DeviceInfo[]> {
  const adapter = adapters[platform]
  if (!adapter) return []
  return adapter.listDevices()
}

export async function platformAvailability(): Promise<Record<DevicePlatform, boolean>> {
  const platforms = Object.keys(adapters) as DevicePlatform[]
  const entries = await Promise.all(
    platforms.map(
      async (platform) =>
        [platform, await adapters[platform].isAvailable().catch(() => false)] as const
    )
  )
  return Object.fromEntries(entries) as Record<DevicePlatform, boolean>
}
