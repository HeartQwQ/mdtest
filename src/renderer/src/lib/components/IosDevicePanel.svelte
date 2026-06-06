<script lang="ts">
  import { Smartphone, Tablet } from '@lucide/svelte'
  import * as Card from '$lib/components/ui/card'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { cn } from '$lib/utils'
  import { ipc, type DeviceInfo } from '../ipc'
  import { statusDotClass } from '../ui/status'
  import FileExplorer from './FileExplorer.svelte'
  import { reconcileSelectedDevice, watchMobileDevices } from '../devices/watch'

  let devices = $state<DeviceInfo[]>([])
  let selected = $state<DeviceInfo | null>(null)
  let loading = $state(false)
  let error = $state<string | null>(null)
  let toolReady = $state(false)
  let toolPath = $state<string | null>(null)

  const detailKeys: { key: string; label: string }[] = [
    { key: 'DeviceName', label: '设备名称' },
    { key: 'ProductType', label: '型号' },
    { key: 'ProductVersion', label: '系统版本' },
    { key: 'SerialNumber', label: '序列号' },
    { key: 'udid', label: 'UDID' }
  ]

  function applyDeviceList(list: DeviceInfo[]): void {
    devices = list
    selected = reconcileSelectedDevice(selected, list)
  }

  function selectDevice(d: DeviceInfo): void {
    selected = d
  }

  $effect(() => {
    selected = null
    error = null

    void ipc.bundledIdevice().then((ready) => (toolReady = ready))
    void ipc.idevicePath().then((p) => (toolPath = p))

    const stop = watchMobileDevices('ios', {
      onLoading: (v) => (loading = v),
      onError: (msg) => {
        if (msg) {
          error = msg
          devices = []
        }
      },
      onDevices: (list) => applyDeviceList(list)
    })

    return stop
  })
</script>

<section class="flex h-full min-h-0 flex-col p-6 lg:p-8">
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-primary">
        <Tablet class="size-5" strokeWidth={1.75} />
        <span class="text-xs font-medium uppercase tracking-wider">libimobiledevice</span>
      </div>
      <h1 class="mt-2 text-xl font-semibold tracking-tight">iOS 设备</h1>
      <p class="mt-1 text-sm text-muted-foreground">通过 USB 自动发现已连接的 iPhone / iPad</p>
      {#if toolPath}
        <p class="mt-2 max-w-2xl truncate font-mono text-[11px] text-muted-foreground" title={toolPath}>
          {toolPath}
        </p>
      {/if}
    </div>
    {#if toolReady}
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          class={cn('size-2 rounded-full', loading ? 'animate-pulse bg-primary' : 'bg-online')}
          title={loading ? '正在检测' : '自动检测中'}
        ></span>
        {loading ? '正在检测…' : '自动检测中'}
      </div>
    {/if}
  </header>

  {#if !toolReady}
    <div
      class="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-foreground"
      role="alert"
    >
      未检测到 libimobiledevice 工具链。请将 Windows 版工具链放入
      <code class="rounded bg-muted px-1 py-0.5 font-mono text-xs">resources/device-toolchains/ios/</code>
      ，并确保已安装 Apple Mobile Device Support（iTunes 组件）。
    </div>
  {/if}

  {#if error}
    <div
      class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      {error}
    </div>
  {/if}

  <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
    <Card.Root class="flex min-h-[300px] flex-col py-0">
      <Card.Header class="border-b py-3">
        <Card.Title class="text-xs font-medium uppercase tracking-wide text-muted-foreground">设备</Card.Title>
      </Card.Header>
      <ScrollArea class="min-h-0 flex-1">
        <ul class="space-y-1 p-2">
          {#if devices.length === 0 && !loading}
            <li class="px-2 py-6 text-center text-sm text-muted-foreground">
              {#if toolReady}
                未发现设备，请用 USB 连接 iPhone 并在手机上点「信任此电脑」
              {:else}
                工具链未就绪
              {/if}
            </li>
          {:else}
            {#each devices as d (d.id)}
              <li>
                <button
                  type="button"
                  class={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                    selected?.id === d.id
                      ? 'border-primary/35 bg-accent'
                      : 'border-transparent hover:bg-accent/60'
                  )}
                  onclick={() => selectDevice(d)}
                >
                  <span class="size-2 shrink-0 rounded-full {statusDotClass(d.status, d.platform)}"></span>
                  <span class="min-w-0 flex-1 truncate">{d.name}</span>
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </ScrollArea>
    </Card.Root>

    <Card.Root class="flex min-h-[300px] flex-col">
      <Card.Content class="flex min-h-0 flex-1 flex-col pt-6">
        {#if !selected}
          <div class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <Smartphone class="size-10 opacity-40" strokeWidth={1.25} />
            <p>请选择左侧设备查看详情</p>
          </div>
        {:else}
          <h2 class="text-lg font-semibold tracking-tight">{selected.name}</h2>

          {#if selected.status === 'unauthorized'}
            <div class="mt-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm">
              请在 iPhone 上解锁屏幕，弹出「信任此电脑」时点信任，信任后将自动上线。
            </div>
          {:else if selected.status === 'online'}
            <div class="mt-6 min-h-0 flex-1">
              <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                设备存储
              </h3>
              <FileExplorer mode="device" root="" devicePlatform="ios" deviceId={selected.id} />
            </div>
          {/if}

          <dl class="mt-6 space-y-3 text-sm">
            {#each detailKeys as item (item.key)}
              {#if selected.details?.[item.key]}
                <div class="grid grid-cols-[120px_1fr] gap-2 border-b border-border/60 pb-2">
                  <dt class="text-muted-foreground">{item.label}</dt>
                  <dd class="break-all font-mono text-xs">{selected.details[item.key]}</dd>
                </div>
              {/if}
            {/each}
          </dl>

          {#if selected.details && Object.keys(selected.details).length > 0}
            <details class="mt-6 min-h-0 flex-1">
              <summary class="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
                全部字段
              </summary>
              <pre
                class="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed"
              >{JSON.stringify(selected.details, null, 2)}</pre>
            </details>
          {/if}
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</section>
