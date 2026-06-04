<script lang="ts">
  import { RefreshCw, Star, Package, Smartphone } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { cn } from '$lib/utils'
  import { ipc, type DeviceInfo } from '../ipc'
  import { gamesApi, type InstalledPackage, type MobilePackageFavorite } from '../games'
  import { statusDotClass } from '../ui/status'
  import FileExplorer from './FileExplorer.svelte'

  let { platform }: { platform: 'android' | 'harmony' } = $props()

  let devices = $state<DeviceInfo[]>([])
  let selectedDevice = $state<DeviceInfo | null>(null)
  let packages = $state<InstalledPackage[]>([])
  let favorites = $state<MobilePackageFavorite[]>([])
  let selectedPackage = $state<string | null>(null)
  let loading = $state(false)
  let listingPackages = $state(false)
  let error = $state<string | null>(null)
  let toolPath = $state<string | null>(null)

  const favSet = $derived(new Set(favorites.map((f) => f.applicationId)))
  const mobilePlatform = $derived(platform)

  const meta = {
    android: { title: '安卓设备', tool: 'ADB' },
    harmony: { title: '鸿蒙设备', tool: 'HDC' }
  }

  const statusLabel: Record<string, string> = {
    online: '在线',
    offline: '离线',
    unauthorized: '未授权',
    unknown: '未知'
  }

  async function refreshDevices(): Promise<void> {
    loading = true
    error = null
    selectedDevice = null
    selectedPackage = null
    try {
      devices = await ipc.listDevices(platform)
      favorites = await gamesApi.listFavorites()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      devices = []
    } finally {
      loading = false
    }
  }

  async function loadPackages(): Promise<void> {
    if (!selectedDevice || selectedDevice.status !== 'online') return
    listingPackages = true
    error = null
    try {
      packages = await gamesApi.listPackages(platform, selectedDevice.id)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
      packages = []
    } finally {
      listingPackages = false
    }
  }

  async function toggleFavorite(pkgId: string, label: string): Promise<void> {
    if (favSet.has(pkgId)) {
      const f = favorites.find((x) => x.applicationId === pkgId)
      if (f) await gamesApi.removeFavorite(f.id)
    } else {
      await gamesApi.addFavorite(pkgId, label)
    }
    favorites = await gamesApi.listFavorites()
  }

  function selectDevice(d: DeviceInfo): void {
    selectedDevice = d
    selectedPackage = null
    packages = []
    if (d.status === 'online') void loadPackages()
  }

  $effect(() => {
    void platform
    refreshDevices()
    if (platform === 'android') {
      ipc.adbPath().then((p) => (toolPath = p))
    } else {
      ipc.hdcPath().then((p) => (toolPath = p))
    }
  })
</script>

<section class="flex h-full min-h-0 flex-col p-6 lg:p-8">
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-primary">
        <Smartphone class="size-5" strokeWidth={1.75} />
        <span class="text-xs font-medium uppercase tracking-wider">{meta[platform].tool}</span>
      </div>
      <h1 class="mt-2 text-xl font-semibold tracking-tight">{meta[platform].title}</h1>
      <p class="mt-1 text-sm text-muted-foreground">收藏包后可管理应用数据目录</p>
      {#if toolPath}
        <p class="mt-2 max-w-2xl truncate font-mono text-[11px] text-muted-foreground" title={toolPath}>
          {toolPath}
        </p>
      {/if}
    </div>
    <Button onclick={refreshDevices} disabled={loading}>
      <RefreshCw class={cn('size-4', loading && 'animate-spin')} />
      {loading ? '刷新中…' : '刷新设备'}
    </Button>
  </header>

  {#if error}
    <div
      class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      {error}
    </div>
  {/if}

  <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[240px_260px_1fr]">
    <Card.Root class="flex min-h-[300px] flex-col py-0">
      <Card.Header class="border-b py-3">
        <Card.Title class="text-xs font-medium uppercase tracking-wide text-muted-foreground">设备</Card.Title>
      </Card.Header>
      <ScrollArea class="min-h-0 flex-1">
        <ul class="space-y-1 p-2">
          {#if devices.length === 0 && !loading}
            <li class="px-2 py-6 text-center text-sm text-muted-foreground">未发现设备</li>
          {:else}
            {#each devices as d (d.id)}
              <li>
                <button
                  type="button"
                  class={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                    selectedDevice?.id === d.id
                      ? 'border-primary/35 bg-accent'
                      : 'border-transparent hover:bg-accent/60'
                  )}
                  onclick={() => selectDevice(d)}
                >
                  <span class="size-2 shrink-0 rounded-full {statusDotClass(d.status)}"></span>
                  <span class="min-w-0 flex-1 truncate">{d.name}</span>
                  <span class="shrink-0 text-[10px] text-muted-foreground">
                    {statusLabel[d.status] ?? d.status}
                  </span>
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </ScrollArea>
    </Card.Root>

    <Card.Root class="flex min-h-[300px] flex-col py-0">
      <Card.Header
        class="flex-row items-center justify-between space-y-0 border-b py-3"
      >
        <Card.Title
          class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          <Package class="size-3.5" /> 应用包
        </Card.Title>
        {#if selectedDevice?.status === 'online'}
          <Button variant="link" size="sm" class="h-auto p-0 text-xs" onclick={loadPackages} disabled={listingPackages}>
            {listingPackages ? '读取中…' : '读取包名'}
          </Button>
        {/if}
      </Card.Header>
      <ScrollArea class="min-h-0 flex-1 p-2">
        <p class="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">收藏</p>
        <ul class="mb-3 space-y-1">
          {#if favorites.length === 0}
            <li class="px-2 py-2 text-xs text-muted-foreground">暂无收藏</li>
          {:else}
            {#each favorites as f (f.id)}
              <li>
                <button
                  type="button"
                  class={cn(
                    'w-full truncate rounded-lg border px-2.5 py-2 text-left text-xs transition-colors',
                    selectedPackage === f.applicationId
                      ? 'border-primary/35 bg-accent'
                      : 'border-transparent text-muted-foreground hover:bg-accent/60'
                  )}
                  onclick={() => (selectedPackage = f.applicationId)}
                >
                  {f.label || f.applicationId}
                </button>
              </li>
            {/each}
          {/if}
        </ul>

        {#if packages.length > 0}
          <p class="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">本机列表</p>
          <ul class="space-y-1">
            {#each packages as pkg (pkg.applicationId)}
              <li class="flex gap-1">
                <button
                  type="button"
                  class={cn(
                    'min-w-0 flex-1 truncate rounded-lg border px-2 py-1.5 text-left font-mono text-[11px] transition-colors',
                    selectedPackage === pkg.applicationId
                      ? 'border-primary/35 bg-accent'
                      : 'border-transparent text-muted-foreground hover:bg-accent/60'
                  )}
                  onclick={() => (selectedPackage = pkg.applicationId)}
                >
                  {pkg.applicationId}
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class={favSet.has(pkg.applicationId) ? 'text-warn' : 'text-muted-foreground'}
                  onclick={() => toggleFavorite(pkg.applicationId, pkg.label)}
                  title={favSet.has(pkg.applicationId) ? '取消收藏' : '收藏'}
                  aria-label={favSet.has(pkg.applicationId) ? '取消收藏' : '收藏'}
                >
                  <Star
                    class="size-3.5"
                    fill={favSet.has(pkg.applicationId) ? 'currentColor' : 'none'}
                  />
                </Button>
              </li>
            {/each}
          </ul>
        {/if}
      </ScrollArea>
    </Card.Root>

    <Card.Root class="flex min-h-[300px] min-w-0 flex-col">
      <Card.Content class="flex min-h-0 flex-1 flex-col pt-6">
        {#if !selectedDevice}
          <p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">请选择设备</p>
        {:else if selectedDevice.status !== 'online'}
          <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <p>设备需在线才能管理文件</p>
            {#if selectedDevice.status === 'unauthorized'}
              <p class="text-xs text-warn">请在手机上允许 USB 调试后刷新</p>
            {/if}
          </div>
        {:else if !selectedPackage}
          <p class="flex flex-1 items-center justify-center text-sm text-muted-foreground">请选择应用包</p>
        {:else}
          <h2 class="break-all font-mono text-sm font-medium">{selectedPackage}</h2>
          <p class="mt-1 text-xs text-muted-foreground">{selectedDevice.name}</p>
          <div class="mt-4 min-h-0 flex-1">
            <FileExplorer
              mode="mobile"
              root=""
              mobilePlatform={mobilePlatform}
              deviceId={selectedDevice.id}
              packageId={selectedPackage}
            />
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</section>
