import type { MobilePlatform } from '../games/types'
import { runAdb } from '../devices/adb-path'
import { runHdc } from '../devices/hdc-path'
import { shellQuote } from './shell-quote'

const ANDROID_CANDIDATES = (pkg: string) => [
  `/storage/emulated/0/Android/data/${pkg}`,
  `/sdcard/Android/data/${pkg}`,
  `/storage/emulated/0/Android/data/${pkg}/files`
]

const HARMONY_CANDIDATES = (pkg: string) => [
  `/data/app/el2/100/database/${pkg}`,
  `/data/storage/el2/base/haps/${pkg}`,
  `/storage/media/100/local/files/Docs`
]

async function pathExists(
  platform: MobilePlatform,
  deviceId: string,
  remotePath: string
): Promise<boolean> {
  try {
    if (platform === 'android') {
      await runAdb(['-s', deviceId, 'shell', 'ls', shellQuote(remotePath)])
      return true
    }
    await runHdc(['-t', deviceId, 'shell', 'ls', shellQuote(remotePath)])
    return true
  } catch {
    return false
  }
}

export async function resolvePackageDataRoot(
  platform: MobilePlatform,
  deviceId: string,
  applicationId: string
): Promise<string> {
  const candidates =
    platform === 'android' ? ANDROID_CANDIDATES(applicationId) : HARMONY_CANDIDATES(applicationId)

  for (const p of candidates) {
    if (await pathExists(platform, deviceId, p)) return p
  }

  if (platform === 'android') {
    return `/storage/emulated/0/Android/data/${applicationId}`
  }
  return `/data/app/el2/100/database/${applicationId}`
}
