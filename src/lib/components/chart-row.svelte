<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import type { Chart } from "$lib/data/index.js";
  import { compact, relativeTime, coverUrl, previewProxyUrl } from "$lib/data/index.js";
  import CoverArt from "./cover-art.svelte";
  import LevelBadge from "./level-badge.svelte";
  import Waveform from "./waveform.svelte";
  import FormattedText from "./formatted-text.svelte";
  import { RiHeart3Fill, RiChat3Line, RiStarFill, RiTimeLine } from "$lib/icons.js";

  let { chart }: { chart: Chart } = $props();

  const cover = $derived(coverUrl(chart));
</script>

<article class="group bg-card clip-rounded relative isolate flex items-center gap-4 overflow-hidden rounded-2xl p-2 pr-4">
  {#if cover}
    <img
      src={cover}
      alt=""
      loading="lazy"
      decoding="async"
      class="absolute inset-y-0 left-0 -z-10 w-1/2 opacity-25 blur-2xl saturate-150 transition-opacity duration-250 [mask-image:linear-gradient(to_right,black,transparent)] group-hover:opacity-45 motion-reduce:transition-none h-full object-cover"
    />
  {/if}

  <CoverArt id={chart.id} title={chart.title} src={cover} rounded="rounded-xl" class="size-16 shrink-0" />

  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <div class="flex items-center gap-2">
      <h3 class="min-w-0 truncate text-[15px] font-bold">
        <a href={`/levels/UnCh-${chart.id}`} class="after:absolute after:inset-0 after:content-['']"
          ><FormattedText text={chart.title} /></a
        >
      </h3>
      {#if chart.staff_pick}
        <span
          class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950"
        >
          <RiStarFill class="size-2.5" />
          {t("common.staff")}
        </span>
      {/if}
    </div>

    <p class="text-muted-foreground truncate text-xs">
      <a href={`/creators/${chart.author_handle}`} class="text-accent relative z-10 font-bold hover:underline"
        >{chart.chart_design}</a
      >
      · <FormattedText text={chart.artists} />
    </p>

    <div class="flex flex-wrap items-center gap-1.5">
      <LevelBadge level={chart.rating} size="sm" />
      {#each chart.tags.slice(0, 3) as tag (tag)}
        <span class="bg-muted/70 text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">#{tag}</span>
      {/each}
    </div>
  </div>

  <div class="relative z-10 hidden w-52 shrink-0 lg:block">
    <Waveform id={chart.id} src={previewProxyUrl(chart)} variant="compact" height={26} lazy />
  </div>

  <div class="text-muted-foreground flex shrink-0 flex-col items-end gap-1.5 text-xs tabular-nums">
    <div class="flex items-center gap-3 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">
      <span><RiHeart3Fill class="size-3.5 text-rose-400" />{compact(chart.like_count)}</span>
      <span><RiChat3Line class="size-3.5" />{compact(chart.comment_count)}</span>
    </div>
    <span class="inline-flex items-center gap-1 text-[11px] whitespace-nowrap">
      <RiTimeLine class="size-3" />
      {relativeTime(chart.updated_at)}
    </span>
  </div>
</article>
