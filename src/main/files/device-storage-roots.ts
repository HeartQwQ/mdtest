import type { DeviceFsPlatform } from './device-fs'

export function getDeviceStorageRootCandidates(platform: DeviceFsPlatform): string[] {
  if (platform === 'android') return ['/storage/emulated/0', '/sdcard', '/']
  return ['/']
}
