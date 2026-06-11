import type { FilePathFavorite } from './types'
import { loadGamesStore, newId, updateStore } from './storage'

export type FilePathFavoriteInput = Omit<FilePathFavorite, 'id' | 'addedAt'>

function normalizeRemotePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
}

function normalizeRoot(root?: string): string {
  return root?.trim().replace(/\\/g, '/') ?? ''
}

function sameFavorite(left: FilePathFavorite, right: FilePathFavoriteInput): boolean {
  return (
    left.platform === right.platform &&
    left.sourceType === right.sourceType &&
    normalizeRoot(left.root) === normalizeRoot(right.root) &&
    left.path === normalizeRemotePath(right.path)
  )
}

export function listFilePathFavorites(platform: FilePathFavorite['platform'], root?: string): FilePathFavorite[] {
  const normalizedRoot = normalizeRoot(root)
  return loadGamesStore().filePathFavorites.filter((favorite) => {
    if (favorite.platform !== platform) return false
    if (platform === 'windows') return normalizeRoot(favorite.root) === normalizedRoot
    return true
  })
}

export function addFilePathFavorite(input: FilePathFavoriteInput): FilePathFavorite {
  const normalizedPath = normalizeRemotePath(input.path)
  const label = input.label.trim() || normalizedPath.split('/').filter(Boolean).at(-1) || '/'
  let result!: FilePathFavorite

  updateStore((store) => {
    const normalizedInput = { ...input, path: normalizedPath, label }
    const existing = store.filePathFavorites.find((favorite) => sameFavorite(favorite, normalizedInput))
    if (existing) {
      result = existing
      return
    }

    result = {
      ...normalizedInput,
      id: newId(),
      root: normalizeRoot(input.root) || undefined,
      addedAt: new Date().toISOString()
    }
    store.filePathFavorites.push(result)
    store.filePathFavorites.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  })

  return result
}

export function removeFilePathFavorite(id: string): boolean {
  let removed = false
  updateStore((store) => {
    const before = store.filePathFavorites.length
    store.filePathFavorites = store.filePathFavorites.filter((favorite) => favorite.id !== id)
    removed = store.filePathFavorites.length < before
  })
  return removed
}
