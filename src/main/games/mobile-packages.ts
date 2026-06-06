import type { InstalledPackage, MobilePlatform } from './types'
import { runAdb } from '../devices/adb-path'
import { runHdc } from '../devices/hdc-path'
import { runIdevice } from '../devices/idevice-path'

/** iOS 已安装应用列表项 */
interface IosAppEntry {
  bundleId: string
  name?: string
}

function parsePmList(stdout: string, platform: MobilePlatform, deviceId: string): InstalledPackage[] {
  const seen = new Set<string>()
  const list: InstalledPackage[] = []

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let pkg = trimmed
    if (pkg.startsWith('package:')) {
      pkg = pkg.slice('package:'.length).trim()
    }

    if (!pkg || seen.has(pkg)) continue

    // 严格验证包名格式：只允许字母、数字、下划线、点号，且至少包含一个点
    // 过滤掉 stderr 混入的错误行（如 "/bin/sh: pm: inaccessible or not found"）
    if (!/^[a-zA-Z][a-zA-Z0-9_.]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(pkg)) continue

    seen.add(pkg)

    list.push({
      applicationId: pkg,
      platform,
      deviceId,
      label: pkg
    })
  }

  return list.sort((a, b) => a.applicationId.localeCompare(b.applicationId))
}

/** 安卓：已安装第三方包（pm list packages -3） */
export async function listAndroidPackages(deviceId?: string): Promise<InstalledPackage[]> {
  const args = deviceId
    ? ['-s', deviceId, 'shell', 'pm', 'list', 'packages', '-3']
    : ['shell', 'pm', 'list', 'packages', '-3']

  const out = await runAdb(args)
  return parsePmList(out, 'android', deviceId ?? 'default')
}

/**
 * 鸿蒙：优先 pm list packages；失败则列举 database 目录名作为包标识。
 */
export async function listHarmonyPackages(deviceId?: string): Promise<InstalledPackage[]> {
  const hdcArgs = (cmd: string[]) =>
    deviceId ? ['-t', deviceId, 'shell', ...cmd] : ['shell', ...cmd]

  try {
    const out = await runHdc(hdcArgs(['pm', 'list', 'packages']))
    const parsed = parsePmList(out, 'harmony', deviceId ?? 'default')
    if (parsed.length > 0) return parsed
  } catch {
    /* fallback */
  }

  const databaseRoots = [
    '/data/app/el2/100/database',
    '/data/app/el2/100/base/database'
  ]

  const seen = new Set<string>()
  const list: InstalledPackage[] = []

  for (const root of databaseRoots) {
    try {
      const out = await runHdc(hdcArgs(['ls', root]))
      for (const line of out.split(/\r?\n/)) {
        const name = line.trim()
        if (!name || name === '.' || name === '..') continue
        if (seen.has(name)) continue
        seen.add(name)
        list.push({
          applicationId: name,
          platform: 'harmony',
          deviceId: deviceId ?? 'default',
          label: name
        })
      }
    } catch {
      /* try next root */
    }
  }

  return list.sort((a, b) => a.applicationId.localeCompare(b.applicationId))
}

/** iOS：通过 ideviceinstaller -l 列出已安装应用 */
export async function listIosPackages(deviceId?: string): Promise<InstalledPackage[]> {
  const args = deviceId ? ['-u', deviceId, '-l', '-o', 'list_all'] : ['-l', '-o', 'list_all']
  try {
    const out = await runIdevice('ideviceinstaller', args)
    return parseIosPackageList(out, deviceId ?? 'default')
  } catch {
    // fallback: 尝试不带 -o list_all
    try {
      const args2 = deviceId ? ['-u', deviceId, '-l'] : ['-l']
      const out2 = await runIdevice('ideviceinstaller', args2)
      return parseIosPackageList(out2, deviceId ?? 'default')
    } catch {
      return []
    }
  }
}

function parseIosPackageList(stdout: string, deviceId: string): InstalledPackage[] {
  const seen = new Set<string>()
  const list: InstalledPackage[] = []

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // ideviceinstaller 输出格式:
    //   CFBundleIdentifier: com.example.app
    //   或直接每行一个 bundleId
    let bundleId = trimmed

    // 处理 "key: value" 格式
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx > 0 && colonIdx < trimmed.length - 1) {
      const key = trimmed.slice(0, colonIdx).trim()
      if (key === 'CFBundleIdentifier' || key.toLowerCase().includes('bundle')) {
        bundleId = trimmed.slice(colonIdx + 1).trim()
      }
    }

    // 过滤非包名行（空行、标题行等）
    if (!bundleId || bundleId.includes(' ') && !bundleId.startsWith('com.')) continue
    if (!/^[a-zA-Z0-9.-]+$/.test(bundleId)) continue
    if (seen.has(bundleId)) continue
    seen.add(bundleId)

    list.push({
      applicationId: bundleId,
      platform: 'ios' as MobilePlatform,
      deviceId,
      label: bundleId
    })
  }

  return list.sort((a, b) => a.applicationId.localeCompare(b.applicationId))
}

export async function listMobilePackages(
  platform: MobilePlatform | 'ios',
  deviceId?: string
): Promise<InstalledPackage[]> {
  if (platform === 'android') return listAndroidPackages(deviceId)
  if (platform === 'ios') return listIosPackages(deviceId)
  return listHarmonyPackages(deviceId)
}
