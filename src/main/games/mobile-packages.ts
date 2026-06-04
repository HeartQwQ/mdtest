import type { InstalledPackage, MobilePlatform } from './types'
import { runAdb } from '../devices/adb-path'
import { runHdc } from '../devices/hdc-path'

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

export async function listMobilePackages(
  platform: MobilePlatform,
  deviceId?: string
): Promise<InstalledPackage[]> {
  if (platform === 'android') return listAndroidPackages(deviceId)
  return listHarmonyPackages(deviceId)
}
