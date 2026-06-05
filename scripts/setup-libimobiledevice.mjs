/**
 * 下载 libimobiledevice Windows 工具包并解压到 resources/libimobiledevice/
 * 来源：https://github.com/jrjr/libimobiledevice-windows
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, cpSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { execSync } from 'child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET_DIR = join(ROOT, 'resources', 'libimobiledevice')
const IDEVICE_ID = join(TARGET_DIR, 'idevice_id.exe')

const URLS = [
  'https://github.com/jrjr/libimobiledevice-windows/releases/download/v20260531-74585f8/libimobile-suite-latest_w64.zip',
  'https://mirror.ghproxy.com/https://github.com/jrjr/libimobiledevice-windows/releases/download/v20260531-74585f8/libimobile-suite-latest_w64.zip'
]

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

function extractZip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true })
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit' }
  )
}

function findIdeviceId(root, depth = 0) {
  if (depth > 4 || !existsSync(root)) return null
  const direct = join(root, 'idevice_id.exe')
  if (existsSync(direct)) return root
  for (const name of readdirSync(root)) {
    const full = join(root, name)
    const found = findIdeviceId(full, depth + 1)
    if (found) return found
  }
  return null
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('[libimobiledevice] 当前仅自动下载 Windows 版，其它平台请手动放入 resources/libimobiledevice/')
    process.exit(0)
  }

  if (existsSync(IDEVICE_ID)) {
    console.log('[libimobiledevice] 已存在，跳过下载:', IDEVICE_ID)
    process.exit(0)
  }

  const tmpDir = join(ROOT, 'resources', '.tmp-libimobiledevice')
  const zipPath = join(tmpDir, 'libimobile-suite.zip')
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(tmpDir, { recursive: true })

  let lastErr
  for (const url of URLS) {
    try {
      console.log('[libimobiledevice] 下载:', url)
      await download(url, zipPath)
      lastErr = null
      break
    } catch (e) {
      lastErr = e
      console.warn('[libimobiledevice] 失败:', e.message)
    }
  }

  if (lastErr) {
    console.error('[libimobiledevice] 全部镜像失败，请手动解压到:', TARGET_DIR)
    process.exit(1)
  }

  const extractRoot = join(tmpDir, 'extract')
  extractZip(zipPath, extractRoot)

  const toolDir = findIdeviceId(extractRoot)
  if (!toolDir) {
    console.error('[libimobiledevice] 压缩包结构异常，未找到 idevice_id.exe')
    process.exit(1)
  }

  mkdirSync(TARGET_DIR, { recursive: true })
  for (const name of readdirSync(toolDir)) {
    cpSync(join(toolDir, name), join(TARGET_DIR, name), { recursive: true, force: true })
  }

  rmSync(tmpDir, { recursive: true, force: true })
  console.log('[libimobiledevice] 完成:', TARGET_DIR)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
