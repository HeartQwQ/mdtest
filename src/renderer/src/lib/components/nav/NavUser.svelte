<script lang="ts">
  import { BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from '@lucide/svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { userInfo } from '$lib/nav/nav-data'

  const initials = $derived(
    userInfo.name
      .replace(/[（(].*?[）)]/g, '')
      .trim()
      .slice(0, 2)
      .toUpperCase()
  )
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="no-drag flex size-10 items-center justify-center rounded-lg outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-sidebar-accent"
    aria-label="用户菜单"
    title={userInfo.name}
  >
    <span
      class="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground"
    >
      {initials}
    </span>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="min-w-60 rounded-lg" align="end" side="right" sideOffset={8}>
    <DropdownMenu.Label class="p-0 font-normal">
      <div class="flex items-center gap-2 px-1 py-1.5">
        <span
          class="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground"
        >
          {initials}
        </span>
        <div class="grid flex-1 leading-tight">
          <span class="truncate text-sm font-medium">{userInfo.name}</span>
          <span class="truncate text-[11px] text-muted-foreground">{userInfo.email}</span>
        </div>
      </div>
    </DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Group>
      <DropdownMenu.Item><Sparkles class="size-4" />升级 Pro</DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.Group>
      <DropdownMenu.Item><BadgeCheck class="size-4" />账户</DropdownMenu.Item>
      <DropdownMenu.Item><CreditCard class="size-4" />账单</DropdownMenu.Item>
      <DropdownMenu.Item><Bell class="size-4" />通知</DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.Item><LogOut class="size-4" />退出登录</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
