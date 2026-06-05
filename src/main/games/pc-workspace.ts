import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { log, logError } from '../log'
import { listPcPaths, addPcPath, removePcPath } from './pc-paths'
import { scanPcByDirNames } from './pc-scanner'
import { enrichPcPath, enrichScanPath, type PcGameInstance } from './pc-enrich'
import type { PcScanResult } from './types'

const CACHE_NAME = 'pc-game-scan-cache.json'

function cacheFile(): string {
  const dir = app.getPath('userData')
  return join(dir, CACHE_NAME)
}

let memoryCache: PcGameInstance[] | null = null

export function getCachedPcGames(): PcGameInstance[] | null {
  if (memoryCache) return memoryCache
  const file = cacheFile()
  if (!existsSync(file)) return null
  try {
    const data = JSON.parse(readFileSync(file, 'utf8')) as PcGameInstance[]
    memoryCache = data
    return data
  } catch {
    return null
  }
}

function saveCache(games: PcGameInstance[]): void {
  memoryCache = games
  const file = cacheFile()
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(file, JSON.stringify(games), 'utf8')
}

function mergeInstances(instances: PcGameInstance[]): PcGameInstance[] {
  const map = new Map<string, PcGameInstance>()
  for (const g of instances) {
    const key = g.path.toLowerCase()
    if (!map.has(key)) map.set(key, g)
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path))
}

export function listPcGameInstances(): PcGameInstance[] {
  const fromStore = listPcPaths().map(enrichPcPath)
  const cached = getCachedPcGames() ?? []
  return mergeInstances([...cached, ...fromStore])
}

export async function scanAndCachePcGames(): Promise<PcGameInstance[]> {
  log('game_scanner', '全量扫描开始')
  const started = Date.now()
  try {
    const scanResults: PcScanResult[] = await scanPcByDirNames()
    const scanned = scanResults.map((r) => enrichScanPath(r.path, r.label))

    for (const r of scanResults) {
      addPcPath(r.path, r.label, 'search')
    }

    const merged = mergeInstances([...scanned, ...listPcPaths().map(enrichPcPath)])
    saveCache(merged)
    log('game_scanner', `全量扫描完成，${merged.length} 条，耗时 ${Date.now() - started}ms`)
    return merged
  } catch (err) {
    logError('game_scanner', '全量扫描失败', err)
    throw err
  }
}

/** 仅读缓存与手动路径，不触发全盘扫描。 */
export async function ensurePcGamesLoaded(): Promise<PcGameInstance[]> {
  const instances = listPcGameInstances()
  log('game_scanner', `ensureLoaded 快路径，${instances.length} 条`)
  return instances
}

/** 从持久化存储与扫描缓存中移除 PC 游戏目录。 */
export function removePcGameInstance(id: string): boolean {
  const fromStore = listPcPaths().find((p) => p.id === id)
  let removed = false
  if (fromStore) removed = removePcPath(id) || removed

  const cached = getCachedPcGames()
  if (cached) {
    const next = cached.filter((g) => g.id !== id)
    if (next.length !== cached.length) {
      saveCache(next)
      removed = true
    }
  }

  return removed
}
