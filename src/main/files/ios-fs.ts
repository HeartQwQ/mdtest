import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { app } from 'electron'
import { resolveIdeviceToolchainDir } from '../devices/idevice-path'
import { normalizeRemoteRelativePath } from './path-guards'
import type { FileEntry } from './types'

const execFileAsync = promisify(execFile)

function tempDir(): string {
  const dir = join(app.getPath('userData'), 'file-transfer-temp')
  mkdirSync(dir, { recursive: true })
  return dir
}

function tempFile(prefix: string): string {
  return join(tempDir(), `${prefix}-${randomUUID()}`)
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '')
}

/** AFC 路径：根为 `/`，子路径不带多余前缀。 */
function joinAfcPath(root: string, relative: string): string {
  const rel = relative.replace(/^\/+/, '').replace(/\\/g, '/')
  if (!rel || rel === '.') return root === '' ? '/' : root
  if (root === '/' || root === '') return rel
  return `${root.replace(/\/+$/, '')}/${rel}`
}

interface AfcStat {
  isDirectory: boolean
  size?: number
}

function parseAfcStat(output: string): AfcStat {
  const match = output.match(/\{[\s\S]*\}/)
  if (!match) return { isDirectory: false }
  try {
    const json = JSON.parse(match[0]) as { st_ifmt?: string; st_size?: number }
    return {
      isDirectory: json.st_ifmt === 'S_IFDIR',
      size: json.st_ifmt === 'S_IFREG' ? json.st_size : undefined
    }
  } catch {
    return { isDirectory: false }
  }
}

export async function runAfc(deviceId: string, command: string[], appId?: string): Promise<string> {
  const dir = resolveIdeviceToolchainDir()
  const exe = join(dir, 'afcclient.exe')

  const baseArgs = appId
    ? ['-u', deviceId, '--container', appId, ...command]
    : ['-u', deviceId, ...command]

  try {
    const { stdout, stderr } = await execFileAsync(exe, baseArgs, {
      timeout: 120000,
      cwd: dir,
      windowsHide: true,
      env: {
        ...process.env,
        PATH: `${dir};${process.env.PATH ?? ''}`
      },
      maxBuffer: 16 * 1024 * 1024
    })
    const combined = stripAnsi([stdout, stderr].filter(Boolean).join('\n'))
    if (/^Error:/m.test(combined)) {
      throw new Error(combined.trim())
    }
    return combined
  } catch (err) {
    const stdout =
      err && typeof err === 'object' && 'stdout' in err
        ? stripAnsi(String((err as { stdout?: string }).stdout ?? ''))
        : ''
    const stderr =
      err && typeof err === 'object' && 'stderr' in err
        ? stripAnsi(String((err as { stderr?: string }).stderr ?? ''))
        : ''
    const merged = [stdout, stderr].filter(Boolean).join('\n')
    if (/^Error:/m.test(merged)) {
      throw new Error(merged.trim())
    }
    if (stdout.trim()) return stdout
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(stderr ? `${message}\n${stderr}` : message)
  }
}

async function afcStat(deviceId: string, remotePath: string): Promise<AfcStat> {
  const out = await runAfc(deviceId, ['info', remotePath])
  return parseAfcStat(out)
}

export async function iosPathExists(deviceId: string, remotePath: string): Promise<boolean> {
  try {
    await runAfc(deviceId, ['ls', remotePath])
    return true
  } catch {
    return false
  }
}

export async function listIosDir(
  deviceId: string,
  relativePath: string,
  root = '/'
): Promise<{ root: string; entries: FileEntry[] }> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'list', { allowRoot: true })
  const remote = joinAfcPath(root, safeRelativePath)
  // 此版本 afcclient 不支持 `ls -l`（-l 会被当成全局选项），仅能用 plain ls
  const out = await runAfc(deviceId, ['ls', remote === '/' ? '/' : remote])
  const names = out
    .split(/\r?\n/)
    .map((line) => stripAnsi(line.trim()))
    .filter((name) => name && name !== '.' && name !== '..')

  if (names.length === 0) {
    return { root, entries: [] }
  }

  // 优化：并行 stat（限流 8 并发），避免 N+1 串行延迟
  const CONCURRENCY = 8
  const entries: (FileEntry | null)[] = new Array(names.length).fill(null)

  // 分批并行执行 stat
  for (let batchStart = 0; batchStart < names.length; batchStart += CONCURRENCY) {
    const batchEnd = Math.min(batchStart + CONCURRENCY, names.length)
    const batch = names.slice(batchStart, batchEnd)

    const results = await Promise.all(
      batch.map(async (name, batchIdx): Promise<FileEntry | null> => {
        const childRemote = joinAfcPath(remote === '/' ? '' : remote, name)
        try {
          const stat = await afcStat(deviceId, childRemote)
          const rel = safeRelativePath ? joinAfcPath(safeRelativePath, name) : name
          return {
            name,
            path: rel,
            isDirectory: stat.isDirectory,
            size: stat.size
          }
        } catch {
          return null
        }
      })
    )

    for (let i = 0; i < results.length; i++) {
      entries[batchStart + i] = results[i]
    }
  }

  const filtered = entries.filter((e): e is FileEntry => e !== null)

  return {
    root,
    entries: filtered.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }
}

export async function readIosFile(
  deviceId: string,
  relativePath: string,
  root = '/'
): Promise<{ text: string; binary: boolean }> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'read')
  const remote = joinAfcPath(root, safeRelativePath)
  const localTmp = tempFile('ios-read')
  try {
    await runAfc(deviceId, ['get', remote, localTmp])
    const buf = readFileSync(localTmp)
    const binary = buf.includes(0)
    return { text: binary ? buf.toString('base64') : buf.toString('utf8'), binary }
  } finally {
    rmSync(localTmp, { force: true })
  }
}

export async function writeIosFile(
  deviceId: string,
  relativePath: string,
  content: string,
  binary = false,
  root = '/'
): Promise<void> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'write')
  const remote = joinAfcPath(root, safeRelativePath)
  const localTmp = tempFile('ios-write')

  try {
    writeFileSync(localTmp, binary ? Buffer.from(content, 'base64') : content)

    const parent = remote.includes('/') ? remote.replace(/\/[^/]+$/, '') : ''
    if (parent) {
      try {
        await runAfc(deviceId, ['mkdir', parent])
      } catch {
        /* 父目录可能已存在 */
      }
    }

    await runAfc(deviceId, ['put', localTmp, remote])
  } finally {
    rmSync(localTmp, { force: true })
  }
}

export async function deleteIosPath(
  deviceId: string,
  relativePath: string,
  root = '/'
): Promise<void> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'delete')
  const remote = joinAfcPath(root, safeRelativePath)
  await runAfc(deviceId, ['rm', remote])
}

export async function mkdirIos(
  deviceId: string,
  relativePath: string,
  root = '/'
): Promise<void> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'mkdir')
  const remote = joinAfcPath(root, safeRelativePath)
  await runAfc(deviceId, ['mkdir', remote])
}

/* ------------------------------------------------------------------ */
/*  iOS 应用包沙盒目录操作（通过 --container 访问 house_arrest 服务）    */
/* ------------------------------------------------------------------ */

export async function listIosAppDir(
  deviceId: string,
  bundleId: string,
  relativePath = ''
): Promise<{ entries: FileEntry[] }> {
  // 使用 --container 模式，root 就是沙盒根目录 "/"
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'list', { allowRoot: true })
  const remote = joinAfcPath('/', safeRelativePath)
  const out = await runAfc(deviceId, ['ls', remote === '/' ? '/' : remote], bundleId)
  const names = out
    .split(/\r?\n/)
    .map((line) => stripAnsi(line.trim()))
    .filter((name) => name && name !== '.' && name !== '..')

  if (names.length === 0) {
    return { entries: [] }
  }

  // 并行 stat（限流 8 并发）
  const CONCURRENCY = 8
  const entries: (FileEntry | null)[] = new Array(names.length).fill(null)

  for (let batchStart = 0; batchStart < names.length; batchStart += CONCURRENCY) {
    const batchEnd = Math.min(batchStart + CONCURRENCY, names.length)
    const batch = names.slice(batchStart, batchEnd)

    const results = await Promise.all(
      batch.map(async (name): Promise<FileEntry | null> => {
        const childRemote = joinAfcPath(remote === '/' ? '' : remote, name)
        try {
          const statRaw = await runAfc(deviceId, ['info', childRemote], bundleId)
          const stat = parseAfcStat(statRaw)
          const rel = safeRelativePath ? joinAfcPath(safeRelativePath, name) : name
          return {
            name,
            path: rel,
            isDirectory: stat.isDirectory,
            size: stat.size
          }
        } catch {
          return null
        }
      })
    )

    for (let i = 0; i < results.length; i++) {
      entries[batchStart + i] = results[i]
    }
  }

  const filtered = entries.filter((e): e is FileEntry => e !== null)

  return {
    entries: filtered.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }
}

export async function iosAppPathExists(
  deviceId: string,
  bundleId: string,
  relativePath: string
): Promise<boolean> {
  try {
    const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'exists', {
      allowRoot: true
    })
    const remote = joinAfcPath('/', safeRelativePath)
    await runAfc(deviceId, ['ls', remote], bundleId)
    return true
  } catch {
    return false
  }
}

export async function readIosAppFile(
  deviceId: string,
  bundleId: string,
  relativePath: string
): Promise<{ text: string; binary: boolean }> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'read')
  const remote = joinAfcPath('/', safeRelativePath)
  const localTmp = tempFile('ios-app-read')
  try {
    await runAfc(deviceId, ['get', remote, localTmp], bundleId)
    const buf = readFileSync(localTmp)
    const binary = buf.includes(0)
    return { text: binary ? buf.toString('base64') : buf.toString('utf8'), binary }
  } finally {
    rmSync(localTmp, { force: true })
  }
}

export async function writeIosAppFile(
  deviceId: string,
  bundleId: string,
  relativePath: string,
  content: string,
  binary = false
): Promise<void> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'write')
  const remote = joinAfcPath('/', safeRelativePath)
  const localTmp = tempFile('ios-app-write')

  try {
    writeFileSync(localTmp, binary ? Buffer.from(content, 'base64') : content)

    const parent = remote.includes('/') ? remote.replace(/\/[^/]+$/, '') : ''
    if (parent) {
      try {
        await runAfc(deviceId, ['mkdir', parent], bundleId)
      } catch {
        /* 父目录可能已存在 */
      }
    }

    await runAfc(deviceId, ['put', localTmp, remote], bundleId)
  } finally {
    rmSync(localTmp, { force: true })
  }
}

export async function deleteIosAppPath(
  deviceId: string,
  bundleId: string,
  relativePath: string
): Promise<void> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'delete')
  const remote = joinAfcPath('/', safeRelativePath)
  await runAfc(deviceId, ['rm', remote], bundleId)
}

export async function mkdirIosApp(
  deviceId: string,
  bundleId: string,
  relativePath: string
): Promise<void> {
  const safeRelativePath = normalizeRemoteRelativePath(relativePath, 'mkdir')
  const remote = joinAfcPath('/', safeRelativePath)
  await runAfc(deviceId, ['mkdir', remote], bundleId)
}
