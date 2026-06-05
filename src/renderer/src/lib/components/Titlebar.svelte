<script lang="ts">
  import { onMount } from 'svelte'
  import { Minus, Moon, Square, Sun, X } from '@lucide/svelte'
  import { navMain } from '$lib/nav/nav-data'
  import { view } from '$lib/stores/view.svelte'
  import { setColorMode, theme } from '$lib/stores/theme.svelte'

  const current = $derived(navMain.find((n) => n.id === view.current))
  const isDark = $derived(theme.colorMode === 'dark')

  let maximized = $state(false)

  onMount(async () => {
    maximized = await window.api.windowIsMaximized()
  })

  async function toggleMax(): Promise<void> {
    maximized = await window.api.windowToggleMaximize()
  }

  function toggleTheme(): void {
    setColorMode(isDark ? 'light' : 'dark')
  }
</script>

<header
  class="drag-region flex h-11 shrink-0 items-center justify-between border-b border-border bg-background pl-4"
>
  <div class="flex items-center gap-2 text-sm">
    <span class="font-semibold tracking-tight">多端测试工具</span>
    {#if current}
      <span class="text-muted-foreground">/</span>
      <span class="text-muted-foreground">{current.title}</span>
    {/if}
  </div>

  <div class="no-drag flex items-center">
    <button
      type="button"
      class="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onclick={toggleTheme}
      aria-label={isDark ? '切换到浅色' : '切换到深色'}
      title={isDark ? '浅色模式' : '深色模式'}
    >
      {#if isDark}
        <Sun class="size-4" strokeWidth={1.75} />
      {:else}
        <Moon class="size-4" strokeWidth={1.75} />
      {/if}
    </button>
    <button
      type="button"
      class="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onclick={() => window.api.windowMinimize()}
      aria-label="最小化"
    >
      <Minus class="size-4" strokeWidth={1.75} />
    </button>
    <button
      type="button"
      class="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onclick={toggleMax}
      aria-label={maximized ? '还原' : '最大化'}
    >
      <Square class="size-3.5" strokeWidth={1.75} />
    </button>
    <button
      type="button"
      class="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
      onclick={() => window.api.windowClose()}
      aria-label="关闭"
    >
      <X class="size-4" strokeWidth={1.75} />
    </button>
  </div>
</header>
