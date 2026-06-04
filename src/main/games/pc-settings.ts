import type { PcSearchSettings } from './types'
import { loadGamesStore, updateStore } from './storage'

export function getPcSearchSettings(): PcSearchSettings {
  return loadGamesStore().pcSearch
}

export function setPcSearchSettings(settings: Partial<PcSearchSettings>): PcSearchSettings {
  updateStore((s) => {
    if (settings.dirNames?.length) {
      s.pcSearch.dirNames = settings.dirNames.map((n) => n.trim()).filter(Boolean)
    }
    if (settings.maxDepth !== undefined && settings.maxDepth >= 1 && settings.maxDepth <= 6) {
      s.pcSearch.maxDepth = settings.maxDepth
    }
  })
  return getPcSearchSettings()
}
