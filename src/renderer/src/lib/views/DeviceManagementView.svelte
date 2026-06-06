<script lang="ts">
  import {
    Bot,
    Camera,
    ChevronDown,
    ChevronUp,
    FolderOpen,
    ListChecks,
    Monitor,
    MonitorPlay,
    Package,
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
  import { Input } from '$lib/components/ui/input'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { cn } from '$lib/utils'
  import { ipc, type DeviceInfo, type DevicePlatform } from '$lib/ipc'
  import { gamesApi } from '$lib/games'
  import { filesApi, type DeviceFsPlatform } from '$lib/files'
  import { reconcileSelectedDevice, watchAllPlatforms } from '$lib/devices/watch'
  import { statusDotClass } from '$lib/ui/status'
  import FileExplorer from '$lib/components/FileExplorer.svelte'

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

  // 移动端应用包列表
  let mobilePackages = $state<{ applicationId: string; label: string }[]>([])
  let selectedPackageId = $state<string | null>(null)
  let loadingPackages = $state(false)
  let packageFilter = $state('')

  const currentDevices = $derived(devicesByPlatform[activeEnd] ?? [])
  const currentLoading = $derived(loadingByPlatform[activeEnd])
  const selectedDevice = $derived(selectedByPlatform[activeEnd] ?? null)

  /** 当前平台的在线设备列表 */
  const onlineDevices = $derived(currentDevices.filter((d) => d.status === 'online'))

  /** 检查设备列表是否有实质变化（id 增减或 status 变化），忽略 details 等不稳定字段 */
  function hasMaterialChange(prev: DeviceInfo[], next: DeviceInfo[]): boolean {
    if (prev.length !== next.length) return true
    for (let i = 0; i < prev.length; i++) {
      if (prev[i].id !== next[i].id || prev[i].status !== next[i].status) return true
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
          void loadMobilePackages(selected.platform, selected.id)
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
        // 自动加载应用包列表
        void loadMobilePackages(d.platform, d.id)
      }
    } else {
      // 设备离线时清空包列表
      mobilePackages = []
      selectedPackageId = null
    }
  }

  async function loadMobilePackages(platform: string, deviceId: string): Promise<void> {
    loadingPackages = true
    try {
      mobilePackages = await gamesApi.listPackages(platform as 'android' | 'harmony', deviceId)
      // 如果之前选中的包不在新列表中，清空选择
      if (selectedPackageId && !mobilePackages.some(p => p.applicationId === selectedPackageId)) {
        selectedPackageId = null
      }
      // 自动选中第一个包
      if (!selectedPackageId && mobilePackages.length > 0) {
        selectedPackageId = mobilePackages[0].applicationId
      }
    } catch {
      mobilePackages = []
    } finally {
      loadingPackages = false
    }
  }

  /** 过滤后的应用包列表 */
  const filteredPackages = $derived.by(() => {
    if (!packageFilter.trim()) return mobilePackages
    const q = packageFilter.trim().toLowerCase()
    return mobilePackages.filter(p =>
      p.applicationId.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
    )
  })

  /** 切换平台时重置包列表 */
  $effect(() => {
    const end = activeEnd
    mobilePackages = []
    selectedPackageId = null
    packageFilter = ''
    // 如果当前已选中在线设备，自动加载包列表
    const dev = selectedByPlatform[end]
    if (dev && dev.status === 'online' && dev.platform !== 'windows') {
      void loadMobilePackages(dev.platform, dev.id)
    }
  })

  async function removeDevice(d: DeviceInfo, event: MouseEvent): Promise<void> {
    event.stopPropagation()
    actionError = null
    try {
      const ok = await ipc.removeDevice(d.platform, d.id)
      if (!ok) actionError = '未能移除该设备'
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

<div class="flex h-full min-h-0 gap-3 p-3">
  <!-- 左+中：投屏控制区（含顶部设备管理栏） -->
  <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <!-- 顶部设备管理栏 -->
    <div class="flex items-center gap-2 border-b border-border px-2 py-1.5">
      <!-- 左侧：四端切换按钮组 -->
      <div class="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
        {#each ends as end (end.id)}
          {@const Icon = end.icon}
          {@const isActive = activeEnd === end.id}
          {@const count = devicesByPlatform[end.id]?.filter((d) => d.status === 'online').length ?? 0}
          <button
            type="button"
            class={cn(
              'relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onclick={() => (activeEnd = end.id)}
          >
            <Icon class="size-3.5" strokeWidth={1.75} />
            <span>{end.label}</span>
            {#if count > 0}
              <span class="flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
                {count}
              </span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 分隔线 -->
      <div class="mx-1 h-5 w-px bg-border"></div>

      <!-- 投屏/文件标签 -->
      {#each [{ id: 'screen', label: '投屏', icon: MonitorPlay }, { id: 'files', label: '文件管理', icon: FolderOpen }] as tab (tab.id)}
        {@const Icon = tab.icon}
        {@const isActive = activeTab === (tab.id as TabId)}
        <button
          type="button"
          class={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => (activeTab = tab.id as TabId)}
        >
          <Icon class="size-3.5" strokeWidth={1.75} />
          {tab.label}
        </button>
      {/each}

      <!-- 右侧：设备连接控制区 -->
      <div class="ms-auto flex items-center gap-2">
        {#if actionError}
          <span class="text-xs text-destructive" role="alert">{actionError}</span>
        {/if}

        {#if currentLoading && currentDevices.length === 0}
          <span class="text-xs text-muted-foreground">扫描中…</span>
        {:else}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors outline-none',
                selectedDevice
                  ? 'border-border bg-background text-foreground hover:bg-accent/50'
                  : 'border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {#if selectedDevice}
                <span
                  class={cn('size-1.5 shrink-0 rounded-full', statusDotClass(selectedDevice.status, selectedDevice.platform))}
                  aria-hidden="true"
                ></span>
                <span class="max-w-40 truncate">{selectedDevice.name}</span>
              {:else}
                <span>{currentDevices.length > 0 ? '选择设备' : '未检测到设备'}</span>
              {/if}
              <ChevronDown class="size-3 shrink-0 opacity-60" strokeWidth={2} />
            </DropdownMenu.Trigger>

            <DropdownMenu.Content class="min-w-56 rounded-lg" align="end" sideOffset={4}>
              <!-- 设备列表 -->
              {#if currentDevices.length > 0}
                <DropdownMenu.Label class="text-xs text-muted-foreground">
                  可用设备 ({currentDevices.length})
                </DropdownMenu.Label>
                {#each currentDevices as device (device.id)}
                  <DropdownMenu.Item
                    class={cn(
                      'flex items-center gap-2',
                      selectedDevice?.id === device.id && 'bg-accent/50',
                      activeEnd !== 'windows' && device.status === 'offline' && 'opacity-60'
                    )}
                    onclick={() => selectDevice(device)}
                  >
                    <span
                      class={cn('size-1.5 shrink-0 rounded-full', statusDotClass(device.status, device.platform))}
                      aria-hidden="true"
                    ></span>
                    <span class="min-w-0 flex-1 truncate text-sm">{device.name}</span>
                    {#if device.status === 'online'}
                      <span class="text-[10px] text-muted-foreground">在线</span>
                    {:else if device.status === 'unauthorized'}
                      <span class="text-[10px] text-warn">未授权</span>
                    {:else}
                      <span class="text-[10px] text-muted-foreground">离线</span>
                    {/if}
                  </DropdownMenu.Item>
                {/each}
              {:else}
                <DropdownMenu.Label class="text-xs text-muted-foreground">
                  {activeEnd === 'windows' ? '未找到游戏目录' : '未检测到设备'}
                </DropdownMenu.Label>
              {/if}

              <!-- PC端特殊功能 -->
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

              <!-- 已选中设备的操作 -->
              {#if selectedDevice}
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  class="flex items-center gap-2 text-destructive focus:text-destructive"
                  onclick={() => void removeDevice(selectedDevice, new MouseEvent('click'))}
                >
                  <Trash2 class="size-3.5" strokeWidth={1.75} />
                  <span class="text-sm">从列表移除</span>
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-background/40 p-4">
      {#if !selectedDevice}
        <div class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div class="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
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
        <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <MonitorPlay class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
          <p class="text-sm text-muted-foreground">投屏区域（待接入）</p>
          <p class="text-xs text-muted-foreground">{selectedDevice.name}</p>
        </div>
      {:else if selectedDevice.status !== 'online'}
        <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <FolderOpen class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
          <p>设备需在线才能浏览文件</p>
          {#if selectedDevice.status === 'unauthorized'}
            <p class="text-xs text-warn">请在设备上完成 USB 调试 / 信任授权</p>
          {/if}
        </div>
      {:else if selectedDevice.platform === 'windows'}
        {#if selectedDevice.details?.path}
          <FileExplorer mode="local" root={selectedDevice.details.path} />
        {:else}
          <p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            该 PC 条目无本地路径，请使用「添加游戏目录」或「刷新设备列表」
          </p>
        {/if}
      {:else}
        <!-- 移动端：应用包目录（默认）+ 可切换到根目录 -->
        <div class="flex min-h-0 flex-1 flex-col gap-2">
          <!-- 应用包选择栏 -->
          <div class="flex items-center gap-2">
            <div class="relative min-w-0 flex-1">
              <Input
                value={packageFilter}
                onchange={(e) => (packageFilter = e.currentTarget.value)}
                placeholder={loadingPackages ? '加载应用包列表…' : mobilePackages.length === 0 ? '暂无应用包' : '搜索应用包…'}
                class="h-7 text-xs"
                disabled={loadingPackages}
              />
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                class="flex min-w-0 max-w-56 items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-accent/50 outline-none"
                disabled={loadingPackages || mobilePackages.length === 0}
              >
                <Package class="size-3.5 shrink-0" strokeWidth={1.75} />
                <span class="truncate">{selectedPackageId ?? '选择应用包'}</span>
                <ChevronDown class="size-3 shrink-0 opacity-60" strokeWidth={2} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content class="min-w-64 max-h-72 rounded-lg" align="start" sideOffset={4}>
                <DropdownMenu.Label class="text-xs text-muted-foreground">
                  已安装应用 ({filteredPackages.length})
                </DropdownMenu.Label>
                <ScrollArea class="max-h-56">
                  {#each filteredPackages as pkg (pkg.applicationId)}
                    <DropdownMenu.Item
                      class={cn(
                        'flex items-center gap-2',
                        selectedPackageId === pkg.applicationId && 'bg-accent/50'
                      )}
                      onclick={() => (selectedPackageId = pkg.applicationId)}
                    >
                      <span class="min-w-0 flex-1 truncate font-mono text-xs">{pkg.applicationId}</span>
                      {#if pkg.label && pkg.label !== pkg.applicationId}
                        <span class="shrink-0 text-[10px] text-muted-foreground">{pkg.label}</span>
                      {/if}
                    </DropdownMenu.Item>
                  {/each}
                </ScrollArea>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs shrink-0"
              disabled={loadingPackages || !selectedDevice}
              onclick={() => {
                if (selectedDevice && selectedDevice.platform !== 'windows') {
                  void loadMobilePackages(selectedDevice.platform, selectedDevice.id)
                }
              }}
            >
              <RefreshCw class={cn('size-3', loadingPackages && 'animate-spin')} strokeWidth={1.75} />
              刷新
            </Button>
          </div>
          <div class="min-h-0 flex-1">
            <FileExplorer
              mode="mobile"
              root=""
              mobilePlatform={selectedDevice.platform as DeviceFsPlatform}
              deviceId={selectedDevice.id}
              packageId={selectedPackageId ?? undefined}
            />
          </div>
        </div>
      {/if}
    </div>

    <div class="flex items-center justify-between gap-2 border-t border-border p-2">
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          disabled={!selectedDevice}
        >
          <Camera class="size-4" strokeWidth={1.75} />截屏
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          disabled={!selectedDevice}
        >
          <Video class="size-4" strokeWidth={1.75} />录屏
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          disabled={!selectedDevice}
        >
          <ListChecks class="size-4" strokeWidth={1.75} />执行用例
        </button>
      </div>

      <div class="flex items-stretch">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-l-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={!selectedDevice || selectedDevice.status !== 'online'}
        >
          <Play class="size-4" strokeWidth={2} />启动游戏
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="flex items-center rounded-r-lg border-l border-primary-foreground/20 bg-primary px-1.5 text-primary-foreground transition-colors hover:bg-primary/90 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            aria-label="选择启动应用"
            disabled={!selectedDevice}
          >
            <ChevronUp class="size-4" strokeWidth={2} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="min-w-44 rounded-lg" align="end" side="top" sideOffset={8}>
            <DropdownMenu.Label class="text-xs text-muted-foreground">选择启动应用</DropdownMenu.Label>
            <DropdownMenu.Item disabled>暂无配置的应用</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  </section>

  <!-- 右：功能区 -->
  <section class="flex w-72 shrink-0 flex-col gap-3">
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div class="flex items-center gap-1.5 border-b border-border px-3 py-2 text-sm font-medium">
        <ScrollText class="size-4 text-muted-foreground" strokeWidth={1.75} />
        日志 / 用例进度
      </div>
      <div class="flex flex-1 items-center justify-center p-4 text-center">
        <p class="text-xs text-muted-foreground">运行日志与用例执行进度将显示在此处</p>
      </div>
    </div>

    <div class="flex h-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div class="flex items-center gap-1.5 border-b border-border px-3 py-2 text-sm font-medium">
        <Bot class="size-4 text-muted-foreground" strokeWidth={1.75} />
        AI 助手
      </div>
      <div class="flex flex-1 items-center justify-center p-4 text-center">
        <p class="text-xs text-muted-foreground">AI 对话（待接入）</p>
      </div>
    </div>
  </section>
</div>
