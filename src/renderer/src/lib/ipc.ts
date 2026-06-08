export type DevicePlatform = 'android' | 'windows' | 'ios' | 'harmony'

export type DeviceStatus = 'online' | 'offline' | 'unauthorized' | 'unknown'

export interface DeviceInfo {
  id: string
  platform: DevicePlatform
  name: string
  status: DeviceStatus
  details?: Record<string, string>
}

export interface AndroidScreenSize {
  width: number
  height: number
}

export interface AndroidScreenshot {
  mime: 'image/png'
  data: string
  width?: number
  height?: number
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

  androidScreenSize: (deviceId: string): Promise<AndroidScreenSize> =>
    window.api.androidScreenSize(deviceId) as Promise<AndroidScreenSize>,

  androidScreenshot: (deviceId: string): Promise<AndroidScreenshot> =>
    window.api.androidScreenshot(deviceId) as Promise<AndroidScreenshot>,

  androidTap: (deviceId: string, x: number, y: number): Promise<void> =>
    window.api.androidTap(deviceId, x, y) as Promise<void>,

  androidSwipe: (
    deviceId: string,
    opts: { x1: number; y1: number; x2: number; y2: number; durationMs?: number }
  ): Promise<void> => window.api.androidSwipe(deviceId, opts) as Promise<void>,

  androidKeyevent: (deviceId: string, keyCode: number | string): Promise<void> =>
    window.api.androidKeyevent(deviceId, keyCode) as Promise<void>,

  androidInputText: (deviceId: string, text: string): Promise<void> =>
    window.api.androidInputText(deviceId, text) as Promise<void>,

  startDeviceWatch: (platform: DevicePlatform): Promise<void> =>
    window.api.startDeviceWatch(platform) as Promise<void>,

  stopDeviceWatch: (platform: DevicePlatform): Promise<void> =>
    window.api.stopDeviceWatch(platform) as Promise<void>,

  removeDevice: (platform: DevicePlatform, deviceId: string): Promise<boolean> =>
    window.api.removeDevice(platform, deviceId) as Promise<boolean>,

  onDevicesChanged: (callback: (payload: DevicesChangedPayload) => void): (() => void) =>
    window.api.onDevicesChanged((payload) =>
      callback(payload as DevicesChangedPayload)
    ) as () => void
}

export interface DevicesChangedPayload {
  platform: DevicePlatform
  devices: DeviceInfo[]
}
