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
