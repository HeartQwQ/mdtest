import { ipcMain, dialog } from 'electron'
import { readFileSync } from 'fs'

import { isBundledAdbPresent, resolveAdbPath } from './devices/adb-path'
import { isBundledHdcPresent, resolveHdcPath } from './devices/hdc-path'
import { isBundledIdevicePresent, resolveIdeviceToolchainDir } from './devices/idevice-path'
import { listDevices, platformAvailability } from './devices/manager'
import { deviceMonitor, type WatchPlatform } from './devices/device-monitor'
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
  scanAndCachePcGames,
  setPcSearchSettings
} from './games'
import type { MobilePlatform } from './games/types'
import {
  deleteLocalPath,
  deleteMobilePath,
  listLocalDir,
  listMobileDir,
  mkdirLocal,
  mkdirMobile,
  readLocalFile,
  readMobileFile,
  renameLocal,
  writeLocalFile,
  writeMobileFile
} from './files'

export function registerIpc(): void {
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

  ipcMain.handle('devices:startWatch', (event, platform: WatchPlatform) => {
    deviceMonitor.start(platform, event.sender)
  })
  ipcMain.handle('devices:stopWatch', (event, platform: WatchPlatform) => {
    deviceMonitor.stop(platform, event.sender)
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
  ipcMain.handle('games:pc:addPath', (_e, path: string, label?: string, source?: 'manual' | 'search') =>
    addPcPath(path, label, source ?? 'manual')
  )
  ipcMain.handle('games:pc:removePath', (_e, id: string) => removePcPath(id))
  ipcMain.handle('games:pc:getSearchSettings', () => getPcSearchSettings())
  ipcMain.handle('games:pc:setSearchSettings', (_e, settings) => setPcSearchSettings(settings))
  ipcMain.handle('games:pc:listInstances', () => listPcGameInstances())
  ipcMain.handle('games:pc:ensureLoaded', () => ensurePcGamesLoaded())
  ipcMain.handle('games:pc:scan', () => scanAndCachePcGames())
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
}
