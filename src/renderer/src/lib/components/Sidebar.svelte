<script lang="ts">

  import { onMount } from 'svelte'

  import { Monitor, Smartphone } from '@lucide/svelte'

  import { cn } from '$lib/utils'

  import { ipc, type DevicePlatform } from '../ipc'

  import ThemeSwitcher from './ThemeSwitcher.svelte'



  let { active = $bindable() }: { active: DevicePlatform } = $props()



  const deviceItems: {

    id: DevicePlatform

    label: string

    icon: typeof Smartphone

  }[] = [
    { id: 'windows', label: 'PC', icon: Monitor },
    { id: 'android', label: '安卓', icon: Smartphone },
    { id: 'ios', label: 'iOS', icon: Smartphone },
    { id: 'harmony', label: '鸿蒙', icon: Smartphone }
  ]



  let availability = $state<Record<string, boolean>>({})



  onMount(async () => {

    try {

      availability = await ipc.platformAvailability()

    } catch {

      availability = {}

    }

  })

</script>



<aside

  class="flex h-full w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground"

  aria-label="平台导航"

>

  <div class="mb-6 px-2">

    <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">多端测试</p>

    <h1 class="mt-1 text-base font-semibold tracking-tight">设备工作台</h1>

  </div>



  <nav class="flex flex-col gap-1" aria-label="平台列表">

    {#each deviceItems as item (item.id)}

      {@const Icon = item.icon}

      <button

        type="button"

        class={cn(

          'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',

          active === item.id

            ? 'border-primary/30 bg-sidebar-accent text-sidebar-accent-foreground'

            : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground'

        )}

        onclick={() => (active = item.id)}

      >

        <span

          class={cn(

            'size-2 shrink-0 rounded-full',

            availability[item.id] ? 'bg-online' : 'bg-muted-foreground/40'

          )}

          title={availability[item.id] ? '工具链就绪' : '未就绪'}

        ></span>

        <Icon class="size-4 shrink-0 opacity-80" strokeWidth={1.75} />

        <span class="min-w-0 flex-1 truncate font-medium">{item.label}</span>

      </button>

    {/each}

  </nav>



  <ThemeSwitcher />



  <p class="mt-3 px-2 text-[11px] leading-relaxed text-muted-foreground">

    绿点表示 adb / hdc / libimobiledevice 工具链可用

  </p>

</aside>

