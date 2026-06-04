/**
 * 下载 Android SDK Platform-Tools 并解压到 resources/platform-tools/
 * 供应用内置 adb 使用（Apache 2.0，见 Google SDK 许可）。
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, cpSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { execSync } from 'child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET_DIR = join(ROOT, 'resources', 'platform-tools')
const ADB_EXE = join(TARGET_DIR, 'adb.exe')

const URLS = [
  'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
  'https://mirrors.cloud.tencent.com/AndroidSDK/repository/platform-tools-latest-windows.zip'
]

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  await pipeline(readableFromWeb(res.body), createWriteStream(dest))
}

function readableFromWeb(body) {
  return Readable.fromWeb(body)
}

function extractZip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true })
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit' }
  )
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('[platform-tools] 当前仅自动下载 Windows 版，其它平台请手动放入 resources/platform-tools/<platform>/')
    process.exit(0)
  }

  if (existsSync(ADB_EXE)) {
    console.log('[platform-tools] 已存在，跳过下载:', ADB_EXE)
    process.exit(0)
  }

  mkdirSync(TARGET_DIR, { recursive: true })
  const tmpDir = join(ROOT, 'resources', '.tmp-platform-tools')
  const zipPath = join(tmpDir, 'platform-tools.zip')

  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(tmpDir, { recursive: true })

  let lastErr
  for (const url of URLS) {
    try {
      console.log('[platform-tools] 下载:', url)
      await download(url, zipPath)
      lastErr = null
      break
    } catch (e) {
      lastErr = e
      console.warn('[platform-tools] 失败:', e.message)
    }
  }

  if (lastErr) {
    console.error('[platform-tools] 全部镜像失败，请检查网络或手动解压 platform-tools 到:', TARGET_DIR)
    process.exit(1)
  }

  const extractRoot = join(tmpDir, 'extract')
  extractZip(zipPath, extractRoot)

  const inner = join(extractRoot, 'platform-tools')
  if (!existsSync(inner)) {
    console.error('[platform-tools] 压缩包结构异常，未找到 platform-tools 目录')
    process.exit(1)
  }

  for (const name of readdirSync(inner)) {
    cpSync(join(inner, name), join(TARGET_DIR, name), { recursive: true, force: true })
  }

  rmSync(tmpDir, { recursive: true, force: true })
  console.log('[platform-tools] 完成:', TARGET_DIR)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
