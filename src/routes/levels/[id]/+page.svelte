<script lang="ts">
  import LevelView from "./level-view.svelte";
  import ScheduledView from "./scheduled-view.svelte";
  import Confetti from "$lib/components/confetti.svelte";
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { storedSessionKey } from "$lib/state/session.svelte";

  let { data } = $props();

  // everyone gets the countdown first; whoever got the full chart back can skip it
  let skipped = $state(false);
  const countdown = $derived(data.scheduled && (data.scheduled.teaser || !skipped));

  // set when the countdown runs out; the confetti sits outside the views so it keeps falling once the chart opens
  let celebrating = $state(false);

  // the server only gets the public countdown of a private chart; the charter's browser asks again with its session
  onMount(() => {
    if (data.serverRendered && data.scheduled?.teaser && storedSessionKey()) invalidateAll();
  });
</script>

{#if data.scheduled && countdown}
  <ScheduledView
    chart={data.chart}
    at={data.scheduled.at}
    author={data.author}
    onreleased={() => (celebrating = true)}
    onskip={data.scheduled.teaser ? undefined : () => (skipped = true)}
  />
{:else}
  <LevelView {data} />
{/if}

{#if celebrating}
  <Confetti onend={() => (celebrating = false)} />
{/if}
