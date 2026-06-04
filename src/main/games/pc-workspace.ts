import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { listPcPaths, addPcPath } from './pc-paths'
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
  const scanResults: PcScanResult[] = await scanPcByDirNames()
  const scanned = scanResults.map((r) => enrichScanPath(r.path, r.label))

  for (const r of scanResults) {
    addPcPath(r.path, r.label, 'search')
  }

  const merged = mergeInstances([...scanned, ...listPcPaths().map(enrichPcPath)])
  saveCache(merged)
  return merged
}

export async function ensurePcGamesLoaded(): Promise<PcGameInstance[]> {
  const cached = getCachedPcGames()
  if (cached?.length) {
    void scanAndCachePcGames().catch(() => {})
    return mergeInstances([...cached, ...listPcPaths().map(enrichPcPath)])
  }
  try {
    return await scanAndCachePcGames()
  } catch {
    return listPcGameInstances()
  }
}
