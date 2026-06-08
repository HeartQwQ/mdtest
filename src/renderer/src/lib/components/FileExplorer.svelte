<script lang="ts">
  import {
    ArrowUp,
    CheckSquare,
    ChevronRight,
    Clipboard,
    Copy,
    File as FileIcon,
    FilePlus,
    Folder,
    FolderPlus,
    HardDrive,
    Home,
    Package,
    Pencil,
    RefreshCw,
    Scissors,
    Square,
    Trash2,
    Upload
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { cn } from '$lib/utils'
  import { gamesApi } from '../games'
  import { filesApi, type DeviceFsPlatform, type FileEntry } from '../files'

  let {
    mode,
    root,
    mobilePlatform,
    devicePlatform,
    deviceId,
    packageId,
    fileMode: fileModeProp
  }: {
    mode: 'local' | 'mobile' | 'device'
    root: string
    mobilePlatform?: DeviceFsPlatform
    devicePlatform?: DeviceFsPlatform
    deviceId?: string
    packageId?: string
    fileMode?: 'app' | 'root'
  } = $props()

  type SourceMode = 'local' | 'app' | 'root'
  type MenuState = { x: number; y: number; entry?: DisplayEntry }
  type ClipboardState = {
    action: 'copy' | 'cut'
    contextKey: string
    entries: DisplayEntry[]
  }

  interface DisplayEntry extends FileEntry {
    virtualPackage?: boolean
    packageId?: string
  }

  interface Crumb {
    label: string
    title: string
    target: string
    kind: 'local' | 'root' | 'android-app' | 'app-home' | 'app-package'
  }

  let activeFileMode = $state<'app' | 'root'>('app')
  let activePackageId = $state<string | undefined>()
  let cwd = $state('')
  let entries = $state<DisplayEntry[]>([])
  let dataRoot = $state('')
  let loading = $state(false)
  let refreshing = $state(false)
  let error = $state<string | null>(null)
  let selectedPaths = $state<string[]>([])
  let newName = $state('')
  let contextMenu = $state<MenuState | null>(null)
  let clipboard = $state<ClipboardState | null>(null)
  let lastInitKey = ''
  let lastPackageIdProp: string | undefined

  const platform = $derived((mobilePlatform ?? devicePlatform) as DeviceFsPlatform | undefined)
  const sourceMode = $derived<SourceMode>(
    mode === 'local' ? 'local' : activeFileMode === 'root' ? 'root' : 'app'
  )
  const contextKey = $derived.by(() =>
    [sourceMode, root, platform ?? '', deviceId ?? '', activePackageId ?? ''].join('|')
  )
  const selectedCount = $derived(selectedPaths.length)
  const selectedEntries = $derived.by(() =>
    entries.filter((entry) => selectedPaths.includes(resolveEntryPath(entry)))
  )
  const appRoot = $derived(dataRoot || (platform === 'android' ? '/storage/emulated/0/Android/data' : '/'))
  const canMutate = $derived.by(() => {
    if (sourceMode === 'local') return true
    if (!platform || !deviceId) return false
    if (sourceMode === 'root') return true
    if (platform === 'android') return true
    return Boolean(activePackageId)
  })

  function normalizeRel(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
  }

  function joinRel(...parts: string[]): string {
    return parts.map(normalizeRel).filter(Boolean).join('/')
  }

  function joinAbs(base: string, rel: string): string {
    const cleanBase = base === '/' ? '' : base.replace(/\/+$/, '')
    const cleanRel = normalizeRel(rel)
    if (!cleanBase && !cleanRel) return '/'
    return `${cleanBase}/${cleanRel}`.replace(/\/+/g, '/')
  }

  function fileName(path: string): string {
    return normalizeRel(path).split('/').filter(Boolean).pop() ?? ''
  }

  function resolveEntryPath(entry: FileEntry): string {
    return normalizeRel(entry.path || joinRel(cwd, entry.name))
  }

  function parentPath(path: string): string {
    const parts = normalizeRel(path).split('/').filter(Boolean)
    parts.pop()
    return parts.join('/')
  }

  function makePackageEntries(): Promise<DisplayEntry[]> {
    if (!platform || !deviceId) return Promise.resolve([])
    return gamesApi.listPackages(platform, deviceId).then((packages) =>
      packages.map((pkg) => ({
        name: pkg.applicationId,
        path: pkg.applicationId,
        isDirectory: true,
        virtualPackage: true,
        packageId: pkg.applicationId
      }))
    )
  }

  async function listAt(path: string): Promise<{ root: string; entries: DisplayEntry[]; hint?: string }> {
    if (sourceMode === 'local') {
      return { root, entries: await filesApi.listLocal(root, path) }
    }

    if (!platform || !deviceId) return { root: '', entries: [] }

    if (sourceMode === 'root') {
      const res = await filesApi.listDevice(platform, deviceId, path)
      return { root: res.root, entries: res.entries, hint: res.hint }
    }

    if (platform !== 'android' && !activePackageId) {
      return { root: '应用目录', entries: await makePackageEntries() }
    }

    const res = await filesApi.listApp(platform, deviceId, activePackageId ?? '', path)
    return { root: res.root, entries: res.entries, hint: res.hint }
  }

  function cacheMode(path: string) {
    if (sourceMode === 'local') return { mode: 'local' as const, opts: { root, relativePath: path } }
    if (sourceMode === 'root' && platform && deviceId) {
      return { mode: 'device' as const, opts: { platform, deviceId, relativePath: path } }
    }
    if (sourceMode === 'app' && platform && deviceId) {
      return {
        mode: 'mobile' as const,
        opts: { platform, deviceId, packageId: activePackageId ?? '', relativePath: path }
      }
    }
    return null
  }

  async function loadDir(path = cwd, forceRefresh = false): Promise<void> {
    const nextPath = normalizeRel(path)
    if (forceRefresh) {
      const cacheOpts = cacheMode(nextPath)
      if (cacheOpts) await filesApi.cacheInvalidate(cacheOpts.mode, cacheOpts.opts)
    }

    loading = entries.length === 0 || forceRefresh
    refreshing = forceRefresh
    error = null
    contextMenu = null

    try {
      const res = await listAt(nextPath)
      dataRoot = res.root
      entries = res.entries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
      cwd = nextPath
      selectedPaths = []
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      entries = []
    } finally {
      loading = false
      refreshing = false
    }
  }

  function selectOnly(path: string): void {
    selectedPaths = [path]
  }

  function toggleSelection(path: string): void {
    selectedPaths = selectedPaths.includes(path)
      ? selectedPaths.filter((item) => item !== path)
      : [...selectedPaths, path]
  }

  function toggleAll(): void {
    if (selectedPaths.length === entries.length) {
      selectedPaths = []
    } else {
      selectedPaths = entries.map(resolveEntryPath)
    }
  }

  async function openEntry(entry: DisplayEntry): Promise<void> {
    if (entry.virtualPackage) {
      activePackageId = entry.packageId
      await loadDir('')
      return
    }

    const next = resolveEntryPath(entry)
    if (entry.isDirectory) {
      await loadDir(next)
    } else {
      selectOnly(next)
    }
  }

  async function goUp(): Promise<void> {
    if (sourceMode === 'app' && platform !== 'android' && activePackageId && !cwd) {
      activePackageId = undefined
      await loadDir('')
      return
    }
    if (!cwd) return
    await loadDir(parentPath(cwd))
  }

  async function goHome(): Promise<void> {
    if (sourceMode === 'app' && platform !== 'android') activePackageId = undefined
    await loadDir('')
  }

  function breadcrumbsForAbsolute(abs: string, kind: 'root' | 'android-app'): Crumb[] {
    const normalized = abs === '/' ? '/' : `/${normalizeRel(abs)}`
    const parts = normalized.split('/').filter(Boolean)
    const crumbs: Crumb[] = [{ label: '/', title: '/', target: '/', kind }]
    let acc = ''
    for (const part of parts) {
      acc = `${acc}/${part}`.replace(/\/+/g, '/')
      crumbs.push({ label: part, title: acc, target: acc, kind })
    }
    return crumbs
  }

  const breadcrumbs = $derived.by<Crumb[]>(() => {
    if (sourceMode === 'local') {
      const displayRoot = root.replace(/\\/g, '/')
      const rootName = displayRoot.split('/').filter(Boolean).pop() ?? displayRoot
      const crumbs: Crumb[] = [{ label: rootName, title: displayRoot, target: '', kind: 'local' }]
      let acc = ''
      for (const part of cwd.split('/').filter(Boolean)) {
        acc = joinRel(acc, part)
        crumbs.push({ label: part, title: acc, target: acc, kind: 'local' })
      }
      return crumbs
    }

    if (sourceMode === 'root') {
      return breadcrumbsForAbsolute(joinAbs(dataRoot || '/', cwd), 'root')
    }

    if (platform === 'android') {
      return breadcrumbsForAbsolute(joinAbs(appRoot, cwd), 'android-app')
    }

    const crumbs: Crumb[] = [{ label: '应用目录', title: '应用目录', target: '', kind: 'app-home' }]
    if (activePackageId) {
      crumbs.push({
        label: activePackageId,
        title: activePackageId,
        target: '',
        kind: 'app-package'
      })
      let acc = ''
      for (const part of cwd.split('/').filter(Boolean)) {
        acc = joinRel(acc, part)
        crumbs.push({ label: part, title: acc, target: acc, kind: 'app-package' })
      }
    }
    return crumbs
  })

  async function goCrumb(crumb: Crumb): Promise<void> {
    if (crumb.kind === 'local') {
      await loadDir(crumb.target)
      return
    }

    if (crumb.kind === 'root') {
      await loadDir(normalizeRel(crumb.target))
      return
    }

    if (crumb.kind === 'android-app') {
      const target = crumb.target
      const rootPath = appRoot.replace(/\/+$/, '')
      if (target === rootPath || target.startsWith(`${rootPath}/`)) {
        await loadDir(normalizeRel(target.slice(rootPath.length)))
      } else {
        activeFileMode = 'root'
        await loadDir(normalizeRel(target))
      }
      return
    }

    if (crumb.kind === 'app-home') {
      activePackageId = undefined
      await loadDir('')
      return
    }

    await loadDir(crumb.target)
  }

  async function readEntry(path: string): Promise<{ text: string; binary: boolean }> {
    if (sourceMode === 'local') return filesApi.readLocal(root, path)
    if (!platform || !deviceId) throw new Error('未选择设备')
    if (sourceMode === 'root') return filesApi.readDevice(platform, deviceId, path)
    if (platform !== 'android' && !activePackageId) throw new Error('请选择应用包')
    return filesApi.readApp(platform, deviceId, activePackageId ?? '', path)
  }

  async function writeEntry(path: string, content: string, binary = false): Promise<void> {
    if (sourceMode === 'local') return filesApi.writeLocal(root, path, content, binary)
    if (!platform || !deviceId) throw new Error('未选择设备')
    if (sourceMode === 'root') return filesApi.writeDevice(platform, deviceId, path, content, binary)
    if (platform !== 'android' && !activePackageId) throw new Error('请选择应用包')
    return filesApi.writeApp(platform, deviceId, activePackageId ?? '', path, content, binary)
  }

  async function mkdirEntry(path: string): Promise<void> {
    if (sourceMode === 'local') return filesApi.mkdirLocal(root, path)
    if (!platform || !deviceId) throw new Error('未选择设备')
    if (sourceMode === 'root') return filesApi.mkdirDevice(platform, deviceId, path)
    if (platform !== 'android' && !activePackageId) throw new Error('请选择应用包')
    return filesApi.mkdirApp(platform, deviceId, activePackageId ?? '', path)
  }

  async function deleteEntry(path: string): Promise<void> {
    if (sourceMode === 'local') return filesApi.deleteLocal(root, path)
    if (!platform || !deviceId) throw new Error('未选择设备')
    if (sourceMode === 'root') return filesApi.deleteDevice(platform, deviceId, path)
    if (platform !== 'android' && !activePackageId) throw new Error('请选择应用包')
    return filesApi.deleteApp(platform, deviceId, activePackageId ?? '', path)
  }

  async function listEntry(path: string): Promise<DisplayEntry[]> {
    const res = await listAt(path)
    return res.entries
  }

  async function copyEntry(source: DisplayEntry, targetPath: string): Promise<void> {
    const sourcePath = resolveEntryPath(source)
    if (source.virtualPackage) throw new Error('应用包入口不能复制')

    if (source.isDirectory) {
      await mkdirEntry(targetPath)
      const children = await listEntry(sourcePath)
      for (const child of children) {
        await copyEntry({ ...child, path: joinRel(sourcePath, child.name) }, joinRel(targetPath, child.name))
      }
      return
    }

    const file = await readEntry(sourcePath)
    await writeEntry(targetPath, file.text, file.binary)
  }

  function copySelected(action: 'copy' | 'cut'): void {
    if (selectedEntries.length === 0) return
    clipboard = {
      action,
      contextKey,
      entries: selectedEntries.map((entry) => ({ ...entry, path: resolveEntryPath(entry) }))
    }
    contextMenu = null
  }

  async function pasteIntoCurrent(): Promise<void> {
    if (!clipboard || !canMutate) return
    if (clipboard.contextKey !== contextKey) {
      error = '暂只支持同一设备与同一目录类型内复制粘贴'
      return
    }

    try {
      for (const entry of clipboard.entries) {
        const sourcePath = resolveEntryPath(entry)
        const targetPath = joinRel(cwd, entry.name)
        if (targetPath === sourcePath || targetPath.startsWith(`${sourcePath}/`)) continue
        await copyEntry(entry, targetPath)
        if (clipboard.action === 'cut') await deleteEntry(sourcePath)
      }
      if (clipboard.action === 'cut') clipboard = null
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function createFile(): Promise<void> {
    const name = newName.trim()
    if (!name || !canMutate) return
    try {
      await writeEntry(joinRel(cwd, name), '', false)
      newName = ''
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function createFolder(): Promise<void> {
    const name = newName.trim()
    if (!name || !canMutate) return
    try {
      await mkdirEntry(joinRel(cwd, name))
      newName = ''
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function uploadFromPc(): Promise<void> {
    if (!canMutate) return
    const picked = await filesApi.pickLocalFile()
    if (!picked) return
    try {
      await writeEntry(joinRel(cwd, picked.name), picked.content, picked.binary)
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function deleteSelected(): Promise<void> {
    if (selectedEntries.length === 0 || !canMutate) return
    if (!confirm(`确定删除 ${selectedEntries.length} 个项目？`)) return
    try {
      for (const entry of selectedEntries) {
        if (!entry.virtualPackage) await deleteEntry(resolveEntryPath(entry))
      }
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function renameSelected(): Promise<void> {
    const entry = selectedEntries[0]
    if (!entry || selectedEntries.length !== 1 || entry.virtualPackage || !canMutate) return
    const nextName = prompt('重命名', entry.name)?.trim()
    if (!nextName || nextName === entry.name) return

    try {
      const sourcePath = resolveEntryPath(entry)
      const targetPath = joinRel(parentPath(sourcePath), nextName)
      if (sourceMode === 'local') {
        await filesApi.renameLocal(root, sourcePath, targetPath)
      } else {
        await copyEntry(entry, targetPath)
        await deleteEntry(sourcePath)
      }
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  function showContextMenu(event: MouseEvent, entry?: DisplayEntry): void {
    event.preventDefault()
    event.stopPropagation()
    if (entry) {
      const path = resolveEntryPath(entry)
      if (!selectedPaths.includes(path)) selectedPaths = [path]
    }
    contextMenu = { x: event.clientX, y: event.clientY, entry }
  }

  function switchFileMode(next: 'app' | 'root'): void {
    if (activeFileMode === next) return
    activeFileMode = next
    activePackageId = undefined
  }

  $effect(() => {
    if (fileModeProp) activeFileMode = fileModeProp
  })

  $effect(() => {
    const nextPackageId = packageId
    if (nextPackageId === lastPackageIdProp) return
    lastPackageIdProp = nextPackageId
    activePackageId = nextPackageId
  })

  $effect(() => {
    const key = contextKey
    if (key === lastInitKey) return
    lastInitKey = key
    cwd = ''
    entries = []
    selectedPaths = []
    error = null
    contextMenu = null
    void loadDir('')
  })
</script>

<div
  class="flex h-full min-h-[280px] flex-col overflow-hidden rounded-lg border border-border bg-card"
  role="presentation"
  onmousedown={() => (contextMenu = null)}
>
  <div class="flex min-h-0 flex-col border-b border-border bg-muted/20">
    <div class="flex flex-wrap items-center gap-1.5 px-2 py-1.5">
      {#if mode !== 'local'}
        <div class="flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5">
          <button
            type="button"
            class={cn(
              'flex h-7 items-center gap-1 rounded-sm px-2 text-xs font-medium transition-colors',
              activeFileMode === 'app' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            onclick={() => switchFileMode('app')}
            title={platform === 'android' ? '默认读取 /storage/emulated/0/Android/data，系统权限可能限制部分应用目录。' : '自动读取应用包列表，进入后浏览应用沙盒目录。'}
          >
            <Package class="size-3.5" strokeWidth={1.75} />
            应用目录
          </button>
          <button
            type="button"
            class={cn(
              'flex h-7 items-center gap-1 rounded-sm px-2 text-xs font-medium transition-colors',
              activeFileMode === 'root' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            onclick={() => switchFileMode('root')}
            title="从 / 开始读取完整设备目录，系统目录可能因权限不可访问。"
          >
            <HardDrive class="size-3.5" strokeWidth={1.75} />
            根目录
          </button>
        </div>
      {/if}

      <Button variant="ghost" size="icon-sm" onclick={goHome} title="根位置" aria-label="根位置">
        <Home class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={goUp} disabled={!cwd && !(sourceMode === 'app' && activePackageId)} title="上级" aria-label="上级">
        <ArrowUp class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={() => loadDir(cwd, true)} disabled={loading} title="刷新" aria-label="刷新">
        <RefreshCw class={cn('size-4', (loading || refreshing) && 'animate-spin')} />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={uploadFromPc} disabled={!canMutate} title="上传" aria-label="上传">
        <Upload class="size-4" />
      </Button>

      <div class="mx-1 h-5 w-px bg-border"></div>

      <Input bind:value={newName} placeholder="新建名称" class="h-7 min-w-28 max-w-44 text-xs" disabled={!canMutate} />
      <Button variant="outline" size="sm" onclick={createFile} disabled={!newName.trim() || !canMutate} title="新建文件">
        <FilePlus class="size-3.5" /> 文件
      </Button>
      <Button variant="outline" size="sm" onclick={createFolder} disabled={!newName.trim() || !canMutate} title="新建文件夹">
        <FolderPlus class="size-3.5" /> 文件夹
      </Button>

      <div class="mx-1 h-5 w-px bg-border"></div>

      <Button variant="ghost" size="icon-sm" onclick={() => copySelected('copy')} disabled={selectedCount === 0} title="复制" aria-label="复制">
        <Copy class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={() => copySelected('cut')} disabled={selectedCount === 0 || !canMutate} title="剪切" aria-label="剪切">
        <Scissors class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={pasteIntoCurrent} disabled={!clipboard || !canMutate} title="粘贴" aria-label="粘贴">
        <Clipboard class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onclick={renameSelected} disabled={selectedCount !== 1 || !canMutate} title="重命名" aria-label="重命名">
        <Pencil class="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" class="text-destructive hover:bg-destructive/10" onclick={deleteSelected} disabled={selectedCount === 0 || !canMutate} title="删除" aria-label="删除">
        <Trash2 class="size-4" />
      </Button>

      {#if selectedCount > 0}
        <span class="ms-auto text-xs text-muted-foreground">已选 {selectedCount}</span>
      {/if}
    </div>

    <div class="flex min-w-0 items-center gap-0.5 overflow-x-auto px-2 pb-1.5 font-mono text-[11px] text-muted-foreground">
      {#each breadcrumbs as crumb, index (`${crumb.kind}:${crumb.target}:${index}`)}
        {#if index > 0}
          <ChevronRight class="size-3 shrink-0 opacity-50" />
        {/if}
        <button
          type="button"
          class="max-w-56 shrink-0 truncate rounded px-1 py-0.5 underline-offset-2 hover:bg-accent hover:text-foreground hover:underline"
          title={crumb.title}
          onclick={() => goCrumb(crumb)}
        >
          {crumb.label}
        </button>
      {/each}
    </div>
  </div>

  {#if error}
    <p class="border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
  {/if}

  <div class="min-h-0 flex-1 overflow-auto" role="presentation" oncontextmenu={(event) => showContextMenu(event)}>
    <table class="w-full table-fixed text-sm">
      <thead class="sticky top-0 z-10 border-b border-border bg-card/95 text-xs text-muted-foreground">
        <tr>
          <th class="w-9 px-2 py-2 text-left">
            <button type="button" class="flex" onclick={toggleAll} aria-label="全选">
              {#if entries.length > 0 && selectedPaths.length === entries.length}
                <CheckSquare class="size-4" />
              {:else}
                <Square class="size-4" />
              {/if}
            </button>
          </th>
          <th class="px-2 py-2 text-left font-medium">名称</th>
          <th class="w-28 px-2 py-2 text-right font-medium">大小</th>
          <th class="w-40 px-2 py-2 text-left font-medium">修改时间</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr>
            <td colspan="4" class="px-3 py-8 text-center text-xs text-muted-foreground">加载中…</td>
          </tr>
        {:else if entries.length === 0}
          <tr>
            <td colspan="4" class="px-3 py-8 text-center text-xs text-muted-foreground">空目录</td>
          </tr>
        {:else}
          {#each entries as entry (resolveEntryPath(entry))}
            {@const path = resolveEntryPath(entry)}
            {@const checked = selectedPaths.includes(path)}
            <tr
              class={cn(
                'border-b border-border/50 transition-colors hover:bg-accent/50',
                checked && 'bg-accent text-accent-foreground'
              )}
              oncontextmenu={(event) => showContextMenu(event, entry)}
            >
              <td class="px-2 py-1.5 align-middle">
                <button type="button" class="flex" onclick={() => toggleSelection(path)} aria-label={`选择 ${entry.name}`}>
                  {#if checked}
                    <CheckSquare class="size-4" />
                  {:else}
                    <Square class="size-4 text-muted-foreground" />
                  {/if}
                </button>
              </td>
              <td class="min-w-0 px-2 py-1.5 align-middle">
                <button
                  type="button"
                  class="flex w-full min-w-0 items-center gap-2 text-left"
                  onclick={() => selectOnly(path)}
                  ondblclick={() => openEntry(entry)}
                >
                  {#if entry.isDirectory}
                    <Folder class="size-4 shrink-0 text-primary" strokeWidth={1.75} />
                  {:else}
                    <FileIcon class="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  {/if}
                  <span class="truncate" title={entry.name}>{entry.name}</span>
                </button>
              </td>
              <td class="px-2 py-1.5 text-right font-mono text-xs text-muted-foreground">
                {entry.isDirectory ? '—' : entry.size ?? '—'}
              </td>
              <td class="px-2 py-1.5 font-mono text-xs text-muted-foreground">
                {entry.modifiedAt ?? '—'}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  {#if contextMenu}
    <div
      class="fixed z-50 min-w-36 rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg"
      style={`left: ${contextMenu.x}px; top: ${contextMenu.y}px;`}
      role="menu"
      tabindex="-1"
      onmousedown={(event) => event.stopPropagation()}
    >
      {#if contextMenu.entry?.isDirectory}
        <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent" type="button" onclick={() => openEntry(contextMenu!.entry!)}>
          <Folder class="size-4" /> 打开
        </button>
      {/if}
      <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50" type="button" disabled={selectedCount === 0} onclick={() => copySelected('copy')}>
        <Copy class="size-4" /> 复制
      </button>
      <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50" type="button" disabled={selectedCount === 0 || !canMutate} onclick={() => copySelected('cut')}>
        <Scissors class="size-4" /> 剪切
      </button>
      <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50" type="button" disabled={!clipboard || !canMutate} onclick={pasteIntoCurrent}>
        <Clipboard class="size-4" /> 粘贴
      </button>
      <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50" type="button" disabled={selectedCount !== 1 || !canMutate} onclick={renameSelected}>
        <Pencil class="size-4" /> 重命名
      </button>
      <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-destructive hover:bg-destructive/10 disabled:opacity-50" type="button" disabled={selectedCount === 0 || !canMutate} onclick={deleteSelected}>
        <Trash2 class="size-4" /> 删除
      </button>
    </div>
  {/if}
</div>
