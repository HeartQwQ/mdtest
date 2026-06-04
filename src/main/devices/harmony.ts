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
      name: isUartCom
        ? `${id}（串口通道，非 USB 手机）`
        : details.extra
          ? `${id} (${details.extra})`
          : id,
      status: mapStatus(statusRaw),
      details: {
        ...details,
        ...(isUartCom ? { note: 'HDC 扫描到的 UART/COM 端口，多为板载或蓝牙虚拟串口' } : {})
      }
    })
  }

  return devices
}

/** 是否为用户通常关心的真机/模拟器（USB、TCP），排除 UART/COM 串口条目。 */
export function isHarmonyHandset(device: DeviceInfo): boolean {
  const t = device.details?.transport?.toLowerCase()
  if (t === 'uart') return false
  if (/^COM\d+$/i.test(device.id)) return false
  return true
}

function filterHandsets(devices: DeviceInfo[]): DeviceInfo[] {
  const handsets = devices.filter(isHarmonyHandset)
  // 有真机时隐藏 COM 串口噪音；只有 COM 时仍显示并标注，避免列表空白却让用户困惑
  if (handsets.length > 0) return handsets
  return devices
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
    let out = await runHdc(['list', 'targets'])
    let devices = parseListTargets(out)

    if (devices.length === 0) {
      try {
        out = await runHdc(['list', 'targets', '-v'])
        devices = parseListTargets(out)
      } catch {
        /* 部分版本不支持 -v */
      }
    }

    return filterHandsets(devices)
  }
}
