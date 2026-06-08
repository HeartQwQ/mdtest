import type { DeviceAdapter, DeviceInfo, DeviceStatus } from './types'
import { isIdeviceAvailable, runIdevice } from './idevice-path'

function parseInfo(stdout: string): Record<string, string> {
  const details: Record<string, string> = {}
  for (const line of stdout.split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key) details[key] = value
  }
  return details
}

function deviceName(details: Record<string, string>, udid: string): string {
  return (
    details.DeviceName ||
    details.ProductType ||
    details.ModelNumber ||
    udid.slice(0, 8)
  )
}

function isEmptyDeviceListError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('no device found') ||
    lower.includes('unable to retrieve device list') ||
    lower.includes('no device connected') ||
    lower.includes('could not connect to lockdownd') ||
    lower.includes('usbmux')
  )
}

async function fetchDeviceInfo(udid: string): Promise<{
  status: DeviceStatus
  details: Record<string, string>
}> {
  try {
    const out = await runIdevice('ideviceinfo', ['-u', udid])
    const details = parseInfo(out)
    details.udid = udid
    return { status: 'online', details }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stderr =
      err && typeof err === 'object' && 'stderr' in err
        ? String((err as { stderr?: string }).stderr ?? '')
        : ''

    const combined = `${message}\n${stderr}`.toLowerCase()
    if (
      combined.includes('not trusted') ||
      combined.includes('user denied') ||
      combined.includes('pairing dialog') ||
      combined.includes('lockdownd')
    ) {
      return { status: 'unauthorized', details: { udid } }
    }

    return { status: 'unknown', details: { udid, error: message } }
  }
}

/**
 * iOS 端接入：通过 libimobiledevice（idevice_id / ideviceinfo）发现 USB 连接设备。
 * Windows 需安装 Apple Mobile Device Support（iTunes 组件）以提供 usbmuxd。
 */
export const iosAdapter: DeviceAdapter = {
  platform: 'ios',

  async isAvailable(): Promise<boolean> {
    return isIdeviceAvailable()
  },

  async listDevices(): Promise<DeviceInfo[]> {
    let stdout = ''
    try {
      stdout = await runIdevice('idevice_id', ['-l'])
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (isEmptyDeviceListError(message)) return []
      throw err
    }

    const udids = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (udids.length === 0) return []

    const devices = await Promise.all(
      udids.map(async (udid) => {
        const { status, details } = await fetchDeviceInfo(udid)
        return {
          id: udid,
          platform: 'ios' as const,
          name: deviceName(details, udid),
          status,
          details
        }
      })
    )

    return devices
  }
}
