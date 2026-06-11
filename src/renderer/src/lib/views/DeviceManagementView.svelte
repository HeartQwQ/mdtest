<script lang="ts">
  import {
    Bot,
    Camera,
    ChevronDown,
    ChevronRight,
    CircleDot,
    FolderOpen,
    Home,
    ListChecks,
    Monitor,
    MonitorPlay,
    Play,
    Plus,
    RefreshCw,
    ScrollText,
    Smartphone,
    Trash2,
    Video
  } from '@lucide/svelte'
  import type { Component } from 'svelte'
  import { onMount } from 'svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { Button } from '$lib/components/ui/button'
  import { cn } from '$lib/utils'
  import { ipc, type DeviceInfo, type DevicePlatform } from '$lib/ipc'
  import { gamesApi } from '$lib/games'
  import { filesApi, type DeviceFsPlatform } from '$lib/files'
  import { reconcileSelectedDevice, watchAllPlatforms } from '$lib/devices/watch'
  import { statusDotClass } from '$lib/ui/status'
  import FileExplorer from '$lib/components/file-explorer/FileExplorer.svelte'

  type EndId = DevicePlatform
  type TabId = 'screen' | 'files'

  const ends: { id: EndId; label: string; icon: Component }[] = [
    { id: 'windows', label: 'PC', icon: Monitor },
    { id: 'android', label: '安卓', icon: Smartphone },
    { id: 'ios', label: 'iOS', icon: Smartphone },
    { id: 'harmony', label: '鸿蒙', icon: Smartphone }
  ]

  let activeEnd = $state<EndId>('windows')
  let activeTab = $state<TabId>('screen')
  let devicesByPlatform = $state<Record<EndId, DeviceInfo[]>>({
    windows: [],
    android: [],
    ios: [],
    harmony: []
  })
  let loadingByPlatform = $state<Record<EndId, boolean>>({
    windows: true,
    android: true,
    ios: true,
    harmony: true
  })
  let selectedByPlatform = $state<Partial<Record<EndId, DeviceInfo | null>>>({})
  let addingPc = $state(false)
  let scanningPc = $state(false)
  let actionError = $state<string | null>(null)
  let androidFrame = $state<{ src: string; width?: number; height?: number } | null>(null)
  let androidScreenLoading = $state(false)
  let androidControlError = $state<string | null>(null)

  const currentDevices = $derived(devicesByPlatform[activeEnd] ?? [])
  const currentLoading = $derived(loadingByPlatform[activeEnd])
  const selectedDevice = $derived(selectedByPlatform[activeEnd] ?? null)

  /** 检查设备列表是否有实质变化，忽略 details 等不稳定字段 */
  function hasMaterialChange(prev: DeviceInfo[], next: DeviceInfo[]): boolean {
    if (prev.length !== next.length) return true
    for (let i = 0; i < prev.length; i++) {
      if (
        prev[i].id !== next[i].id ||
        prev[i].status !== next[i].status ||
        prev[i].name !== next[i].name
      ) {
        return true
      }
    }
    return false
  }

  function setDevices(platform: DevicePlatform, list: DeviceInfo[]): void {
    const prevList = devicesByPlatform[platform] ?? []
    // 设备列表无实质变化时跳过更新，避免 iOS 轮询每次都触发 Svelte 响应式重渲染
    if (!hasMaterialChange(prevList, list)) return

    devicesByPlatform = { ...devicesByPlatform, [platform]: list }
    const prev = selectedByPlatform[platform] ?? null
    const reconciled = reconcileSelectedDevice(prev, list)

    // 如果之前没有选中设备，自动选中首个在线设备
    if (!reconciled && list.length > 0) {
      const firstOnline = list.find((d) => d.status === 'online')
      const selected = firstOnline ?? list[0] ?? null
      selectedByPlatform = {
        ...selectedByPlatform,
        [platform]: selected
      }
      // 自动选中时也预热缓存
      if (selected?.status === 'online') {
        if (selected.platform === 'windows' && selected.details?.path) {
          void filesApi.cachePreload('local', { root: selected.details.path })
        } else if (selected.platform !== 'windows') {
          void filesApi.cachePreload('device', { platform: selected.platform, deviceId: selected.id })
        }
      }
    } else {
      selectedByPlatform = {
        ...selectedByPlatform,
        [platform]: reconciled
      }
    }
  }

  function selectDevice(d: DeviceInfo): void {
    selectedByPlatform = { ...selectedByPlatform, [activeEnd]: d }
    actionError = null
    // 设备连接后预热文件目录缓存
    if (d.status === 'online') {
      if (d.platform === 'windows' && d.details?.path) {
        void filesApi.cachePreload('local', { root: d.details.path })
      } else if (d.platform !== 'windows') {
        void filesApi.cachePreload('device', { platform: d.platform, deviceId: d.id })
      }
    } else {
      androidFrame = null
    }
  }

  async function refreshAndroidFrame(): Promise<void> {
    if (!selectedDevice || selectedDevice.platform !== 'android' || selectedDevice.status !== 'online') {
      androidFrame = null
      return
    }

    androidScreenLoading = true
    androidControlError = null
    try {
      const frame = await ipc.androidScreenshot(selectedDevice.id)
      androidFrame = {
        src: `data:${frame.mime};base64,${frame.data}`,
        width: frame.width,
        height: frame.height
      }
    } catch (e) {
      androidControlError = e instanceof Error ? e.message : String(e)
      androidFrame = null
    } finally {
      androidScreenLoading = false
    }
  }

  async function tapAndroidFrame(event: MouseEvent): Promise<void> {
    if (
      !selectedDevice ||
      selectedDevice.platform !== 'android' ||
      !androidFrame?.width ||
      !androidFrame.height
    ) {
      return
    }

    const target = event.currentTarget as HTMLButtonElement
    const rect = target.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * androidFrame.width
    const y = ((event.clientY - rect.top) / rect.height) * androidFrame.height

    androidControlError = null
    try {
      await ipc.androidTap(selectedDevice.id, x, y)
      await refreshAndroidFrame()
    } catch (e) {
      androidControlError = e instanceof Error ? e.message : String(e)
    }
  }

  async function androidKey(keyCode: number | string): Promise<void> {
    if (!selectedDevice || selectedDevice.platform !== 'android') return
    androidControlError = null
    try {
      await ipc.androidKeyevent(selectedDevice.id, keyCode)
      await refreshAndroidFrame()
    } catch (e) {
      androidControlError = e instanceof Error ? e.message : String(e)
    }
  }

  $effect(() => {
    const end = activeEnd
    androidFrame = null
    androidControlError = null
    void end
  })

  $effect(() => {
    const dev = selectedDevice
    if (activeTab === 'screen' && dev?.platform === 'android' && dev.status === 'online') {
      void refreshAndroidFrame()
    } else if (dev?.platform !== 'android') {
      androidFrame = null
      androidControlError = null
    }
  })

  async function removeDevice(d: DeviceInfo): Promise<void> {
    actionError = null
    try {
      const ok = await ipc.removeDevice(d.platform, d.id)
      if (!ok) actionError = '未能移除该设备'
      if (!ok) return

      const nextList = (devicesByPlatform[d.platform] ?? []).filter((item) => item.id !== d.id)
      devicesByPlatform = { ...devicesByPlatform, [d.platform]: nextList }

      const current = selectedByPlatform[d.platform] ?? null
      if (current?.id === d.id) {
        const nextSelected = nextList.find((item) => item.status === 'online') ?? nextList[0] ?? null
        selectedByPlatform = { ...selectedByPlatform, [d.platform]: nextSelected }
        if (!nextSelected || nextSelected.status !== 'online') androidFrame = null
      }
    } catch (e) {
      actionError = e instanceof Error ? e.message : String(e)
    }
  }

  async function addPcDirectory(): Promise<void> {
    addingPc = true
    actionError = null
    try {
      const path = await gamesApi.pickPcDirectory()
      if (!path) return
      await gamesApi.addPcPath(path)
    } catch (e) {
      actionError = e instanceof Error ? e.message : String(e)
    } finally {
      addingPc = false
    }
  }

  async function refreshPcScan(): Promise<void> {
    scanningPc = true
    actionError = null
    try {
      await gamesApi.scanPc()
    } catch (e) {
      actionError = e instanceof Error ? e.message : String(e)
    } finally {
      scanningPc = false
    }
  }

  onMount(() => {
    const stop = watchAllPlatforms(
      (platform, devices) => setDevices(platform, devices),
      (platform, loading) => {
        loadingByPlatform = { ...loadingByPlatform, [platform]: loading }
      }
    )
    return stop
  })
</script>

<div class="flex h-full min-h-0 bg-background">
  <main class="flex min-w-0 flex-1 flex-col">
    <header class="shrink-0 border-b border-border/80 bg-card/80 px-4 py-3 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <div class="inline-flex h-10 items-center gap-0.5 rounded-lg border border-border bg-background p-1 shadow-sm">
            {#each ends as end (end.id)}
              {@const Icon = end.icon}
              {@const isActive = activeEnd === end.id}
              {@const count = devicesByPlatform[end.id]?.filter((d) => d.status === 'online').length ?? 0}
              <button
                type="button"
                class={cn(
                  'relative flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                onclick={() => (activeEnd = end.id)}
              >
                <Icon class="size-4" strokeWidth={1.75} />
                <span>{end.label}</span>
                {#if count > 0}
                  <span
                    class={cn(
                      'flex size-4 items-center justify-center rounded-full text-[9px] font-semibold',
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary'
                    )}
                  >
                    {count}
                  </span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <div class="min-w-0">
          {#if actionError}
            <span class="block max-w-48 truncate text-xs text-destructive" role="alert">{actionError}</span>
          {/if}

          {#if currentLoading && currentDevices.length === 0}
            <span class="flex h-10 items-center rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground">
              扫描中…
            </span>
          {:else}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                class={cn(
                  'flex h-10 min-w-52 max-w-72 items-center gap-2 rounded-lg border px-3 text-sm font-medium shadow-sm transition-colors outline-none',
                  selectedDevice
                    ? 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                    : 'border-dashed border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {#if selectedDevice}
                  <span
                    class={cn('size-2 shrink-0 rounded-full', statusDotClass(selectedDevice.status, selectedDevice.platform))}
                    aria-hidden="true"
                  ></span>
                  <span class="min-w-0 flex-1 truncate">{selectedDevice.name}</span>
                {:else}
                  <span>{currentDevices.length > 0 ? '选择设备' : '未检测到设备'}</span>
                {/if}
                <ChevronDown class="ms-auto size-4 shrink-0 opacity-60" strokeWidth={2} />
              </DropdownMenu.Trigger>

              <DropdownMenu.Content class="min-w-64 rounded-lg" align="start" sideOffset={6}>
                {#if currentDevices.length > 0}
                  <DropdownMenu.Label class="text-xs text-muted-foreground">
                    可用设备 ({currentDevices.length})
                  </DropdownMenu.Label>
                  {#each currentDevices as device (device.id)}
                    <DropdownMenu.Item
                      class={cn(
                        'flex items-center gap-2 pr-1',
                        selectedDevice?.id === device.id && 'bg-accent/50',
                        activeEnd !== 'windows' && device.status === 'offline' && 'opacity-60'
                      )}
                      onclick={() => selectDevice(device)}
                    >
                      <span
                        class={cn('size-2 shrink-0 rounded-full', statusDotClass(device.status, device.platform))}
                        aria-hidden="true"
                      ></span>
                      <span class="min-w-0 flex-1 truncate text-sm">{device.name}</span>
                      <button
                        type="button"
                        class="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                        title="删除设备记录"
                        aria-label={`删除 ${device.name}`}
                        onclick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void removeDevice(device)
                        }}
                      >
                        <Trash2 class="size-3.5" strokeWidth={1.75} />
                      </button>
                    </DropdownMenu.Item>
                  {/each}
                {:else}
                  <DropdownMenu.Label class="text-xs text-muted-foreground">
                    {activeEnd === 'windows' ? '未找到游戏目录' : '未检测到设备'}
                  </DropdownMenu.Label>
                {/if}

                {#if activeEnd === 'windows'}
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    class="flex items-center gap-2"
                    disabled={scanningPc}
                    onclick={() => void refreshPcScan()}
                  >
                    <RefreshCw class={cn('size-3.5', scanningPc && 'animate-spin')} strokeWidth={2} />
                    <span class="text-sm">{scanningPc ? '扫描中…' : '刷新设备列表'}</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    class="flex items-center gap-2"
                    disabled={addingPc}
                    onclick={() => void addPcDirectory()}
                  >
                    <Plus class="size-3.5" strokeWidth={2} />
                    <span class="text-sm">{addingPc ? '添加中…' : '添加游戏目录'}</span>
                  </DropdownMenu.Item>
                {/if}

              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {/if}
        </div>

        <div class="ms-auto inline-flex h-10 shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-1 shadow-sm">
          {#each [{ id: 'screen', label: '投屏', icon: MonitorPlay }, { id: 'files', label: '文件管理', icon: FolderOpen }] as tab (tab.id)}
            {@const Icon = tab.icon}
            {@const isActive = activeTab === (tab.id as TabId)}
            <button
              type="button"
              class={cn(
                'flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground'
              )}
              onclick={() => (activeTab = tab.id as TabId)}
            >
              <Icon class="size-4" strokeWidth={1.75} />
              {tab.label}
            </button>
          {/each}
        </div>
      </div>
    </header>

    <section class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {#if !selectedDevice}
        <div class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div class="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
            <MonitorPlay class="size-8 text-muted-foreground/60" strokeWidth={1.25} />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">
              {activeEnd === 'windows' ? '请选择或添加游戏目录' : '请连接设备'}
            </p>
            <p class="mt-1 text-xs text-muted-foreground/70">
              {activeEnd === 'windows'
                ? '使用顶部下拉菜单中的「刷新设备列表」或「添加游戏目录」'
                : '连接设备后将自动检测并出现在下拉菜单中'}
            </p>
          </div>
        </div>
      {:else if activeTab === 'screen'}
        {#if selectedDevice.platform === 'android' && selectedDevice.status === 'online'}
          <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
            <div class="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm">
              <Button
                variant="outline"
                size="sm"
                onclick={refreshAndroidFrame}
                disabled={androidScreenLoading}
              >
                <RefreshCw class={cn('size-3.5', androidScreenLoading && 'animate-spin')} strokeWidth={1.75} />
                刷新画面
              </Button>
              <Button variant="outline" size="sm" onclick={() => androidKey('KEYCODE_HOME')}>
                <Home class="size-3.5" strokeWidth={1.75} />
                Home
              </Button>
              <Button variant="outline" size="sm" onclick={() => androidKey('KEYCODE_BACK')}>
                <ChevronRight class="size-3.5 rotate-180" strokeWidth={1.75} />
                返回
              </Button>
            </div>

            {#if androidControlError}
              <p class="max-w-xl text-center text-xs text-destructive">{androidControlError}</p>
            {/if}

            <div class="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20 p-3 shadow-sm">
              {#if androidFrame}
                <button
                  type="button"
                  class="group relative h-full max-h-full max-w-full overflow-hidden rounded-md bg-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={`aspect-ratio: ${androidFrame.width ?? 9} / ${androidFrame.height ?? 16};`}
                  onclick={tapAndroidFrame}
                  aria-label="点击安卓画面"
                  title="点击画面会映射为 adb input tap"
                >
                  <img
                    src={androidFrame.src}
                    alt={`${selectedDevice.name} screen`}
                    class="h-full w-full object-contain"
                    draggable="false"
                  />
                  <span class="pointer-events-none absolute right-2 top-2 hidden items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] text-white group-hover:flex">
                    <CircleDot class="size-3" strokeWidth={2} />
                    点击模拟触控
                  </span>
                </button>
              {:else}
                <div class="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                  <MonitorPlay class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
                  <p>{androidScreenLoading ? '正在获取画面…' : '暂无截图'}</p>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
            <MonitorPlay class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
            <p class="text-sm text-muted-foreground">投屏区域（待接入）</p>
            <p class="text-xs text-muted-foreground">{selectedDevice.name}</p>
          </div>
        {/if}
      {:else if selectedDevice.status !== 'online'}
        <div class="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
          <FolderOpen class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
          <p>设备需在线才能浏览文件</p>
          {#if selectedDevice.status === 'unauthorized'}
            <p class="text-xs text-warn">请在设备上完成 USB 调试 / 信任授权</p>
          {/if}
        </div>
      {:else if selectedDevice.platform === 'windows'}
        {#if selectedDevice.details?.path}
          <FileExplorer source={{ type: 'local', root: selectedDevice.details.path, label: selectedDevice.name }} />
        {:else}
          <p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            该 PC 条目无本地路径，请使用「添加游戏目录」或「刷新设备列表」
          </p>
        {/if}
      {:else}
        <FileExplorer
          source={{
            type: 'device',
            platform: selectedDevice.platform as DeviceFsPlatform,
            deviceId: selectedDevice.id,
            label: selectedDevice.name
          }}
        />
      {/if}

      {#if activeTab === 'screen'}
        <div class="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-card/95 p-1 shadow-xl backdrop-blur">
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            disabled={!selectedDevice}
          >
            <Camera class="size-4" strokeWidth={1.75} />截屏
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            disabled={!selectedDevice}
          >
            <Video class="size-4" strokeWidth={1.75} />录屏
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            disabled={!selectedDevice}
          >
            <ListChecks class="size-4" strokeWidth={1.75} />用例
          </button>
          <div class="h-6 w-px bg-border"></div>
          <div class="flex items-stretch">
            <button
              type="button"
              class="flex h-9 items-center justify-center gap-1.5 rounded-l-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={!selectedDevice || selectedDevice.status !== 'online'}
            >
              <Play class="size-4" strokeWidth={2} />启动游戏
            </button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                class="flex h-9 items-center rounded-r-md border-l border-primary-foreground/20 bg-primary px-2 text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label="选择启动应用"
                disabled={!selectedDevice}
              >
                <ChevronDown class="size-4" strokeWidth={2} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content class="min-w-44 rounded-lg" align="start" sideOffset={8}>
                <DropdownMenu.Label class="text-xs text-muted-foreground">选择启动应用</DropdownMenu.Label>
                <DropdownMenu.Item disabled>暂无配置的应用</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      {/if}
    </section>
  </main>

  <aside class="flex w-80 shrink-0 flex-col border-l border-border bg-card/70">
    <section class="flex min-h-0 flex-1 flex-col border-b border-border">
      <div class="flex items-center gap-1.5 border-b border-border px-4 py-3 text-sm font-medium">
        <ScrollText class="size-4 text-muted-foreground" strokeWidth={1.75} />
        日志 / 用例进度
      </div>
      <div class="flex flex-1 items-center justify-center p-4 text-center">
        <p class="text-xs text-muted-foreground">运行日志与用例执行进度将显示在此处</p>
      </div>
    </section>

    <section class="flex h-64 shrink-0 flex-col">
      <div class="flex items-center gap-1.5 border-b border-border px-4 py-3 text-sm font-medium">
        <Bot class="size-4 text-muted-foreground" strokeWidth={1.75} />
        AI 助手
      </div>
      <div class="flex flex-1 items-center justify-center p-4 text-center">
        <p class="text-xs text-muted-foreground">AI 对话（待接入）</p>
      </div>
    </section>
  </aside>
</div>
