import type { MobilePackageFavorite } from './types'
import { loadGamesStore, newId, updateStore } from './storage'

export function listMobileFavorites(): MobilePackageFavorite[] {
  return loadGamesStore().mobileFavorites
}

export function addMobileFavorite(
  applicationId: string,
  label?: string,
  note?: string
): MobilePackageFavorite {
  const id = applicationId.trim()
  let created!: MobilePackageFavorite

  updateStore((s) => {
    const exists = s.mobileFavorites.find((f) => f.applicationId === id)
    if (exists) {
      created = exists
      return
    }
    created = {
      id: newId(),
      applicationId: id,
      label: label?.trim() || id,
      note: note?.trim(),
      addedAt: new Date().toISOString()
    }
    s.mobileFavorites.push(created)
    s.mobileFavorites.sort((a, b) => a.label.localeCompare(b.label))
  })

  return created!
}

export function removeMobileFavorite(id: string): boolean {
  let removed = false
  updateStore((s) => {
    const before = s.mobileFavorites.length
    s.mobileFavorites = s.mobileFavorites.filter((f) => f.id !== id)
    removed = s.mobileFavorites.length < before
  })
  return removed
}

export function isFavoritePackage(applicationId: string): boolean {
  return loadGamesStore().mobileFavorites.some((f) => f.applicationId === applicationId)
}
