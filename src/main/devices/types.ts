export type DevicePlatform = 'android' | 'windows' | 'ios' | 'harmony'

export type DeviceStatus = 'online' | 'offline' | 'unauthorized' | 'unknown'

export interface DeviceInfo {
  id: string
  platform: DevicePlatform
  name: string
  status: DeviceStatus
  details?: Record<string, string>
}

export interface DeviceAdapter {
  platform: DevicePlatform
  /** 当前环境是否具备该端接入的前置条件（工具链是否就绪）。 */
  isAvailable(): Promise<boolean>
  /** 列出当前已连接的设备。 */
  listDevices(): Promise<DeviceInfo[]>
}
