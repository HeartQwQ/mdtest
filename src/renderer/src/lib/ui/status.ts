import type { DeviceInfo, DevicePlatform } from '../ipc'

/** 设备列表状态灯：有/可用=绿，无/不可用=灰；未授权=黄（仅移动端）。 */
export function statusDotClass(
  status: DeviceInfo['status'] | string,
  platform?: DevicePlatform
): string {
  if (platform === 'windows') {
    return status === 'online'
      ? 'bg-online ring-2 ring-online/30'
      : 'bg-muted-foreground/40'
  }

  switch (status) {
    case 'online':
      return 'bg-online ring-2 ring-online/30'
    case 'unauthorized':
      return 'bg-warn'
    default:
      return 'bg-muted-foreground/40'
  }
}
