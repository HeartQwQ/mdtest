import type { DeviceAdapter, DeviceInfo } from './types'

/**
 * iOS 端接入：架构预留。
 * 后续通过 libimobiledevice（idevice_id / ideviceinfo）实现设备发现。
 */
export const iosAdapter: DeviceAdapter = {
  platform: 'ios',

  async isAvailable(): Promise<boolean> {
    return false
  },

  async listDevices(): Promise<DeviceInfo[]> {
    return []
  }
}
