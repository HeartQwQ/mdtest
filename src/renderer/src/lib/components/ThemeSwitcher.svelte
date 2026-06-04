<script lang="ts">
  import { Monitor, Moon, Palette, Sun } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { cn } from '$lib/utils'
  import {
    colorModes,
    setColorMode,
    setPalette,
    theme,
    themePalettes,
    type ThemePalette
  } from '$lib/stores/theme.svelte'

  const modeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor
  } as const
</script>

<div class="mt-auto flex flex-col gap-3 border-t border-sidebar-border pt-4">
  <div>
    <p class="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      <Palette class="size-3" strokeWidth={1.75} />
      风格主题
    </p>
    <div class="flex flex-col gap-1">
      {#each themePalettes as t (t.id)}
        <button
          type="button"
          class={cn(
            'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
            theme.palette === t.id
              ? 'border-primary/40 bg-sidebar-accent text-sidebar-accent-foreground'
              : 'border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
          onclick={() => setPalette(t.id as ThemePalette)}
        >
          <span class="block font-medium">{t.label}</span>
          <span class="mt-0.5 block text-[10px] opacity-80">{t.description}</span>
        </button>
      {/each}
    </div>
  </div>

  <div>
    <p class="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      明暗
    </p>
    <div class="grid grid-cols-3 gap-1 px-1" role="group" aria-label="颜色模式">
      {#each colorModes as m (m.id)}
        {@const Icon = modeIcons[m.id]}
        <Button
          variant={theme.colorMode === m.id ? 'secondary' : 'ghost'}
          size="sm"
          class="h-8 px-0"
          onclick={() => setColorMode(m.id)}
          title={m.label}
          aria-label={m.label}
        >
          <Icon class="size-3.5" strokeWidth={1.75} />
        </Button>
      {/each}
    </div>
  </div>
</div>
