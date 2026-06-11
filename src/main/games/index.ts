export type {
  InstalledPackage,
  MobilePackageFavorite,
  FilePathFavorite,
  PcGamePathEntry,
  PcSearchSettings,
  PcScanResult,
  MobilePlatform
} from './types'

export { listMobilePackages } from './mobile-packages'
export {
  listMobileFavorites,
  addMobileFavorite,
  removeMobileFavorite,
  isFavoritePackage
} from './mobile-favorites'

export { listPcPaths, addPcPath, removePcPath } from './pc-paths'
export {
  listFilePathFavorites,
  addFilePathFavorite,
  removeFilePathFavorite,
  type FilePathFavoriteInput
} from './file-path-favorites'
export { getPcSearchSettings, setPcSearchSettings } from './pc-settings'
export { scanPcByDirNames } from './pc-scanner'
export type { PcGameInstance } from './pc-enrich'
export { enrichPcPath, enrichScanPath } from './pc-enrich'
export { openFolderInExplorer, launchExe } from './pc-launch'
export {
  listPcGameInstances,
  scanAndCachePcGames,
  ensurePcGamesLoaded,
  getCachedPcGames,
  removePcGameInstance
} from './pc-workspace'
