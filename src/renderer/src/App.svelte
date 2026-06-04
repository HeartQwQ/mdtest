<script lang="ts">
  import { ModeWatcher } from 'mode-watcher'
  import Sidebar from './lib/components/Sidebar.svelte'
  import DeviceView from './lib/components/DeviceView.svelte'
  import type { DevicePlatform } from './lib/ipc'

  let active = $state<DevicePlatform>('android')
</script>

<ModeWatcher />

<div class="flex h-screen bg-background">
  <Sidebar bind:active />
  <main class="min-w-0 flex-1 overflow-auto">
    <DeviceView platform={active} />
  </main>
</div>
