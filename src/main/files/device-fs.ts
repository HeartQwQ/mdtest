import type { DevicePlatform } from '../devices/types'
import type { MobilePlatform } from '../games/types'
import type { FileEntry } from './types'
import { dirCache, makeCacheKey } from './dir-cache'
import { remoteDirListable, remotePathExists } from './mobile-data-path'
import {
  deleteMobilePath,
  listMobileDir,
  mkdirMobile,
  readMobileFile,
  writeMobileFile
} from './remote-fs'
import {
  deleteIosPath,
  iosPathExists,
  listIosDir,
  mkdirIos,
  readIosFile,
  writeIosFile,
  listIosAppDir,
  iosAppPathExists,
  readIosAppFile,
  writeIosAppFile,
  deleteIosAppPath,
  mkdirIosApp
} from './ios-fs'
import { getDeviceStorageRootCandidates } from './device-storage-roots'

export type DeviceFsPlatform = Exclude<DevicePlatform, 'windows'>

const IOS_STORAGE_ROOT = '/'

export async function resolveDeviceStorageRoot(
  platform: DeviceFsPlatform,
  deviceId: string
): Promise<string> {
  if (platform === 'ios') {
    if (await iosPathExists(deviceId, IOS_STORAGE_ROOT)) return IOS_STORAGE_ROOT
    return IOS_STORAGE_ROOT
  }

  const candidates = getDeviceStorageRootCandidates(platform)
  for (const p of candidates) {
    if (await remoteDirListable(platform as MobilePlatform, deviceId, p)) {
      return p.replace(/\/+$/, '') || p
    }
  }
  for (const p of candidates) {
    if (await remotePathExists(platform as MobilePlatform, deviceId, p)) {
      return p.replace(/\/+$/, '') || p
    }
  }
  return (candidates[0].replace(/\/+$/, '') || candidates[0])
}

export async function listDeviceDir(
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath = ''
): Promise<{ root: string; entries: FileEntry[]; hint?: string; fromCache?: boolean }> {
  const cacheKey = makeCacheKey('device', { platform, deviceId, relativePath })
  const root = await resolveDeviceStorageRoot(platform, deviceId)

  // 查缓存
  const cached = dirCache.getWithFreshness(cacheKey)
  if (cached) {
    if ((cached.cached.root ?? '') !== root) {
      dirCache.invalidate(cacheKey)
      return loadAndCacheDeviceDir(cacheKey, platform, deviceId, relativePath, root)
    }

    // 缓存可用，立即返回；若陈旧，在后台异步刷新
    if (cached.stale) {
      void refreshDeviceDir(cacheKey, platform, deviceId, relativePath, root)
    }
    return {
      root: cached.cached.root ?? '',
      entries: cached.cached.entries,
      hint: cached.cached.hint,
      fromCache: true
    }
  }

  // 缓存未命中，正常加载
  return loadAndCacheDeviceDir(cacheKey, platform, deviceId, relativePath, root)
}

/** 从实际源加载设备目录并写入缓存 */
async function loadAndCacheDeviceDir(
  cacheKey: string,
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string,
  root: string
): Promise<{ root: string; entries: FileEntry[]; hint?: string; fromCache?: boolean }> {
  let entries: FileEntry[]
  let hint: string | undefined

  if (platform === 'ios') {
    const res = await listIosDir(deviceId, relativePath, root)
    entries = res.entries
    hint = 'iOS 仅可访问 AFC 媒体目录（如 DCIM），无法浏览系统根目录。'
  } else {
    const res = await listMobileDir(
      platform as MobilePlatform,
      deviceId,
      '',
      relativePath,
      root
    )
    entries = res.entries
    hint =
      platform === 'android'
        ? '部分路径（如 /Android/data 下未授权应用目录）可能因系统权限无法访问。'
        : undefined
  }

  const result = { root, entries, hint }

  // 写入缓存
  dirCache.set(cacheKey, { entries, root, hint })

  return { ...result, fromCache: false }
}

/** 后台刷新陈旧缓存（智能比对，内容不变则跳过） */
async function refreshDeviceDir(
  cacheKey: string,
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string,
  root: string
): Promise<void> {
  try {
    let entries: FileEntry[]
    let hint: string | undefined

    if (platform === 'ios') {
      const res = await listIosDir(deviceId, relativePath, root)
      entries = res.entries
      hint = 'iOS 仅可访问 AFC 媒体目录（如 DCIM），无法浏览系统根目录。'
    } else {
      const res = await listMobileDir(
        platform as MobilePlatform,
        deviceId,
        '',
        relativePath,
        root
      )
      entries = res.entries
      hint =
        platform === 'android'
          ? '部分路径（如 /Android/data 下未授权应用目录）可能因系统权限无法访问。'
          : undefined
    }

    // 智能刷新：仅内容变化时更新缓存
    if (!dirCache.isSameSnapshot(cacheKey, entries)) {
      dirCache.set(cacheKey, { entries, root, hint })
    }
  } catch {
    // 后台刷新失败不影响已返回的缓存数据
  }
}

export async function readDeviceFile(
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string
): Promise<{ text: string; binary: boolean }> {
  const root = await resolveDeviceStorageRoot(platform, deviceId)
  if (platform === 'ios') return readIosFile(deviceId, relativePath, root)
  return readMobileFile(platform as MobilePlatform, deviceId, '', relativePath, root)
}

export async function writeDeviceFile(
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string,
  content: string,
  binary = false
): Promise<void> {
  const root = await resolveDeviceStorageRoot(platform, deviceId)
  if (platform === 'ios') {
    await writeIosFile(deviceId, relativePath, content, binary, root)
  } else {
    await writeMobileFile(platform as MobilePlatform, deviceId, '', relativePath, content, binary, root)
  }
  // 写操作后使该目录及父目录的缓存失效
  invalidateDevicePathCache(platform, deviceId, relativePath)
}

export async function deleteDevicePath(
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string
): Promise<void> {
  const root = await resolveDeviceStorageRoot(platform, deviceId)
  if (platform === 'ios') {
    await deleteIosPath(deviceId, relativePath, root)
  } else {
    await deleteMobilePath(platform as MobilePlatform, deviceId, '', relativePath, root)
  }
  invalidateDevicePathCache(platform, deviceId, relativePath)
}

export async function mkdirDevice(
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string
): Promise<void> {
  const root = await resolveDeviceStorageRoot(platform, deviceId)
  if (platform === 'ios') {
    await mkdirIos(deviceId, relativePath, root)
  } else {
    await mkdirMobile(platform as MobilePlatform, deviceId, '', relativePath, root)
  }
  invalidateDevicePathCache(platform, deviceId, relativePath)
}

/** 使设备路径的缓存失效（包括当前路径和所有父路径） */
function invalidateDevicePathCache(
  platform: DeviceFsPlatform,
  deviceId: string,
  relativePath: string
): void {
  // 失效当前目录的缓存
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean)
  // 失效从根到当前路径的所有层级缓存
  for (let i = 0; i <= parts.length; i++) {
    const rel = parts.slice(0, i).join('/')
    const key = makeCacheKey('device', { platform, deviceId, relativePath: rel })
    dirCache.invalidate(key)
  }
}

/* ================================================================== */
/*  应用包目录操作（mobile 模式）                                       */
/*  - 安卓/鸿蒙：通过 ADB/HDC shell 访问 /Android/data/<pkg> 等路径     */
/*  - iOS：通过 afcclient --container <bundleId> 访问应用沙盒           */
/* ================================================================== */

export async function listAppDir(
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath = ''
): Promise<{ root: string; entries: FileEntry[]; hint?: string; fromCache?: boolean }> {
  const cacheKey = makeCacheKey('mobile', { platform, deviceId, packageId, relativePath })

  // 查缓存
  const cached = dirCache.getWithFreshness(cacheKey)
  if (cached) {
    if (cached.stale) {
      void refreshAppDir(cacheKey, platform, deviceId, packageId, relativePath)
    }
    return {
      root: cached.cached.root ?? '',
      entries: cached.cached.entries,
      hint: cached.cached.hint,
      fromCache: true
    }
  }

  return loadAndCacheAppDir(cacheKey, platform, deviceId, packageId, relativePath)
}

async function loadAndCacheAppDir(
  cacheKey: string,
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string
): Promise<{ root: string; entries: FileEntry[]; hint?: string; fromCache?: boolean }> {
  let entries: FileEntry[]
  let root: string
  let hint: string | undefined

  if (platform === 'ios') {
    // iOS 应用沙盒：root 为 '/'
    root = '/'
    const res = await listIosAppDir(deviceId, packageId, relativePath)
    entries = res.entries
    hint = 'iOS 应用沙盒目录，仅可访问该应用的 Documents/Library/tmp 等目录。'
  } else if (platform === 'android') {
    // 安卓应用包模式：直接列出 /storage/emulated/0/Android/data 下的所有应用包目录
    // 不需要传 packageId，因为每个子目录就是一个应用包
    root = '/storage/emulated/0/Android/data'
    const res = await listMobileDir(
      platform as MobilePlatform,
      deviceId,
      '',
      relativePath,
      root
    )
    entries = res.entries
    hint = '每个子目录对应一个已安装的应用包，点击可进入该应用的数据目录。'
  } else {
    // 鸿蒙：通过 resolvePackageDataRoot 解析应用包路径
    const res = await listMobileDir(
      platform as MobilePlatform,
      deviceId,
      packageId,
      relativePath
    )
    root = res.root
    entries = res.entries
    hint = '部分子目录可能因系统权限无法访问。'
  }

  const result = { root, entries, hint }
  dirCache.set(cacheKey, { entries, root, hint })
  return { ...result, fromCache: false }
}

async function refreshAppDir(
  cacheKey: string,
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string
): Promise<void> {
  try {
    let entries: FileEntry[]
    let root: string
    let hint: string | undefined

    if (platform === 'ios') {
      root = '/'
      const res = await listIosAppDir(deviceId, packageId, relativePath)
      entries = res.entries
      hint = 'iOS 应用沙盒目录，仅可访问该应用的 Documents/Library/tmp 等目录。'
    } else if (platform === 'android') {
      root = '/storage/emulated/0/Android/data'
      const res = await listMobileDir(
        platform as MobilePlatform,
        deviceId,
        '',
        relativePath,
        root
      )
      entries = res.entries
      hint = '每个子目录对应一个已安装的应用包，点击可进入该应用的数据目录。'
    } else {
      const res = await listMobileDir(
        platform as MobilePlatform,
        deviceId,
        packageId,
        relativePath
      )
      root = res.root
      entries = res.entries
      hint = '部分子目录可能因系统权限无法访问。'
    }

    if (!dirCache.isSameSnapshot(cacheKey, entries)) {
      dirCache.set(cacheKey, { entries, root, hint })
    }
  } catch {
    // 后台刷新失败不影响已返回的缓存数据
  }
}

export async function readAppFile(
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string
): Promise<{ text: string; binary: boolean }> {
  if (platform === 'ios') return readIosAppFile(deviceId, packageId, relativePath)
  return readMobileFile(platform as MobilePlatform, deviceId, packageId, relativePath)
}

export async function writeAppFile(
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string,
  content: string,
  binary = false
): Promise<void> {
  if (platform === 'ios') {
    await writeIosAppFile(deviceId, packageId, relativePath, content, binary)
  } else {
    await writeMobileFile(
      platform as MobilePlatform,
      deviceId,
      packageId,
      relativePath,
      content,
      binary
    )
  }
  invalidateAppPathCache(platform, deviceId, packageId, relativePath)
}

export async function deleteAppPath(
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string
): Promise<void> {
  if (platform === 'ios') {
    await deleteIosAppPath(deviceId, packageId, relativePath)
  } else {
    await deleteMobilePath(platform as MobilePlatform, deviceId, packageId, relativePath)
  }
  invalidateAppPathCache(platform, deviceId, packageId, relativePath)
}

export async function mkdirApp(
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string
): Promise<void> {
  if (platform === 'ios') {
    await mkdirIosApp(deviceId, packageId, relativePath)
  } else {
    await mkdirMobile(platform as MobilePlatform, deviceId, packageId, relativePath)
  }
  invalidateAppPathCache(platform, deviceId, packageId, relativePath)
}

/** 使应用包路径的缓存失效（包括当前路径和所有父路径） */
function invalidateAppPathCache(
  platform: DeviceFsPlatform,
  deviceId: string,
  packageId: string,
  relativePath: string
): void {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean)
  for (let i = 0; i <= parts.length; i++) {
    const rel = parts.slice(0, i).join('/')
    const key = makeCacheKey('mobile', { platform, deviceId, packageId, relativePath: rel })
    dirCache.invalidate(key)
  }
}
