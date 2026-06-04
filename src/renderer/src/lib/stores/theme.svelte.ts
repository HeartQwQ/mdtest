import { setMode } from 'mode-watcher'

export type ThemePalette = 'default' | 'studio' | 'cyber' | 'forge'
export type ColorMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'mdtest-ui-theme'

type StoredTheme = {
  palette: ThemePalette
  colorMode: ColorMode
}

export const themePalettes: { id: ThemePalette; label: string; description: string }[] = [
  { id: 'default', label: '默认', description: '锌灰 + 青色强调（工具台默认）' },
  { id: 'studio', label: '工作室', description: '暖中性色 + 紫罗兰强调' },
  { id: 'cyber', label: '赛博', description: '深底 + 荧光绿强调' },
  { id: 'forge', label: '熔炉', description: '冷灰石板 + 琥珀强调（工业监控感）' }
]

export const colorModes: { id: ColorMode; label: string }[] = [
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
  { id: 'system', label: '跟随系统' }
]

function readStored(): StoredTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTheme
    if (
      themePalettes.some((t) => t.id === parsed.palette) &&
      colorModes.some((m) => m.id === parsed.colorMode)
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

function persist(): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ palette: theme.palette, colorMode: theme.colorMode })
  )
}

function applyPalette(palette: ThemePalette): void {
  document.documentElement.setAttribute('data-theme', palette)
}

const stored = readStored()

export const theme = $state({
  palette: (stored?.palette ?? 'default') as ThemePalette,
  colorMode: (stored?.colorMode ?? 'dark') as ColorMode
})

export function setPalette(next: ThemePalette): void {
  theme.palette = next
  applyPalette(next)
  persist()
}

export function setColorMode(next: ColorMode): void {
  theme.colorMode = next
  setMode(next)
  persist()
}

export function initTheme(): void {
  applyPalette(theme.palette)
  setMode(theme.colorMode)
}
