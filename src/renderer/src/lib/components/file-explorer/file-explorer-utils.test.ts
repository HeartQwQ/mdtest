import { describe, expect, it } from 'vitest'
import {
  cycleSortState,
  deriveFavoriteLabel,
  filterAndSortEntries,
  filterEntriesByName,
  formatFileSize,
  getBreadcrumbRootSegments,
  getContextMenuPosition,
  getSelectionSummary,
  type FileExplorerEntry,
  type SortState
} from './file-explorer-utils'

describe('formatFileSize', () => {
  it('shows an em dash for folders and unknown sizes', () => {
    expect(formatFileSize(undefined)).toBe('—')
    expect(formatFileSize(1024, true)).toBe('—')
  })

  it('formats bytes without decimals', () => {
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('formats kilobytes and larger units with two decimals', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB')
    expect(formatFileSize(1048576)).toBe('1.00 MB')
  })
})

describe('filterEntriesByName', () => {
  const entries: FileExplorerEntry[] = [
    { name: 'Logs', path: 'Logs', isDirectory: true },
    { name: 'Config.ini', path: 'Config.ini', isDirectory: false, size: 512 },
    { name: 'client.log', path: 'client.log', isDirectory: false, size: 1536 }
  ]

  it('filters names case-insensitively', () => {
    expect(filterEntriesByName(entries, 'CONFIG').map((entry) => entry.name)).toEqual([
      'Config.ini'
    ])
  })

  it('preserves the existing order while filtering', () => {
    expect(filterEntriesByName(entries, 'log').map((entry) => entry.name)).toEqual([
      'Logs',
      'client.log'
    ])
  })
})

describe('filterAndSortEntries', () => {
  const entries: FileExplorerEntry[] = [
    { name: 'Saved', path: 'Saved', isDirectory: true, modifiedAt: '2026-01-03T00:00:00.000Z' },
    { name: 'Config', path: 'Config', isDirectory: true },
    { name: 'b.log', path: 'b.log', isDirectory: false, size: 2048, modifiedAt: '2026-01-02T00:00:00.000Z' },
    { name: 'a.log', path: 'a.log', isDirectory: false, size: 4096, modifiedAt: '2026-01-01T00:00:00.000Z' },
    { name: 'unknown.log', path: 'unknown.log', isDirectory: false }
  ]

  it('keeps default directory-first name ordering after search', () => {
    expect(filterAndSortEntries(entries, 'log', { key: 'name', direction: 'default' }).map((entry) => entry.name)).toEqual([
      'a.log',
      'b.log',
      'unknown.log'
    ])
  })

  it('sorts by name, modified time, and size while keeping folders first', () => {
    expect(filterAndSortEntries(entries, '', { key: 'name', direction: 'desc' }).map((entry) => entry.name)).toEqual([
      'Saved',
      'Config',
      'unknown.log',
      'b.log',
      'a.log'
    ])

    expect(filterAndSortEntries(entries, '', { key: 'modifiedAt', direction: 'asc' }).map((entry) => entry.name)).toEqual([
      'Saved',
      'Config',
      'a.log',
      'b.log',
      'unknown.log'
    ])

    expect(filterAndSortEntries(entries, '', { key: 'size', direction: 'desc' }).map((entry) => entry.name)).toEqual([
      'Saved',
      'Config',
      'a.log',
      'b.log',
      'unknown.log'
    ])
  })
})

describe('cycleSortState', () => {
  it('cycles default, ascending, descending, then default for one column', () => {
    const initial: SortState = { key: 'name', direction: 'default' }
    const asc = cycleSortState(initial, 'modifiedAt')
    const desc = cycleSortState(asc, 'modifiedAt')
    const backToDefault = cycleSortState(desc, 'modifiedAt')

    expect(asc).toEqual({ key: 'modifiedAt', direction: 'asc' })
    expect(desc).toEqual({ key: 'modifiedAt', direction: 'desc' })
    expect(backToDefault).toEqual({ key: 'modifiedAt', direction: 'default' })
  })
})

describe('getSelectionSummary', () => {
  it('counts selected items, known file sizes, and uncounted folders', () => {
    const summary = getSelectionSummary([
      { name: 'Saved', path: 'Saved', isDirectory: true },
      { name: 'a.log', path: 'a.log', isDirectory: false, size: 1024 },
      { name: 'b.log', path: 'b.log', isDirectory: false, size: 1536 },
      { name: 'unknown.log', path: 'unknown.log', isDirectory: false }
    ])

    expect(summary).toEqual({
      count: 4,
      knownSize: 2560,
      folders: 1
    })
  })
})

describe('deriveFavoriteLabel', () => {
  it('uses the last path segment as the favorite label', () => {
    expect(deriveFavoriteLabel('storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd')).toBe(
      'com.tencent.tmgp.pubgmhd'
    )
    expect(deriveFavoriteLabel('Saved\\Logs')).toBe('Logs')
    expect(deriveFavoriteLabel('')).toBe('/')
  })
})

describe('getBreadcrumbRootSegments', () => {
  it('shows Android device roots as the device internal storage path', () => {
    expect(
      getBreadcrumbRootSegments({
        sourceType: 'device',
        platform: 'android',
        label: 'HONOR 80 GT',
        dataRoot: '/storage/emulated/0'
      }).map((segment) => segment.label)
    ).toEqual(['HONOR 80 GT', '内部存储'])
  })
})

describe('getContextMenuPosition', () => {
  it('moves the menu left and up when it would overflow the viewport', () => {
    expect(
      getContextMenuPosition(
        { x: 780, y: 560 },
        { width: 180, height: 220 },
        { width: 800, height: 600 }
      )
    ).toEqual({ x: 612, y: 332 })
  })
})
