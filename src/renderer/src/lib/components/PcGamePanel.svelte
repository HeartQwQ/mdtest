<script lang="ts">
  import { onMount } from 'svelte'
  import {
    FolderOpen,
    FolderPlus,
    Gamepad2,
    Play,
    RefreshCw,
    Search,
    Files
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as Card from '$lib/components/ui/card'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { cn } from '$lib/utils'
  import { gamesApi, type PcGameInstance } from '../games'
  import FileExplorer from './FileExplorer.svelte'

  let games = $state<PcGameInstance[]>([])
  let selectedId = $state<string | null>(null)
  let scanning = $state(false)
  let error = $state<string | null>(null)
  let showFiles = $state(false)

  const selected = $derived(games.find((g) => g.id === selectedId) ?? null)

  function displayName(g: PcGameInstance): string {
    return g.label || g.name || g.path
  }

  async function loadGames(): Promise<void> {
    if (!scanning) scanning = true
    error = null
    try {
      games = await gamesApi.ensurePcLoaded()
      if (games.length && !games.find((g) => g.id === selectedId)) {
        selectedId = games[0].id
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      scanning = false
    }
  }

  async function rescan(): Promise<void> {
    scanning = true
    error = null
    try {
      games = await gamesApi.scanPc()
      if (games.length && !selectedId) selectedId = games[0].id
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      scanning = false
    }
  }

  async function addManual(): Promise<void> {
    const path = await gamesApi.pickPcDirectory()
    if (!path) return
    await gamesApi.addPcPath(path)
    await loadGames()
    const added = games.find((g) => g.path.toLowerCase() === path.toLowerCase())
    if (added) selectedId = added.id
  }

  async function launchGame(g: PcGameInstance): Promise<void> {
    try {
      if (g.launcherPath) await gamesApi.launch(g.launcherPath)
      else if (g.exePath) await gamesApi.launch(g.exePath)
      else error = '未找到可执行文件'
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  async function openFolder(g: PcGameInstance): Promise<void> {
    try {
      await gamesApi.openFolder(g.path)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  onMount(() => {
    void loadGames()
  })
</script>

<section class="flex h-full min-h-0 flex-col p-6 lg:p-8">
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-primary">
        <Gamepad2 class="size-5" strokeWidth={1.75} />
        <span class="text-xs font-medium uppercase tracking-wider">Windows</span>
      </div>
      <h1 class="mt-2 text-xl font-semibold tracking-tight">PC 游戏目录</h1>
      <p class="mt-1 max-w-xl text-sm text-muted-foreground">
        自动检索 ShadowTrackerExtra，支持启动与目录内文件管理
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" onclick={addManual}>
        <FolderPlus class="size-4" />
        添加目录
      </Button>
      <Button onclick={rescan} disabled={scanning}>
        <RefreshCw class={cn('size-4', scanning && 'animate-spin')} />
        {scanning ? '扫描中…' : '重新扫描'}
      </Button>
    </div>
  </header>

  {#if error}
    <div
      class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      {error}
    </div>
  {/if}

  <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,300px)_1fr]">
    <Card.Root class="flex min-h-[320px] flex-col py-0">
      <Card.Header class="flex-row items-center gap-2 space-y-0 border-b py-3">
        <Search class="size-3.5 text-muted-foreground" />
        <Card.Title class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          游戏实例
        </Card.Title>
      </Card.Header>
      <ScrollArea class="min-h-0 flex-1">
        <ul class="space-y-1 p-2">
          {#if games.length === 0}
            <li class="px-3 py-8 text-center text-sm text-muted-foreground">
              {scanning ? '扫描中…' : '未找到目录，请添加或扫描'}
            </li>
          {:else}
            {#each games as g (g.id)}
              <li>
                <button
                  type="button"
                  class={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                    selectedId === g.id
                      ? 'border-primary/35 bg-accent text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                  onclick={() => (selectedId = g.id)}
                >
                  <span class="min-w-0 flex-1 truncate font-medium">{displayName(g)}</span>
                  {#if g.hasExe}
                    <Badge variant="secondary" class="shrink-0 text-[10px]">可启动</Badge>
                  {/if}
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </ScrollArea>
    </Card.Root>

    <Card.Root class="flex min-h-[320px] min-w-0 flex-col">
      <Card.Content class="flex min-h-0 flex-1 flex-col pt-6">
        {#if selected}
          <h2 class="text-lg font-semibold">{displayName(selected)}</h2>
          <p class="mt-2 break-all font-mono text-xs text-muted-foreground">{selected.path}</p>

          <dl class="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt class="text-muted-foreground">版本号</dt>
            <dd>{selected.appVersion ?? '未知'}</dd>
            <dt class="text-muted-foreground">资源号</dt>
            <dd>{selected.srcVersion ?? '未知'}</dd>
          </dl>

          <div class="mt-6 flex flex-wrap gap-2">
            {#if selected.launcherPath}
              <Button onclick={() => launchGame(selected!)}>
                <Play class="size-4" />
                启动 WeGame
              </Button>
            {:else}
              <Button disabled={!selected.hasExe} onclick={() => launchGame(selected!)}>
                <Play class="size-4" />
                启动游戏
              </Button>
            {/if}
            <Button variant="outline" onclick={() => openFolder(selected!)}>
              <FolderOpen class="size-4" />
              系统文件夹
            </Button>
            <Button variant="outline" onclick={() => (showFiles = !showFiles)}>
              <Files class="size-4" />
              {showFiles ? '收起文件' : '应用内文件'}
            </Button>
          </div>

          {#if showFiles}
            <div class="mt-6 min-h-0 flex-1">
              <FileExplorer mode="local" root={selected.path} />
            </div>
          {/if}
        {:else}
          <div
            class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground"
          >
            <Gamepad2 class="size-8 opacity-40" strokeWidth={1.25} />
            <p>从左侧选择一个游戏目录</p>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</section>
