import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { DeviceInfo, DevicePlatform } from './types'

const FILE_NAME = 'device-registry.json'

/** 仅缓存移动三端；PC 目录走 games-store / pc-workspace。 */
export type CachedDevicePlatform = Exclude<DevicePlatform, 'windows'>

export interface CachedDeviceRecord {
  id: string
  platform: CachedDevicePlatform
  name: string
  details?: Record<string, string>
  addedAt: string
  lastSeenAt: string
}

interface RegistryStore {
  devices: CachedDeviceRecord[]
}

function filePath(): string {
  return join(app.getPath('userData'), FILE_NAME)
}

let cache: RegistryStore | null = null
let dirty = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

function load(): RegistryStore {
  if (cache) return cache
  const path = filePath()
  if (!existsSync(path)) {
    cache = { devices: [] }
    return cache
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as Partial<RegistryStore>
    cache = { devices: raw.devices ?? [] }
    return cache
  } catch {
    cache = { devices: [] }
    return cache
  }
}

function save(store: RegistryStore): void {
  cache = store
  dirty = true
  // 延迟写盘：合并短时间内多次 upsert 为一次 I/O
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null
      if (dirty) {
        dirty = false
        const path = filePath()
        mkdirSync(join(path, '..'), { recursive: true })
        writeFileSync(path, JSON.stringify(store, null, 2), 'utf-8')
      }
    }, 2000)
  }
}

function isMobilePlatform(p: DevicePlatform): p is CachedDevicePlatform {
  return p === 'android' || p === 'ios' || p === 'harmony'
}

export function upsertFromLive(live: DeviceInfo[]): void {
  if (live.length === 0) return
  const platform = live[0].platform
  if (!isMobilePlatform(platform)) return

  const now = new Date().toISOString()
  const store = load()

  for (const d of live) {
    const idx = store.devices.findIndex((x) => x.platform === platform && x.id === d.id)
    const record: CachedDeviceRecord = {
      id: d.id,
      platform,
      name: d.name,
      details: d.details,
      addedAt: idx >= 0 ? store.devices[idx].addedAt : now,
      lastSeenAt: now
    }
    if (idx >= 0) store.devices[idx] = record
    else store.devices.push(record)
  }

  save(store)
}

/** 合并实时列表与缓存：在线设备 + 曾见过且确认已拔出的离线设备。 */
export function mergeWithCache(
  platform: CachedDevicePlatform,
  live: DeviceInfo[],
  options?: { confirmedEmpty?: boolean }
): DeviceInfo[] {
  upsertFromLive(live)

  const merged = [...live]

  // 仅当 adb 明确返回「列表为空」时，才把历史设备标为离线；扫描失败不应污染为 offline
  if (!options?.confirmedEmpty) {
    return merged.sort((a, b) => {
      const ao = a.status === 'online' ? 0 : 1
      const bo = b.status === 'online' ? 0 : 1
      if (ao !== bo) return ao - bo
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  }

  const store = load()
  const liveIds = new Set(live.map((d) => d.id))

  for (const c of store.devices) {
    if (c.platform !== platform || liveIds.has(c.id)) continue
    merged.push({
      id: c.id,
      platform,
      name: c.name,
      status: 'offline',
      details: c.details
    })
  }

  return merged.sort((a, b) => {
    const ao = a.status === 'online' ? 0 : 1
    const bo = b.status === 'online' ? 0 : 1
    if (ao !== bo) return ao - bo
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

export function removeCachedDevice(platform: CachedDevicePlatform, deviceId: string): boolean {
  const store = load()
  const before = store.devices.length
  store.devices = store.devices.filter((d) => !(d.platform === platform && d.id === deviceId))
  if (store.devices.length === before) return false
  save(store)
  return true
}
