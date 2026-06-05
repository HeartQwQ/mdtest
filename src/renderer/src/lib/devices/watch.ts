import { ipc, type DeviceInfo, type DevicePlatform } from '../ipc'

export type WatchablePlatform = DevicePlatform

export interface DeviceWatchOptions {
  onDevices: (devices: DeviceInfo[]) => void
  onError?: (message: string | null) => void
  onLoading?: (loading: boolean) => void
}

/**
 * 订阅主进程设备变化（四端），渲染层不轮询。
 */
export function watchDevices(
  platform: WatchablePlatform,
  options: DeviceWatchOptions
): () => void {
  let disposed = false
  let firstArrived = false

  options.onLoading?.(true)

  const unsubscribe = ipc.onDevicesChanged((payload) => {
    if (disposed || payload.platform !== platform) return
    if (!firstArrived) {
      firstArrived = true
      options.onLoading?.(false)
    }
    options.onError?.(null)
    options.onDevices(payload.devices)
  })

  void ipc.startDeviceWatch(platform)

  return () => {
    disposed = true
    unsubscribe()
    void ipc.stopDeviceWatch(platform)
  }
}

/** 同时订阅四端，返回统一 cleanup。 */
export function watchAllPlatforms(
  onUpdate: (platform: DevicePlatform, devices: DeviceInfo[]) => void,
  onLoading?: (platform: DevicePlatform, loading: boolean) => void
): () => void {
  const platforms: DevicePlatform[] = ['windows', 'android', 'ios', 'harmony']
  const stops = platforms.map((platform) =>
    watchDevices(platform, {
      onLoading: (v) => onLoading?.(platform, v),
      onDevices: (devices) => onUpdate(platform, devices)
    })
  )
  return () => stops.forEach((s) => s())
}

export function reconcileSelectedDevice(
  selected: DeviceInfo | null,
  devices: DeviceInfo[]
): DeviceInfo | null {
  if (!selected) return null
  return devices.find((d) => d.id === selected.id) ?? null
}

/** @deprecated 使用 watchDevices；保留给旧面板。 */
export type MobileDevicePlatform = Exclude<DevicePlatform, 'windows'>

export interface MobileDeviceWatchOptions {
  onDevices: (devices: DeviceInfo[], changed: boolean) => void
  onError?: (message: string | null) => void
  onLoading?: (loading: boolean) => void
}

export function watchMobileDevices(
  platform: MobileDevicePlatform,
  options: MobileDeviceWatchOptions
): () => void {
  return watchDevices(platform, {
    onLoading: options.onLoading,
    onError: options.onError,
    onDevices: (devices) => options.onDevices(devices, true)
  })
}
