import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import { basename, dirname, isAbsolute, join, relative as pathRelative, resolve, sep } from 'path'
import type { FileEntry } from './types'
import { dirCache, makeCacheKey } from './dir-cache'

function assertUnderRoot(root: string, target: string): string {
  const resolvedRoot = resolve(root)
  const resolvedTarget = resolve(resolvedRoot, target)
  const rel = pathRelative(resolvedRoot, resolvedTarget)

  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('路径越界')
  }
  return resolvedTarget
}

function assertNotRoot(relativePath: string, action: string): void {
  if (!relativePath.trim() || relativePath.trim() === '.') {
    throw new Error(`不能${action}根目录`)
  }
}

export function listLocalDir(root: string, relativePath = ''): FileEntry[] {
  const cacheKey = makeCacheKey('local', { root, relativePath })

  // 查缓存
  const cached = dirCache.getWithFreshness(cacheKey)
  if (cached) {
    // 本地文件系统访问极快，陈旧缓存直接后台刷新
    if (cached.stale) {
      // 使用 setImmediate 在下一个事件循环中刷新，不阻塞当前返回
      setImmediate(() => {
        const fresh = readLocalDirFromDisk(root, relativePath)
        if (!dirCache.isSameSnapshot(cacheKey, fresh)) {
          dirCache.set(cacheKey, { entries: fresh })
        }
      })
    }
    return cached.cached.entries
  }

  // 缓存未命中，读取并缓存
  const entries = readLocalDirFromDisk(root, relativePath)
  dirCache.set(cacheKey, { entries })
  return entries
}

/** 从磁盘读取本地目录内容（不含缓存逻辑） */
function readLocalDirFromDisk(root: string, relativePath: string): FileEntry[] {
  const dir = assertUnderRoot(root, relativePath)
  if (!existsSync(dir)) throw new Error('目录不存在')
  if (!statSync(dir).isDirectory()) throw new Error('不是目录')

  const entries = readdirSync(dir, { withFileTypes: true })
  const list: FileEntry[] = []

  for (const ent of entries) {
    const full = join(dir, ent.name)
    const st = statSync(full)
    list.push({
      name: ent.name,
      path: relativePath ? join(relativePath, ent.name) : ent.name,
      isDirectory: ent.isDirectory(),
      size: st.isFile() ? st.size : undefined,
      modifiedAt: st.mtime.toISOString()
    })
  }

  return list.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function readLocalFile(root: string, relativePath: string): { text: string; binary: boolean } {
  const file = assertUnderRoot(root, relativePath)
  if (!existsSync(file) || !statSync(file).isFile()) throw new Error('文件不存在')
  const buf = readFileSync(file)
  const binary = buf.includes(0)
  return { text: binary ? buf.toString('base64') : buf.toString('utf8'), binary }
}

export function writeLocalFile(root: string, relativePath: string, content: string, binary = false): void {
  const file = assertUnderRoot(root, relativePath)
  const parent = dirname(file)
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true })
  writeFileSync(file, binary ? Buffer.from(content, 'base64') : content, binary ? undefined : 'utf8')
  invalidateLocalPathCache(root, relativePath)
}

export function deleteLocalPath(root: string, relativePath: string): void {
  assertNotRoot(relativePath, '删除')
  const target = assertUnderRoot(root, relativePath)
  if (!existsSync(target)) throw new Error('路径不存在')
  rmSync(target, { recursive: true, force: true })
  invalidateLocalPathCache(root, relativePath)
}

export function mkdirLocal(root: string, relativePath: string): void {
  const dir = assertUnderRoot(root, relativePath)
  mkdirSync(dir, { recursive: true })
  invalidateLocalPathCache(root, relativePath)
}

/** 使本地路径的缓存失效（包括当前路径和所有父路径） */
function invalidateLocalPathCache(root: string, relativePath: string): void {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean)
  for (let i = 0; i <= parts.length; i++) {
    const rel = parts.slice(0, i).join('/')
    const key = makeCacheKey('local', { root, relativePath: rel })
    dirCache.invalidate(key)
  }
}

export function renameLocal(root: string, fromRel: string, toRel: string): void {
  assertNotRoot(fromRel, '重命名')
  assertNotRoot(toRel, '重命名为')
  const from = assertUnderRoot(root, fromRel)
  const to = assertUnderRoot(root, toRel)
  if (!existsSync(from)) throw new Error('源路径不存在')
  if (existsSync(to)) throw new Error('目标已存在')
  const parent = dirname(to)
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true })
  renameSync(from, to)
  invalidateLocalPathCache(root, fromRel)
  invalidateLocalPathCache(root, toRel)
}

export function localDisplayName(relativePath: string): string {
  if (!relativePath) return ''
  return basename(relativePath)
}
