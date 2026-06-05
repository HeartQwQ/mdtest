export type {
  InstalledPackage,
  MobilePackageFavorite,
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
