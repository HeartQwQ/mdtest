import { ipcMain, dialog, BrowserWindow, type SaveDialogOptions } from 'electron'
import { readFileSync, writeFileSync } from 'fs'

import { log } from './log'
import { isBundledAdbPresent, resolveAdbPath } from './devices/adb-path'
import { isBundledHdcPresent, resolveHdcPath } from './devices/hdc-path'
import { isBundledIdevicePresent, resolveIdeviceToolchainDir } from './devices/idevice-path'
import {
  captureAndroidScreen,
  getAndroidScreenSize,
  inputTextAndroid,
  keyeventAndroid,
  swipeAndroid,
  tapAndroid
} from './devices/android-control'
import { listDevices, platformAvailability } from './devices/manager'
import { deviceMonitor, initDeviceMonitoring, type WatchPlatform } from './devices/device-monitor'
import { removeCachedDevice } from './devices/device-registry'
import type { DevicePlatform } from './devices/types'
import {
  addMobileFavorite,
  addPcPath,
  ensurePcGamesLoaded,
  getPcSearchSettings,
  launchExe,
  listMobileFavorites,
  listMobilePackages,
  listPcGameInstances,
  listPcPaths,
  openFolderInExplorer,
  removeMobileFavorite,
  removePcPath,
  removePcGameInstance,
  scanAndCachePcGames,
  setPcSearchSettings
} from './games'
import type { MobilePlatform } from './games/types'
import {
  deleteDevicePath,
  deleteLocalPath,
  deleteMobilePath,
  listDeviceDir,
  listLocalDir,
  listMobileDir,
  mkdirDevice,
  mkdirLocal,
  mkdirMobile,
  readDeviceFile,
  readLocalFile,
  readMobileFile,
  renameLocal,
  writeDeviceFile,
  writeLocalFile,
  writeMobileFile,
  dirCache,
  makeCacheKey,
  listAppDir,
  readAppFile,
  writeAppFile,
  deleteAppPath,
  mkdirApp
} from './files'
import type { DeviceFsPlatform } from './files'

export function registerIpc(): void {
  initDeviceMonitoring()

  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle('window:toggleMaximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false
    if (win.isMaximized()) {
      win.unmaximize()
      return false
    }
    win.maximize()
    return true
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle('window:isMaximized', (event) =>
    BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  )

  ipcMain.handle('devices:list', (_event, platform: DevicePlatform) => listDevices(platform))
  ipcMain.handle('devices:availability', () => platformAvailability())
  ipcMain.handle('devices:adbPath', () => {
    try {
      return resolveAdbPath()
    } catch {
      return null
    }
  })
  ipcMain.handle('devices:bundledAdb', () => isBundledAdbPresent())
  ipcMain.handle('devices:hdcPath', () => {
    try {
      return resolveHdcPath()
    } catch {
      return null
    }
  })
  ipcMain.handle('devices:bundledHdc', () => isBundledHdcPresent())
  ipcMain.handle('devices:idevicePath', () => {
    try {
      return resolveIdeviceToolchainDir()
    } catch {
      return null
    }
  })
  ipcMain.handle('devices:bundledIdevice', () => isBundledIdevicePresent())

  ipcMain.handle('android:screenSize', (_e, deviceId: string) =>
    getAndroidScreenSize(deviceId)
  )
  ipcMain.handle('android:screenshot', (_e, deviceId: string) =>
    captureAndroidScreen(deviceId)
  )
  ipcMain.handle('android:tap', (_e, deviceId: string, x: number, y: number) =>
    tapAndroid(deviceId, x, y)
  )
  ipcMain.handle(
    'android:swipe',
    (
      _e,
      deviceId: string,
      opts: { x1: number; y1: number; x2: number; y2: number; durationMs?: number }
    ) => swipeAndroid(deviceId, opts)
  )
  ipcMain.handle('android:keyevent', (_e, deviceId: string, keyCode: number | string) =>
    keyeventAndroid(deviceId, keyCode)
  )
  ipcMain.handle('android:inputText', (_e, deviceId: string, text: string) =>
    inputTextAndroid(deviceId, text)
  )

  ipcMain.handle('devices:startWatch', (event, platform: WatchPlatform) => {
    deviceMonitor.start(platform, event.sender)
  })
  ipcMain.handle('devices:stopWatch', (event, platform: WatchPlatform) => {
    deviceMonitor.stop(platform, event.sender)
  })

  ipcMain.handle('devices:remove', async (_event, platform: DevicePlatform, deviceId: string) => {
    let ok = false
    if (platform === 'windows') {
      ok = removePcGameInstance(deviceId)
    } else {
      ok = removeCachedDevice(platform, deviceId)
    }
    if (ok) await deviceMonitor.refresh(platform, true)
    return ok
  })

  ipcMain.handle('games:mobile:listPackages', (_e, platform: MobilePlatform, deviceId?: string) =>
    listMobilePackages(platform, deviceId)
  )
  ipcMain.handle('games:mobile:listFavorites', () => listMobileFavorites())
  ipcMain.handle(
    'games:mobile:addFavorite',
    (_e, applicationId: string, label?: string, note?: string) =>
      addMobileFavorite(applicationId, label, note)
  )
  ipcMain.handle('games:mobile:removeFavorite', (_e, id: string) => removeMobileFavorite(id))

  ipcMain.handle('games:pc:listPaths', () => listPcPaths())
  ipcMain.handle('games:pc:addPath', async (_e, path: string, label?: string, source?: 'manual' | 'search') => {
    const entry = addPcPath(path, label, source ?? 'manual')
    await deviceMonitor.refresh('windows', true)
    return entry
  })
  ipcMain.handle('games:pc:removePath', async (_e, id: string) => {
    const ok = removePcPath(id)
    if (ok) await deviceMonitor.refresh('windows', true)
    return ok
  })
  ipcMain.handle('games:pc:getSearchSettings', () => getPcSearchSettings())
  ipcMain.handle('games:pc:setSearchSettings', (_e, settings) => setPcSearchSettings(settings))
  ipcMain.handle('games:pc:listInstances', () => listPcGameInstances())
  ipcMain.handle('games:pc:ensureLoaded', () => ensurePcGamesLoaded())
  ipcMain.handle('games:pc:scan', async () => {
    log('game_scanner', 'IPC games:pc:scan')
    const games = await scanAndCachePcGames()
    await deviceMonitor.refresh('windows', true)
    return games
  })
  ipcMain.handle('games:pc:launch', (_e, exePath: string) => {
    launchExe(exePath)
  })
  ipcMain.handle('games:openFolder', (_e, path: string) => openFolderInExplorer(path))

  ipcMain.handle('games:pc:pickDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('files:local:list', (_e, root: string, relativePath?: string) =>
    listLocalDir(root, relativePath ?? '')
  )
  ipcMain.handle('files:local:read', (_e, root: string, relativePath: string) =>
    readLocalFile(root, relativePath)
  )
  ipcMain.handle('files:local:write', (_e, root: string, relativePath: string, content: string, binary?: boolean) => {
    writeLocalFile(root, relativePath, content, binary ?? false)
  })
  ipcMain.handle('files:local:delete', (_e, root: string, relativePath: string) => {
    deleteLocalPath(root, relativePath)
  })
  ipcMain.handle('files:local:mkdir', (_e, root: string, relativePath: string) => {
    mkdirLocal(root, relativePath)
  })
  ipcMain.handle('files:local:rename', (_e, root: string, fromRel: string, toRel: string) => {
    renameLocal(root, fromRel, toRel)
  })

  ipcMain.handle(
    'files:mobile:list',
    (_e, platform: MobilePlatform, deviceId: string, packageId: string, relativePath?: string) =>
      listMobileDir(platform, deviceId, packageId, relativePath ?? '')
  )
  ipcMain.handle(
    'files:mobile:read',
    (_e, platform: MobilePlatform, deviceId: string, packageId: string, relativePath: string) =>
      readMobileFile(platform, deviceId, packageId, relativePath)
  )
  ipcMain.handle(
    'files:mobile:write',
    (
      _e,
      platform: MobilePlatform,
      deviceId: string,
      packageId: string,
      relativePath: string,
      content: string,
      binary?: boolean
    ) => writeMobileFile(platform, deviceId, packageId, relativePath, content, binary ?? false)
  )
  ipcMain.handle(
    'files:mobile:delete',
    (_e, platform: MobilePlatform, deviceId: string, packageId: string, relativePath: string) =>
      deleteMobilePath(platform, deviceId, packageId, relativePath)
  )
  ipcMain.handle(
    'files:mobile:mkdir',
    (_e, platform: MobilePlatform, deviceId: string, packageId: string, relativePath: string) =>
      mkdirMobile(platform, deviceId, packageId, relativePath)
  )

  ipcMain.handle(
    'files:device:list',
    (_e, platform: DeviceFsPlatform, deviceId: string, relativePath?: string) =>
      listDeviceDir(platform, deviceId, relativePath ?? '')
  )
  ipcMain.handle(
    'files:device:read',
    (_e, platform: DeviceFsPlatform, deviceId: string, relativePath: string) =>
      readDeviceFile(platform, deviceId, relativePath)
  )
  ipcMain.handle(
    'files:device:write',
    (
      _e,
      platform: DeviceFsPlatform,
      deviceId: string,
      relativePath: string,
      content: string,
      binary?: boolean
    ) => writeDeviceFile(platform, deviceId, relativePath, content, binary ?? false)
  )
  ipcMain.handle(
    'files:device:delete',
    (_e, platform: DeviceFsPlatform, deviceId: string, relativePath: string) =>
      deleteDevicePath(platform, deviceId, relativePath)
  )
  ipcMain.handle(
    'files:device:mkdir',
    (_e, platform: DeviceFsPlatform, deviceId: string, relativePath: string) =>
      mkdirDevice(platform, deviceId, relativePath)
  )

  // ---- 应用包目录 IPC（移动三端统一入口） ----

  ipcMain.handle(
    'files:app:list',
    (_e, platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath?: string) =>
      listAppDir(platform, deviceId, packageId, relativePath ?? '')
  )
  ipcMain.handle(
    'files:app:read',
    (_e, platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath: string) =>
      readAppFile(platform, deviceId, packageId, relativePath)
  )
  ipcMain.handle(
    'files:app:write',
    (
      _e,
      platform: DeviceFsPlatform,
      deviceId: string,
      packageId: string,
      relativePath: string,
      content: string,
      binary?: boolean
    ) => writeAppFile(platform, deviceId, packageId, relativePath, content, binary ?? false)
  )
  ipcMain.handle(
    'files:app:delete',
    (_e, platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath: string) =>
      deleteAppPath(platform, deviceId, packageId, relativePath)
  )
  ipcMain.handle(
    'files:app:mkdir',
    (_e, platform: DeviceFsPlatform, deviceId: string, packageId: string, relativePath: string) =>
      mkdirApp(platform, deviceId, packageId, relativePath)
  )

  ipcMain.handle('files:pickLocalFile', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] })
    if (result.canceled || !result.filePaths[0]) return null
    const path = result.filePaths[0]
    const buf = readFileSync(path)
    const binary = buf.includes(0)
    return {
      name: path.split(/[/\\]/).pop() ?? 'file',
      content: binary ? buf.toString('base64') : buf.toString('utf8'),
      binary
    }
  })

  ipcMain.handle(
    'files:saveLocalFile',
    async (event, defaultName: string, content: string, binary?: boolean) => {
      const safeDefaultName =
        defaultName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'download'
      const saveOptions: SaveDialogOptions = {
        defaultPath: safeDefaultName,
        properties: ['showOverwriteConfirmation']
      }
      const parentWindow = BrowserWindow.fromWebContents(event.sender)
      const result = parentWindow
        ? await dialog.showSaveDialog(parentWindow, saveOptions)
        : await dialog.showSaveDialog(saveOptions)
      if (result.canceled || !result.filePath) return null
      if (binary) {
        writeFileSync(result.filePath, Buffer.from(content, 'base64'))
      } else {
        writeFileSync(result.filePath, content, 'utf8')
      }
      return result.filePath
    }
  )

  // ---- 目录缓存 IPC ----

  /** 预热：设备连接后立即异步加载根目录（不等待结果） */
  ipcMain.handle(
    'cache:preload',
    async (
      _e,
      mode: 'local' | 'device',
      opts: { root?: string; platform?: string; deviceId?: string; packageId?: string }
    ) => {
      const key = makeCacheKey(mode, { ...opts, relativePath: '' })
      if (dirCache.get(key)) return // 已有缓存，跳过
      try {
        if (mode === 'local' && opts.root) {
          const entries = listLocalDir(opts.root)
          dirCache.set(key, { entries })
        } else if (mode === 'device' && opts.platform && opts.deviceId) {
          await listDeviceDir(opts.platform as DeviceFsPlatform, opts.deviceId, '')
        }
      } catch {
        // 预热失败不影响正常流程
      }
    }
  )

  /** 使指定路径的缓存失效 */
  ipcMain.handle(
    'cache:invalidate',
    (
      _e,
      mode: 'local' | 'device' | 'mobile',
      opts: {
        root?: string
        platform?: string
        deviceId?: string
        packageId?: string
        relativePath?: string
      }
    ) => {
      const key = makeCacheKey(mode, opts)
      dirCache.invalidate(key)
    }
  )

  /** 使某个设备的所有缓存失效 */
  ipcMain.handle(
    'cache:invalidateDevice',
    (_e, platform: string, deviceId: string) => {
      const prefix = `device:${platform}:${deviceId}:`
      dirCache.invalidatePrefix(prefix)
    }
  )

  /** 清除所有缓存 */
  ipcMain.handle('cache:clear', () => {
    dirCache.clear()
  })
}
