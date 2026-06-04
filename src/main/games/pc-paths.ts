import type { PcGamePathEntry } from './types'
import { loadGamesStore, newId, updateStore } from './storage'

export function listPcPaths(): PcGamePathEntry[] {
  return loadGamesStore().pcPaths
}

export function addPcPath(path: string, label?: string, source: 'manual' | 'search' = 'manual'): PcGamePathEntry {
  const normalized = path.trim()
  let entry!: PcGamePathEntry

  updateStore((s) => {
    const exists = s.pcPaths.find((p) => p.path.toLowerCase() === normalized.toLowerCase())
    if (exists) {
      entry = exists
      return
    }
    entry = {
      id: newId(),
      path: normalized,
      label: label?.trim() || normalized,
      source,
      addedAt: new Date().toISOString()
    }
    s.pcPaths.push(entry)
  })

  return entry!
}

export function removePcPath(id: string): boolean {
  let removed = false
  updateStore((s) => {
    const before = s.pcPaths.length
    s.pcPaths = s.pcPaths.filter((p) => p.id !== id)
    removed = s.pcPaths.length < before
  })
  return removed
}
