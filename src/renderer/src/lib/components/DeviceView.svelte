<script lang="ts">
  import { Tablet } from '@lucide/svelte'
  import type { DevicePlatform } from '../ipc'
  import PcGamePanel from './PcGamePanel.svelte'
  import MobileGamePanel from './MobileGamePanel.svelte'

  let { platform }: { platform: DevicePlatform } = $props()
</script>

{#if platform === 'windows'}
  <PcGamePanel />
{:else if platform === 'android'}
  <MobileGamePanel platform="android" />
{:else if platform === 'harmony'}
  <MobileGamePanel platform="harmony" />
{:else}
  <section class="flex h-full flex-col p-6 lg:p-8">
    <header class="mb-6">
      <h1 class="text-xl font-semibold tracking-tight">iOS 设备</h1>
      <p class="mt-1 text-sm text-muted-foreground">libimobiledevice（架构预留）</p>
    </header>
    <div
      class="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center"
    >
      <Tablet class="size-10 text-muted-foreground opacity-50" strokeWidth={1.25} />
      <p class="max-w-sm text-sm text-muted-foreground">该端尚未实现，接入层已在主进程预留适配器。</p>
    </div>
  </section>
{/if}
