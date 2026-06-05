import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { deviceToolchainDir } from './resources-path'

const execFileAsync = promisify(execFile)

const TOOLCHAIN_DIR = deviceToolchainDir('ios')
const IDEVICE_ID = join(TOOLCHAIN_DIR, 'idevice_id.exe')
const IDEVICEINFO = join(TOOLCHAIN_DIR, 'ideviceinfo.exe')

let cachedReady: boolean | undefined

export function resolveIdeviceToolchainDir(): string {
  if (!existsSync(IDEVICE_ID)) {
    throw new Error(
      `未找到内置 libimobiledevice 工具: ${IDEVICE_ID}，请将工具链放入 resources/device-toolchains/ios/`
    )
  }
  return TOOLCHAIN_DIR
}

export function isBundledIdevicePresent(): boolean {
  if (cachedReady !== undefined) return cachedReady
  cachedReady = existsSync(IDEVICE_ID) && existsSync(IDEVICEINFO)
  return cachedReady
}

export async function runIdevice(
  tool: 'idevice_id' | 'ideviceinfo' | 'ideviceinstaller',
  args: string[]
): Promise<string> {
  const dir = resolveIdeviceToolchainDir()
  const exe = join(dir, `${tool}.exe`)
  if (!existsSync(exe)) {
    throw new Error(`未找到 ${tool}.exe，请将 libimobiledevice 工具链放入 resources/device-toolchains/ios/`)
  }

  try {
    const { stdout } = await execFileAsync(exe, args, {
      timeout: 20000,
      cwd: dir,
      env: {
        ...process.env,
        PATH: `${dir};${process.env.PATH ?? ''}`
      }
    })
    return stdout
  } catch (err) {
    const stderr =
      err && typeof err === 'object' && 'stderr' in err
        ? String((err as { stderr?: string }).stderr ?? '').trim()
        : ''
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(stderr ? `${message}\n${stderr}` : message)
  }
}

export async function isIdeviceAvailable(): Promise<boolean> {
  if (!isBundledIdevicePresent()) return false
  try {
    await runIdevice('idevice_id', ['-h'])
    return true
  } catch {
    return false
  }
}
