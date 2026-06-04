import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { MobilePlatform } from '../games/types'
import { runAdb } from '../devices/adb-path'
import { runHdc } from '../devices/hdc-path'
import type { FileEntry } from './types'
import { resolvePackageDataRoot } from './mobile-data-path'
import { shellQuote } from './shell-quote'

function tempDir(): string {
  const dir = join(app.getPath('userData'), 'file-transfer-temp')
  mkdirSync(dir, { recursive: true })
  return dir
}

function joinRemote(root: string, relative: string): string {
  const base = root.replace(/\/+$/, '')
  if (!relative || relative === '.') return base
  const rel = relative.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${base}/${rel}`
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
    size: Number.isNaN(size) ? undefined : size
  }
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
  const remote = joinRemote(root, relativePath)

  const out = await runShell(platform, deviceId, ['ls', '-la', shellQuote(remote)])
  const entries: FileEntry[] = []

  for (const line of out.split(/\r?\n/)) {
    const ent = parseLsLine(line, remote)
    if (ent) {
      ent.path = relativePath ? joinRemote(relativePath, ent.name) : ent.name
      entries.push(ent)
    }
  }

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
  const remote = joinRemote(root, relativePath)
  const localTmp = join(tempDir(), `read-${Date.now()}`)

  if (platform === 'android') {
    await runAdb(['-s', deviceId, 'pull', remote, localTmp])
  } else {
    await runHdc(['-t', deviceId, 'file', 'recv', remote, localTmp])
  }

  const buf = readFileSync(localTmp)
  rmSync(localTmp, { force: true })
  const binary = buf.includes(0)
  return { text: binary ? buf.toString('base64') : buf.toString('utf8'), binary }
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
  const remote = joinRemote(root, relativePath)
  const localTmp = join(tempDir(), `write-${Date.now()}`)
  writeFileSync(localTmp, binary ? Buffer.from(content, 'base64') : content)

  if (platform === 'android') {
    const parent = remote.replace(/\/[^/]+$/, '')
    await runAdb(['-s', deviceId, 'shell', 'mkdir', '-p', shellQuote(parent)])
    await runAdb(['-s', deviceId, 'push', localTmp, remote])
  } else {
    await runHdc(['-t', deviceId, 'file', 'send', localTmp, remote])
  }
  rmSync(localTmp, { force: true })
}

export async function deleteMobilePath(
  platform: MobilePlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  dataRoot?: string
): Promise<void> {
  const root = dataRoot ?? (await resolvePackageDataRoot(platform, deviceId, packageId))
  const remote = joinRemote(root, relativePath)
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
  const remote = joinRemote(root, relativePath)
  await runShell(platform, deviceId, ['mkdir', '-p', shellQuote(remote)])
}
