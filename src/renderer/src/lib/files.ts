export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modifiedAt?: string
}

export type DeviceFsPlatform = 'android' | 'harmony' | 'ios'

export const filesApi = {
  listLocal: (root: string, relativePath?: string) =>
    window.api.filesLocalList(root, relativePath) as Promise<FileEntry[]>,

  readLocal: (root: string, relativePath: string) =>
    window.api.filesLocalRead(root, relativePath) as Promise<{ text: string; binary: boolean }>,

  writeLocal: (root: string, relativePath: string, content: string, binary?: boolean) =>
    window.api.filesLocalWrite(root, relativePath, content, binary) as Promise<void>,

  deleteLocal: (root: string, relativePath: string) =>
    window.api.filesLocalDelete(root, relativePath) as Promise<void>,

  mkdirLocal: (root: string, relativePath: string) =>
    window.api.filesLocalMkdir(root, relativePath) as Promise<void>,

  renameLocal: (root: string, fromRel: string, toRel: string) =>
    window.api.filesLocalRename(root, fromRel, toRel) as Promise<void>,

  listMobile: (platform: 'android' | 'harmony', deviceId: string, packageId: string, relativePath?: string) =>
    window.api.filesMobileList(platform, deviceId, packageId, relativePath) as Promise<{
      root: string
      entries: FileEntry[]
    }>,

  readMobile: (
    platform: 'android' | 'harmony',
    deviceId: string,
    packageId: string,
    relativePath: string
  ) =>
    window.api.filesMobileRead(platform, deviceId, packageId, relativePath) as Promise<{
      text: string
      binary: boolean
    }>,

  writeMobile: (
    platform: 'android' | 'harmony',
    deviceId: string,
    packageId: string,
    relativePath: string,
    content: string,
    binary?: boolean
  ) => window.api.filesMobileWrite(platform, deviceId, packageId, relativePath, content, binary),

  deleteMobile: (
    platform: 'android' | 'harmony',
    deviceId: string,
    packageId: string,
    relativePath: string
  ) => window.api.filesMobileDelete(platform, deviceId, packageId, relativePath),

  mkdirMobile: (
    platform: 'android' | 'harmony',
    deviceId: string,
    packageId: string,
    relativePath: string
  ) => window.api.filesMobileMkdir(platform, deviceId, packageId, relativePath),

  listDevice: (platform: DeviceFsPlatform, deviceId: string, relativePath?: string) =>
    window.api.filesDeviceList(platform, deviceId, relativePath) as Promise<{
      root: string
      entries: FileEntry[]
      hint?: string
    }>,

  readDevice: (platform: DeviceFsPlatform, deviceId: string, relativePath: string) =>
    window.api.filesDeviceRead(platform, deviceId, relativePath) as Promise<{
      text: string
      binary: boolean
    }>,

  writeDevice: (
    platform: DeviceFsPlatform,
    deviceId: string,
    relativePath: string,
    content: string,
    binary?: boolean
  ) => window.api.filesDeviceWrite(platform, deviceId, relativePath, content, binary),

  deleteDevice: (platform: DeviceFsPlatform, deviceId: string, relativePath: string) =>
    window.api.filesDeviceDelete(platform, deviceId, relativePath),

  mkdirDevice: (platform: DeviceFsPlatform, deviceId: string, relativePath: string) =>
    window.api.filesDeviceMkdir(platform, deviceId, relativePath),

  pickLocalFile: () =>
    window.api.filesPickLocalFile() as Promise<{ name: string; content: string; binary: boolean } | null>,

  saveLocalFile: (defaultName: string, content: string, binary?: boolean) =>
    window.api.filesSaveLocalFile(defaultName, content, binary) as Promise<string | null>,

  /** 应用包目录操作（移动三端统一入口，支持安卓/鸿蒙/iOS） */
  listApp: (platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath?: string) =>
    window.api.filesAppList(platform, deviceId, packageId, relativePath) as Promise<{
      root: string
      entries: FileEntry[]
      hint?: string
    }>,

  readApp: (platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath: string) =>
    window.api.filesAppRead(platform, deviceId, packageId, relativePath) as Promise<{
      text: string
      binary: boolean
    }>,

  writeApp: (
    platform: DeviceFsPlatform,
    deviceId: string,
    packageId: string,
    relativePath: string,
    content: string,
    binary?: boolean
  ) => window.api.filesAppWrite(platform, deviceId, packageId, relativePath, content, binary),

  deleteApp: (platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath: string) =>
    window.api.filesAppDelete(platform, deviceId, packageId, relativePath),

  mkdirApp: (platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath: string) =>
    window.api.filesAppMkdir(platform, deviceId, packageId, relativePath),

  /** 预热：设备连接后立即异步加载根目录 */
  cachePreload: (mode: 'local' | 'device', opts: { root?: string; platform?: string; deviceId?: string; packageId?: string }) =>
    window.api.cachePreload(mode, opts) as Promise<void>,

  /** 使指定路径的缓存失效 */
  cacheInvalidate: (
    mode: 'local' | 'device' | 'mobile',
    opts: {
      root?: string
      platform?: string
      deviceId?: string
      packageId?: string
      relativePath?: string
    }
  ) => window.api.cacheInvalidate(mode, opts) as Promise<void>,

  /** 使某个设备的所有缓存失效 */
  cacheInvalidateDevice: (platform: string, deviceId: string) =>
    window.api.cacheInvalidateDevice(platform, deviceId) as Promise<void>,

  /** 清除所有缓存 */
  cacheClear: () => window.api.cacheClear() as Promise<void>
}
