import { ipc, type DeviceInfo } from '../ipc'

export type MobileDevicePlatform = 'android' | 'harmony' | 'ios'

export interface MobileDeviceWatchOptions {
  onDevices: (devices: DeviceInfo[], changed: boolean) => void
  onError?: (message: string | null) => void
  onLoading?: (loading: boolean) => void
}

/**
 * 订阅主进程的设备变化事件，渲染层不再轮询。
 * 组件卸载时调用返回的 stop 取消订阅并通知主进程停止监测。
 */
export function watchMobileDevices(
  platform: MobileDevicePlatform,
  options: MobileDeviceWatchOptions
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
    options.onDevices(payload.devices, true)
  })

  void ipc.startDeviceWatch(platform)

  return () => {
    disposed = true
    unsubscribe()
    void ipc.stopDeviceWatch(platform)
  }
}

/** 轮询更新后保持选中项；设备离线则返回 null。 */
export function reconcileSelectedDevice(
  selected: DeviceInfo | null,
  devices: DeviceInfo[]
): DeviceInfo | null {
  if (!selected) return null
  return devices.find((d) => d.id === selected.id) ?? null
}
