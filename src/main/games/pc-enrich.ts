import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import type { PcGamePathEntry } from './types'

const GAME_EXE = 'ShadowTrackerExtra.exe'
const WEGAME_PARTS = ['WeGameLauncher', 'launcher.exe']
const VERSION_INI_PARTS = ['Saved', 'SrcVersion.ini']

export interface PcGameInstance {
  id: string
  path: string
  label: string
  name: string
  source: PcGamePathEntry['source']
  hasExe: boolean
  exePath?: string
  launcherPath?: string
  appVersion?: string
  srcVersion?: string
}

function pathId(path: string): string {
  return createHash('sha256').update(path.toLowerCase()).digest('hex').slice(0, 16)
}

function readVersionIni(gameDir: string): { app?: string; src?: string } {
  const iniPath = join(gameDir, ...VERSION_INI_PARTS)
  if (!existsSync(iniPath)) return {}
  try {
    const content = readFileSync(iniPath, 'utf8')
    let app: string | undefined
    let src: string | undefined
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim()
      const eq = t.indexOf('=')
      if (eq < 0) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim()
      if (key === 'AppVersion') app = val
      if (key === 'SrcVersion') src = val
    }
    return { app, src }
  } catch {
    return {}
  }
}

export function enrichPcPath(entry: PcGamePathEntry): PcGameInstance {
  const gameDir = entry.path
  const exePath = join(gameDir, GAME_EXE)
  const hasExe = existsSync(exePath)

  let launcherPath: string | undefined
  const parent = join(gameDir, '..')
  const launcher = join(parent, ...WEGAME_PARTS)
  if (existsSync(launcher)) launcherPath = launcher

  const { app, src } = readVersionIni(gameDir)
  const parts = gameDir.replace(/\\/g, '/').split('/')
  const parentName = parts[parts.length - 2] ?? entry.label

  return {
    id: entry.id || pathId(gameDir),
    path: gameDir,
    label: entry.label,
    name: parentName,
    source: entry.source,
    hasExe,
    exePath: hasExe ? exePath : undefined,
    launcherPath,
    appVersion: app,
    srcVersion: src
  }
}

export function enrichScanPath(path: string, label: string): PcGameInstance {
  return enrichPcPath({
    id: pathId(path),
    path,
    label,
    source: 'search',
    addedAt: new Date().toISOString()
  })
}
