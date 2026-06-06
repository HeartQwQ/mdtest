import type { DeviceAdapter, DeviceInfo, DeviceStatus } from './types'
import {
  adbOutputHasDevices,
  adbScanConfirmedEmpty,
  isAdbAvailable,
  runAdb
} from './adb-path'
import { queryAdbServer } from './adb-server'
import { log, logWarn } from '../log'

function mapStatus(state: string): DeviceStatus {
  switch (state) {
    case 'device':
      return 'online'
    case 'unauthorized':
    case 'authorizing':
      return 'unauthorized'
    case 'offline':
      return 'offline'
    default:
      return 'unknown'
  }
}

function parseDevicesOutput(out: string): DeviceInfo[] {
  const devices: DeviceInfo[] = []

  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('*') || trimmed.startsWith('List of devices')) continue

    const [serial, state, ...rest] = trimmed.split(/\s+/)
    if (!serial || !state) continue
    if (serial === 'adb' || serial === 'daemon') continue

    const details: Record<string, string> = {}
    for (const kv of rest) {
      const idx = kv.indexOf(':')
      if (idx > 0) {
        details[kv.slice(0, idx)] = kv.slice(idx + 1)
      }
    }

    devices.push({
      id: serial,
      platform: 'android',
      name: details['model'] ?? details['device'] ?? serial,
      status: mapStatus(state),
      details
    })
  }

  return devices
}

async function fetchDeviceList(): Promise<string> {
  // 优先通过 TCP 直连 adb server 获取设备列表（绕过 adb.exe 在 Windows + Node.js
  // 子进程下 stdout 为空的问题）
  try {
    const out = await queryAdbServer('host:devices-l')
    if (adbOutputHasDevices(out) || adbScanConfirmedEmpty(out)) {
      return out
    }
    logWarn('adb', 'TCP 直连 host:devices-l 无有效输出，回退到 adb.exe')
  } catch (err) {
    logWarn('adb', 'TCP 直连 adb server 失败，回退到 adb.exe', err)
  }

  // 回退：通过 adb.exe 命令行获取
  let out = await runAdb(['devices', '-l'])

  if (!adbOutputHasDevices(out) && !adbScanConfirmedEmpty(out)) {
    // 不做 kill-server：kill 会导致已连接设备反复掉线
    logWarn('adb', 'devices -l 无有效输出，短暂等待后重试')
    await new Promise((r) => setTimeout(r, 400))
    out = await runAdb(['devices', '-l'])
  }

  if (!adbOutputHasDevices(out) && !adbScanConfirmedEmpty(out)) {
    throw new Error('adb devices 扫描无有效结果')
  }

  return out
}

/**
 * 安卓设备接入：通过 adb devices -l 发现设备。
 */
export const androidAdapter: DeviceAdapter = {
  platform: 'android',

  async isAvailable(): Promise<boolean> {
    return isAdbAvailable()
  },

  async listDevices(): Promise<DeviceInfo[]> {
    const out = await fetchDeviceList()
    const devices = parseDevicesOutput(out)

    if (devices.length === 0) {
      log('adb', 'devices -l 确认当前无已连接设备')
      return []
    }

    log(
      'adb',
      `devices -l 发现 ${devices.length} 台`,
      devices.map((d) => `${d.id}:${d.status}`).join(', ')
    )

    return devices
  }
}
