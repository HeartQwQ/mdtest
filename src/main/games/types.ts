export type MobilePlatform = 'android' | 'harmony' | 'ios'

/** 从设备上读到的已安装包 */
export interface InstalledPackage {
  applicationId: string
  platform: MobilePlatform
  deviceId: string
  /** 展示用，默认同 applicationId */
  label: string
}

/** 用户收藏的手机端包（跨设备复用包名） */
export interface MobilePackageFavorite {
  id: string
  applicationId: string
  label: string
  note?: string
  addedAt: string
}

/** PC 游戏目录条目 */
export interface PcGamePathEntry {
  id: string
  path: string
  label: string
  source: 'manual' | 'search'
  addedAt: string
}

/** PC 按目录名搜索的配置 */
export interface PcSearchSettings {
  /** 要匹配的文件夹名，如 ShadowTrackerExtra */
  dirNames: string[]
  /** 扫描深度（每盘符） */
  maxDepth: number
}

export interface PcScanResult {
  path: string
  matchedDirName: string
  label: string
}

export interface GamesStore {
  mobileFavorites: MobilePackageFavorite[]
  pcPaths: PcGamePathEntry[]
  pcSearch: PcSearchSettings
}
