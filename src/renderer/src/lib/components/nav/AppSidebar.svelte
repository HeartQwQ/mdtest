<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip'
  import { cn } from '$lib/utils'
  import { navMain } from '$lib/nav/nav-data'
  import { view, goTo } from '$lib/stores/view.svelte'
  import TeamSwitcher from './TeamSwitcher.svelte'
  import NavUser from './NavUser.svelte'
</script>

<aside
  class="flex h-full w-14 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-2.5"
  aria-label="主导航"
>
  <!-- 顶部功能区 -->
  <div class="flex flex-col items-center">
    <TeamSwitcher />
  </div>

  <div class="my-2.5 h-px w-7 bg-sidebar-border"></div>

  <!-- 主导航（icon-only，hover 出名称） -->
  <Tooltip.Provider delayDuration={300}>
    <nav class="flex flex-1 flex-col items-center gap-1" aria-label="页面导航">
      {#each navMain as item (item.id)}
        {@const Icon = item.icon}
        {@const isActive = view.current === item.id}
        <Tooltip.Root>
          <Tooltip.Trigger
            class={cn(
              'no-drag flex size-10 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
            )}
            aria-label={item.title}
            aria-current={isActive ? 'page' : undefined}
            onclick={() => goTo(item.id)}
          >
            <Icon class="size-5" strokeWidth={1.75} />
          </Tooltip.Trigger>
          <Tooltip.Content side="right" sideOffset={8}>
            <span class="font-medium">{item.title}</span>
          </Tooltip.Content>
        </Tooltip.Root>
      {/each}
    </nav>
  </Tooltip.Provider>

  <div class="my-2.5 h-px w-7 bg-sidebar-border"></div>

  <!-- 底部功能区 -->
  <div class="flex flex-col items-center">
    <NavUser />
  </div>
</aside>
