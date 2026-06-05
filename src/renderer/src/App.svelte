<script lang="ts">
  import { ModeWatcher } from 'mode-watcher'
  import AppSidebar from '$lib/components/nav/AppSidebar.svelte'
  import Titlebar from '$lib/components/Titlebar.svelte'
  import HomeView from '$lib/views/HomeView.svelte'
  import DeviceManagementView from '$lib/views/DeviceManagementView.svelte'
  import SettingsView from '$lib/views/SettingsView.svelte'
  import { view } from '$lib/stores/view.svelte'
</script>

<ModeWatcher />

<div class="flex h-screen flex-col overflow-hidden bg-background text-foreground">
  <Titlebar />
  <div class="flex min-h-0 flex-1">
    <AppSidebar />
    <main class="min-w-0 flex-1 overflow-hidden">
      {#if view.current === 'home'}
        <HomeView />
      {:else if view.current === 'devices'}
        <DeviceManagementView />
      {:else if view.current === 'settings'}
        <SettingsView />
      {/if}
    </main>
  </div>
</div>
