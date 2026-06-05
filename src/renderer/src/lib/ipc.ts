export type DevicePlatform = 'android' | 'windows' | 'ios' | 'harmony'

export type DeviceStatus = 'online' | 'offline' | 'unauthorized' | 'unknown'

export interface DeviceInfo {
  id: string
  platform: DevicePlatform
  name: string
  status: DeviceStatus
  details?: Record<string, string>
}

export const ipc = {
  listDevices: (platform: DevicePlatform): Promise<DeviceInfo[]> =>
    window.api.listDevices(platform) as Promise<DeviceInfo[]>,

  platformAvailability: (): Promise<Record<DevicePlatform, boolean>> =>
    window.api.platformAvailability() as Promise<Record<DevicePlatform, boolean>>,

  adbPath: (): Promise<string | null> => window.api.adbPath() as Promise<string | null>,

  bundledAdb: (): Promise<boolean> => window.api.bundledAdb() as Promise<boolean>,

  hdcPath: (): Promise<string | null> => window.api.hdcPath() as Promise<string | null>,

  bundledHdc: (): Promise<boolean> => window.api.bundledHdc() as Promise<boolean>,

  idevicePath: (): Promise<string | null> => window.api.idevicePath() as Promise<string | null>,

  bundledIdevice: (): Promise<boolean> => window.api.bundledIdevice() as Promise<boolean>,

  startDeviceWatch: (platform: DevicePlatform): Promise<void> =>
    window.api.startDeviceWatch(platform) as Promise<void>,

  stopDeviceWatch: (platform: DevicePlatform): Promise<void> =>
    window.api.stopDeviceWatch(platform) as Promise<void>,

  onDevicesChanged: (callback: (payload: DevicesChangedPayload) => void): (() => void) =>
    window.api.onDevicesChanged((payload) =>
      callback(payload as DevicesChangedPayload)
    ) as () => void
}

export interface DevicesChangedPayload {
  platform: DevicePlatform
  devices: DeviceInfo[]
}
