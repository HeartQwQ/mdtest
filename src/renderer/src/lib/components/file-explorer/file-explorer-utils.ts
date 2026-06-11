import type { FileEntry } from '$lib/files'

export type FileExplorerEntry = Pick<FileEntry, 'name' | 'path' | 'isDirectory' | 'size' | 'modifiedAt'>

export type SortKey = 'name' | 'modifiedAt' | 'size'
export type SortDirection = 'default' | 'asc' | 'desc'

export interface SortState {
  key: SortKey
  direction: SortDirection
}

export interface SelectionSummary {
  count: number
  knownSize: number
  folders: number
}

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface BreadcrumbSegment {
  label: string
  title: string
  target: string
}

export interface BreadcrumbRootInput {
  sourceType: 'local' | 'app' | 'device'
  platform?: 'android' | 'harmony' | 'ios'
  label?: string
  localRoot?: string
  packageId?: string
  dataRoot?: string
}

export function formatFileSize(size?: number, isDirectory = false): string {
  if (isDirectory || typeof size !== 'number' || !Number.isFinite(size)) return '—'
  if (size < 1024) return `${Math.max(0, Math.round(size))} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = size / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`
}

export function filterEntriesByName<T extends FileExplorerEntry>(entries: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return entries

  return entries.filter((entry) => entry.name.toLocaleLowerCase().includes(normalizedQuery))
}

export function cycleSortState(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, direction: 'asc' }
  if (current.direction === 'default') return { key, direction: 'asc' }
  if (current.direction === 'asc') return { key, direction: 'desc' }
  return { key, direction: 'default' }
}

function isMissingNumber(value?: number): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function compareMissingLast(aMissing: boolean, bMissing: boolean): number | null {
  if (aMissing && bMissing) return 0
  if (aMissing) return 1
  if (bMissing) return -1
  return null
}

function compareBySortKey<T extends FileExplorerEntry>(a: T, b: T, sort: SortState): number {
  if (sort.direction === 'default') {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
  }

  let result = 0
  if (sort.key === 'name') {
    result = a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
  } else if (sort.key === 'modifiedAt') {
    const aTime = a.modifiedAt ? new Date(a.modifiedAt).getTime() : Number.NaN
    const bTime = b.modifiedAt ? new Date(b.modifiedAt).getTime() : Number.NaN
    const missingResult = compareMissingLast(Number.isNaN(aTime), Number.isNaN(bTime))
    if (missingResult !== null) return missingResult
    result = aTime - bTime
  } else {
    const missingResult = compareMissingLast(isMissingNumber(a.size), isMissingNumber(b.size))
    if (missingResult !== null) return missingResult
    result = a.size! - b.size!
  }

  if (result === 0) {
    result = a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
  }
  return sort.direction === 'desc' ? -result : result
}

export function filterAndSortEntries<T extends FileExplorerEntry>(
  entries: T[],
  query: string,
  sort: SortState
): T[] {
  return [...filterEntriesByName(entries, query)].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return compareBySortKey(a, b, sort)
  })
}

export function getSelectionSummary(entries: FileExplorerEntry[]): SelectionSummary {
  return entries.reduce<SelectionSummary>(
    (summary, entry) => {
      summary.count += 1
      if (entry.isDirectory) {
        summary.folders += 1
      } else if (typeof entry.size === 'number' && Number.isFinite(entry.size)) {
        summary.knownSize += entry.size
      }
      return summary
    },
    { count: 0, knownSize: 0, folders: 0 }
  )
}

export function deriveFavoriteLabel(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
  return parts.at(-1) ?? '/'
}

export function getBreadcrumbRootSegments(input: BreadcrumbRootInput): BreadcrumbSegment[] {
  if (input.sourceType === 'local') {
    const displayRoot = (input.localRoot ?? '').replace(/\\/g, '/')
    return [
      {
        label: input.label?.trim() || displayRoot.split('/').filter(Boolean).pop() || displayRoot || '此电脑',
        title: displayRoot || input.label?.trim() || '此电脑',
        target: ''
      }
    ]
  }

  if (input.sourceType === 'app') {
    return [
      {
        label: input.label?.trim() || input.packageId?.trim() || '应用目录',
        title: input.dataRoot?.trim() || input.packageId?.trim() || '应用目录',
        target: ''
      }
    ]
  }

  if (input.platform === 'android') {
    const deviceLabel = input.label?.trim() || 'Android 设备'
    return [
      { label: deviceLabel, title: deviceLabel, target: '' },
      { label: '内部存储', title: input.dataRoot?.trim() || '/storage/emulated/0', target: '' }
    ]
  }

  return [
    {
      label: input.label?.trim() || input.dataRoot?.trim() || '/',
      title: input.dataRoot?.trim() || input.label?.trim() || '/',
      target: ''
    }
  ]
}

export function getContextMenuPosition(point: Point, menu: Size, viewport: Size, margin = 8): Point {
  const maxX = Math.max(margin, viewport.width - menu.width - margin)
  const wouldOverflowBottom = point.y + menu.height + margin > viewport.height
  const y = wouldOverflowBottom ? point.y - menu.height - margin : point.y

  return {
    x: Math.min(Math.max(point.x, margin), maxX),
    y: Math.max(y, margin)
  }
}
