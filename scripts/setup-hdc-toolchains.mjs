/**
 * 从本机 DevEco SDK 复制 toolchains 到 resources/hdc-toolchains/toolchains/
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = join(ROOT, 'resources', 'hdc-toolchains', 'toolchains')
const HDC_EXE = join(TARGET, 'hdc.exe')

const HDC_EXE_NAME = process.platform === 'win32' ? 'hdc.exe' : 'hdc'

function findHdc(root, depth = 0) {
  if (depth > 6 || !existsSync(root)) return null
  const tc = join(root, 'toolchains', HDC_EXE_NAME)
  if (existsSync(tc)) return tc
  try {
    for (const name of readdirSync(root)) {
      if (name.startsWith('.')) continue
      const full = join(root, name)
      if (!statSync(full).isDirectory()) continue
      const f = findHdc(full, depth + 1)
      if (f) return f
    }
  } catch {
    /* ignore */
  }
  return null
}

function main() {
  if (existsSync(HDC_EXE)) {
    console.log('[hdc] 已存在，跳过:', HDC_EXE)
    process.exit(0)
  }

  const local = process.env.LOCALAPPDATA
  const roots = local ? [join(local, 'Huawei')] : []
  if (process.env.HDC_PATH) roots.push(dirname(process.env.HDC_PATH))

  let source = null
  for (const root of roots) {
    source = findHdc(root)
    if (source) break
  }

  if (!source) {
    console.error('[hdc] 未找到本机 hdc，请手动复制 DevEco 的 toolchains 到:', TARGET)
    process.exit(1)
  }

  const srcDir = dirname(source)
  mkdirSync(TARGET, { recursive: true })

  for (const name of readdirSync(srcDir)) {
    const src = join(srcDir, name)
    const dest = join(TARGET, name)
    if (statSync(src).isDirectory()) {
      cpSync(src, dest, { recursive: true, force: true })
    } else {
      copyFileSync(src, dest)
    }
  }

  console.log('[hdc] 完成:', TARGET)
}

main()
