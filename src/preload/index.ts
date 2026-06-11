import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

const api = {
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowToggleMaximize: (): Promise<boolean> => ipcRenderer.invoke('window:toggleMaximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  listDevices: (platform: string) => ipcRenderer.invoke('devices:list', platform),
  platformAvailability: () => ipcRenderer.invoke('devices:availability'),
  adbPath: () => ipcRenderer.invoke('devices:adbPath'),
  bundledAdb: () => ipcRenderer.invoke('devices:bundledAdb'),
  hdcPath: () => ipcRenderer.invoke('devices:hdcPath'),
  bundledHdc: () => ipcRenderer.invoke('devices:bundledHdc'),
  idevicePath: () => ipcRenderer.invoke('devices:idevicePath'),
  bundledIdevice: () => ipcRenderer.invoke('devices:bundledIdevice'),

  androidScreenSize: (deviceId: string) => ipcRenderer.invoke('android:screenSize', deviceId),
  androidScreenshot: (deviceId: string) => ipcRenderer.invoke('android:screenshot', deviceId),
  androidTap: (deviceId: string, x: number, y: number) =>
    ipcRenderer.invoke('android:tap', deviceId, x, y),
  androidSwipe: (
    deviceId: string,
    opts: { x1: number; y1: number; x2: number; y2: number; durationMs?: number }
  ) => ipcRenderer.invoke('android:swipe', deviceId, opts),
  androidKeyevent: (deviceId: string, keyCode: number | string) =>
    ipcRenderer.invoke('android:keyevent', deviceId, keyCode),
  androidInputText: (deviceId: string, text: string) =>
    ipcRenderer.invoke('android:inputText', deviceId, text),

  startDeviceWatch: (platform: string) => ipcRenderer.invoke('devices:startWatch', platform),
  stopDeviceWatch: (platform: string) => ipcRenderer.invoke('devices:stopWatch', platform),
  removeDevice: (platform: string, deviceId: string) =>
    ipcRenderer.invoke('devices:remove', platform, deviceId) as Promise<boolean>,
  onDevicesChanged: (callback: (payload: unknown) => void) => {
    const listener = (_event: IpcRendererEvent, payload: unknown): void => callback(payload)
    ipcRenderer.on('devices:changed', listener)
    return () => ipcRenderer.removeListener('devices:changed', listener)
  },

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

  filesDeviceList: (platform: string, deviceId: string, relativePath?: string) =>
    ipcRenderer.invoke('files:device:list', platform, deviceId, relativePath),
  filesDeviceRead: (platform: string, deviceId: string, relativePath: string) =>
    ipcRenderer.invoke('files:device:read', platform, deviceId, relativePath),
  filesDeviceWrite: (
    platform: string,
    deviceId: string,
    relativePath: string,
    content: string,
    binary?: boolean
  ) => ipcRenderer.invoke('files:device:write', platform, deviceId, relativePath, content, binary),
  filesDeviceDelete: (platform: string, deviceId: string, relativePath: string) =>
    ipcRenderer.invoke('files:device:delete', platform, deviceId, relativePath),
  filesDeviceMkdir: (platform: string, deviceId: string, relativePath: string) =>
    ipcRenderer.invoke('files:device:mkdir', platform, deviceId, relativePath),
  filesPickLocalFile: () => ipcRenderer.invoke('files:pickLocalFile'),
  filesSaveLocalFile: (defaultName: string, content: string, binary?: boolean) =>
    ipcRenderer.invoke('files:saveLocalFile', defaultName, content, binary),
  filesOpen: (source: object, relativePath: string, name: string) =>
    ipcRenderer.invoke('files:open', source, relativePath, name),
  filesFavoritesList: (platform: string, root?: string) =>
    ipcRenderer.invoke('files:favorites:list', platform, root),
  filesFavoritesAdd: (favorite: object) => ipcRenderer.invoke('files:favorites:add', favorite),
  filesFavoritesRemove: (id: string) => ipcRenderer.invoke('files:favorites:remove', id),

  filesAppList: (platform: string, deviceId: string, packageId: string, relativePath?: string) =>
    ipcRenderer.invoke('files:app:list', platform, deviceId, packageId, relativePath),
  filesAppRead: (platform: string, deviceId: string, packageId: string, relativePath: string) =>
    ipcRenderer.invoke('files:app:read', platform, deviceId, packageId, relativePath),
  filesAppWrite: (
    platform: string,
    deviceId: string,
    packageId: string,
    relativePath: string,
    content: string,
    binary?: boolean
  ) =>
    ipcRenderer.invoke('files:app:write', platform, deviceId, packageId, relativePath, content, binary),
  filesAppDelete: (platform: string, deviceId: string, packageId: string, relativePath: string) =>
    ipcRenderer.invoke('files:app:delete', platform, deviceId, packageId, relativePath),
  filesAppMkdir: (platform: string, deviceId: string, packageId: string, relativePath: string) =>
    ipcRenderer.invoke('files:app:mkdir', platform, deviceId, packageId, relativePath),

  cachePreload: (mode: 'local' | 'device', opts: object) =>
    ipcRenderer.invoke('cache:preload', mode, opts),
  cacheInvalidate: (
    mode: 'local' | 'device' | 'mobile',
    opts: {
      root?: string
      platform?: string
      deviceId?: string
      packageId?: string
      relativePath?: string
    }
  ) => ipcRenderer.invoke('cache:invalidate', mode, opts),
  cacheInvalidateDevice: (platform: string, deviceId: string) =>
    ipcRenderer.invoke('cache:invalidateDevice', platform, deviceId),
  cacheClear: () => ipcRenderer.invoke('cache:clear')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
