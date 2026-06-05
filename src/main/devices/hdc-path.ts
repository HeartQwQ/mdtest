import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { deviceToolchainDir } from './resources-path'

const execFileAsync = promisify(execFile)

const HDC_PATH = join(deviceToolchainDir('harmony'), 'hdc.exe')

let cachedReady: boolean | undefined

export function resolveHdcPath(): string {
  if (!existsSync(HDC_PATH)) {
    throw new Error(`未找到内置 hdc: ${HDC_PATH}，请将 DevEco toolchains 放入 resources/device-toolchains/harmony/`)
  }
  return HDC_PATH
}

export function isBundledHdcPresent(): boolean {
  if (cachedReady !== undefined) return cachedReady
  cachedReady = existsSync(HDC_PATH)
  return cachedReady
}

export async function runHdc(args: string[]): Promise<string> {
  const hdcPath = resolveHdcPath()
  const { stdout } = await execFileAsync(hdcPath, args, {
    timeout: 20000,
    cwd: dirname(hdcPath)
  })
  return stdout
}

export async function isHdcAvailable(): Promise<boolean> {
  try {
    await runHdc(['version'])
    return true
  } catch {
    return false
  }
}
