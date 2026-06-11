<script lang="ts">
  import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    CheckSquare,
    ChevronRight,
    Clipboard,
    Copy,
    ExternalLink,
    File as FileIcon,
    FilePlus,
    Folder,
    FolderPlus,
    Bookmark,
    Pencil,
    RefreshCw,
    Scissors,
    Search,
    Square,
    Star,
    Trash2,
    Upload
  } from '@lucide/svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { cn } from '$lib/utils'
  import {
    filesApi,
    type DeviceFsPlatform,
    type FileEntry,
    type FileFavoritePlatform,
    type FileOpenSource,
    type FilePathFavorite
  } from '$lib/files'
  import {
    cycleSortState,
    deriveFavoriteLabel,
    filterAndSortEntries,
    formatFileSize,
    getBreadcrumbRootSegments,
    getContextMenuPosition,
    getSelectionSummary,
    type BreadcrumbSegment,
    type SortKey,
    type SortState
  } from './file-explorer-utils'

  type FileExplorerSource =
    | { type: 'local'; root: string; label?: string }
    | {
        type: 'app'
        platform: DeviceFsPlatform
        deviceId: string
        packageId: string
        label?: string
      }
    | { type: 'device'; platform: DeviceFsPlatform; deviceId: string; label?: string }

  type MenuState = { x: number; y: number; entry?: DisplayEntry }
  type ClipboardState = {
    action: 'copy' | 'cut'
    contextKey: string
    entries: DisplayEntry[]
  }
  type CreateKind = 'file' | 'folder'

  interface DisplayEntry extends FileEntry {}

  let { source }: { source: FileExplorerSource } = $props()

  let cwd = $state('')
  let entries = $state<DisplayEntry[]>([])
  let dataRoot = $state('')
  let loading = $state(false)
  let refreshing = $state(false)
  let error = $state<string | null>(null)
  let selectedPaths = $state<string[]>([])
  let searchQuery = $state('')
  let sortState = $state<SortState>({ key: 'name', direction: 'default' })
  let newName = $state('')
  let createPanelOpen = $state(false)
  let createKind = $state<CreateKind>('folder')
  let contextMenu = $state<MenuState | null>(null)
  let clipboard = $state<ClipboardState | null>(null)
  let favorites = $state<FilePathFavorite[]>([])
  let backStack = $state<string[]>([])
  let forwardStack = $state<string[]>([])
  let lastSourceKey = ''

  const sourceKey = $derived.by(() => {
    if (source.type === 'local') return `local|${source.root}`
    if (source.type === 'app') {
      return `app|${source.platform}|${source.deviceId}|${source.packageId}`
    }
    return `device|${source.platform}|${source.deviceId}`
  })

  const contextKey = $derived.by(() => {
    if (source.type === 'local') return `local|${source.root}`
    if (source.type === 'app') {
      return `app|${source.platform}|${source.deviceId}|${source.packageId}`
    }
    return `device|${source.platform}|${source.deviceId}`
  })

  const selectedCount = $derived(selectedPaths.length)
  const visibleEntries = $derived(filterAndSortEntries(entries, searchQuery, sortState))
  const visiblePaths = $derived(visibleEntries.map(resolveEntryPath))
  const selectedEntries = $derived.by(() =>
    entries.filter((entry) => selectedPaths.includes(resolveEntryPath(entry)))
  )
  const selectionSummary = $derived(getSelectionSummary(selectedEntries))
  const canMutate = $derived.by(() => {
    if (source.type === 'local') return true
    if (source.type === 'app') return Boolean(source.platform && source.deviceId && source.packageId)
    return Boolean(source.platform && source.deviceId)
  })
  const favoritePlatform = $derived<FileFavoritePlatform>(
    source.type === 'local' ? 'windows' : source.platform
  )
  const favoriteRoot = $derived(source.type === 'local' ? source.root : undefined)
  const favoritesSupported = $derived(source.type !== 'app')
  const currentFavorite = $derived.by(() =>
    favorites.find((favorite) => favorite.path === normalizeRel(cwd))
  )

  function normalizeRel(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
  }

  function joinRel(...parts: string[]): string {
    return parts.map(normalizeRel).filter(Boolean).join('/')
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

  function favoriteSourceType(): 'local' | 'device' {
    return source.type === 'local' ? 'local' : 'device'
  }

  function toOpenSource(): FileOpenSource {
    if (source.type === 'local') return { type: 'local', root: source.root }
    if (source.type === 'app') {
      return {
        type: 'app',
        platform: source.platform,
        deviceId: source.deviceId,
        packageId: source.packageId
      }
    }
    return { type: 'device', platform: source.platform, deviceId: source.deviceId }
  }

  async function loadFavorites(): Promise<void> {
    if (!favoritesSupported) {
      favorites = []
      return
    }
    favorites = await filesApi.listFavorites(favoritePlatform, favoriteRoot)
  }

  const breadcrumbs = $derived.by<BreadcrumbSegment[]>(() => {
    const crumbs = getBreadcrumbRootSegments(
      source.type === 'local'
        ? {
            sourceType: 'local',
            label: source.label,
            localRoot: source.root,
            dataRoot
          }
        : source.type === 'app'
          ? {
              sourceType: 'app',
              platform: source.platform,
              label: source.label,
              packageId: source.packageId,
              dataRoot
            }
          : {
              sourceType: 'device',
              platform: source.platform,
              label: source.label,
              dataRoot
            }
    )
    let acc = ''
    for (const part of cwd.split('/').filter(Boolean)) {
      acc = joinRel(acc, part)
      crumbs.push({ label: part, title: acc, target: acc })
    }
    return crumbs
  })

  async function listAt(path: string): Promise<{ root: string; entries: DisplayEntry[]; hint?: string }> {
    if (source.type === 'local') {
      return { root: source.root, entries: await filesApi.listLocal(source.root, path) }
    }

    if (source.type === 'app') {
      const res = await filesApi.listApp(source.platform, source.deviceId, source.packageId, path)
      return { root: res.root, entries: res.entries, hint: res.hint }
    }

    const res = await filesApi.listDevice(source.platform, source.deviceId, path)
    return { root: res.root, entries: res.entries, hint: res.hint }
  }

  function cacheMode(path: string) {
    if (source.type === 'local') return { mode: 'local' as const, opts: { root: source.root, relativePath: path } }
    if (source.type === 'app') {
      return {
        mode: 'mobile' as const,
        opts: {
          platform: source.platform,
          deviceId: source.deviceId,
          packageId: source.packageId,
          relativePath: path
        }
      }
    }
    return {
      mode: 'device' as const,
      opts: { platform: source.platform, deviceId: source.deviceId, relativePath: path }
    }
  }

  async function loadDir(path = cwd, forceRefresh = false): Promise<boolean> {
    const nextPath = normalizeRel(path)
    if (forceRefresh) {
      const cacheOpts = cacheMode(nextPath)
      await filesApi.cacheInvalidate(cacheOpts.mode, cacheOpts.opts)
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
      return true
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      entries = []
      return false
    } finally {
      loading = false
      refreshing = false
    }
  }

  async function navigateTo(path: string, pushHistory = true): Promise<void> {
    const nextPath = normalizeRel(path)
    const previousPath = cwd
    if (nextPath === previousPath && !error) return

    const ok = await loadDir(nextPath)
    if (!ok) return

    if (pushHistory) {
      backStack = [...backStack, previousPath]
      forwardStack = []
    }
  }

  function changeSort(key: SortKey): void {
    sortState = cycleSortState(sortState, key)
  }

  function sortLabel(key: SortKey): string {
    if (sortState.key !== key || sortState.direction === 'default') return ''
    return sortState.direction === 'asc' ? '↑' : '↓'
  }

  function isFavorite(path: string): FilePathFavorite | undefined {
    const normalizedPath = normalizeRel(path)
    return favorites.find((favorite) => favorite.path === normalizedPath)
  }

  async function toggleFavorite(path = cwd): Promise<void> {
    if (!favoritesSupported) return
    const normalizedPath = normalizeRel(path)
    const existing = isFavorite(normalizedPath)
    if (existing) {
      await filesApi.removeFavorite(existing.id)
    } else {
      await filesApi.addFavorite({
        platform: favoritePlatform,
        sourceType: favoriteSourceType(),
        root: favoriteRoot,
        path: normalizedPath,
        label: deriveFavoriteLabel(normalizedPath)
      })
    }
    await loadFavorites()
    contextMenu = null
  }

  async function jumpToFavorite(favorite: FilePathFavorite): Promise<void> {
    await navigateTo(favorite.path)
  }

  async function goBack(): Promise<void> {
    const target = backStack.at(-1)
    if (target === undefined) return

    const previousPath = cwd
    const ok = await loadDir(target)
    if (!ok) return

    backStack = backStack.slice(0, -1)
    forwardStack = [previousPath, ...forwardStack]
  }

  async function goForward(): Promise<void> {
    const target = forwardStack[0]
    if (target === undefined) return

    const previousPath = cwd
    const ok = await loadDir(target)
    if (!ok) return

    forwardStack = forwardStack.slice(1)
    backStack = [...backStack, previousPath]
  }

  async function goUp(): Promise<void> {
    if (!cwd) return
    await navigateTo(parentPath(cwd))
  }

  function selectOnly(path: string): void {
    selectedPaths = [path]
  }

  function toggleSelection(path: string): void {
    selectedPaths = selectedPaths.includes(path)
      ? selectedPaths.filter((item) => item !== path)
      : [...selectedPaths, path]
  }

  function toggleAllVisible(): void {
    const allVisibleSelected =
      visiblePaths.length > 0 && visiblePaths.every((path) => selectedPaths.includes(path))

    if (allVisibleSelected) {
      selectedPaths = selectedPaths.filter((path) => !visiblePaths.includes(path))
    } else {
      selectedPaths = Array.from(new Set([...selectedPaths, ...visiblePaths]))
    }
  }

  async function openEntry(entry: DisplayEntry): Promise<void> {
    const next = resolveEntryPath(entry)
    if (entry.isDirectory) {
      await navigateTo(next)
    } else {
      selectOnly(next)
    }
  }

  async function openExternal(entry: DisplayEntry): Promise<void> {
    if (entry.isDirectory) {
      await navigateTo(resolveEntryPath(entry))
      return
    }

    try {
      await filesApi.open(toOpenSource(), resolveEntryPath(entry), entry.name)
      contextMenu = null
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function readEntry(path: string): Promise<{ text: string; binary: boolean }> {
    if (source.type === 'local') return filesApi.readLocal(source.root, path)
    if (source.type === 'app') {
      return filesApi.readApp(source.platform, source.deviceId, source.packageId, path)
    }
    return filesApi.readDevice(source.platform, source.deviceId, path)
  }

  async function writeEntry(path: string, content: string, binary = false): Promise<void> {
    if (source.type === 'local') return filesApi.writeLocal(source.root, path, content, binary)
    if (source.type === 'app') {
      return filesApi.writeApp(source.platform, source.deviceId, source.packageId, path, content, binary)
    }
    return filesApi.writeDevice(source.platform, source.deviceId, path, content, binary)
  }

  async function mkdirEntry(path: string): Promise<void> {
    if (source.type === 'local') return filesApi.mkdirLocal(source.root, path)
    if (source.type === 'app') return filesApi.mkdirApp(source.platform, source.deviceId, source.packageId, path)
    return filesApi.mkdirDevice(source.platform, source.deviceId, path)
  }

  async function deleteEntry(path: string): Promise<void> {
    if (source.type === 'local') return filesApi.deleteLocal(source.root, path)
    if (source.type === 'app') return filesApi.deleteApp(source.platform, source.deviceId, source.packageId, path)
    return filesApi.deleteDevice(source.platform, source.deviceId, path)
  }

  async function listEntry(path: string): Promise<DisplayEntry[]> {
    const res = await listAt(path)
    return res.entries
  }

  async function copyEntry(sourceEntry: DisplayEntry, targetPath: string): Promise<void> {
    const sourcePath = resolveEntryPath(sourceEntry)

    if (sourceEntry.isDirectory) {
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

  function openCreate(kind: CreateKind, presetName = ''): void {
    createKind = kind
    newName = presetName
    createPanelOpen = true
    contextMenu = null
  }

  async function createFile(): Promise<boolean> {
    const name = newName.trim()
    if (!name || !canMutate) return false
    try {
      await writeEntry(joinRel(cwd, name), '', false)
      newName = ''
      await loadDir(cwd, true)
      return true
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      return false
    }
  }

  async function createFolder(): Promise<boolean> {
    const name = newName.trim()
    if (!name || !canMutate) return false
    try {
      await mkdirEntry(joinRel(cwd, name))
      newName = ''
      await loadDir(cwd, true)
      return true
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      return false
    }
  }

  async function submitCreate(): Promise<void> {
    const ok = createKind === 'folder' ? await createFolder() : await createFile()
    if (ok) createPanelOpen = false
  }

  async function uploadFromPc(): Promise<void> {
    if (!canMutate) return
    contextMenu = null
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
        await deleteEntry(resolveEntryPath(entry))
      }
      await loadDir(cwd, true)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function renameSelected(): Promise<void> {
    const entry = selectedEntries[0]
    if (!entry || selectedEntries.length !== 1 || !canMutate) return
    const nextName = prompt('重命名', entry.name)?.trim()
    if (!nextName || nextName === entry.name) return

    try {
      const sourcePath = resolveEntryPath(entry)
      const targetPath = joinRel(parentPath(sourcePath), nextName)
      if (source.type === 'local') {
        await filesApi.renameLocal(source.root, sourcePath, targetPath)
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
    const estimatedHeight = entry ? 360 : 180
    const position = getContextMenuPosition(
      { x: event.clientX, y: event.clientY },
      { width: 224, height: estimatedHeight },
      { width: window.innerWidth, height: window.innerHeight }
    )
    contextMenu = { ...position, entry }
  }

  function formatModifiedAt(value?: string): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    const tagName = target.tagName.toLowerCase()
    return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (isEditableTarget(event.target)) return
    if (!event.ctrlKey && !event.metaKey) return

    const key = event.key.toLowerCase()
    if (key === 'c') {
      if (selectedEntries.length === 0) return
      event.preventDefault()
      copySelected('copy')
    } else if (key === 'x') {
      if (selectedEntries.length === 0 || !canMutate) return
      event.preventDefault()
      copySelected('cut')
    } else if (key === 'v') {
      if (!clipboard || !canMutate) return
      event.preventDefault()
      void pasteIntoCurrent()
    }
  }

  function handleMouseButton(event: MouseEvent): void {
    if (event.button === 3) {
      event.preventDefault()
      void goBack()
    } else if (event.button === 4) {
      event.preventDefault()
      void goForward()
    }
  }

  $effect(() => {
    const key = sourceKey
    if (key === lastSourceKey) return
    lastSourceKey = key
    cwd = ''
    entries = []
    dataRoot = ''
    selectedPaths = []
    searchQuery = ''
    error = null
    contextMenu = null
    createPanelOpen = false
    backStack = []
    forwardStack = []
    void loadDir('')
    void loadFavorites()
  })
</script>

<svelte:window onkeydown={handleGlobalKeydown} onmouseup={handleMouseButton} />

<div
  class="relative flex h-full min-h-[280px] flex-col overflow-hidden bg-background"
  role="presentation"
  onmousedown={() => (contextMenu = null)}
>
  <div class="flex h-14 shrink-0 items-center gap-2 border-b border-border/90 bg-card/95 px-3 shadow-sm">
    <div class="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onclick={goBack}
        disabled={backStack.length === 0 || loading}
        title="后退"
        aria-label="后退"
      >
        <ArrowLeft class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onclick={goForward}
        disabled={forwardStack.length === 0 || loading}
        title="前进"
        aria-label="前进"
      >
        <ArrowRight class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onclick={goUp}
        disabled={!cwd || loading}
        title="上一级"
        aria-label="上一级"
      >
        <ArrowUp class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onclick={() => loadDir(cwd, true)}
        disabled={loading}
        title="刷新"
        aria-label="刷新"
      >
        <RefreshCw class={cn('size-4', (loading || refreshing) && 'animate-spin')} />
      </Button>
    </div>

    <div class="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-border/90 bg-background px-1.5 py-1.5 text-sm shadow-inner">
      <div class="flex min-w-0 flex-1 items-center overflow-x-auto">
        {#each breadcrumbs as crumb, index (`${crumb.target}:${index}`)}
          {#if index > 0}
            <ChevronRight class="mx-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          {/if}
          <button
            type="button"
            class={cn(
              'max-w-72 shrink-0 truncate rounded px-1.5 py-0.5 font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              index === breadcrumbs.length - 1 ? 'text-foreground' : 'text-muted-foreground'
            )}
            title={crumb.title}
            onclick={() => navigateTo(crumb.target)}
          >
            {crumb.label}
          </button>
        {/each}
      </div>
      <button
        type="button"
        class="ms-1 flex size-7 shrink-0 items-center justify-center rounded-md border-l border-border/80 pl-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
        title={currentFavorite ? '取消收藏当前文件夹' : '收藏当前文件夹'}
        aria-label={currentFavorite ? '取消收藏当前文件夹' : '收藏当前文件夹'}
        disabled={!favoritesSupported}
        onclick={() => void toggleFavorite(cwd)}
      >
        <Star class="size-4" fill={currentFavorite ? 'currentColor' : 'none'} strokeWidth={1.75} />
      </button>
    </div>

    <label class="relative w-40 shrink-0">
      <span class="sr-only">搜索当前目录</span>
      <Search class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input bind:value={searchQuery} class="h-9 pl-8 text-sm" placeholder="搜索" />
    </label>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        disabled={!favoritesSupported}
      >
        <Bookmark class="size-4" strokeWidth={1.75} />
        收藏夹
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="min-w-52 rounded-lg" align="end" sideOffset={6}>
        {#if favorites.length === 0}
          <DropdownMenu.Label class="text-xs text-muted-foreground">暂无收藏路径</DropdownMenu.Label>
        {:else}
          {#each favorites as favorite (favorite.id)}
            <DropdownMenu.Item
              class="flex items-center gap-2 pr-1"
              onclick={() => void jumpToFavorite(favorite)}
            >
              <span class="min-w-0 flex-1 truncate text-sm">{favorite.label}</span>
              <button
                type="button"
                class="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="删除收藏"
                aria-label={`删除收藏 ${favorite.label}`}
                onclick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void filesApi.removeFavorite(favorite.id).then(() => loadFavorites())
                }}
              >
                <Trash2 class="size-3.5" strokeWidth={1.75} />
              </button>
            </DropdownMenu.Item>
          {/each}
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  {#if createPanelOpen}
    <div
      class="absolute right-4 top-16 z-30 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl"
      onmousedown={(event) => event.stopPropagation()}
      role="dialog"
      tabindex="-1"
      aria-label={createKind === 'folder' ? '新建文件夹' : '新建文件'}
    >
      <div class="flex items-center gap-2 text-sm font-semibold">
        {#if createKind === 'folder'}
          <FolderPlus class="size-4 text-primary" strokeWidth={1.75} />
          新建文件夹
        {:else}
          <FilePlus class="size-4 text-primary" strokeWidth={1.75} />
          新建文件
        {/if}
      </div>
      <Input
        bind:value={newName}
        placeholder={createKind === 'folder' ? '文件夹名称' : '文件名称'}
        class="mt-3 h-9 text-sm"
        disabled={!canMutate}
        onkeydown={(event) => {
          if (event.key === 'Enter') void submitCreate()
        }}
      />
      <div class="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={() => (createPanelOpen = false)}>取消</Button>
        <Button size="sm" onclick={submitCreate} disabled={!newName.trim() || !canMutate}>创建</Button>
      </div>
    </div>
  {/if}

  {#if error}
    <p class="border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
  {/if}

  <div class="min-h-0 flex-1 overflow-auto" role="presentation" oncontextmenu={(event) => showContextMenu(event)}>
    <div
      class="sticky top-0 z-10 grid border-b border-border bg-background/95 text-xs text-muted-foreground shadow-sm"
      style="grid-template-columns: 44px minmax(220px, 1fr) max-content 112px;"
    >
      <div class="px-4 py-2.5">
        <button type="button" class="flex" onclick={toggleAllVisible} aria-label="全选当前列表">
          {#if visiblePaths.length > 0 && visiblePaths.every((path) => selectedPaths.includes(path))}
            <CheckSquare class="size-4" />
          {:else}
            <Square class="size-4" />
          {/if}
        </button>
      </div>
      <button
        type="button"
        class="px-2 py-2.5 text-left font-medium transition-colors hover:text-foreground"
        onclick={() => changeSort('name')}
      >
        名称 {sortLabel('name')}
      </button>
      <button
        type="button"
        class="whitespace-nowrap px-3 py-2.5 text-left font-medium transition-colors hover:text-foreground"
        onclick={() => changeSort('modifiedAt')}
      >
        修改时间 {sortLabel('modifiedAt')}
      </button>
      <button
        type="button"
        class="px-3 py-2.5 pr-8 text-right font-medium transition-colors hover:text-foreground"
        onclick={() => changeSort('size')}
      >
        大小 {sortLabel('size')}
      </button>
    </div>

    {#if loading}
      <div class="px-3 py-10 text-center text-xs text-muted-foreground">加载中…</div>
    {:else if entries.length === 0}
      <div class="px-3 py-10 text-center text-xs text-muted-foreground">空目录</div>
    {:else if visibleEntries.length === 0}
      <div class="px-3 py-10 text-center text-xs text-muted-foreground">没有匹配的文件</div>
    {:else}
      {#each visibleEntries as entry (resolveEntryPath(entry))}
        {@const path = resolveEntryPath(entry)}
        {@const checked = selectedPaths.includes(path)}
        <div
          class={cn(
            'grid min-h-11 border-b border-border/75 text-sm transition-colors hover:bg-accent/70',
            checked && 'bg-accent text-accent-foreground shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-accent'
          )}
          style="grid-template-columns: 44px minmax(220px, 1fr) max-content 112px;"
          role="row"
          tabindex="-1"
          oncontextmenu={(event) => showContextMenu(event, entry)}
        >
          <div class="flex items-center px-4 py-2">
            <button type="button" class="flex" onclick={() => toggleSelection(path)} aria-label={`选择 ${entry.name}`}>
              {#if checked}
                <CheckSquare class="size-4" />
              {:else}
                <Square class="size-4 text-muted-foreground" />
              {/if}
            </button>
          </div>
          <div class="min-w-0 px-2 py-2">
            <button
              type="button"
              class="flex w-full min-w-0 items-center gap-2.5 text-left"
              onclick={() => selectOnly(path)}
              ondblclick={() => openEntry(entry)}
            >
              {#if entry.isDirectory}
                <Folder class="size-4 shrink-0 text-primary" strokeWidth={1.75} />
              {:else}
                <FileIcon class="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              {/if}
              <span class="truncate font-medium" title={entry.name}>{entry.name}</span>
            </button>
          </div>
          <div class="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
            {formatModifiedAt(entry.modifiedAt)}
          </div>
          <div class="px-3 py-2 pr-8 text-right font-mono text-xs text-muted-foreground">
            {formatFileSize(entry.size, entry.isDirectory)}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="flex h-9 shrink-0 items-center border-t border-border bg-card/80 px-3 text-xs text-muted-foreground">
    {#if selectionSummary.count > 0}
      <span>
        已选中 {selectionSummary.count} 项 · 已知大小 {formatFileSize(selectionSummary.knownSize)}
        {#if selectionSummary.folders > 0}
          · 含 {selectionSummary.folders} 个文件夹未统计
        {/if}
      </span>
    {:else}
      <span>未选择文件</span>
    {/if}
  </div>

  {#if contextMenu}
    <div
      class="fixed z-50 min-w-56 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-xl"
      style={`left: ${contextMenu.x}px; top: ${contextMenu.y}px;`}
      role="menu"
      tabindex="-1"
      onmousedown={(event) => event.stopPropagation()}
    >
      <button
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
        type="button"
        disabled={!canMutate}
        onclick={() => openCreate('folder')}
      >
        <FolderPlus class="size-4" /> 新建文件夹
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
        type="button"
        disabled={!canMutate}
        onclick={() => openCreate('file')}
      >
        <FilePlus class="size-4" /> 新建文件
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
        type="button"
        disabled={!canMutate}
        onclick={uploadFromPc}
      >
        <Upload class="size-4" /> 上传
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
        type="button"
        disabled={!clipboard || !canMutate}
        onclick={pasteIntoCurrent}
      >
        <Clipboard class="size-4" /> 粘贴
      </button>

      {#if contextMenu.entry}
        <div class="my-1 h-px bg-border"></div>
        <button
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
          type="button"
          onclick={() => openEntry(contextMenu!.entry!)}
        >
          {#if contextMenu.entry.isDirectory}
            <Folder class="size-4" /> 打开
          {:else}
            <FileIcon class="size-4" /> 打开
          {/if}
        </button>
        {#if !contextMenu.entry.isDirectory}
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
            type="button"
            onclick={() => openExternal(contextMenu!.entry!)}
          >
            <ExternalLink class="size-4" /> 外部打开
          </button>
        {/if}
        {#if contextMenu.entry.isDirectory && favoritesSupported}
          {@const folderPath = resolveEntryPath(contextMenu.entry)}
          {@const folderFavorite = isFavorite(folderPath)}
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
            type="button"
            onclick={() => void toggleFavorite(folderPath)}
          >
            <Star class="size-4" fill={folderFavorite ? 'currentColor' : 'none'} />
            {folderFavorite ? '取消收藏文件夹' : '收藏文件夹'}
          </button>
        {/if}
        <div class="my-1 h-px bg-border"></div>
        <button
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
          type="button"
          disabled={selectedCount === 0}
          onclick={() => copySelected('copy')}
        >
          <Copy class="size-4" /> 复制
        </button>
        <button
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
          type="button"
          disabled={selectedCount === 0 || !canMutate}
          onclick={() => copySelected('cut')}
        >
          <Scissors class="size-4" /> 剪切
        </button>
        <button
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
          type="button"
          disabled={selectedCount !== 1 || !canMutate}
          onclick={renameSelected}
        >
          <Pencil class="size-4" /> 重命名
        </button>
        <button
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-destructive hover:bg-destructive/10 disabled:opacity-50"
          type="button"
          disabled={selectedCount === 0 || !canMutate}
          onclick={deleteSelected}
        >
          <Trash2 class="size-4" /> 删除
        </button>
      {/if}
    </div>
  {/if}
</div>
