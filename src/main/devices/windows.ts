import { existsSync } from 'fs'
import type { DeviceAdapter, DeviceInfo } from './types'
import { listPcGameInstances } from '../games/pc-workspace'
import type { PcGameInstance } from '../games/pc-enrich'

function instanceToDevice(g: PcGameInstance): DeviceInfo {
  const pathExists = existsSync(g.path)
  let status: DeviceInfo['status'] = 'offline'
  if (pathExists) {
    status = g.hasExe ? 'online' : 'unknown'
  }

  return {
    id: g.id,
    platform: 'windows',
    name: g.label || g.name || g.path,
    status,
    details: {
      path: g.path,
      hasExe: String(g.hasExe),
      source: g.source,
      ...(g.appVersion ? { appVersion: g.appVersion } : {}),
      ...(g.srcVersion ? { srcVersion: g.srcVersion } : {})
    }
  }
}

/**
 * PC 端：ShadowTrackerExtra 游戏目录列表（扫描 + 手动添加），
 * 目录存在视为在线，路径丢失视为离线。
 */
export const windowsAdapter: DeviceAdapter = {
  platform: 'windows',

  async isAvailable(): Promise<boolean> {
    return process.platform === 'win32'
  },

  async listDevices(): Promise<DeviceInfo[]> {
    if (process.platform !== 'win32') return []
    const instances = listPcGameInstances()
    return instances.map(instanceToDevice).sort((a, b) => {
      const ao = a.status === 'online' ? 0 : 1
      const bo = b.status === 'online' ? 0 : 1
      if (ao !== bo) return ao - bo
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  }
}
