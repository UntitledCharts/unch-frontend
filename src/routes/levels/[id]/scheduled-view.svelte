<script lang="ts">
  import { t, i18n } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import LevelBadge from "$lib/components/level-badge.svelte";
  import FormattedText from "$lib/components/formatted-text.svelte";
  import Button from "$lib/components/button.svelte";
  import Seo from "$lib/components/seo.svelte";
  import { invalidateAll } from "$app/navigation";
  import { cn } from "$lib/utils.js";
  import { ambientFrom, ambientStyle, tintPage, type Ambient } from "$lib/ambient.js";
  import { coverUrl, type Chart } from "$lib/data/index.js";
  import { SITE_URL } from "$lib/config.js";
  import { RiArrowLeftLine, RiCalendarEventLine, RiShareLine, RiCheckLine } from "$lib/icons.js";

  // What everyone but the charter sees while a release is pending: the artwork, the names and a live
  // countdown. No audio, preview or files; those unlock when the API flips the chart to public.
  // Under the timer is a small note lane: one note lands on the judgement line every second.
  let { chart, at }: { chart: Chart; at: string } = $props();

  const releaseTime = $derived(new Date(at).getTime());
  let now = $state(Date.now());
  const left = $derived(Math.max(0, releaseTime - now));
  const tick = $derived(Math.ceil(left / 1000));
  const parts = $derived([
    { value: Math.floor(left / 86_400_000), label: t("levelDetail.days") },
    { value: Math.floor(left / 3_600_000) % 24, label: t("levelDetail.hours") },
    { value: Math.floor(left / 60_000) % 60, label: t("levelDetail.mins") },
    { value: Math.floor(left / 1000) % 60, label: t("levelDetail.secs") },
  ]);
  const releaseLabel = $derived(
    new Date(at).toLocaleString(i18n.locale, { dateStyle: "full", timeStyle: "short" }),
  );
  const pageUrl = $derived(`${SITE_URL}/levels/UnCh-${chart.id}`);
  const title = $derived(chart.title.replace(/:[a-zA-Z0-9_]+:/g, "").trim());

  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });

  // once the timer runs out, reload until the API has actually published it (that can lag a few seconds)
  $effect(() => {
    if (left > 0) return;
    const retry = setInterval(() => invalidateAll(), 5000);
    invalidateAll();
    return () => clearInterval(retry);
  });

  let ambient = $state<Ambient | null>(null);
  $effect(() => {
    let alive = true;
    ambientFrom(coverUrl(chart)).then((a) => {
      if (alive) ambient = a;
    });
    return () => {
      alive = false;
    };
  });
  $effect(() => tintPage(ambient));

  // a one-event .ics so people can get reminded without an account
  function addToCalendar() {
    const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UntitledCharts//Release//EN",
      "BEGIN:VEVENT",
      `UID:release-${chart.id}@untitledcharts`,
      `DTSTAMP:${stamp(Date.now())}`,
      `DTSTART:${stamp(releaseTime)}`,
      `DTEND:${stamp(releaseTime + 30 * 60_000)}`,
      `SUMMARY:${title} releases on UntitledCharts`,
      `URL:${pageUrl}`,
      `DESCRIPTION:${pageUrl}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = `${title || "release"}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  let copied = $state(false);
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: pageUrl });
      } catch {
        void 0;
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(pageUrl);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      void 0;
    }
  }
</script>

<Seo
  title={chart.title}
  description={`${chart.artists}, Lv.${chart.rating}, charted by ${chart.chart_design}. ${t("levelDetail.releasesOn", [releaseLabel])}`}
  image={`/og/level/UnCh-${chart.id}`}
  type="article"
/>

<SiteHeader />

<div class={cn(ambient && "ambient")} style={ambientStyle(ambient)}>
  <main class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
    <a
      href="/browse"
      class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
      {t("nav.browse")}
    </a>

    <section class="bg-card clip-rounded relative isolate overflow-hidden rounded-3xl border">
      <!-- the cover, blown up and blurred, is the stage everything sits on -->
      <div class="pointer-events-none absolute inset-0 -z-10">
        <img src={coverUrl(chart)} alt="" class="size-full scale-125 object-cover opacity-45 blur-2xl" />
        <div class="from-card/40 via-card/80 to-card absolute inset-0 bg-linear-to-b"></div>
      </div>

      <div class="flex flex-col items-center gap-5 px-5 pt-8 text-center sm:flex-row sm:items-end sm:gap-7 sm:px-9 sm:pt-10 sm:text-left">
        <CoverArt
          id={chart.id}
          title={chart.title}
          src={coverUrl(chart)}
          rounded="rounded-2xl"
          class="ring-card/60 size-36 shrink-0 shadow-xl ring-4 sm:size-48"
        />
        <div class="min-w-0 space-y-2">
          <LevelBadge level={chart.rating} />
          <h1 class="font-heading text-3xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
            <FormattedText text={chart.title} />
          </h1>
          <p class="text-muted-foreground sm:text-lg"><FormattedText text={chart.artists} /></p>
          <a
            href={`/creators/${chart.author_handle}`}
            class="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
          >
            {t("levelDetail.chartedBy", [""])}<span class="text-accent font-semibold"><FormattedText text={chart.chart_design} /></span>
          </a>
        </div>
      </div>

      <div class="px-5 pt-8 pb-7 sm:px-9 sm:pt-10 sm:pb-9">
        <p class="text-muted-foreground mb-2 text-sm">
          {left > 0 ? t("levelDetail.releasesIn") : t("levelDetail.releasingNow")}
        </p>

        <div class="flex items-end justify-between gap-2 sm:justify-start sm:gap-8" role="timer" aria-live="off">
          {#each parts as part (part.label)}
            <div class="min-w-0">
              <div class="font-heading text-[2.6rem] leading-none font-bold tabular-nums sm:text-7xl">
                {String(part.value).padStart(2, "0")}
              </div>
              <div class="text-muted-foreground mt-1.5 text-xs sm:text-sm">{part.label}</div>
            </div>
          {/each}
        </div>

        <!-- note lane: four columns tilted back, a note per second dropping onto the judgement line -->
        <div class="lane-wrap mt-6" aria-hidden="true">
          <div class="lane">
            {#each [0, 1, 2, 3] as col (col)}<span class="col" style={`left:${col * 25}%`}></span>{/each}
            {#if left > 0}
              {#key tick}
                <span class="note" style={`left:${(tick % 4) * 25}%`}></span>
                <span class="hit" style={`left:${(tick % 4) * 25}%`}></span>
              {/key}
            {/if}
            <span class={cn("judge", left === 0 && "judge-live")}></span>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-md space-y-1">
            <p class="font-semibold">{t("levelDetail.releasesOn", [releaseLabel])}</p>
            <p class="text-muted-foreground text-sm">{t("levelDetail.scheduledNote")}</p>
          </div>
          <div class="flex gap-2">
            <Button type="button" onclick={addToCalendar} class="flex-1 rounded-full sm:flex-none">
              <RiCalendarEventLine class="size-4" />
              {t("levelDetail.addToCalendar")}
            </Button>
            <Button type="button" variant="outline" onclick={share} class="rounded-full">
              {#if copied}<RiCheckLine class="size-4" />{:else}<RiShareLine class="size-4" />{/if}
              {copied ? t("levelDetail.linkCopied") : t("levelDetail.share")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>

<SiteFooter />

<style>
  .lane-wrap {
    perspective: 420px;
    perspective-origin: 50% 0%;
  }
  .lane {
    position: relative;
    height: 7.5rem;
    margin-inline: auto;
    max-width: 34rem;
    overflow: hidden;
    border-radius: 1rem 1rem 0.5rem 0.5rem;
    background: linear-gradient(to bottom, transparent, color-mix(in oklab, var(--primary) 14%, transparent));
    transform: rotateX(38deg);
    transform-origin: 50% 100%;
  }
  /* sits under the digits, which are left-aligned from sm up */
  @media (min-width: 640px) {
    .lane-wrap {
      max-width: 27rem;
    }
    .lane {
      margin-inline: 0;
    }
  }
  .col {
    position: absolute;
    inset-block: 0;
    width: 25%;
    border-left: 1px solid color-mix(in oklab, var(--foreground) 10%, transparent);
  }
  .col:first-child {
    border-left: 0;
  }
  .judge {
    position: absolute;
    inset-inline: 0;
    bottom: 1.1rem;
    height: 3px;
    border-radius: 9999px;
    background: var(--accent);
    box-shadow: 0 0 12px var(--accent);
  }
  .judge-live {
    animation: judge-pulse 1s ease-in-out infinite;
  }
  .note {
    position: absolute;
    top: 0;
    width: 25%;
    height: 0.9rem;
    padding-inline: 10%;
    background: var(--primary);
    background-clip: content-box;
    border-radius: 9999px;
    /* lands on the judgement line (bottom 1.1rem, note centred on it) at 85% of the second */
    animation: note-fall 1s linear forwards;
  }
  .hit {
    position: absolute;
    bottom: 0.4rem;
    width: 25%;
    height: 1.8rem;
    background: radial-gradient(closest-side, color-mix(in oklab, var(--accent) 70%, transparent), transparent);
    opacity: 0;
    animation: hit-flash 1s ease-out forwards;
  }
  @keyframes note-fall {
    from {
      transform: translateY(-1rem);
    }
    85% {
      transform: translateY(5.95rem);
      opacity: 1;
    }
    to {
      transform: translateY(5.95rem);
      opacity: 0;
    }
  }
  @keyframes hit-flash {
    0%,
    84% {
      opacity: 0;
      transform: scale(0.6);
    }
    88% {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(1.3);
    }
  }
  @keyframes judge-pulse {
    50% {
      box-shadow: 0 0 28px var(--accent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .note,
    .hit,
    .judge-live {
      animation: none;
    }
    .note {
      display: none;
    }
  }
</style>
