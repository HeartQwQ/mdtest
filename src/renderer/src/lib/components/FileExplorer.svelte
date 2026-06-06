<script lang="ts">
  import {
    ArrowUp,
    ChevronRight,
    File as FileIcon,
    FilePlus,
    Folder,
    FolderPlus,
    HardDrive,
    Home,
    Package,
    RefreshCw,
    Trash2,
    Upload
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { cn } from '$lib/utils'
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
    /** 移动端文件视图模式：'app'=应用包目录（默认），'root'=设备根目录 */
    fileMode?: 'app' | 'root'
  } = $props()

  /** 当前实际文件浏览模式（仅移动端有效） */
  let activeFileMode = $state<'app' | 'root'>('app')

  /** 当前活跃的应用包ID（安卓应用包模式下动态追踪） */
  let activePackageId = $state<string | undefined>(packageId)

  let cwd = $state('')
  let entries = $state<FileEntry[]>([])
  let dataRoot = $state('')
  let storageHint = $state<string | null>(null)
  let loading = $state(false)
  let refreshing = $state(false)
  let error = $state<string | null>(null)
  let selectedPath = $state('')
  let newName = $state('')
  let lastInitKey = ''

  const breadcrumbs = $derived(cwd ? cwd.split(/[/\\]/).filter(Boolean) : [])
  const visibleEntries = $derived(entries)
  /** 当前实际生效的浏览模式 */
  const effectiveMode = $derived.by(() => {
    if (mode === 'local') return 'local'
    // 移动端：根据activeFileMode决定实际模式
    if (mode === 'mobile' || mode === 'device') {
      if (activeFileMode === 'root') return 'device'
      return 'mobile'
    }
    return mode
  })

  const contextKey = $derived.by(() =>
    [effectiveMode, root, mobilePlatform ?? '', devicePlatform ?? '', deviceId ?? '', activePackageId ?? '', activeFileMode].join('|')
  )

  /** 构建当前上下文的缓存失效参数 */
  function getCacheOpts(path: string) {
    if (effectiveMode === 'local') return { mode: 'local' as const, opts: { root, relativePath: path } }
    if (effectiveMode === 'device' && (devicePlatform || mobilePlatform) && deviceId) {
      return { mode: 'device' as const, opts: { platform: (devicePlatform ?? mobilePlatform!) as DeviceFsPlatform, deviceId, relativePath: path } }
    }
    if (effectiveMode === 'mobile' && mobilePlatform && deviceId && activePackageId) {
      return { mode: 'mobile' as const, opts: { platform: mobilePlatform, deviceId, packageId: activePackageId, relativePath: path } }
    }
    return null
  }

  async function loadDir(path = cwd, forceRefresh = false): Promise<void> {
    // 手动刷新时先使缓存失效
    if (forceRefresh) {
      const cacheOpts = getCacheOpts(path)
      if (cacheOpts) await filesApi.cacheInvalidate(cacheOpts.mode, cacheOpts.opts)
    }

    // 首次加载（无已有数据）时显示loading，缓存命中时瞬时展示不闪烁
    const hasData = entries.length > 0 || cwd !== ''
    if (!hasData || forceRefresh) loading = true
    if (forceRefresh) refreshing = true
    error = null
    try {
      if (effectiveMode === 'local') {
        entries = await filesApi.listLocal(root, path)
      } else if (effectiveMode === 'device' && (devicePlatform || mobilePlatform) && deviceId) {
        const plat = (devicePlatform ?? mobilePlatform!) as DeviceFsPlatform
        const res = await filesApi.listDevice(plat, deviceId, path)
        dataRoot = res.root
        storageHint = res.hint ?? null
        entries = res.entries
      } else if (effectiveMode === 'mobile' && mobilePlatform && deviceId) {
        // 安卓应用包模式下不需要 activePackageId 即可列出 /storage/emulated/0/Android/data 目录
        // 当用户进入某个具体应用包子目录后，该子目录名会成为新的 activePackageId
        // 非安卓平台（鸿蒙）必须提供 packageId，安卓允许空字符串
        const effectivePkgId = mobilePlatform === 'android'
          ? (activePackageId ?? '')
          : (activePackageId ?? '')
        if (effectivePkgId !== '' || mobilePlatform === 'android') {
          const res = await filesApi.listApp(mobilePlatform, deviceId, effectivePkgId, path)
          dataRoot = res.root
          storageHint = res.hint ?? null
          entries = res.entries
        } else {
          entries = []
        }
      } else {
        entries = []
      }
      cwd = path
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      entries = []
    } finally {
      loading = false
      refreshing = false
    }
  }

  function resolveEntryPath(ent: FileEntry): string {
    return ent.path || (cwd ? `${cwd}/${ent.name}` : ent.name)
  }

  async function openEntry(ent: FileEntry): Promise<void> {
    const next = resolveEntryPath(ent)
    selectedPath = next
    if (!ent.isDirectory) return
    // 安卓应用包模式下：进入子目录时，将该子目录名设为新的 activePackageId
    if (effectiveMode === 'mobile' && mobilePlatform === 'android' && ent.isDirectory) {
      activePackageId = ent.name
    }
    await loadDir(next)
  }

  async function goUp(): Promise<void> {
    if (!cwd) return
    const parts = cwd.split(/[/\\]/).filter(Boolean)
    parts.pop()
    selectedPath = ''
    await loadDir(parts.join('/'))
  }

  async function goRoot(): Promise<void> {
    selectedPath = ''
    storageHint = null
    await loadDir('')
  }

  async function goBreadcrumb(index: number): Promise<void> {
    const target = breadcrumbs.slice(0, index + 1).join('/')
    selectedPath = ''
    await loadDir(target)
  }

  async function deleteSelected(): Promise<void> {
    const rel = selectedPath || cwd
    if (!rel) return
    if (!confirm(`确定删除「${rel || '当前目录'}」？`)) return
    try {
      if (effectiveMode === 'local') {
        await filesApi.deleteLocal(root, rel)
      } else if (effectiveMode === 'device' && (devicePlatform || mobilePlatform) && deviceId) {
        await filesApi.deleteDevice((devicePlatform ?? mobilePlatform!) as DeviceFsPlatform, deviceId, rel)
      } else if (effectiveMode === 'mobile' && mobilePlatform && deviceId && activePackageId) {
        await filesApi.deleteApp(mobilePlatform, deviceId, activePackageId, rel)
      }
      selectedPath = ''
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function createFolder(): Promise<void> {
    const name = newName.trim()
    if (!name) return
    const rel = cwd ? `${cwd}/${name}` : name
    try {
      if (effectiveMode === 'local') await filesApi.mkdirLocal(root, rel)
      else if (effectiveMode === 'device' && (devicePlatform || mobilePlatform) && deviceId) {
        await filesApi.mkdirDevice((devicePlatform ?? mobilePlatform!) as DeviceFsPlatform, deviceId, rel)
      } else if (effectiveMode === 'mobile' && mobilePlatform && deviceId && activePackageId) {
        await filesApi.mkdirApp(mobilePlatform, deviceId, activePackageId, rel)
      }
      newName = ''
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function createFile(): Promise<void> {
    const name = newName.trim()
    if (!name) return
    const rel = cwd ? `${cwd}/${name}` : name
    try {
      if (effectiveMode === 'local') await filesApi.writeLocal(root, rel, '', false)
      else if (effectiveMode === 'device' && (devicePlatform || mobilePlatform) && deviceId) {
        await filesApi.writeDevice((devicePlatform ?? mobilePlatform!) as DeviceFsPlatform, deviceId, rel, '', false)
      } else if (effectiveMode === 'mobile' && mobilePlatform && deviceId && activePackageId) {
        await filesApi.writeApp(mobilePlatform, deviceId, activePackageId, rel, '', false)
      }
      newName = ''
      await loadDir(cwd)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function uploadFromPc(): Promise<void> {
    const picked = await filesApi.pickLocalFile()
    if (!picked) return
    const rel = cwd ? `${cwd}/${picked.name}` : picked.name
    try {
      if (effectiveMode === 'local') {
        await filesApi.writeLocal(root, rel, picked.content, picked.binary)
      } else if (effectiveMode === 'device' && (devicePlatform || mobilePlatform) && deviceId) {
        await filesApi.writeDevice(
          (devicePlatform ?? mobilePlatform!) as DeviceFsPlatform,
          deviceId,
          rel,
          picked.content,
          picked.binary
        )
      } else if (effectiveMode === 'mobile' && mobilePlatform && deviceId && activePackageId) {
        await filesApi.writeApp(
          mobilePlatform,
          deviceId,
          activePackageId,
          rel,
          picked.content,
          picked.binary
        )
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  /** 切换文件浏览模式（应用包/根目录） */
  function switchFileMode(newMode: 'app' | 'root') {
    if (activeFileMode === newMode) return
    activeFileMode = newMode
  }

  $effect(() => {
    // 同步外部fileModeProp变化
    if (fileModeProp) {
      activeFileMode = fileModeProp
    }
  })

  $effect(() => {
    const key = contextKey
    if (key === lastInitKey) return
    lastInitKey = key
    // 立即清空旧数据，防止切换端/设备时串目录
    entries = []
    cwd = ''
    dataRoot = ''
    storageHint = null
    selectedPath = ''
    error = null
    void loadDir('')
  })
</script>

<div class="flex min-h-[280px] flex-col overflow-hidden rounded-lg border border-border bg-card">
  <div class="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/30 px-2 py-2">
    <Button variant="ghost" size="icon-sm" onclick={goRoot} disabled={!cwd} title="根目录" aria-label="根目录">
      <Home class="size-4" />
    </Button>
    <Button variant="ghost" size="icon-sm" onclick={goUp} disabled={!cwd} title="上级" aria-label="上级">
      <ArrowUp class="size-4" />
    </Button>
    <Button variant="ghost" size="icon-sm" onclick={() => loadDir(cwd)} disabled={loading} title="刷新" aria-label="刷新">
      <RefreshCw class={cn('size-4', loading && 'animate-spin')} />
    </Button>
    <Button variant="ghost" size="icon-sm" onclick={uploadFromPc} title="从本机上传" aria-label="从本机上传">
      <Upload class="size-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon-sm"
      class="text-destructive hover:bg-destructive/10"
      onclick={deleteSelected}
      disabled={!selectedPath && !cwd}
      title="删除"
      aria-label="删除"
    >
      <Trash2 class="size-4" />
    </Button>
    {#if mode !== 'local'}
      <!-- 应用包/根目录切换 -->
      <div class="flex items-center gap-0.5 rounded-md bg-muted/50 p-0.5">
        <button
          type="button"
          class={cn(
            'flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium transition-colors',
            activeFileMode === 'app'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => switchFileMode('app')}
          disabled={mobilePlatform !== 'android' && !activePackageId}
          title="应用包目录"
        >
          <Package class="size-3" strokeWidth={1.75} />
          <span>应用包</span>
        </button>
        <button
          type="button"
          class={cn(
            'flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium transition-colors',
            activeFileMode === 'root'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => switchFileMode('root')}
          title="设备根目录"
        >
          <HardDrive class="size-3" strokeWidth={1.75} />
          <span>根目录</span>
        </button>
      </div>
    {/if}
    <div class="flex min-w-0 flex-1 items-center gap-0.5 truncate px-1 font-mono text-[11px] text-muted-foreground">
      {#if effectiveMode === 'mobile' && dataRoot}
        <button
          type="button"
          class="truncate underline-offset-2 hover:underline"
          onclick={goRoot}
          title={dataRoot}
          aria-label="回到根目录"
        >
          {dataRoot}
        </button>
      {:else if effectiveMode === 'device' && dataRoot}
        <button
          type="button"
          class="truncate underline-offset-2 hover:underline"
          onclick={goRoot}
          title={dataRoot}
          aria-label="回到根目录"
        >
          {dataRoot}
        </button>
      {:else if effectiveMode === 'local'}
        <button
          type="button"
          class="truncate underline-offset-2 hover:underline"
          onclick={goRoot}
          title={root}
          aria-label="回到根目录"
        >
          {root.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? root}
        </button>
      {/if}
      {#each breadcrumbs as part, i (i)}
        <ChevronRight class="size-3 shrink-0 opacity-50" />
        <button
          type="button"
          class="truncate underline-offset-2 hover:underline"
          onclick={() => goBreadcrumb(i)}
          aria-label={`跳转到 ${part}`}
        >
          {part}
        </button>
      {/each}
    </div>
  </div>

  {#if error}
    <p class="border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
  {:else if storageHint}
    <p class="border-b border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{storageHint}</p>
  {/if}

  <div class="flex min-h-[220px] flex-1 flex-col">
    <div class="flex flex-wrap gap-1 border-b border-border p-2">
      <Input bind:value={newName} placeholder="新建名称" class="min-w-[100px] flex-1 text-xs" />
      <Button variant="outline" size="sm" onclick={createFile}>
        <FilePlus class="size-3" /> 文件
      </Button>
      <Button variant="outline" size="sm" onclick={createFolder}>
        <FolderPlus class="size-3" /> 文件夹
      </Button>
    </div>
    <ul class="flex-1 overflow-auto p-1">
      {#if loading}
        <li class="px-3 py-6 text-center text-xs text-muted-foreground">加载中…</li>
      {:else if visibleEntries.length === 0}
        <li class="px-3 py-6 text-center text-xs text-muted-foreground">空目录</li>
      {:else}
        {#each visibleEntries as ent (resolveEntryPath(ent))}
          <li>
            <button
              type="button"
              class={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                selectedPath === resolveEntryPath(ent)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
              onclick={() => openEntry(ent)}
            >
              {#if ent.isDirectory}
                <Folder class="size-4 shrink-0 text-primary" strokeWidth={1.75} />
              {:else}
                <FileIcon class="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              {/if}
              <span class="min-w-0 flex-1 truncate">{ent.name}</span>
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</div>
