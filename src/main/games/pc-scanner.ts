import { existsSync } from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { log, logWarn } from '../log'
import type { PcScanResult } from './types'
import { getPcSearchSettings } from './pc-settings'

const execFileAsync = promisify(execFile)

const SKIP_DIRS = new Set([
  'windows',
  'program files',
  'program files (x86)',
  'programdata',
  '$recycle.bin',
  'system volume information',
  'node_modules',
  '.git',
  'appdata'
])

function getDriveLetters(): string[] {
  const drives: string[] = []
  for (let i = 67; i <= 90; i++) {
    const letter = String.fromCharCode(i)
    const root = `${letter}:\\`
    if (existsSync(root)) drives.push(letter)
  }
  return drives
}

/**
 * 在各盘符按目录名搜索（默认 ShadowTrackerExtra），深度可配置。
 * 使用 PowerShell，避免引入原生 NTFS 模块。
 */
export async function scanPcByDirNames(
  dirNames?: string[],
  maxDepth?: number
): Promise<PcScanResult[]> {
  if (process.platform !== 'win32') return []

  const settings = getPcSearchSettings()
  const names = dirNames?.length ? dirNames : settings.dirNames
  const depth = maxDepth ?? settings.maxDepth

  if (names.length === 0) return []

  const results: PcScanResult[] = []
  const seen = new Set<string>()
  const drives = getDriveLetters()
  log('game_scanner', `扫描盘符 ${drives.join(',')}，目录名 ${names.join(',')}，深度 ${depth}`)

  for (const drive of drives) {
    for (const dirName of names) {
      const filter = dirName.replace(/'/g, "''")
      const script = [
        `$root='${drive}:\\'`,
        `Get-ChildItem -LiteralPath $root -Filter '${filter}' -Directory -Recurse -Depth ${depth} -ErrorAction SilentlyContinue`,
        '| Select-Object -ExpandProperty FullName'
      ].join(' ')

      try {
        const { stdout } = await execFileAsync(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-Command', script],
          { timeout: 120000, maxBuffer: 8 * 1024 * 1024 }
        )

        for (const line of stdout.split(/\r?\n/)) {
          const path = line.trim()
          if (!path || seen.has(path.toLowerCase())) continue

          const parts = path.replace(/\\/g, '/').split('/')
          const parent = parts[parts.length - 2]?.toLowerCase() ?? ''
          if (SKIP_DIRS.has(parent)) continue

          seen.add(path.toLowerCase())
          results.push({
            path,
            matchedDirName: dirName,
            label: parts[parts.length - 2] ?? dirName
          })
        }
      } catch (err) {
        logWarn('game_scanner', `${drive}: 扫描 ${dirName} 失败`, err)
      }
    }
  }

  log('game_scanner', `扫描原始命中 ${results.length} 条`)
  return results.sort((a, b) => a.path.localeCompare(b.path))
}
