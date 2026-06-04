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
import { basename, dirname, join } from 'path'
import type { FileEntry } from './types'

function assertUnderRoot(root: string, target: string): string {
  const normalizedRoot = join(root).replace(/\\/g, '/').toLowerCase()
  const normalizedTarget = join(root, target).replace(/\\/g, '/').toLowerCase()
  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new Error('路径越界')
  }
  return join(root, target)
}

export function listLocalDir(root: string, relativePath = ''): FileEntry[] {
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
}

export function deleteLocalPath(root: string, relativePath: string): void {
  const target = assertUnderRoot(root, relativePath)
  if (!existsSync(target)) throw new Error('路径不存在')
  rmSync(target, { recursive: true, force: true })
}

export function mkdirLocal(root: string, relativePath: string): void {
  const dir = assertUnderRoot(root, relativePath)
  mkdirSync(dir, { recursive: true })
}

export function renameLocal(root: string, fromRel: string, toRel: string): void {
  const from = assertUnderRoot(root, fromRel)
  const to = assertUnderRoot(root, toRel)
  if (!existsSync(from)) throw new Error('源路径不存在')
  if (existsSync(to)) throw new Error('目标已存在')
  const parent = dirname(to)
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true })
  renameSync(from, to)
}

export function localDisplayName(relativePath: string): string {
  if (!relativePath) return ''
  return basename(relativePath)
}
