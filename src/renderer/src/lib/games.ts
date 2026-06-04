export type MobilePlatform = 'android' | 'harmony'

export interface InstalledPackage {
  applicationId: string
  platform: MobilePlatform
  deviceId: string
  label: string
}

export interface MobilePackageFavorite {
  id: string
  applicationId: string
  label: string
  note?: string
  addedAt: string
}

export interface PcGamePathEntry {
  id: string
  path: string
  label: string
  source: 'manual' | 'search'
  addedAt: string
}

export interface PcSearchSettings {
  dirNames: string[]
  maxDepth: number
}

export interface PcScanResult {
  path: string
  matchedDirName: string
  label: string
}

export const gamesApi = {
  listPackages: (platform: MobilePlatform, deviceId?: string) =>
    window.api.gamesMobileListPackages(platform, deviceId) as Promise<InstalledPackage[]>,

  listFavorites: () =>
    window.api.gamesMobileListFavorites() as Promise<MobilePackageFavorite[]>,

  addFavorite: (applicationId: string, label?: string) =>
    window.api.gamesMobileAddFavorite(applicationId, label) as Promise<MobilePackageFavorite>,

  removeFavorite: (id: string) => window.api.gamesMobileRemoveFavorite(id) as Promise<boolean>,

  listPcPaths: () => window.api.gamesPcListPaths() as Promise<PcGamePathEntry[]>,

  addPcPath: (path: string, label?: string, source?: 'manual' | 'search') =>
    window.api.gamesPcAddPath(path, label, source) as Promise<PcGamePathEntry>,

  removePcPath: (id: string) => window.api.gamesPcRemovePath(id) as Promise<boolean>,

  getPcSearchSettings: () =>
    window.api.gamesPcGetSearchSettings() as Promise<PcSearchSettings>,

  setPcSearchSettings: (settings: Partial<PcSearchSettings>) =>
    window.api.gamesPcSetSearchSettings(settings) as Promise<PcSearchSettings>,

  scanPc: () => window.api.gamesPcScan() as Promise<PcGameInstance[]>,

  pickPcDirectory: () => window.api.gamesPcPickDirectory() as Promise<string | null>,

  listPcInstances: () => window.api.gamesPcListInstances() as Promise<PcGameInstance[]>,

  ensurePcLoaded: () => window.api.gamesPcEnsureLoaded() as Promise<PcGameInstance[]>,

  launch: (exePath: string) => window.api.gamesLaunch(exePath) as Promise<void>,

  openFolder: (path: string) => window.api.gamesOpenFolder(path) as Promise<void>
}

export interface PcGameInstance {
  id: string
  path: string
  label: string
  name: string
  source: 'manual' | 'search'
  hasExe: boolean
  exePath?: string
  launcherPath?: string
  appVersion?: string
  srcVersion?: string
}
