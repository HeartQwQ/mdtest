export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modifiedAt?: string
}

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

  pickLocalFile: () =>
    window.api.filesPickLocalFile() as Promise<{ name: string; content: string; binary: boolean } | null>
}
