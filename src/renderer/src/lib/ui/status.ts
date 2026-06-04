import type { DeviceInfo } from '../ipc'

export function statusDotClass(status: DeviceInfo['status'] | string): string {
  switch (status) {
    case 'online':
      return 'bg-online ring-2 ring-online/30'
    case 'unauthorized':
      return 'bg-warn'
    case 'offline':
      return 'bg-muted-foreground/50'
    default:
      return 'bg-muted-foreground/40'
  }
}
