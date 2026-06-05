<script lang="ts">
  import { Monitor, Moon, Sun } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import {
    colorModes,
    setColorMode,
    setPalette,
    theme,
    themePalettes,
    type ColorMode
  } from '$lib/stores/theme.svelte'

  const modeIcons = { light: Sun, dark: Moon, system: Monitor } as const
</script>

<div class="mx-auto flex h-full w-full max-w-3xl flex-col gap-8 overflow-auto p-8">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">设置</h1>
    <p class="mt-1.5 text-sm text-muted-foreground">管理应用内的各项配置</p>
  </div>

  <section class="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
    <div>
      <h2 class="text-base font-medium">外观主题</h2>
      <p class="mt-0.5 text-sm text-muted-foreground">选择风格主题与明暗模式</p>
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">风格</span>
      <div class="grid gap-2 sm:grid-cols-2">
        {#each themePalettes as t (t.id)}
          <button
            type="button"
            class={cn(
              'rounded-lg border px-3 py-2.5 text-left transition-colors',
              theme.palette === t.id
                ? 'border-primary/40 bg-accent/40'
                : 'border-border text-muted-foreground hover:bg-accent/30 hover:text-foreground'
            )}
            onclick={() => setPalette(t.id)}
          >
            <span class="block text-sm font-medium">{t.label}</span>
            <span class="mt-0.5 block text-xs text-muted-foreground">{t.description}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">明暗</span>
      <div class="grid max-w-xs grid-cols-3 gap-2" role="group" aria-label="颜色模式">
        {#each colorModes as m (m.id)}
          {@const Icon = modeIcons[m.id]}
          <button
            type="button"
            class={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors',
              theme.colorMode === m.id
                ? 'border-primary/40 bg-accent/40'
                : 'border-border text-muted-foreground hover:bg-accent/30 hover:text-foreground'
            )}
            onclick={() => setColorMode(m.id as ColorMode)}
          >
            <Icon class="size-4" strokeWidth={1.75} />
            {m.label}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <section class="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
    <h2 class="text-base font-medium">设备与工具链</h2>
    <p class="text-sm text-muted-foreground">扫描路径、包名、工具链路径等配置（待接入）</p>
  </section>
</div>
