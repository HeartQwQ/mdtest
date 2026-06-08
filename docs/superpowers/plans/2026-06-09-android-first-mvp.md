# Android First MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Android workflow for Peace Elite: device selection, Android screen viewing/control, game file workspace, evidence screenshot, and operation trace.

**Architecture:** Keep Electron main process as the only layer with adb and filesystem authority. The renderer uses typed preload APIs and focused Svelte components; PC / iOS / Harmony remain visible as reserved platform entries but do not receive partial implementation in this MVP.

**Tech Stack:** Electron, electron-vite, Svelte 5 runes, TypeScript, Tailwind CSS 4, shadcn-svelte, lucide-svelte, adb.

---

## Scope

This plan restores screen mirroring as a core product ability, but narrows the first implementation to Android.

Included:

- Android screenshot refresh through adb.
- Android tap coordinate mapping.
- Android Home / Back controls.
- Evidence screenshot save.
- Peace Elite package and known path shortcuts.
- Android file workspace connected to the current selected device.
- Operation trace for screen and file actions.
- Verification with `pnpm run check` and `pnpm run build`.

Not included in this plan:

- PC / iOS / Harmony screen mirroring.
- scrcpy realtime streaming.
- OCR, image recognition, or AI execution.
- Environment template execution engine.
- Multi-user permissions.

## File Structure

- Modify `docs/requirements.md`: keep Android screen control in first-stage acceptance criteria.
- Modify `docs/pomelosuki/project-profile.md`: keep the middle workspace as Android screen control plus file workspace.
- Modify `docs/pomelosuki/ui-v2-design-notes.md`: keep UI layout aligned with Android-first workflow.
- Modify `docs/ai/development-toolchain.md`: force future AI workers to keep screen mirroring in the product core.
- Modify `src/main/devices/android-control.ts`: normalize Android control errors and keep all adb control in one file.
- Modify `src/main/ipc.ts`: expose Android screen/control handlers and operation logging hooks.
- Modify `src/preload/index.ts`: expose typed Android control and operation APIs through `contextBridge`.
- Modify `src/renderer/src/lib/ipc.ts`: type Android control wrappers used by Svelte.
- Create `src/renderer/src/lib/android/screen.ts`: pure helpers for screenshot data URL, coordinate mapping, and evidence filename.
- Create `src/renderer/src/lib/components/AndroidScreenPanel.svelte`: focused Android screen/control UI.
- Modify `src/renderer/src/lib/views/DeviceManagementView.svelte`: default to Android, mount `AndroidScreenPanel`, keep file workspace as a separate tab.
- Create `src/renderer/src/lib/peace-elite.ts`: package ID and Android known paths.
- Create `src/renderer/src/lib/components/PeaceElitePathRail.svelte`: quick path rail for the file workspace.
- Modify `src/renderer/src/lib/components/FileExplorer.svelte`: accept an initial path and reload when the selected quick path changes.
- Create `src/main/operation-log.ts`: append-only local operation trace under Electron `userData`.
- Create `src/renderer/src/lib/operation-log.ts`: renderer wrapper and display types.

## Task 1: Lock Android Screen Control API

**Files:**

- Modify: `src/main/devices/android-control.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/lib/ipc.ts`

- [ ] **Step 1: Confirm existing Android control handlers**

Run:

```powershell
rg -n "android:screenSize|android:screenshot|android:tap|android:keyevent|androidInputText" src\main src\preload src\renderer\src\lib
```

Expected: matches in `src/main/ipc.ts`, `src/preload/index.ts`, and `src/renderer/src/lib/ipc.ts`.

- [ ] **Step 2: Normalize Android control errors**

In `src/main/devices/android-control.ts`, keep the public functions and make all validation messages Chinese and actionable:

```ts
function assertDeviceId(deviceId: string): void {
  if (!deviceId.trim()) throw new Error('缺少 Android 设备 ID，请先选择在线设备')
}

function intArg(value: number, name: string): string {
  if (!Number.isFinite(value)) throw new Error(`${name} 不是有效坐标`)
  return String(Math.round(value))
}
```

Expected: invalid screen control calls fail before adb execution.

- [ ] **Step 3: Keep IPC surface small**

In `src/main/ipc.ts`, expose only these Android handlers for the MVP:

```ts
ipcMain.handle('android:screenSize', (_e, deviceId: string) =>
  getAndroidScreenSize(deviceId)
)
ipcMain.handle('android:screenshot', (_e, deviceId: string) =>
  captureAndroidScreen(deviceId)
)
ipcMain.handle('android:tap', (_e, deviceId: string, x: number, y: number) =>
  tapAndroid(deviceId, x, y)
)
ipcMain.handle('android:keyevent', (_e, deviceId: string, keyCode: number | string) =>
  keyeventAndroid(deviceId, keyCode)
)
```

Expected: swipe and text input may remain present if already implemented, but the screen panel uses only screenshot, tap, and keyevent for first acceptance.

- [ ] **Step 4: Run type check**

Run:

```powershell
corepack pnpm run check
```

Expected: command exits with code `0`.

## Task 2: Add Pure Android Screen Helpers

**Files:**

- Create: `src/renderer/src/lib/android/screen.ts`

- [ ] **Step 1: Create helper module**

Create `src/renderer/src/lib/android/screen.ts`:

```ts
import type { AndroidScreenshot } from '$lib/ipc'

export interface AndroidFrameView {
  src: string
  width?: number
  height?: number
}

export interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

export function screenshotToFrame(frame: AndroidScreenshot): AndroidFrameView {
  return {
    src: `data:${frame.mime};base64,${frame.data}`,
    width: frame.width,
    height: frame.height
  }
}

export function mapPointerToDevice(
  clientX: number,
  clientY: number,
  rect: RectLike,
  frame: AndroidFrameView
): { x: number; y: number } {
  if (!frame.width || !frame.height) throw new Error('缺少 Android 屏幕尺寸，无法映射点击坐标')
  if (rect.width <= 0 || rect.height <= 0) throw new Error('投屏区域尺寸异常，无法映射点击坐标')

  return {
    x: Math.round(((clientX - rect.left) / rect.width) * frame.width),
    y: Math.round(((clientY - rect.top) / rect.height) * frame.height)
  }
}

export function evidenceFilename(deviceName: string, now = new Date()): string {
  const safeDevice = deviceName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'android'
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  return `${safeDevice}-screen-${stamp}.png`
}
```

Expected: helper has no Svelte or Electron dependency.

- [ ] **Step 2: Use helper in screen panel task**

No command in this step. Task 3 imports these helpers directly.

## Task 3: Extract Android Screen Panel

**Files:**

- Create: `src/renderer/src/lib/components/AndroidScreenPanel.svelte`
- Modify: `src/renderer/src/lib/views/DeviceManagementView.svelte`

- [ ] **Step 1: Create focused screen component**

Create `src/renderer/src/lib/components/AndroidScreenPanel.svelte`:

```svelte
<script lang="ts">
  import { CircleDot, ChevronRight, Home, MonitorPlay, RefreshCw, Save } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { cn } from '$lib/utils'
  import { ipc, type DeviceInfo } from '$lib/ipc'
  import { filesApi } from '$lib/files'
  import { evidenceFilename, mapPointerToDevice, screenshotToFrame, type AndroidFrameView } from '$lib/android/screen'

  let { device }: { device: DeviceInfo | null } = $props()

  let frame = $state<AndroidFrameView | null>(null)
  let loading = $state(false)
  let error = $state<string | null>(null)

  const canControl = $derived(device?.platform === 'android' && device.status === 'online')

  export async function refresh(): Promise<void> {
    if (!canControl || !device) {
      frame = null
      return
    }

    loading = true
    error = null
    try {
      frame = screenshotToFrame(await ipc.androidScreenshot(device.id))
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      frame = null
    } finally {
      loading = false
    }
  }

  async function tapFrame(event: MouseEvent): Promise<void> {
    if (!canControl || !device || !frame) return
    const target = event.currentTarget as HTMLButtonElement
    const point = mapPointerToDevice(event.clientX, event.clientY, target.getBoundingClientRect(), frame)
    error = null
    try {
      await ipc.androidTap(device.id, point.x, point.y)
      await refresh()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function keyevent(keyCode: string): Promise<void> {
    if (!canControl || !device) return
    error = null
    try {
      await ipc.androidKeyevent(device.id, keyCode)
      await refresh()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function saveEvidence(): Promise<void> {
    if (!frame || !device) return
    const base64 = frame.src.split(',')[1] ?? ''
    await filesApi.saveLocalFile(evidenceFilename(device.name), base64, true)
  }

  $effect(() => {
    const id = device?.id
    frame = null
    error = null
    if (canControl && id) void refresh()
  })
</script>

<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" onclick={refresh} disabled={!canControl || loading}>
      <RefreshCw class={cn('size-3.5', loading && 'animate-spin')} strokeWidth={1.75} />
      刷新画面
    </Button>
    <Button variant="outline" size="sm" onclick={() => keyevent('KEYCODE_HOME')} disabled={!canControl}>
      <Home class="size-3.5" strokeWidth={1.75} />
      Home
    </Button>
    <Button variant="outline" size="sm" onclick={() => keyevent('KEYCODE_BACK')} disabled={!canControl}>
      <ChevronRight class="size-3.5 rotate-180" strokeWidth={1.75} />
      返回
    </Button>
    <Button variant="outline" size="sm" onclick={saveEvidence} disabled={!frame}>
      <Save class="size-3.5" strokeWidth={1.75} />
      保存证据
    </Button>
  </div>

  {#if error}
    <p class="max-w-xl text-center text-xs text-destructive" role="alert">{error}</p>
  {/if}

  <div class="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
    {#if frame}
      <button
        type="button"
        class="group relative h-full max-h-full max-w-full overflow-hidden rounded-md bg-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={`aspect-ratio: ${frame.width ?? 9} / ${frame.height ?? 16};`}
        onclick={tapFrame}
        aria-label="点击 Android 画面"
        title="点击画面会映射为 adb input tap"
      >
        <img src={frame.src} alt={`${device?.name ?? 'Android'} screen`} class="h-full w-full object-contain" draggable="false" />
        <span class="pointer-events-none absolute right-2 top-2 hidden items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] text-white group-hover:flex">
          <CircleDot class="size-3" strokeWidth={2} />
          点击模拟触控
        </span>
      </button>
    {:else}
      <div class="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <MonitorPlay class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
        <p>{loading ? '正在获取画面...' : canControl ? '暂无截图' : '请选择在线 Android 设备'}</p>
      </div>
    {/if}
  </div>
</div>
```

Expected: `DeviceManagementView.svelte` no longer owns Android screenshot state.

- [ ] **Step 2: Mount the component**

In `src/renderer/src/lib/views/DeviceManagementView.svelte`, import the component:

```ts
import AndroidScreenPanel from '$lib/components/AndroidScreenPanel.svelte'
```

Replace the inline Android screen block in the `activeTab === 'screen'` branch with:

```svelte
{#if selectedDevice.platform === 'android'}
  <AndroidScreenPanel device={selectedDevice} />
{:else}
  <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center">
    <MonitorPlay class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
    <p class="text-sm text-muted-foreground">投屏能力已预留，第一阶段先完成 Android</p>
    <p class="text-xs text-muted-foreground">{selectedDevice.name}</p>
  </div>
{/if}
```

Expected: screen UI behavior stays the same for Android and becomes clearer for non-Android platforms.

- [ ] **Step 3: Default active platform to Android**

In `DeviceManagementView.svelte`, set:

```ts
let activeEnd = $state<EndId>('android')
```

Expected: the device management page opens on Android by default.

- [ ] **Step 4: Run check**

Run:

```powershell
corepack pnpm run check
```

Expected: command exits with code `0`.

## Task 4: Add Peace Elite Known Paths

**Files:**

- Create: `src/renderer/src/lib/peace-elite.ts`
- Create: `src/renderer/src/lib/components/PeaceElitePathRail.svelte`
- Modify: `src/renderer/src/lib/components/FileExplorer.svelte`
- Modify: `src/renderer/src/lib/views/DeviceManagementView.svelte`

- [ ] **Step 1: Add game constants**

Create `src/renderer/src/lib/peace-elite.ts`:

```ts
export const PEACE_ELITE_PACKAGE_ID = 'com.tencent.tmgp.pubgmhd'

export interface KnownAndroidPath {
  id: string
  label: string
  path: string
  description: string
}

export const PEACE_ELITE_ANDROID_PATHS: KnownAndroidPath[] = [
  {
    id: 'app-data',
    label: '应用数据',
    path: 'com.tencent.tmgp.pubgmhd',
    description: '/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd'
  },
  {
    id: 'ue4-game',
    label: 'UE4Game',
    path: 'com.tencent.tmgp.pubgmhd/files/UE4Game',
    description: 'UE4 游戏数据入口'
  },
  {
    id: 'saved',
    label: 'Saved',
    path: 'com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved',
    description: '保存数据、配置与日志入口'
  },
  {
    id: 'logs',
    label: 'Logs',
    path: 'com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved/Logs',
    description: '运行日志目录'
  },
  {
    id: 'config',
    label: 'Config',
    path: 'com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved/Config',
    description: '配置目录'
  }
]
```

Expected: paths are relative to the Android app directory root currently used by `FileExplorer` app mode.

- [ ] **Step 2: Add quick path rail**

Create `src/renderer/src/lib/components/PeaceElitePathRail.svelte`:

```svelte
<script lang="ts">
  import { FolderOpen } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import { PEACE_ELITE_ANDROID_PATHS } from '$lib/peace-elite'

  let {
    activePath = '',
    onSelect
  }: {
    activePath?: string
    onSelect: (path: string) => void
  } = $props()
</script>

<aside class="flex w-44 shrink-0 flex-col gap-1 border-r border-border bg-muted/20 p-2">
  {#each PEACE_ELITE_ANDROID_PATHS as item (item.id)}
    <button
      type="button"
      class={cn(
        'flex min-h-10 items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
        activePath === item.path ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
      title={item.description}
      onclick={() => onSelect(item.path)}
    >
      <FolderOpen class="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
      <span class="min-w-0">
        <span class="block truncate text-xs font-medium">{item.label}</span>
        <span class="block truncate text-[10px] opacity-70">{item.description}</span>
      </span>
    </button>
  {/each}
</aside>
```

Expected: no direct file API calls inside the rail.

- [ ] **Step 3: Let FileExplorer accept initial path**

In `FileExplorer.svelte`, extend props:

```ts
let {
  mode,
  root,
  mobilePlatform,
  devicePlatform,
  deviceId,
  packageId,
  fileMode: fileModeProp,
  initialPath = ''
}: {
  mode: 'local' | 'mobile' | 'device'
  root: string
  mobilePlatform?: DeviceFsPlatform
  devicePlatform?: DeviceFsPlatform
  deviceId?: string
  packageId?: string
  fileMode?: 'app' | 'root'
  initialPath?: string
} = $props()
```

Add a state key:

```ts
let lastInitialPath = ''
```

Add this effect near the existing initialization effects:

```ts
$effect(() => {
  if (initialPath === lastInitialPath) return
  lastInitialPath = initialPath
  cwd = normalizeRel(initialPath)
  entries = []
  selectedPaths = []
  error = null
  contextMenu = null
  void loadDir(cwd)
})
```

Expected: selecting a known path reloads the explorer without remounting the whole page.

- [ ] **Step 4: Wire known paths into DeviceManagementView**

In `DeviceManagementView.svelte`, add imports:

```ts
import PeaceElitePathRail from '$lib/components/PeaceElitePathRail.svelte'
import { PEACE_ELITE_PACKAGE_ID } from '$lib/peace-elite'
```

Add state:

```ts
let activeAndroidPath = $state('com.tencent.tmgp.pubgmhd')
```

For Android file workspace, render:

```svelte
<div class="flex min-h-0 flex-1 overflow-hidden">
  <PeaceElitePathRail activePath={activeAndroidPath} onSelect={(path) => (activeAndroidPath = path)} />
  <div class="min-w-0 flex-1">
    <FileExplorer
      mode="mobile"
      root=""
      mobilePlatform="android"
      deviceId={selectedDevice.id}
      packageId={PEACE_ELITE_PACKAGE_ID}
      fileMode="app"
      initialPath={activeAndroidPath}
    />
  </div>
</div>
```

Expected: Android file tab opens on Peace Elite app data and offers quick jumps to Saved, Logs, and Config.

- [ ] **Step 5: Run check**

Run:

```powershell
corepack pnpm run check
```

Expected: command exits with code `0`.

## Task 5: Add Operation Trace

**Files:**

- Create: `src/main/operation-log.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/index.ts`
- Create: `src/renderer/src/lib/operation-log.ts`
- Modify: `src/renderer/src/lib/components/AndroidScreenPanel.svelte`
- Modify: `src/renderer/src/lib/views/DeviceManagementView.svelte`

- [ ] **Step 1: Create append-only log store**

Create `src/main/operation-log.ts`:

```ts
import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export type OperationKind =
  | 'android.screenshot'
  | 'android.tap'
  | 'android.keyevent'
  | 'android.evidence.save'
  | 'file.open.path'
  | 'file.write'
  | 'file.delete'

export interface OperationRecord {
  id: string
  at: string
  platform: 'android' | 'windows' | 'ios' | 'harmony'
  deviceId?: string
  deviceName?: string
  kind: OperationKind
  target?: string
  result: 'success' | 'failed'
  message?: string
}

const MAX_RECORDS = 500

function storePath(): string {
  const dir = join(app.getPath('userData'), 'mdtest')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'operation-log.json')
}

export function listOperationRecords(): OperationRecord[] {
  try {
    return JSON.parse(readFileSync(storePath(), 'utf8')) as OperationRecord[]
  } catch {
    return []
  }
}

export function appendOperationRecord(record: Omit<OperationRecord, 'id' | 'at'>): OperationRecord {
  const next: OperationRecord = {
    id: randomUUID(),
    at: new Date().toISOString(),
    ...record
  }
  const records = [next, ...listOperationRecords()].slice(0, MAX_RECORDS)
  writeFileSync(storePath(), JSON.stringify(records, null, 2), 'utf8')
  return next
}
```

Expected: operation records are local-only and capped.

- [ ] **Step 2: Add IPC handlers**

In `src/main/ipc.ts`, import:

```ts
import { appendOperationRecord, listOperationRecords, type OperationRecord } from './operation-log'
```

Add handlers:

```ts
ipcMain.handle('operationLog:list', () => listOperationRecords())
ipcMain.handle(
  'operationLog:append',
  (_e, record: Omit<OperationRecord, 'id' | 'at'>) => appendOperationRecord(record)
)
```

Expected: renderer can append screen and file operations without filesystem access.

- [ ] **Step 3: Add preload and renderer wrappers**

In `src/preload/index.ts`, expose:

```ts
operationLogList: () => ipcRenderer.invoke('operationLog:list'),
operationLogAppend: (record: object) => ipcRenderer.invoke('operationLog:append', record),
```

Create `src/renderer/src/lib/operation-log.ts`:

```ts
export type OperationKind =
  | 'android.screenshot'
  | 'android.tap'
  | 'android.keyevent'
  | 'android.evidence.save'
  | 'file.open.path'
  | 'file.write'
  | 'file.delete'

export interface OperationRecord {
  id: string
  at: string
  platform: 'android' | 'windows' | 'ios' | 'harmony'
  deviceId?: string
  deviceName?: string
  kind: OperationKind
  target?: string
  result: 'success' | 'failed'
  message?: string
}

export const operationLogApi = {
  list: () => window.api.operationLogList() as Promise<OperationRecord[]>,
  append: (record: Omit<OperationRecord, 'id' | 'at'>) =>
    window.api.operationLogAppend(record) as Promise<OperationRecord>
}
```

Expected: Svelte components do not call `window.api` directly outside lib wrappers.

- [ ] **Step 4: Log Android screen operations**

In `AndroidScreenPanel.svelte`, import:

```ts
import { operationLogApi } from '$lib/operation-log'
```

After successful screenshot refresh:

```ts
await operationLogApi.append({
  platform: 'android',
  deviceId: device.id,
  deviceName: device.name,
  kind: 'android.screenshot',
  result: 'success'
})
```

After failed screenshot refresh:

```ts
await operationLogApi.append({
  platform: 'android',
  deviceId: device.id,
  deviceName: device.name,
  kind: 'android.screenshot',
  result: 'failed',
  message: error
})
```

After successful tap:

```ts
await operationLogApi.append({
  platform: 'android',
  deviceId: device.id,
  deviceName: device.name,
  kind: 'android.tap',
  target: `${point.x},${point.y}`,
  result: 'success'
})
```

Expected: screen operations appear in the right-side trace after Task 6.

- [ ] **Step 5: Run check**

Run:

```powershell
corepack pnpm run check
```

Expected: command exits with code `0`.

## Task 6: Replace Right Rail With Evidence And Operation Trace

**Files:**

- Modify: `src/renderer/src/lib/views/DeviceManagementView.svelte`

- [ ] **Step 1: Load operation records**

Add import:

```ts
import { operationLogApi, type OperationRecord } from '$lib/operation-log'
```

Add state:

```ts
let operationRecords = $state<OperationRecord[]>([])
```

Add loader:

```ts
async function refreshOperationRecords(): Promise<void> {
  operationRecords = await operationLogApi.list()
}
```

Call it in `onMount` after device watchers are started:

```ts
void refreshOperationRecords()
```

Expected: records are available to the right rail.

- [ ] **Step 2: Render operation trace**

Replace the right top empty-state content with:

```svelte
<div class="min-h-0 flex-1 overflow-auto p-2">
  {#if operationRecords.length === 0}
    <p class="p-3 text-xs text-muted-foreground">暂无操作记录</p>
  {:else}
    <div class="space-y-1">
      {#each operationRecords.slice(0, 30) as record (record.id)}
        <article class="rounded-md border border-border/60 bg-background/50 p-2">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-xs font-medium">{record.kind}</span>
            <span class={cn('text-[10px]', record.result === 'success' ? 'text-online' : 'text-destructive')}>
              {record.result === 'success' ? '成功' : '失败'}
            </span>
          </div>
          <p class="mt-1 truncate text-[10px] text-muted-foreground">{record.deviceName ?? record.deviceId ?? record.platform}</p>
          {#if record.target}
            <p class="mt-1 truncate font-mono text-[10px] text-muted-foreground">{record.target}</p>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</div>
```

Expected: right rail becomes useful before AI is introduced.

- [ ] **Step 3: Refresh trace after screen actions**

Pass a callback into `AndroidScreenPanel`:

```svelte
<AndroidScreenPanel device={selectedDevice} onOperation={refreshOperationRecords} />
```

Update `AndroidScreenPanel.svelte` props:

```ts
let {
  device,
  onOperation
}: {
  device: DeviceInfo | null
  onOperation?: () => void | Promise<void>
} = $props()
```

After each successful or failed `operationLogApi.append`, call:

```ts
await onOperation?.()
```

Expected: operation rail updates without page reload.

- [ ] **Step 4: Run check**

Run:

```powershell
corepack pnpm run check
```

Expected: command exits with code `0`.

## Task 7: Final Verification

**Files:**

- No new files.

- [ ] **Step 1: Run Svelte and TypeScript check**

Run:

```powershell
corepack pnpm run check
```

Expected: command exits with code `0`.

- [ ] **Step 2: Run production build**

Run:

```powershell
corepack pnpm run build
```

Expected: command exits with code `0`.

- [ ] **Step 3: Manual Android smoke test**

Run:

```powershell
corepack pnpm run dev
```

Expected in the app:

- Device management opens on Android.
- Online Android device appears in the selector.
- Screen tab can refresh a screenshot.
- Clicking the screenshot triggers a device tap.
- Home and Back buttons send key events.
- Save evidence opens a local save dialog and writes a PNG.
- File tab shows Peace Elite quick paths.
- Logs path attempts to load `com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved/Logs`.
- Right rail records screenshot and tap operations.

- [ ] **Step 4: Commit when the whole task is green**

Run:

```powershell
git status --short
git add docs src
git commit -m "feat: build android-first testing workspace"
```

Expected: commit succeeds only after check, build, and manual Android smoke test are complete.

## Self Review

Spec coverage:

- Android screen viewing/control is covered by Tasks 1-3.
- Peace Elite Android file workflow is covered by Task 4.
- Evidence and operation trace are covered by Tasks 5-6.
- Android-first with four-platform reservation is covered by the scope and UI fallback.
- Verification is covered by Task 7.

Placeholder scan:

- The plan avoids unspecified implementation steps.
- Each code-bearing step includes concrete code or an exact replacement target.

Type consistency:

- `DeviceInfo`, `AndroidScreenshot`, and `DevicePlatform` remain sourced from `$lib/ipc`.
- `OperationRecord` has matching main and renderer shapes.
- `PEACE_ELITE_PACKAGE_ID` is the single renderer constant for package-aware file workspace.
