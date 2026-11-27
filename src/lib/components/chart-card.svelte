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

<article class="group bg-card @container clip-rounded relative isolate flex h-full flex-col gap-2.5 overflow-hidden rounded-3xl p-2">
  <!-- Backdrop and tint reuse the cover, which the card downloads anyway. Chart background art is
       ~2–3 MB per chart at full size, far too heavy for a card. Lazy <img> so off-screen cards load nothing. -->
  {#if cover}
    <img
      src={cover}
      alt=""
      loading="lazy"
      decoding="async"
      class="absolute -inset-1/3 -z-20 size-[166%] max-w-none object-cover opacity-20 blur-2xl saturate-150 transition-opacity duration-250 group-hover:opacity-35 motion-reduce:transition-none"
    />
    <img
      src={cover}
      alt=""
      loading="lazy"
      decoding="async"
      class="absolute inset-x-0 top-0 -z-10 h-2/5 w-full object-cover opacity-60 blur-[2px] [mask-image:linear-gradient(to_bottom,black_35%,transparent)]"
    />
  {/if}

  <div class="relative mx-auto mt-3 aspect-square w-[58%] shadow-[0_10px_22px_-10px_rgb(0_0_0/0.6)]">
    <CoverArt
      id={chart.id}
      title={chart.title}
      src={cover}
      rounded="rounded-2xl"
      class="size-full [&_img]:transition-transform [&_img]:duration-250 group-hover:[&_img]:scale-104 motion-reduce:[&_img]:transition-none"
    />
    <LevelBadge level={chart.rating} size="sm" onImage class="absolute top-1.5 left-1.5" />
  </div>

  {#if chart.staff_pick}
    <span
      title={t("common.staff")}
      class="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950"
    >
      <RiStarFill class="size-2.5" />
      <!-- on narrow cards (two per row on phones) the label would run into the level badge -->
      <span class="hidden @[13rem]:inline">{t("common.staff")}</span>
    </span>
  {/if}

  <div class="flex flex-1 flex-col px-2 pb-1.5">
    <h3 class="truncate text-sm font-bold">
      <a href={`/levels/UnCh-${chart.id}`} class="after:absolute after:inset-0 after:content-['']"
        ><FormattedText text={chart.title} /></a
      >
    </h3>
    <p class="text-muted-foreground truncate text-xs"><FormattedText text={chart.artists} /></p>
    <a
      href={`/creators/${chart.author_handle}`}
      class="text-accent relative z-10 mt-0.5 self-start truncate text-xs font-bold hover:underline"
      >{chart.chart_design}</a
    >

    <Waveform id={chart.id} src={previewProxyUrl(chart)} variant="compact" height={26} lazy class="relative z-10 mt-2" />

    <div class="min-h-2 flex-1"></div>
    <div
      class="border-foreground/10 text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[11px] tabular-nums [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1"
    >
      <span><RiHeart3Fill class="size-3.5 text-rose-400" />{compact(chart.like_count)}</span>
      <span><RiChat3Line class="size-3.5" />{compact(chart.comment_count)}</span>
      <span><RiTimeLine class="size-3.5" />{relativeTime(chart.updated_at)}</span>
    </div>
  </div>
</article>
