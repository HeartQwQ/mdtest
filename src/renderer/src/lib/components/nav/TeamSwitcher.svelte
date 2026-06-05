<script lang="ts">
  import { ChevronsUpDown, Plus } from '@lucide/svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { teams } from '$lib/nav/nav-data'

  let activeTeam = $state(teams[0])
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="no-drag flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-accent-foreground outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-sidebar-accent"
    aria-label="切换团队"
    title={activeTeam.name}
  >
    {#if activeTeam}
      {@const Logo = activeTeam.logo}
      <Logo class="size-5" strokeWidth={1.75} />
    {/if}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="min-w-56 rounded-lg" align="start" side="right" sideOffset={8}>
    <DropdownMenu.Label class="text-xs text-muted-foreground">团队</DropdownMenu.Label>
    {#each teams as team, i (team.name)}
      {@const Logo = team.logo}
      <DropdownMenu.Item class="gap-2 p-2" onSelect={() => (activeTeam = team)}>
        <div class="flex size-6 items-center justify-center rounded-md border border-border">
          <Logo class="size-3.5 shrink-0" strokeWidth={1.75} />
        </div>
        <div class="grid flex-1 leading-tight">
          <span class="truncate text-sm font-medium">{team.name}</span>
          <span class="truncate text-[11px] text-muted-foreground">{team.plan}</span>
        </div>
        <DropdownMenu.Shortcut>⌘{i + 1}</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    {/each}
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="gap-2 p-2 text-muted-foreground">
      <div class="flex size-6 items-center justify-center rounded-md border border-border">
        <Plus class="size-4" strokeWidth={1.75} />
      </div>
      <span class="font-medium">添加团队</span>
      <ChevronsUpDown class="ms-auto size-3.5 opacity-0" />
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
