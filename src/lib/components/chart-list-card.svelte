<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import type { Chart } from "$lib/data/index.js";
  import { compact, parseDescriptionMeta, coverUrl, previewProxyUrl } from "$lib/data/index.js";
  import CoverArt from "./cover-art.svelte";
  import LevelBadge from "./level-badge.svelte";
  import Waveform from "./waveform.svelte";
  import FormattedText from "./formatted-text.svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { RiHeart3Fill, RiChat3Line, RiStarFill, RiArrowDownSLine } from "$lib/icons.js";

  let { chart }: { chart: Chart } = $props();

  const cover = $derived(coverUrl(chart));
  const meta = $derived(parseDescriptionMeta(chart.description));
  const hasExtra = $derived(chart.tags.length > 0 || !!(meta.bpm || meta.notes || meta.combo));

  let expanded = $state(false);

  function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    expanded = !expanded;
  }
</script>

<article class="group bg-card clip-rounded relative isolate overflow-hidden rounded-2xl">
  {#if cover}
    <img
      src={cover}
      alt=""
      loading="lazy"
      decoding="async"
      class="absolute inset-y-0 left-0 -z-10 w-2/3 opacity-25 blur-2xl saturate-150 [mask-image:linear-gradient(to_right,black,transparent)] h-full object-cover"
    />
  {/if}

  <div class="flex items-stretch gap-3 p-2.5">
    <CoverArt id={chart.id} title={chart.title} src={cover} rounded="rounded-xl" class="size-20 shrink-0" />

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex min-w-0 items-start gap-2">
        <h3 class="min-w-0 flex-1 text-[15px] leading-snug font-bold">
          <a
            href={`/levels/UnCh-${chart.id}`}
            class="line-clamp-2 after:absolute after:inset-0 after:content-['']"
            ><FormattedText text={chart.title} /></a
          >
        </h3>
        {#if chart.staff_pick}
          <span class="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-amber-400 p-1 text-amber-950" title={t("common.staff")}>
            <RiStarFill class="size-2.5" />
          </span>
        {/if}
      </div>

      <div class="flex min-w-0 items-center gap-1.5">
        <LevelBadge level={chart.rating} size="sm" />
        <span class="text-muted-foreground min-w-0 truncate text-xs"><FormattedText text={chart.artists} /></span>
      </div>

      <div class="mt-auto flex items-center justify-between gap-2 pt-0.5">
        <a
          href={`/creators/${chart.author_handle}`}
          class="text-accent relative z-10 min-w-0 truncate text-xs font-bold hover:underline">{chart.chart_design}</a
        >
        <div class="text-muted-foreground flex shrink-0 items-center gap-3 text-xs tabular-nums [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">
          <span><RiHeart3Fill class="size-3.5 text-rose-400" />{compact(chart.like_count)}</span>
          <span><RiChat3Line class="size-3.5" />{compact(chart.comment_count)}</span>
        </div>
      </div>
    </div>

    {#if hasExtra}
      <button
        type="button"
        onclick={toggle}
        aria-label={expanded ? t("common.showLess") : t("common.showMoreDetails")}
        aria-expanded={expanded}
        class="text-muted-foreground hover:text-foreground hover:bg-muted relative z-10 -mr-1 grid w-8 shrink-0 place-items-center rounded-full transition-colors"
      >
        <RiArrowDownSLine class={["size-5 transition-transform duration-200", expanded && "rotate-180"]} />
      </button>
    {/if}
  </div>

  <div class="relative z-10 px-2.5 pb-2.5">
    <Waveform id={chart.id} src={previewProxyUrl(chart)} variant="compact" height={26} lazy />
  </div>

  {#if expanded}
    <div transition:slide={{ duration: 200, easing: cubicOut }} class="relative z-10 px-3 pb-3">
      <div class="border-foreground/10 space-y-3 border-t pt-3">
        {#if meta.bpm || meta.notes || meta.combo}
          <div class="flex flex-wrap gap-1.5 [&>span]:bg-muted [&>span]:text-muted-foreground [&>span]:rounded-full [&>span]:px-2.5 [&>span]:py-0.5 [&>span]:text-[11px] [&>span]:tabular-nums">
            {#if meta.bpm}<span>{t("common.bpm", [meta.bpm])}</span>{/if}
            {#if meta.notes}<span>{t("common.notes", [compact(meta.notes)])}</span>{/if}
            {#if meta.combo}<span>{t("common.combo", [compact(meta.combo)])}</span>{/if}
          </div>
        {/if}

        {#if chart.tags.length}
          <div class="flex flex-wrap gap-1.5">
            {#each chart.tags.slice(0, 5) as tag (tag)}
              <span class="bg-muted/70 text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">#{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</article>
