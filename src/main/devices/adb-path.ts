import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { deviceToolchainDir } from './resources-path'

const execFileAsync = promisify(execFile)

const ADB_PATH = join(deviceToolchainDir('android'), 'adb.exe')

let cachedReady: boolean | undefined

export function resolveAdbPath(): string {
  if (!existsSync(ADB_PATH)) {
    throw new Error(`未找到内置 adb: ${ADB_PATH}，请将 platform-tools 放入 resources/device-toolchains/android/`)
  }
  return ADB_PATH
}

export function isBundledAdbPresent(): boolean {
  if (cachedReady !== undefined) return cachedReady
  cachedReady = existsSync(ADB_PATH)
  return cachedReady
}

export async function runAdb(args: string[]): Promise<string> {
  const adbPath = resolveAdbPath()
  const { stdout } = await execFileAsync(adbPath, args, {
    timeout: 15000,
    cwd: dirname(adbPath)
  })
  return stdout
}

export async function isAdbAvailable(): Promise<boolean> {
  try {
    await runAdb(['version'])
    return true
  } catch {
    return false
  }
}

/** 确保 adb server 已启动（监测长连接前调用）。失败静默，由调用方重试。 */
export async function ensureAdbServer(): Promise<void> {
  try {
    await runAdb(['start-server'])
  } catch {
    /* 由 tracker 重连逻辑处理 */
  }
}
