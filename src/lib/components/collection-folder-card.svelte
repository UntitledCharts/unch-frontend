<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import {
    collectionCharts,
    collectionDifficulties,
    difficultyMeta,
    coverUrl,
    relativeTime,
    type Collection,
  } from "$lib/data/index.js";
  import CoverArt from "./cover-art.svelte";
  import { cn } from "$lib/utils.js";
  import { RiStackLine } from "$lib/icons.js";

  let { collection }: { collection: Collection } = $props();

  const charts = $derived(collectionCharts(collection));
  const covers = $derived(charts.slice(0, 4));
  const difficulties = $derived(collectionDifficulties(charts).slice(0, 3));
</script>

<a
  href={`/dashboard/collections/${collection.id}`}
  class="group bg-card ring-border/70 hover:ring-primary/40 relative flex flex-col overflow-hidden rounded-2xl ring-1 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
>
  <div class="bg-muted relative grid aspect-square grid-cols-2 grid-rows-2 gap-0.5">
    {#each [0, 1, 2, 3] as i (i)}
      {@const chart = covers[i]}
      {#if chart}
        <CoverArt
          id={chart.id}
          title={chart.title}
          src={coverUrl(chart)}
          rounded="rounded-none"
          class="size-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      {:else}
        <div class="bg-muted/60"></div>
      {/if}
    {/each}

    <span
      class="bg-background/80 absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums shadow-sm backdrop-blur"
    >
      <RiStackLine class="size-3" />
      {charts.length}
    </span>
  </div>

  <div class="flex flex-1 flex-col gap-2 p-3">
    <div class="min-w-0 space-y-0.5">
      <h3
        class="group-hover:text-primary truncate text-sm font-semibold tracking-tight transition-colors"
      >
        {#if collection.emoji}<span class="mr-1">{collection.emoji}</span>{/if}{collection.name}
      </h3>
      <p class="text-muted-foreground truncate text-xs">
        {t("collections.updated", [relativeTime(collection.updatedAt)])}
      </p>
    </div>

    {#if difficulties.length}
      <div class="mt-auto flex flex-wrap gap-1">
        {#each difficulties as d (d)}
          <span
            class={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
              difficultyMeta[d].badge,
            )}>{d}</span
          >
        {/each}
      </div>
    {/if}
  </div>
</a>
