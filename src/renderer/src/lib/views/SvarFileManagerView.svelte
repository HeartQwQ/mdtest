<script lang="ts">
  import { onMount } from 'svelte'
  import { Filemanager, Willow, WillowDark, type IEntity } from '@svar-ui/svelte-filemanager'
  import { theme } from '$lib/stores/theme.svelte'

  const staticFiles: IEntity[] = [
    { id: '/Projects', type: 'folder', date: new Date('2026-06-01T10:00:00') },
    { id: '/Projects/mdtest', type: 'folder', date: new Date('2026-06-05T09:30:00') },
    { id: '/Projects/mdtest/src', type: 'folder', date: new Date('2026-06-05T09:40:00') },
    { id: '/Projects/mdtest/src/App.svelte', type: 'file', size: 2456, date: new Date('2026-06-07T18:20:00') },
    {
      id: '/Projects/mdtest/src/SvarFileManagerView.svelte',
      type: 'file',
      size: 8192,
      date: new Date('2026-06-07T20:10:00')
    },
    { id: '/Projects/mdtest/package.json', type: 'file', size: 1350, date: new Date('2026-06-07T18:48:00') },
    { id: '/Projects/mdtest/pnpm-lock.yaml', type: 'file', size: 140997, date: new Date('2026-06-07T18:48:00') },
    { id: '/Games', type: 'folder', date: new Date('2026-05-28T14:00:00') },
    { id: '/Games/Game For Peace', type: 'folder', date: new Date('2026-05-28T14:10:00') },
    {
      id: '/Games/Game For Peace/Saved',
      type: 'folder',
      date: new Date('2026-05-28T14:20:00')
    },
    {
      id: '/Games/Game For Peace/Saved/Config.ini',
      type: 'file',
      size: 4096,
      date: new Date('2026-05-30T22:16:00')
    },
    {
      id: '/Games/Game For Peace/Saved/Logs',
      type: 'folder',
      date: new Date('2026-06-01T08:45:00')
    },
    {
      id: '/Games/Game For Peace/Saved/Logs/client.log',
      type: 'file',
      size: 98304,
      date: new Date('2026-06-06T23:12:00')
    },
    { id: '/Android', type: 'folder', date: new Date('2026-06-02T12:00:00') },
    { id: '/Android/data', type: 'folder', date: new Date('2026-06-02T12:01:00') },
    {
      id: '/Android/data/com.tencent.tmgp.pubgmhd',
      type: 'folder',
      date: new Date('2026-06-02T12:02:00')
    },
    {
      id: '/Android/data/com.tencent.tmgp.pubgmhd/files',
      type: 'folder',
      date: new Date('2026-06-02T12:03:00')
    },
    {
      id: '/Android/data/com.tencent.tmgp.pubgmhd/files/UE4Game',
      type: 'folder',
      date: new Date('2026-06-02T12:04:00')
    },
    {
      id: '/Android/data/com.tencent.tmgp.pubgmhd/files/UE4Game/SavedGame.sav',
      type: 'file',
      size: 7340032,
      date: new Date('2026-06-03T01:30:00')
    },
    {
      id: '/Android/data/com.tencent.mobileqq',
      type: 'folder',
      date: new Date('2026-06-02T12:05:00')
    },
    {
      id: '/Android/data/com.tencent.mobileqq/files',
      type: 'folder',
      date: new Date('2026-06-02T12:06:00')
    },
    {
      id: '/Android/data/com.tencent.mobileqq/files/config_system_switchs.txt',
      type: 'file',
      size: 5,
      date: new Date('2026-06-02T12:07:00')
    },
    { id: '/Downloads', type: 'folder', date: new Date('2026-06-07T16:59:00') },
    { id: '/Downloads/demo.apk', type: 'file', size: 47099495, date: new Date('2026-06-07T17:00:00') },
    { id: '/Downloads/readme.txt', type: 'file', size: 2048, date: new Date('2026-06-07T17:05:00') }
  ]

  let systemDark = $state(false)
  const useDarkTheme = $derived(
    theme.colorMode === 'dark' || (theme.colorMode === 'system' && systemDark)
  )

  onMount(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = (): void => {
      systemDark = media.matches
    }

    syncSystemTheme()
    media.addEventListener('change', syncSystemTheme)

    return () => {
      media.removeEventListener('change', syncSystemTheme)
    }
  })
</script>

<div class="flex h-full min-h-0 flex-col bg-background text-foreground">
  <div class="border-b border-border px-4 py-3">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-base font-semibold tracking-tight">SVAR 静态文件管理</h1>
        <p class="mt-1 text-xs text-muted-foreground">
          仅使用本地静态数据，先验证 SVAR 原生工具栏、右键菜单、面包屑、列表和磁贴交互。
        </p>
      </div>
      <code class="rounded bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
        static://demo-root
      </code>
    </div>
  </div>

  <div class="min-h-0 flex-1 p-3">
    <div class="svar-host h-full min-h-0 overflow-hidden rounded-md border border-border bg-background">
      {#if useDarkTheme}
        <WillowDark fonts={false}>
          <Filemanager data={staticFiles} mode="table" preview={true} />
        </WillowDark>
      {:else}
        <Willow fonts={false}>
          <Filemanager data={staticFiles} mode="table" preview={true} />
        </Willow>
      {/if}
    </div>
  </div>
</div>

<style>
  .svar-host :global(.wx-willow-theme),
  .svar-host :global(.wx-willow-dark-theme) {
    height: 100%;
    min-height: 0;
  }

  .svar-host :global(.wx-filemanager) {
    height: 100%;
    min-height: 0;
  }
</style>
