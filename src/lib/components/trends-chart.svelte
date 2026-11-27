<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { onMount } from "svelte";

  let {
    likes,
    comments,
    compact = false,
    class: className = "",
  }: { likes: number[]; comments: number[]; compact?: boolean; class?: string } = $props();

  const W = 700;
  const H = 220;
  const TOP = 16;
  const BOTTOM = 196;

  function points(values: number[]) {
    const n = Math.max(values.length - 1, 1);
    return values.map((v, i) => ({
      x: (i / n) * W,
      y: BOTTOM - (Math.max(0, Math.min(100, v)) / 100) * (BOTTOM - TOP),
    }));
  }

  function smooth(values: number[]) {
    const pts = points(values);
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  const likesLine = $derived(smooth(likes));
  const likesArea = $derived(`${likesLine} L ${W} ${BOTTOM} L 0 ${BOTTOM} Z`);
  const commentsLine = $derived(smooth(comments));
  const commentsArea = $derived(`${commentsLine} L ${W} ${BOTTOM} L 0 ${BOTTOM} Z`);

  let mounted = $state(false);
  onMount(() => (mounted = true));
</script>

<figure class={compact ? `space-y-1 ${className}` : `space-y-3 ${className}`}>
  <div class={compact ? "flex items-center gap-3 text-[11px]" : "text-muted-foreground flex items-center gap-4 text-xs"}>
    <span class="inline-flex items-center gap-1.5">
      <span class="size-2 rounded-full bg-teal-400"></span> {t("levelDetail.likes")}
    </span>
    <span class="inline-flex items-center gap-1.5">
      <span class="size-2 rounded-full bg-sky-500"></span> {t("levelDetail.comments")}
    </span>
    {#if compact}
      <span class="ml-auto">{t("levelDetail.activity")}</span>
    {:else}
      <span class="ml-auto">{t("levelDetail.activityLong")}</span>
    {/if}
  </div>

  <div class="trends" class:is-mounted={mounted}>
    <svg
      viewBox="0 0 {W} {H}"
      preserveAspectRatio="none"
      class={compact ? "h-12 w-full" : "h-40 w-full sm:h-44"}
      role="img"
      aria-label={t("levelDetail.activityAria")}
    >
      {#each compact ? [] : [0, 50, 100] as g (g)}
        <line
          x1="0"
          x2={W}
          y1={BOTTOM - (g / 100) * (BOTTOM - TOP)}
          y2={BOTTOM - (g / 100) * (BOTTOM - TOP)}
          class="stroke-border/60"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
      {/each}

      <path d={commentsArea} class="fill-sky-500/10" />
      <path d={likesArea} class="fill-teal-400/15" />

      <path
        d={commentsLine}
        class="trend-line fill-none stroke-sky-500"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <path
        d={likesLine}
        class="trend-line fill-none stroke-teal-400"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </div>
</figure>

<style>
  .trend-line {
    stroke-dasharray: 1200;
    stroke-dashoffset: 1200;
  }
  .trends.is-mounted .trend-line {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .trends :global(path[class*="fill-"]) {
    opacity: 0;
    transition: opacity 600ms ease-out 300ms;
  }
  .trends.is-mounted :global(path[class*="fill-"]) {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .trend-line,
    .trends.is-mounted .trend-line {
      stroke-dasharray: none;
      stroke-dashoffset: 0;
      transition: none;
    }
    .trends :global(path[class*="fill-"]),
    .trends.is-mounted :global(path[class*="fill-"]) {
      opacity: 1;
      transition: none;
    }
  }
</style>
