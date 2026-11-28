<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import type { Chart } from "$lib/data/index.js";
  import ChartCard from "./chart-card.svelte";
  import * as Carousel from "$lib/components/carousel/index.js";
  import { cn } from "$lib/utils.js";
  import { RiArrowRightLine } from "$lib/icons.js";

  let {
    title,
    charts,
    href,
    hrefLabel = t("home.viewAll"),
    columns = "row",
    carousel = false,
  }: {
    title?: string;
    charts: Chart[];
    href?: string;
    hrefLabel?: string;
    columns?: "row" | "grid";
    carousel?: boolean;
  } = $props();
</script>

<section class="space-y-5">
  {#if title}
    <div class="flex items-end justify-between gap-3">
      <h2 class="text-lg font-semibold tracking-tight">{title}</h2>
      {#if href}
        <a
          {href}
          class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1 text-sm transition-colors"
        >
          {hrefLabel}
          <RiArrowRightLine
            class="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </a>
      {/if}
    </div>
  {/if}

  {#if carousel}
    <Carousel.Root opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}>
      <Carousel.Content class="gap-3 sm:gap-5">
        {#each charts as chart (chart.id)}
          <Carousel.Item class="basis-[46%] sm:basis-[calc((100%-2.5rem)/3)] lg:basis-[calc((100%-3.75rem)/4)]">
            <ChartCard {chart} />
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>
  {:else}
    <div
      class={cn(
        "grid gap-3 sm:gap-5",
        columns === "row" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
      )}
    >
      {#each charts as chart (chart.id)}
        <ChartCard {chart} />
      {/each}
    </div>
  {/if}
</section>
