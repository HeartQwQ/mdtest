import { existsSync } from 'fs'
import { delimiter, dirname, join } from 'path'
import { execFile, execFileSync } from 'child_process'
import { promisify } from 'util'
import { deviceToolchainDir } from './resources-path'
import { withAdbLock } from './adb-queue'
import { log, logWarn } from '../log'

const execFileAsync = promisify(execFile)

const ADB_DIR = deviceToolchainDir('android')
const BUNDLED_ADB = join(ADB_DIR, 'adb.exe')

let cachedReady: boolean | undefined

function adbEnv(toolDir: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PATH: `${toolDir}${delimiter}${process.env.PATH ?? ''}`
  }
}

async function execAdbBinary(adbPath: string, args: string[]): Promise<string> {
  const dir = dirname(adbPath)
  const { stdout, stderr } = await execFileAsync(adbPath, args, {
    timeout: 20000,
    cwd: dir,
    windowsHide: true,
    env: adbEnv(dir),
    maxBuffer: 4 * 1024 * 1024
  })

  // adb daemon 提示（以 * 开头）属于正常信息，保留合并；
  // 但 shell 子命令的 stderr 是真正的错误输出（如 "/bin/sh: pm: not found"），
  // 不应混入结果，否则会污染后续解析。
  if (stderr) {
    const isDaemonNotice = stderr.split(/\r?\n/).every(
      (line) => !line.trim() || line.trim().startsWith('*')
    )
    if (isDaemonNotice) {
      // daemon 提示属于正常信息，合并到输出
      return [stdout, stderr].filter(Boolean).join('\n')
    }
    // shell 命令的 stderr 是错误，仅日志化，不混入返回值
    logWarn('adb', `stderr (非 daemon 提示，已忽略): ${stderr.slice(0, 200)}`)
  }

  return stdout
}

async function execAdbBinaryBuffer(adbPath: string, args: string[]): Promise<Buffer> {
  const dir = dirname(adbPath)
  const { stdout, stderr } = await execFileAsync(adbPath, args, {
    timeout: 20000,
    cwd: dir,
    windowsHide: true,
    env: adbEnv(dir),
    encoding: 'buffer',
    maxBuffer: 16 * 1024 * 1024
  })

  const stderrText = Buffer.isBuffer(stderr) ? stderr.toString('utf8') : String(stderr ?? '')
  if (stderrText) {
    const isDaemonNotice = stderrText.split(/\r?\n/).every(
      (line) => !line.trim() || line.trim().startsWith('*')
    )
    if (!isDaemonNotice) {
      logWarn('adb', `stderr (binary command): ${stderrText.slice(0, 200)}`)
    }
  }

  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout ?? '')
}

async function findSystemAdb(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('where.exe', ['adb'], {
      timeout: 5000,
      windowsHide: true
    })
    const line = stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean)
    return line && existsSync(line) ? line : null
  } catch {
    return null
  }
}

function findSystemAdbSync(): string | null {
  try {
    const stdout = execFileSync('where.exe', ['adb'], {
      timeout: 5000,
      windowsHide: true,
      encoding: 'utf8'
    })
    const line = stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean)
    return line && existsSync(line) ? line : null
  } catch {
    return null
  }
}

export function resolveAdbPath(): string {
  if (existsSync(BUNDLED_ADB)) return BUNDLED_ADB
  const system = findSystemAdbSync()
  if (system) return system
  throw new Error(
    `未找到 adb: 请将 platform-tools 放入 resources/device-toolchains/android/，或将 adb 加入系统 PATH。内置路径: ${BUNDLED_ADB}`
  )
}

export function isBundledAdbPresent(): boolean {
  if (cachedReady !== undefined) return cachedReady
  cachedReady = existsSync(BUNDLED_ADB)
  return cachedReady
}

export function isAdbPathResolvable(): boolean {
  try {
    resolveAdbPath()
    return true
  } catch {
    return false
  }
}

/** 输出中是否包含设备行（非 header / daemon 提示）。 */
export function adbOutputHasDevices(out: string): boolean {
  return out.split(/\r?\n/).some((line) => {
    const t = line.trim()
    if (!t || t.startsWith('*') || t.startsWith('List of devices')) return false
    return /^\S+\s+(device|offline|unauthorized|authorizing)\b/.test(t)
  })
}

/** adb 明确返回「已连接设备列表为空」（非扫描失败）。 */
export function adbScanConfirmedEmpty(out: string): boolean {
  return out.includes('List of devices attached') && !adbOutputHasDevices(out)
}

export async function runAdb(args: string[]): Promise<string> {
  return withAdbLock(async () => {
    const primary = resolveAdbPath()
    let out = await execAdbBinary(primary, args)

    if (args[0] === 'devices' && !adbOutputHasDevices(out)) {
      const system = await findSystemAdb()
      if (system && system.toLowerCase() !== primary.toLowerCase()) {
        logWarn('adb', '当前 adb 未列出设备，尝试系统 adb', system)
        out = await execAdbBinary(system, args)
      }
    }

    return out
  })
}

export async function runAdbBuffer(args: string[]): Promise<Buffer> {
  return withAdbLock(async () => execAdbBinaryBuffer(resolveAdbPath(), args))
}

export async function isAdbAvailable(): Promise<boolean> {
  try {
    const out = await runAdb(['version'])
    return out.includes('Android Debug Bridge')
  } catch {
    return false
  }
}

/** 确保 adb server 已启动；start-server 后短暂等待 daemon 就绪。 */
export async function ensureAdbServer(): Promise<void> {
  return withAdbLock(async () => {
    try {
      const adb = resolveAdbPath()
      await execAdbBinary(adb, ['start-server'])
      await new Promise((r) => setTimeout(r, 400))
    } catch {
      /* 由调用方重试 */
    }
  })
}
