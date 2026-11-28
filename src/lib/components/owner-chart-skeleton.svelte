<script lang="ts">
  import { prefs } from "$lib/state/preferences.svelte.js";

  // Loading placeholder shaped like owner-chart-card in the current card style.
  const bar = "bg-muted animate-pulse rounded-full motion-reduce:animate-none";
</script>

{#if prefs.dashboardCards === "cover"}
  <div class="bg-card flex flex-col overflow-hidden rounded-2xl" aria-hidden="true">
    <div class="bg-muted aspect-square w-full animate-pulse motion-reduce:animate-none"></div>
    <div class="space-y-2 p-3">
      <div class={`${bar} h-3.5 w-3/4`}></div>
      <div class={`${bar} h-3 w-1/2`}></div>
      <div class={`${bar} h-8 w-full`}></div>
    </div>
  </div>
{:else if prefs.dashboardCards === "background"}
  <div class="bg-card overflow-hidden rounded-3xl" aria-hidden="true">
    <div class="bg-muted aspect-16/7 w-full animate-pulse motion-reduce:animate-none"></div>
    <div class="space-y-2 px-4 pt-15 pb-4">
      <div class={`${bar} h-3.5 w-2/3`}></div>
      <div class={`${bar} h-3 w-1/3`}></div>
    </div>
  </div>
{:else}
  <div class="bg-card flex items-center gap-3 rounded-2xl p-2.5" aria-hidden="true">
    <div class="bg-muted size-18 shrink-0 animate-pulse rounded-xl motion-reduce:animate-none"></div>
    <div class="min-w-0 flex-1 space-y-2">
      <div class={`${bar} h-4 w-16`}></div>
      <div class={`${bar} h-3.5 w-3/4`}></div>
      <div class={`${bar} h-3 w-1/2`}></div>
    </div>
    <div class="flex shrink-0 flex-col gap-1.5">
      <div class={`${bar} size-8`}></div>
      <div class={`${bar} size-8`}></div>
    </div>
  </div>
{/if}
