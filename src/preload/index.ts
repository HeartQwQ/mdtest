import { contextBridge, ipcRenderer } from 'electron'

const api = {
  listDevices: (platform: string) => ipcRenderer.invoke('devices:list', platform),
  platformAvailability: () => ipcRenderer.invoke('devices:availability'),
  adbPath: () => ipcRenderer.invoke('devices:adbPath'),
  bundledAdb: () => ipcRenderer.invoke('devices:bundledAdb'),
  hdcPath: () => ipcRenderer.invoke('devices:hdcPath'),
  bundledHdc: () => ipcRenderer.invoke('devices:bundledHdc'),

  gamesMobileListPackages: (platform: string, deviceId?: string) =>
    ipcRenderer.invoke('games:mobile:listPackages', platform, deviceId),
  gamesMobileListFavorites: () => ipcRenderer.invoke('games:mobile:listFavorites'),
  gamesMobileAddFavorite: (applicationId: string, label?: string) =>
    ipcRenderer.invoke('games:mobile:addFavorite', applicationId, label),
  gamesMobileRemoveFavorite: (id: string) => ipcRenderer.invoke('games:mobile:removeFavorite', id),

  gamesPcListPaths: () => ipcRenderer.invoke('games:pc:listPaths'),
  gamesPcAddPath: (path: string, label?: string, source?: string) =>
    ipcRenderer.invoke('games:pc:addPath', path, label, source),
  gamesPcRemovePath: (id: string) => ipcRenderer.invoke('games:pc:removePath', id),
  gamesPcGetSearchSettings: () => ipcRenderer.invoke('games:pc:getSearchSettings'),
  gamesPcSetSearchSettings: (settings: object) => ipcRenderer.invoke('games:pc:setSearchSettings', settings),
  gamesPcListInstances: () => ipcRenderer.invoke('games:pc:listInstances'),
  gamesPcEnsureLoaded: () => ipcRenderer.invoke('games:pc:ensureLoaded'),
  gamesPcScan: () => ipcRenderer.invoke('games:pc:scan'),
  gamesPcPickDirectory: () => ipcRenderer.invoke('games:pc:pickDirectory'),
  gamesLaunch: (exePath: string) => ipcRenderer.invoke('games:pc:launch', exePath),
  gamesOpenFolder: (path: string) => ipcRenderer.invoke('games:openFolder', path),

  filesLocalList: (root: string, relativePath?: string) =>
    ipcRenderer.invoke('files:local:list', root, relativePath),
  filesLocalRead: (root: string, relativePath: string) =>
    ipcRenderer.invoke('files:local:read', root, relativePath),
  filesLocalWrite: (root: string, relativePath: string, content: string, binary?: boolean) =>
    ipcRenderer.invoke('files:local:write', root, relativePath, content, binary),
  filesLocalDelete: (root: string, relativePath: string) =>
    ipcRenderer.invoke('files:local:delete', root, relativePath),
  filesLocalMkdir: (root: string, relativePath: string) =>
    ipcRenderer.invoke('files:local:mkdir', root, relativePath),
  filesLocalRename: (root: string, fromRel: string, toRel: string) =>
    ipcRenderer.invoke('files:local:rename', root, fromRel, toRel),

  filesMobileList: (platform: string, deviceId: string, packageId: string, relativePath?: string) =>
    ipcRenderer.invoke('files:mobile:list', platform, deviceId, packageId, relativePath),
  filesMobileRead: (platform: string, deviceId: string, packageId: string, relativePath: string) =>
    ipcRenderer.invoke('files:mobile:read', platform, deviceId, packageId, relativePath),
  filesMobileWrite: (
    platform: string,
    deviceId: string,
    packageId: string,
    relativePath: string,
    content: string,
    binary?: boolean
  ) =>
    ipcRenderer.invoke(
      'files:mobile:write',
      platform,
      deviceId,
      packageId,
      relativePath,
      content,
      binary
    ),
  filesMobileDelete: (platform: string, deviceId: string, packageId: string, relativePath: string) =>
    ipcRenderer.invoke('files:mobile:delete', platform, deviceId, packageId, relativePath),
  filesMobileMkdir: (platform: string, deviceId: string, packageId: string, relativePath: string) =>
    ipcRenderer.invoke('files:mobile:mkdir', platform, deviceId, packageId, relativePath),
  filesPickLocalFile: () => ipcRenderer.invoke('files:pickLocalFile')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
