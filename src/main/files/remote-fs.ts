import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { app } from 'electron'
import type { MobilePlatform } from '../games/types'
import { runAdb } from '../devices/adb-path'
import { runHdc } from '../devices/hdc-path'
import type { FileEntry } from './types'
import { resolvePackageDataRoot } from './mobile-data-path'
import { normalizeRemoteRelativePath } from './path-guards'
import { shellQuote } from './shell-quote'

function tempDir(): string {
  const dir = join(app.getPath('userData'), 'file-transfer-temp')
  mkdirSync(dir, { recursive: true })
  return dir
}

function tempFile(prefix: string): string {
  return join(tempDir(), `${prefix}-${randomUUID()}`)
}

function joinRemote(root: string, relative: string): string {
  const base = root.replace(/\/+$/, '')
  if (!relative || relative === '.') return base
  const rel = relative.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${base}/${rel}`
}

const LS_MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
}

function parseLsModifiedAt(monthText?: string, dayText?: string, yearOrTime?: string): string | undefined {
  if (!monthText || !dayText || !yearOrTime) return undefined

  const month = LS_MONTHS[monthText]
  const day = Number.parseInt(dayText, 10)
  if (month === undefined || Number.isNaN(day)) return undefined

  let year: number
  let hour = 0
  let minute = 0

  if (yearOrTime.includes(':')) {
    year = new Date().getFullYear()
    const [hourText, minuteText] = yearOrTime.split(':')
    hour = Number.parseInt(hourText, 10)
    minute = Number.parseInt(minuteText, 10)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return undefined
  } else {
    year = Number.parseInt(yearOrTime, 10)
    if (Number.isNaN(year)) return undefined
  }

  return new Date(Date.UTC(year, month, day, hour, minute, 0)).toISOString()
}

function parseLsLine(line: string, parentRemote: string): FileEntry | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed === 'total 0') return null

  const parts = trimmed.split(/\s+/)
  if (parts.length < 6) return null

  const perm = parts[0]
  if (!perm.startsWith('-') && !perm.startsWith('d') && !perm.startsWith('l')) return null

  const isDirectory = perm.startsWith('d')
  const isLink = perm.startsWith('l')
  if (isLink) return null

  const name = parts.slice(8).join(' ') || parts[parts.length - 1]
  if (!name || name === '.' || name === '..') return null

  const size = parseInt(parts[4], 10)
  const remotePath = joinRemote(parentRemote, name)

  return {
    name,
    path: name,
    isDirectory,
    size: Number.isNaN(size) ? undefined : size,
    modifiedAt: parseLsModifiedAt(parts[5], parts[6], parts[7])
  }
}

export function parseLsLineForTest(
  line: string,
  parentRemote: string,
  relativePath: string
): FileEntry | null {
  const ent = parseLsLine(line, parentRemote)
  if (ent) {
    ent.path = relativePath ? joinRemote(relativePath, ent.name) : ent.name
  }
  return ent
}

function parseLsOutput(out: string, remote: string, relativePath: string): FileEntry[] {
  const entries: FileEntry[] = []
  for (const line of out.split(/\r?\n/)) {
    const ent = parseLsLine(line, remote)
    if (ent) {
      ent.path = relativePath ? joinRemote(relativePath, ent.name) : ent.name
      entries.push(ent)
    }
  }
  return entries
}

async function runShell(
  platform: MobilePlatform,
  deviceId: string,
  cmd: string[]
): Promise<string> {
  if (platform === 'android') {
    return runAdb(['-s', deviceId, 'shell', ...cmd])
  }
  return runHdc(['-t', deviceId, 'shell', ...cmd])
}

export async function listMobileDir(
  platform: MobilePlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  dataRoot?: string
): Promise<{ root: string; entries: FileEntry[] }> {
  const root = dataRoot ?? (await resolvePackageDataRoot(platform, deviceId, packageId))
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'list', { allowRoot: true })
  const remote = joinRemote(root, safeRelativePath)
  const listTarget = remote.endsWith('/') ? remote : `${remote}/`
  const out = await runShell(platform, deviceId, ['ls', '-la', shellQuote(listTarget)])
  const entries = parseLsOutput(out, remote, safeRelativePath)

  return {
    root,
    entries: entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }
}

export async function readMobileFile(
  platform: MobilePlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  dataRoot?: string
): Promise<{ text: string; binary: boolean }> {
  const root = dataRoot ?? (await resolvePackageDataRoot(platform, deviceId, packageId))
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'read')
  const remote = joinRemote(root, safeRelativePath)
  const localTmp = tempFile('read')

  try {
    if (platform === 'android') {
      await runAdb(['-s', deviceId, 'pull', remote, localTmp])
    } else {
      await runHdc(['-t', deviceId, 'file', 'recv', remote, localTmp])
    }

    const buf = readFileSync(localTmp)
    const binary = buf.includes(0)
    return { text: binary ? buf.toString('base64') : buf.toString('utf8'), binary }
  } finally {
    rmSync(localTmp, { force: true })
  }
}

export async function writeMobileFile(
  platform: MobilePlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  content: string,
  binary = false,
  dataRoot?: string
): Promise<void> {
  const root = dataRoot ?? (await resolvePackageDataRoot(platform, deviceId, packageId))
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'write')
  const remote = joinRemote(root, safeRelativePath)
  const localTmp = tempFile('write')

  try {
    writeFileSync(localTmp, binary ? Buffer.from(content, 'base64') : content)

    if (platform === 'android') {
      const parent = remote.replace(/\/[^/]+$/, '')
      await runAdb(['-s', deviceId, 'shell', 'mkdir', '-p', shellQuote(parent)])
      await runAdb(['-s', deviceId, 'push', localTmp, remote])
    } else {
      await runHdc(['-t', deviceId, 'file', 'send', localTmp, remote])
    }
  } finally {
    rmSync(localTmp, { force: true })
  }
}

export async function deleteMobilePath(
  platform: MobilePlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  dataRoot?: string
): Promise<void> {
  const root = dataRoot ?? (await resolvePackageDataRoot(platform, deviceId, packageId))
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'delete')
  const remote = joinRemote(root, safeRelativePath)
  await runShell(platform, deviceId, ['rm', '-rf', shellQuote(remote)])
}

export async function mkdirMobile(
  platform: MobilePlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  dataRoot?: string
): Promise<void> {
  const root = dataRoot ?? (await resolvePackageDataRoot(platform, deviceId, packageId))
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'mkdir')
  const remote = joinRemote(root, safeRelativePath)
  await runShell(platform, deviceId, ['mkdir', '-p', shellQuote(remote)])
}
