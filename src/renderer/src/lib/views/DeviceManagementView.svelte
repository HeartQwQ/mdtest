<script lang="ts">
  import {
    Bot,
    Camera,
    ChevronUp,
    FolderOpen,
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
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { cn } from '$lib/utils'
  import { ipc, type DeviceInfo, type DevicePlatform } from '$lib/ipc'
  import { gamesApi } from '$lib/games'
  import { reconcileSelectedDevice, watchAllPlatforms } from '$lib/devices/watch'
  import { statusDotClass } from '$lib/ui/status'

  type EndId = DevicePlatform
  type TabId = 'screen' | 'files'

  const ends: { id: EndId; label: string; icon: Component }[] = [
    { id: 'windows', label: 'PC', icon: Monitor },
    { id: 'android', label: '安卓', icon: Smartphone },
    { id: 'ios', label: 'iOS', icon: Smartphone },
    { id: 'harmony', label: '鸿蒙', icon: Smartphone }
  ]

  const statusLabel: Record<string, string> = {
    online: '已连接',
    offline: '离线',
    unauthorized: '未授权',
    unknown: '未知'
  }

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

  const currentDevices = $derived(devicesByPlatform[activeEnd] ?? [])
  const currentLoading = $derived(loadingByPlatform[activeEnd])
  const selectedDevice = $derived(selectedByPlatform[activeEnd] ?? null)

  function setDevices(platform: DevicePlatform, list: DeviceInfo[]): void {
    devicesByPlatform[platform] = list
    const prev = selectedByPlatform[platform] ?? null
    selectedByPlatform[platform] = reconcileSelectedDevice(prev, list)
  }

  function selectDevice(d: DeviceInfo): void {
    selectedByPlatform = { ...selectedByPlatform, [activeEnd]: d }
    actionError = null
  }

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

  async function openDeviceFolder(d: DeviceInfo, event: MouseEvent): Promise<void> {
    event.stopPropagation()
    const path = d.details?.path
    if (!path) return
    try {
      await gamesApi.openFolder(path)
    } catch (e) {
      actionError = e instanceof Error ? e.message : String(e)
    }
  }

  onMount(() => {
    const stop = watchAllPlatforms(
      (platform, devices) => setDevices(platform, devices),
      (platform, loading) => {
        loadingByPlatform[platform] = loading
      }
    )
    return stop
  })
</script>

<div class="flex h-full min-h-0 gap-3 p-3">
  <!-- 左：设备区 -->
  <section
    class="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
    aria-label="设备列表"
  >
    <div class="grid grid-cols-4 gap-1 border-b border-border p-2">
      {#each ends as end (end.id)}
        {@const Icon = end.icon}
        {@const isActive = activeEnd === end.id}
        {@const count = devicesByPlatform[end.id]?.length ?? 0}
        <button
          type="button"
          class={cn(
            'relative flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
          onclick={() => (activeEnd = end.id)}
        >
          <Icon class="size-4" strokeWidth={1.75} />
          {end.label}
          {#if count > 0}
            <span
              class="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary"
            >
              {count}
            </span>
          {/if}
        </button>
      {/each}
    </div>

    {#if actionError}
      <p class="border-b border-border px-3 py-2 text-xs text-destructive" role="alert">{actionError}</p>
    {/if}

    <div class="flex min-h-0 flex-1 flex-col">
      {#if currentLoading && currentDevices.length === 0}
        <div class="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">扫描中…</div>
      {:else if currentDevices.length === 0}
        <div class="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <div class="flex size-11 items-center justify-center rounded-full bg-muted">
            <MonitorPlay class="size-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p class="text-sm font-medium">未找到设备</p>
          <p class="text-xs text-muted-foreground">
            {#if activeEnd === 'windows'}
              点击「刷新扫描」或「添加目录」查找游戏
            {:else}
              连接设备后将自动出现在此列表
            {/if}
          </p>
        </div>
      {:else}
        <ScrollArea class="min-h-0 flex-1">
          <ul class="flex flex-col gap-1 p-2">
            {#each currentDevices as device (device.id)}
              <li>
                <div
                  role="button"
                  tabindex="0"
                  class={cn(
                    'group flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors',
                    selectedDevice?.id === device.id
                      ? 'border-primary/40 bg-sidebar-accent/80'
                      : 'border-transparent hover:border-border hover:bg-accent/40',
                    device.status === 'offline' && 'opacity-60'
                  )}
                  onclick={() => selectDevice(device)}
                  onkeydown={(e) => e.key === 'Enter' && selectDevice(device)}
                >
                  <span
                    class={cn('mt-1.5 size-2 shrink-0 rounded-full', statusDotClass(device.status))}
                    title={statusLabel[device.status] ?? device.status}
                  ></span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium">{device.name}</span>
                    <span class="block truncate text-[11px] text-muted-foreground">
                      {#if device.details?.path}
                        {device.details.path}
                      {:else}
                        {device.id}
                      {/if}
                    </span>
                    <span class="text-[10px] text-muted-foreground">
                      {statusLabel[device.status] ?? device.status}
                    </span>
                  </span>
                  <span class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {#if activeEnd === 'windows' && device.details?.path}
                      <button
                        type="button"
                        class="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                        title="打开文件夹"
                        onclick={(e) => void openDeviceFolder(device, e)}
                      >
                        <FolderOpen class="size-3.5" strokeWidth={1.75} />
                      </button>
                    {/if}
                    <button
                      type="button"
                      class="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="从列表移除"
                      onclick={(e) => void removeDevice(device, e)}
                    >
                      <Trash2 class="size-3.5" strokeWidth={1.75} />
                    </button>
                  </span>
                </div>
              </li>
            {/each}
          </ul>
        </ScrollArea>
      {/if}

      {#if activeEnd === 'windows'}
        <div class="flex flex-col gap-1.5 border-t border-border p-2">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            disabled={scanningPc}
            onclick={() => void refreshPcScan()}
          >
            <RefreshCw class={cn('size-3.5', scanningPc && 'animate-spin')} strokeWidth={2} />
            {scanningPc ? '扫描中…' : '刷新扫描'}
          </button>
          <button
            type="button"
            class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            disabled={addingPc}
            onclick={() => void addPcDirectory()}
          >
            <Plus class="size-3.5" strokeWidth={2} />
            {addingPc ? '添加中…' : '添加目录'}
          </button>
        </div>
      {/if}
    </div>
  </section>

  <!-- 中：投屏控制区 -->
  <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <div class="flex items-center gap-1 border-b border-border p-2">
      {#each [{ id: 'screen', label: '投屏', icon: MonitorPlay }, { id: 'files', label: '文件管理', icon: FolderOpen }] as tab (tab.id)}
        {@const Icon = tab.icon}
        {@const isActive = activeTab === (tab.id as TabId)}
        <button
          type="button"
          class={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          onclick={() => (activeTab = tab.id as TabId)}
        >
          <Icon class="size-4" strokeWidth={1.75} />
          {tab.label}
        </button>
      {/each}
      {#if selectedDevice}
        <span class="ms-auto truncate pe-2 text-xs text-muted-foreground">
          当前：{selectedDevice.name}
        </span>
      {/if}
    </div>

    <div class="flex min-h-0 flex-1 items-center justify-center bg-background/40 p-4">
      {#if !selectedDevice}
        <p class="text-sm text-muted-foreground">请先在左侧选择设备</p>
      {:else if activeTab === 'screen'}
        <div class="flex flex-col items-center gap-2 text-center">
          <MonitorPlay class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
          <p class="text-sm text-muted-foreground">投屏区域（待接入）</p>
          <p class="text-xs text-muted-foreground">{selectedDevice.name}</p>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-2 text-center">
          <FolderOpen class="size-10 text-muted-foreground/60" strokeWidth={1.25} />
          <p class="text-sm text-muted-foreground">文件管理（待接入）</p>
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
