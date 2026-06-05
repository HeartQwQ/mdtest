import type { DeviceAdapter, DeviceInfo, DeviceStatus } from './types'
import { isHdcAvailable, runHdc } from './hdc-path'

function mapStatus(raw: string): DeviceStatus {
  const s = raw.toLowerCase()
  if (s === 'device' || s === 'connected' || s === 'ready') return 'online'
  if (s === 'unauthorized') return 'unauthorized'
  if (s === 'offline') return 'offline'
  return 'unknown'
}

/**
 * 解析 `hdc list targets` / `hdc list targets -v` 输出。
 * 示例：
 *   emulator-5554   device
 *   8710XXXX    USB     Connected       localhost       hdc
 */
function parseListTargets(stdout: string): DeviceInfo[] {
  const devices: DeviceInfo[] = []

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (
      trimmed.startsWith('List of') ||
      trimmed === '[Empty]' ||
      trimmed.toLowerCase().includes('no targets') ||
      trimmed.startsWith('connect-key')
    ) {
      continue
    }

    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length < 2) continue

    const id = parts[0]
    let statusRaw = parts[1]
    const details: Record<string, string> = {}

    // -v 格式: id USB|TCP|UART Connected|Offline ...
    if (['usb', 'tcp', 'uart'].includes(statusRaw.toLowerCase())) {
      details.transport = statusRaw
      statusRaw = parts[2] ?? 'unknown'
      if (parts[3]) details.host = parts[3]
      if (parts[4]) details.channel = parts[4]
    }

    if (parts.length > 2 && !details.transport) {
      details.extra = parts.slice(2).join(' ')
    }

    const transport = details.transport?.toUpperCase()
    const isUartCom = transport === 'UART' || /^COM\d+$/i.test(id)

    devices.push({
      id,
      platform: 'harmony',
      name: details.extra ? `${id} (${details.extra})` : id,
      status: mapStatus(statusRaw),
      details: {
        ...details,
        ...(isUartCom ? { uartChannel: 'true' } : {})
      }
    })
  }

  return devices
}

/** 是否为用户关心的真机/模拟器（USB、TCP），排除 UART/COM 串口通道。 */
export function isHarmonyHandset(device: DeviceInfo): boolean {
  const t = device.details?.transport?.toLowerCase()
  if (t === 'uart') return false
  if (/^COM\d+$/i.test(device.id)) return false
  return true
}

function filterHandsets(devices: DeviceInfo[]): DeviceInfo[] {
  return devices.filter(isHarmonyHandset)
}

/**
 * 鸿蒙设备接入：通过 HDC（HarmonyOS Device Connector）发现设备。
 */
export const harmonyAdapter: DeviceAdapter = {
  platform: 'harmony',

  async isAvailable(): Promise<boolean> {
    return isHdcAvailable()
  },

  async listDevices(): Promise<DeviceInfo[]> {
    const out = await runHdc(['list', 'targets'])
    let devices = parseListTargets(out)

    const noUsbTargets =
      out.includes('[Empty]') || /\bno targets\b/i.test(out)

    // 无 USB/TCP 目标时 -v 往往只列出本机 UART/COM，跳过以免误报为「已连接设备」
    if (devices.length === 0 && !noUsbTargets) {
      try {
        const verbose = await runHdc(['list', 'targets', '-v'])
        devices = parseListTargets(verbose)
      } catch {
        /* 部分版本不支持 -v */
      }
    }

    return filterHandsets(devices)
  }
}
