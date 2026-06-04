import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { resourcesSubdir } from './resources-path'

const execFileAsync = promisify(execFile)

const ADB_PATH = join(resourcesSubdir('platform-tools'), 'adb.exe')

let cachedReady: boolean | undefined

export function resolveAdbPath(): string {
  if (!existsSync(ADB_PATH)) {
    throw new Error(`未找到内置 adb: ${ADB_PATH}，请运行 pnpm run setup:platform-tools`)
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
