<script lang="ts">
  import { goBack } from "$lib/navigation.js";
  import { segments, t, i18n } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import LevelBadge from "$lib/components/level-badge.svelte";
  import FormattedText from "$lib/components/formatted-text.svelte";
  import Button from "$lib/components/button.svelte";
  import Seo from "$lib/components/seo.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";
  import { invalidateAll } from "$app/navigation";
  import { untrack } from "svelte";
  import { cn } from "$lib/utils.js";
  import { hoverCard } from "$lib/state/author-card.svelte.js";
  import { ambientFrom, ambientStyle, tintPage, type Ambient } from "$lib/ambient.js";
  import { bannerUrl, coverUrl, profileUrl, type Account, type Chart } from "$lib/data/index.js";
  import AccountBadges from "$lib/components/account-badges.svelte";
  import { SITE_URL, ogChartUrl } from "$lib/config.js";
  import { RiArrowLeftLine, RiCalendarEventLine, RiShareLine, RiCheckLine } from "$lib/icons.js";

  // What everyone but the charter sees while a release is pending: the artwork, the names and a live
  // countdown. No audio, preview or files; those unlock when the API flips the chart to public.
  // Under the timer is a small note lane: one note lands on the judgement line every second.
  // The last minute swaps the digits for one big number of seconds, and the last ten turn urgent.
  // `onskip` is set for viewers who can open the chart itself before the release
  let {
    chart,
    at,
    author,
    onreleased,
    onskip,
  }: { chart: Chart; at: string; author?: Promise<Account | null>; onreleased?: () => void; onskip?: () => void } = $props();

  const releaseTime = $derived(new Date(at).getTime());
  let now = $state(Date.now());
  const left = $derived(Math.max(0, releaseTime - now));
  const tick = $derived(Math.ceil(left / 1000));
  const finalMinute = $derived(left > 0 && tick <= 60);
  const critical = $derived(left > 0 && tick <= 10);
  const parts = $derived([
    { value: Math.floor(left / 86_400_000), label: t("levelDetail.days") },
    { value: Math.floor(left / 3_600_000) % 24, label: t("levelDetail.hours") },
    { value: Math.floor(left / 60_000) % 60, label: t("levelDetail.mins") },
    { value: Math.floor(left / 1000) % 60, label: t("levelDetail.secs") },
  ]);
  const releaseLabel = $derived(
    new Date(at).toLocaleString(i18n.locale, { dateStyle: "full", timeStyle: "short" }),
  );
  // crawlers have no time zone or language, so the preview spells the release out in English UTC
  const metaRelease = $derived(
    new Date(at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }),
  );
  // the visitor's own time zone, shown after the release time
  const releaseZone = $derived(
    new Intl.DateTimeFormat(i18n.locale, { timeZoneName: "short" })
      .formatToParts(new Date(at))
      .find((part) => part.type === "timeZoneName")?.value ?? "",
  );
  const pageUrl = $derived(`${SITE_URL}/levels/UnCh-${chart.id}`);
  const title = $derived(chart.title.replace(/:[a-zA-Z0-9_]+:/g, "").trim());

  // the big final number has to flip right on the second, so it's checked more often near the end
  const fast = $derived(left <= 61_000);
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), fast ? 200 : 1000);
    return () => clearInterval(timer);
  });

  // once the timer runs out, reload until the API has actually published it (that can lag a few seconds)
  $effect(() => {
    if (left > 0) return;
    untrack(() => onreleased?.());
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
  description={`${chart.artists}, Lv.${chart.rating}, charted by ${chart.chart_design}. Out ${metaRelease} UTC`}
  image={ogChartUrl(chart.id)}
  type="article"
/>

<SiteHeader />

<div class={cn(ambient && "ambient")} style={ambientStyle(ambient)}>
  <main class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
    <button
      type="button"
      onclick={goBack}
      class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
      {t("generic.back")}
    </button>

    <AdSlot />

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
            href={`/users/${chart.author_handle}`}
            {@attach hoverCard(chart.author)}
            class="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
          >
            {#each segments(t("levelDetail.chartedBy")) as part, i (i)}{#if part === 1}<span class="text-accent font-semibold"><FormattedText text={chart.chart_design} /></span>{:else if typeof part === "string"}{part}{/if}{/each}
          </a>
        </div>
      </div>

      <div class="px-5 pt-8 pb-7 sm:px-9 sm:pt-10 sm:pb-9">
        <p class="text-muted-foreground mb-2 text-sm">
          {left > 0 ? t("levelDetail.releasesIn") : t("levelDetail.releasingNow")}
        </p>

        {#if finalMinute}
          <div class="flex flex-col items-center gap-3 sm:items-start">
            <div role="timer" aria-live="off" class="h-28 sm:h-44">
              {#key tick}
                <span class={cn("final-number font-heading block text-[7rem] leading-none font-black tabular-nums sm:text-[11rem]", critical && "critical text-rose-500")}>{tick}</span>
              {/key}
            </div>
            <p aria-live="polite" class={cn("final-message text-lg font-semibold sm:text-2xl", critical ? "critical text-amber-500" : "text-muted-foreground")}>
              {critical ? t("countdown.getReady") : t("countdown.almostThere")}
            </p>
          </div>
        {:else}
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
        {/if}

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
            <p class="font-semibold">{t("levelDetail.releasesOn", [releaseZone ? `${releaseLabel} ${releaseZone}` : releaseLabel])}</p>
            <p class="text-muted-foreground text-sm">{t("levelDetail.scheduledNote")}</p>
          </div>
          <div class="flex gap-2">
            <Button type="button" onclick={addToCalendar} class="flex-1 rounded-full sm:flex-none">
              <RiCalendarEventLine class="size-4" />
              {t("levelDetail.addToCalendar")}
            </Button>
            <Button type="button" variant="outline" onclick={share} class="rounded-full">
              {#if copied}<RiCheckLine class="size-4" />{:else}<RiShareLine class="size-4" />{/if}
              {copied ? t("generic.linkCopied") : t("generic.share")}
            </Button>
            {#if onskip}
              <Button type="button" variant="outline" onclick={onskip} class="rounded-full">
                {t("levelDetail.viewChartAnyways")}
              </Button>
            {/if}
          </div>
        </div>
      </div>
    </section>

    {#if author}
      {#await author then account}
        {#if account}
          <a
            href={`/users/${account.sonolus_handle}`}
            class="bg-card hover:border-primary/40 block overflow-hidden rounded-2xl border transition-colors sm:max-w-sm"
          >
            <div class="h-16 bg-cover bg-center" style={`background-image:url(${bannerUrl(account)})`}></div>
            <div class="-mt-6 flex items-end gap-3 px-4 pb-3">
              <CoverArt
                id={account.sonolus_id}
                title={account.sonolus_username}
                src={profileUrl(account)}
                rounded="rounded-full"
                class="ring-card size-12 shrink-0 ring-4"
              />
              <div class="min-w-0">
                <p class="text-muted-foreground text-xs">{t("generic.charter")}</p>
                <p class="flex min-w-0 items-center gap-1.5 font-semibold">
                  <span class="truncate"><FormattedText text={account.sonolus_username} /></span>
                  <AccountBadges badges={account.badges} class="size-4" />
                </p>
                <p class="text-muted-foreground text-xs tabular-nums">#{account.sonolus_handle}</p>
              </div>
            </div>
          </a>
        {/if}
      {/await}
    {/if}
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
  .final-number {
    text-shadow: 0 0 60px color-mix(in oklab, var(--primary) 60%, transparent);
    animation: number-in 1s ease-out;
  }
  .final-number.critical {
    text-shadow: 0 0 80px color-mix(in oklab, currentColor 80%, transparent);
    animation: critical-pulse 0.5s ease-in-out 2;
  }
  .final-message.critical {
    animation: message-glow 0.5s ease-in-out infinite alternate;
  }
  @keyframes number-in {
    from {
      transform: scale(1.12);
      opacity: 0.4;
    }
    40% {
      opacity: 1;
    }
    to {
      transform: scale(1);
    }
  }
  @keyframes critical-pulse {
    50% {
      transform: scale(1.15);
    }
  }
  @keyframes message-glow {
    from {
      text-shadow: 0 0 10px color-mix(in oklab, currentColor 50%, transparent);
    }
    to {
      text-shadow: 0 0 30px color-mix(in oklab, currentColor 80%, transparent);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .note,
    .hit,
    .judge-live,
    .final-number,
    .final-number.critical,
    .final-message.critical {
      animation: none;
    }
    .note {
      display: none;
    }
  }
</style>
