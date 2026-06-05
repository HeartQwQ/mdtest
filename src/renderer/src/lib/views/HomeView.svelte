<script lang="ts">
  import { ArrowRight } from '@lucide/svelte'
  import { navMain } from '$lib/nav/nav-data'
  import { goTo } from '$lib/stores/view.svelte'

  const entries = $derived(navMain.filter((n) => n.id !== 'home'))
</script>

<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 p-8">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">多端测试工作台</h1>
    <p class="mt-1.5 text-sm text-muted-foreground">
      统一管理 Windows / 安卓 / iOS / 鸿蒙 四端测试设备，投屏、文件与用例一体化。
    </p>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    {#each entries as item (item.id)}
      {@const Icon = item.icon}
      <button
        type="button"
        class="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onclick={() => goTo(item.id)}
      >
        <span
          class="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <Icon class="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 class="flex items-center gap-1.5 text-base font-medium">
            {item.title}
            <ArrowRight
              class="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              strokeWidth={1.75}
            />
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">{item.desc}</p>
        </div>
      </button>
    {/each}
  </div>
</div>
