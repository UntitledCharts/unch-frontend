<script lang="ts">
  import LevelView from "./level-view.svelte";
  import ScheduledView from "./scheduled-view.svelte";
  import { session } from "$lib/state/session.svelte";

  let { data } = $props();

  // the charter keeps the full page while the release is pending, as long as the full chart came back
  const isOwner = $derived(session.isLoggedIn && session.user?.handle === data.chart.author_handle);
  const countdown = $derived(data.scheduled && (data.scheduled.teaser || !isOwner));
</script>

{#if data.scheduled && countdown}
  <ScheduledView chart={data.chart} at={data.scheduled.at} />
{:else}
  <LevelView {data} />
{/if}
