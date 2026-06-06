import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { GamesStore, PcSearchSettings } from './types'

const FILE_NAME = 'games-store.json'

const DEFAULT_STORE: GamesStore = {
  mobileFavorites: [],
  pcPaths: [],
  pcSearch: {
    dirNames: ['ShadowTrackerExtra'],
    maxDepth: 5
  }
}

function filePath(): string {
  return join(app.getPath('userData'), FILE_NAME)
}

let cache: GamesStore | null = null

export function loadGamesStore(): GamesStore {
  if (cache) return cache

  const path = filePath()
  if (!existsSync(path)) {
    cache = structuredClone(DEFAULT_STORE)
    return cache
  }

  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as Partial<GamesStore>
    cache = {
      mobileFavorites: raw.mobileFavorites ?? [],
      pcPaths: raw.pcPaths ?? [],
      pcSearch: {
        dirNames: raw.pcSearch?.dirNames?.length
          ? raw.pcSearch.dirNames
          : DEFAULT_STORE.pcSearch.dirNames,
        maxDepth: raw.pcSearch?.maxDepth ?? DEFAULT_STORE.pcSearch.maxDepth
      }
    }
    return cache
  } catch {
    cache = structuredClone(DEFAULT_STORE)
    return cache
  }
}

export function saveGamesStore(store: GamesStore): void {
  cache = store
  writeFileSync(filePath(), JSON.stringify(store, null, 2), 'utf-8')
}

export function updateStore(mutator: (s: GamesStore) => void): GamesStore {
  const store = loadGamesStore()
  mutator(store)
  saveGamesStore(store)
  return store
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
