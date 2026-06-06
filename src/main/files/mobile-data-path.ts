import type { MobilePlatform } from '../games/types'
import { runAdb } from '../devices/adb-path'
import { runHdc } from '../devices/hdc-path'
import { shellQuote } from './shell-quote'

/** 路径是否可列出目录内容（排除仅返回 symlink 行的 /sdcard 无尾斜杠情况）。 */
export async function remoteDirListable(
  platform: MobilePlatform,
  deviceId: string,
  remotePath: string
): Promise<boolean> {
  const listPath = remotePath.endsWith('/') ? remotePath : `${remotePath}/`
  try {
    let out: string
    if (platform === 'android') {
      out = await runAdb(['-s', deviceId, 'shell', 'ls', '-la', shellQuote(listPath)])
    } else {
      out = await runHdc(['-t', deviceId, 'shell', 'ls', '-la', shellQuote(listPath)])
    }
    return out.split(/\r?\n/).some((line) => {
      const t = line.trim()
      if (!t || t.startsWith('total ')) return false
      const perm = t.split(/\s+/)[0]
      return perm?.startsWith('d') || perm?.startsWith('-')
    })
  } catch {
    return false
  }
}

const ANDROID_CANDIDATES = (pkg: string) => [
  `/storage/emulated/0/Android/data/${pkg}`,
  `/sdcard/Android/data/${pkg}`
]

const HARMONY_CANDIDATES = (pkg: string) => [
  `/data/app/el2/100/database/${pkg}`,
  `/data/storage/el2/base/haps/${pkg}`,
  `/storage/media/100/local/files/Docs`
]

export async function remotePathExists(
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
  // 安卓：直接返回 /storage/emulated/0/Android/data 作为应用包列表的根目录
  // 该目录下的每个子目录就是一个应用包，无需定位到具体的 /${applicationId}
  if (platform === 'android') {
    return '/storage/emulated/0/Android/data'
  }

  // 鸿蒙：通过候选路径探测
  const candidates = HARMONY_CANDIDATES(applicationId)
  for (const p of candidates) {
    if (await remotePathExists(platform, deviceId, p)) return p
  }
  return `/data/app/el2/100/database/${applicationId}`
}
