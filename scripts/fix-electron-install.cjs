/**
 * 修复 Electron 二进制未正确解压的情况（Windows + pnpm 下 extract-zip 偶发失败）。
 * 从 @electron/get 缓存解压到 node_modules/electron/dist，并写入 path.txt。
 */
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const ROOT = path.join(__dirname, '..')

function resolveElectronDir() {
  const pnpmRoot = path.join(ROOT, 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmRoot)) {
    for (const entry of fs.readdirSync(pnpmRoot)) {
      if (!entry.startsWith('electron@')) continue
      const candidate = path.join(pnpmRoot, entry, 'node_modules', 'electron')
      if (fs.existsSync(path.join(candidate, 'install.js'))) return candidate
    }
  }

  const direct = path.join(ROOT, 'node_modules', 'electron')
  if (fs.existsSync(path.join(direct, 'install.js'))) {
    try {
      return fs.realpathSync(direct)
    } catch {
      return direct
    }
  }

  return direct
}

function isElectronReady(electronDir) {
  const exe = path.join(electronDir, 'dist', 'electron.exe')
  const pathTxt = path.join(electronDir, 'path.txt')
  try {
    return (
      fs.existsSync(exe) &&
      fs.readFileSync(pathTxt, 'utf8').trim() === 'electron.exe'
    )
  } catch {
    return false
  }
}

function extractWithPowerShell(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  const ps = [
    "$ErrorActionPreference = 'Stop'",
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`
  ].join('; ')
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', ps],
    { stdio: 'inherit' }
  )
}

async function main() {
  const electronDir = resolveElectronDir()
  if (isElectronReady(electronDir)) {
    console.log('[electron] binary already installed')
    return
  }

  console.log('[electron] installing binary...')
  const installResult = spawnSync(process.execPath, [path.join(electronDir, 'install.js')], {
    cwd: electronDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_MIRROR:
        process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/'
    }
  })

  if (isElectronReady(electronDir)) {
    console.log('[electron] install.js succeeded')
    return
  }

  if (installResult.status !== 0) {
    console.warn('[electron] install.js exited with code', installResult.status)
  }

  console.log('[electron] install.js incomplete, falling back to PowerShell extract...')

  const getPkg = path.join(electronDir, '..', '@electron', 'get', 'dist', 'index.js')
  const { downloadArtifact } = await import(pathToFileURL(getPkg).href)
  const { version } = require(path.join(electronDir, 'package.json'))

  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    platform: process.env.ELECTRON_INSTALL_PLATFORM || process.platform,
    arch: process.env.ELECTRON_INSTALL_ARCH || process.arch
  })

  const distDir = path.join(electronDir, 'dist')
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true })
  extractWithPowerShell(zipPath, distDir)

  if (!fs.existsSync(path.join(distDir, 'electron.exe'))) {
    throw new Error('electron.exe not found after extraction')
  }

  fs.writeFileSync(path.join(electronDir, 'path.txt'), 'electron.exe')
  console.log('[electron] binary ready at', path.join(distDir, 'electron.exe'))
}

main().catch((err) => {
  console.error('[electron] install failed:', err)
  process.exit(1)
})
