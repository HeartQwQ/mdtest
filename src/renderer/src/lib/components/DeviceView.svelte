<script lang="ts">
  import type { DevicePlatform } from '../ipc'
  import PcGamePanel from './PcGamePanel.svelte'
  import MobileGamePanel from './MobileGamePanel.svelte'
  import IosDevicePanel from './IosDevicePanel.svelte'

  let { platform }: { platform: DevicePlatform } = $props()
</script>

{#if platform === 'windows'}
  <PcGamePanel />
{:else if platform === 'android'}
  <MobileGamePanel platform="android" />
{:else if platform === 'harmony'}
  <MobileGamePanel platform="harmony" />
{:else if platform === 'ios'}
  <IosDevicePanel />
{/if}
