<script lang="ts">
  import { goBack } from "$lib/navigation.js";
  import { t, i18n } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import LevelBadge from "$lib/components/level-badge.svelte";
  import TrendsChart from "$lib/components/trends-chart.svelte";
  import LeaderboardTable from "$lib/components/leaderboard-table.svelte";
  import CommentThread from "$lib/components/comment-thread.svelte";
  import CommentComposer from "$lib/components/comment-composer.svelte";
  import Pager from "$lib/components/pager.svelte";
  import ChartPreview from "$lib/components/chart-preview.svelte";
  import Waveform from "$lib/components/waveform.svelte";
  import ChartSection from "$lib/components/chart-section.svelte";
  import ChartSkeleton from "$lib/components/chart-skeleton.svelte";
  import StaffChartPanel from "$lib/components/staff-chart-panel.svelte";
  import FormattedText from "$lib/components/formatted-text.svelte";
  import ClampedText from "$lib/components/clamped-text.svelte";
  import Seo from "$lib/components/seo.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";
  import { levelEmbed } from "$lib/discord-embed.js";
  import { levelStatusId, levelFooter } from "$lib/activity-id.js";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import { recallPage, rememberPage, recallValue, rememberValue } from "$lib/state/page-memory.js";
  import { cn } from "$lib/utils.js";
  import { ambientFrom, ambientStyle, tintPage, type Ambient } from "$lib/ambient.js";
  import {
    fetchLeaderboard,
    fetchComments,
    compact,
    relativeTime,
    chartDate,
    fullDate,
    parseDescriptionMeta,
    LEADERBOARD_TYPES,
    leaderboardMeta,
    coverUrl,
    backgroundUrl,
    bgmProxyUrl,
    chartFileProxyUrl,
    profileUrl,
    DEFAULT_AVATAR,
    type LeaderboardType,
    type ScoreEntry,
    type Comment,
  } from "$lib/data/index.js";
  import {
    RiArrowLeftLine,
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiHeart3Fill,
    RiChat3Line,
    RiStarFill,
    RiTrophyLine,
    RiShareLine,
    RiEditLine,
    RiTimeLine,
  } from "$lib/icons.js";
  import { session, storedSessionKey } from "$lib/state/session.svelte";
  import { hoverCard } from "$lib/state/author-card.svelte.js";
  import { sonolusOpenUrl, SITE_URL, ogChartUrl } from "$lib/config.js";
  import type { PageData } from "./$types";

  // the full level page; +page.svelte swaps in the countdown while a scheduled release is pending
  let { data }: { data: PageData } = $props();
  const chart = $derived(data.chart);
  const songBpm = $derived(parseDescriptionMeta(chart.description).bpm);
  const charterName = $derived(chart.chart_design.replace(/:[a-zA-Z0-9_]+:/g, "").trim());

  // tint the page with the cover's main colour
  let ambient = $state<Ambient | null>(null);
  $effect(() => {
    let alive = true;
    ambient = null;
    ambientFrom(coverUrl(chart)).then((a) => {
      if (alive) ambient = a;
    });
    return () => {
      alive = false;
    };
  });
  $effect(() => tintPage(ambient));
  const isOwner = $derived(session.isLoggedIn && session.user?.handle === chart.author_handle);
  const isStaff = $derived(session.user?.role === "Admin" || session.user?.role === "Mod");

  const sonolusLink = $derived(sonolusOpenUrl(`levels/UnCh-${chart.id}`));
  let copied = $state(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: chart.title, url });
      } catch {
        void 0;
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      void 0;
    }
  }

  const PERPAGE = 10;
  const openVia = $derived(t("levelDetail.openViaSonolus").split("{1}").map((s) => s.trim()));


  let lbScroller = $state<HTMLDivElement | null>(null);
  let canLeft = $state(false);
  let canRight = $state(false);

  function updateArrows() {
    const el = lbScroller;
    if (!el) return;
    canLeft = el.scrollLeft > 4;
    canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
  }
  function scrollTypes(dir: number) {
    lbScroller?.scrollBy({ left: dir * 180, behavior: "smooth" });
  }

  $effect(() => {
    if (lbScroller) updateArrows();
  });

  const DEFAULT_LB: LeaderboardType = "arcade_score_speed";
  let lbType = $state<LeaderboardType>(DEFAULT_LB);
  let lbPage = $state(1);
  let cPage = $state(1);
  let lb = $state<{ data: ScoreEntry[]; pageCount: number }>({ data: [], pageCount: 1 });
  let lbLoading = $state(true);

  $effect.pre(() => {
    const id = chart.id;
    untrack(() => {
      lbType = recallValue(`level:${id}:lbType`, LEADERBOARD_TYPES, DEFAULT_LB);
      lbPage = recallPage(`level:${id}:lb`);
      cPage = recallPage(`level:${id}:comments`);
    });
  });
  $effect(() => {
    rememberValue(`level:${chart.id}:lbType`, lbType, DEFAULT_LB);
    rememberPage(`level:${chart.id}:lb`, lbPage);
    rememberPage(`level:${chart.id}:comments`, cPage);
  });

  function selectType(type: LeaderboardType) {
    if (type === lbType) return;
    lbType = type;
    lbPage = 1;
  }

  let lbToken = 0;
  $effect(() => {
    const type = lbType;
    const p = lbPage;
    const id = chart.id;
    const mine = ++lbToken;
    lbLoading = true;
    fetchLeaderboard(fetch, id, type, p - 1, PERPAGE, storedSessionKey()).then((r) => {
      if (mine !== lbToken) return;
      lb = r;
      lbLoading = false;
    });
  });

  let cm = $state<{ data: Comment[]; pageCount: number }>({ data: [], pageCount: 1 });
  let cmLoading = $state(true);
  let cmToken = 0;
  $effect(() => {
    const p = cPage;
    const id = chart.id;
    const mine = ++cmToken;
    cmLoading = true;
    fetchComments(fetch, id, p - 1, storedSessionKey()).then((r) => {
      if (mine !== cmToken) return;
      cm = r;
      cmLoading = false;
    });
  });

  let commentCount = $derived(chart.comment_count);

  // newest first, so a new comment goes on top of the first page
  function commentPosted(comment: Comment) {
    commentCount += 1;
    if (cPage === 1) cm.data = [comment, ...cm.data];
    else cPage = 1;
  }

  function commentDeleted() {
    commentCount = Math.max(0, commentCount - 1);
    if (!cm.data.length && cPage > 1) cPage -= 1;
  }
</script>

<Seo
  title={chart.title}
  description={`${chart.artists} · Lv.${chart.rating} · charted by ${chart.chart_design}`}
  image={ogChartUrl(chart.id)}
  discord={levelEmbed(chart, SITE_URL)}
  oembed={`/oembed?author=${encodeURIComponent(chart.chart_design.replace(/:([a-zA-Z0-9_]+):/g, "").trim())}&handle=${chart.author_handle}&title=${encodeURIComponent(chart.title.replace(/:([a-zA-Z0-9_]+):/g, "").trim())}&page=${encodeURIComponent(`/levels/UnCh-${chart.id}`)}&footer=${encodeURIComponent(levelFooter(chart.rating, chart.like_count, chart.comment_count))}`}
  activity={levelStatusId(chart.id) ? `/users/${chart.author_handle}/statuses/${levelStatusId(chart.id)}` : null}
  type="article"
/>

<SiteHeader />

<div class={cn(ambient && "ambient")} style={ambientStyle(ambient)}>
<main class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  <button
    type="button"
    onclick={goBack}
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
    {t("generic.back")}
  </button>

  {#if data.scheduled && data.hasAccess}
    <p class="border-primary/30 bg-primary/10 text-primary flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
      <RiTimeLine class="size-4 shrink-0" />
      {chart.status === "UNLISTED" ? t("levelDetail.scheduledUnlistedNotice") : t("levelDetail.scheduledPrivateNotice")}
    </p>
  {/if}

  <AdSlot />

  <section class="bg-card overflow-hidden rounded-3xl border">
    <div class="relative h-32 sm:h-48">
      {#if backgroundUrl(chart)}
        <div
          class="absolute inset-0 bg-cover bg-center"
          style={`background-image:url(${backgroundUrl(chart)})`}
        ></div>
      {:else}
        <div class="from-primary/30 to-card absolute inset-0 bg-linear-to-br"></div>
      {/if}
      <div class="from-card via-card/40 absolute inset-0 bg-linear-to-t to-transparent"></div>
      <TrendsChart
        likes={data.trends.likes}
        comments={data.trends.comments}
        compact
        class="absolute top-5 right-6 hidden w-56 rounded-xl bg-black/30 px-3 pt-2 pb-1 text-white/90 backdrop-blur-sm md:block"
      />
    </div>

    <div class="relative -mt-14 px-4 pb-5 sm:-mt-20 sm:px-7 sm:pb-7">
      <div class="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
        <CoverArt
          id={chart.id}
          title={chart.title}
          src={coverUrl(chart)}
          rounded="rounded-2xl"
          class="ring-card size-28 shrink-0 shadow-lg ring-4 sm:size-40"
        />

        <div class="w-full min-w-0 flex-1 space-y-2">
          <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <LevelBadge level={chart.rating} />
            {#if chart.staff_pick}
              <span
                class="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300"
              >
                <RiStarFill class="block size-3" /> {t("generic.staffPick")}
              </span>
            {/if}
            {#if chart.status !== "PUBLIC"}
              <span class="text-muted-foreground rounded-md border px-2 py-0.5 text-xs font-medium capitalize">
                {chart.status.toLowerCase()}
              </span>
            {/if}
          </div>
          <h1 class="font-heading text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">
            <FormattedText text={chart.title} />
          </h1>
          <p class="text-muted-foreground text-sm sm:text-base"><FormattedText text={chart.artists} /></p>
          <a
            href={`/users/${chart.author_handle}`}
            {@attach hoverCard(chart.author)}
            class="bg-muted/60 hover:bg-muted flex w-full items-center justify-center gap-2 rounded-full border py-1 pr-3.5 pl-1 transition-colors sm:inline-flex sm:w-auto sm:max-w-full sm:justify-start sm:py-0.5 sm:pl-0.5"
          >
            {#await data.author}
              <span class="bg-muted size-7 shrink-0 animate-pulse rounded-full"></span>
            {:then author}
              <img
                src={author ? profileUrl(author) : DEFAULT_AVATAR}
                alt=""
                class="size-7 shrink-0 rounded-full object-cover"
              />
            {/await}
            <span class="text-muted-foreground shrink-0 text-xs">{t("levelDetail.chartedByLabel")}</span>
            <span class="truncate text-sm font-semibold"><FormattedText text={chart.chart_design} /></span>
          </a>
        </div>

        <div class="flex w-full gap-2 sm:w-auto sm:shrink-0">
          <a
            href={sonolusLink}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white! shadow-sm transition-opacity hover:opacity-90 sm:flex-none"
            style="background-color: #000020"
          >
            {#if openVia[0]}<span>{openVia[0]}</span>{/if}
            <img src="https://sonolus.com/logo.png" alt="Sonolus" width="1775" height="360" class="h-4 w-auto" />
            {#if openVia[1]}<span>{openVia[1]}</span>{/if}
          </a>
          <button
            type="button"
            onclick={share}
            class="hover:bg-muted inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
          >
            <RiShareLine class="block size-4" />
            <span>{copied ? t("generic.linkCopied") : t("generic.share")}</span>
          </button>
          {#if isOwner}
            <a
              href={`/dashboard/edit/UnCh-${chart.id}`}
              aria-label={t("generic.editChart")}
              class="hover:bg-muted inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
            >
              <RiEditLine class="block size-4" />
              <span class="hidden sm:inline">{t("generic.edit")}</span>
            </a>
          {/if}
        </div>
      </div>

      <div class="mt-5 grid gap-3">
        <div class="bg-muted/40 flex items-center gap-3 rounded-2xl border px-3 py-2">
          <Waveform id={chart.id} src={bgmProxyUrl(chart)} variant="compact" height={36} class="min-w-0 flex-1" />
          {#if songBpm}
            <span class="text-muted-foreground shrink-0 text-xs font-semibold tabular-nums">{t("generic.bpm", [songBpm])}</span>
          {/if}
        </div>

        <dl class="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4">
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("levelDetail.levelLabel")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{chart.rating}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{chart.like_count === 1 ? t("levelDetail.like") : t("generic.likes")}</dt>
            <dd class="font-heading inline-flex items-center gap-1.5 text-lg font-bold tabular-nums">
              <RiHeart3Fill class="block size-4 text-rose-400" />{compact(chart.like_count)}
            </dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{chart.comment_count === 1 ? t("levelDetail.comment") : t("generic.comments")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{compact(chart.comment_count)}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{chart.status === "PUBLIC" ? t("levelDetail.published") : t("levelDetail.uploaded")}</dt>
            <dd class="font-heading text-base leading-snug font-bold sm:text-lg" title={fullDate(chartDate(chart))}>
              {relativeTime(chartDate(chart))}
            </dd>
          </div>
        </dl>
      </div>

      <TrendsChart
        likes={data.trends.likes}
        comments={data.trends.comments}
        compact
        class="text-muted-foreground mt-4 md:hidden"
      />
    </div>
  </section>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    {#if chartFileProxyUrl(chart)}
      <div class="min-w-0">
        {#key chart.id}
          <ChartPreview
            chartUrl={chartFileProxyUrl(chart)!}
            audioUrl={bgmProxyUrl(chart) ?? ""}
            bgUrl={backgroundUrl(chart)}
          />
        {/key}
      </div>
    {/if}

      <section class="bg-card relative rounded-3xl border p-5 lg:min-h-0">
        <div class={cn("space-y-4", chartFileProxyUrl(chart) && "lg:absolute lg:inset-5 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]")}>
          <h2 class="text-base font-semibold tracking-tight">{t("generic.description")}</h2>
          {#if chart.description}
            {#key chart.id}
              <ClampedText lines={15} class="text-foreground/85 text-sm leading-relaxed wrap-break-word whitespace-pre-line">
                <FormattedText text={chart.description} linkify />
              </ClampedText>
            {/key}
          {:else}
            <p class="text-muted-foreground text-sm">{t("levelDetail.noDescription")}</p>
          {/if}
          {#if chart.tags.length}
            <div class="flex flex-wrap gap-1.5">
              {#each chart.tags as tag (tag)}
                <span class="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">#{tag}</span>
              {/each}
            </div>
          {/if}
        </div>
      </section>
  </div>

  {#if isStaff}<StaffChartPanel {chart} />{/if}

    <section class="bg-card space-y-4 rounded-3xl border p-4 sm:p-6">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 class="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
          <RiTrophyLine class="block size-5 text-amber-500" /> {t("levelDetail.leaderboard")}
        </h2>
      </div>

      <div class="relative flex items-center gap-1">
        <button
          type="button"
          onclick={() => scrollTypes(-1)}
          aria-label={t("generic.scrollLeft")}
          disabled={!canLeft}
          class="text-muted-foreground hover:text-foreground grid size-7 shrink-0 place-items-center rounded-full border transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <RiArrowLeftSLine class="block size-4" />
        </button>
        <div
          bind:this={lbScroller}
          onscroll={updateArrows}
          class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {#each LEADERBOARD_TYPES as t (t)}
            <button
              type="button"
              onclick={() => selectType(t)}
              aria-pressed={lbType === t}
              class={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                lbType === t
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
              )}
            >
              {leaderboardMeta[t].short}
            </button>
          {/each}
        </div>
        <button
          type="button"
          onclick={() => scrollTypes(1)}
          aria-label={t("generic.scrollRight")}
          disabled={!canRight}
          class="text-muted-foreground hover:text-foreground grid size-7 shrink-0 place-items-center rounded-full border transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <RiArrowRightSLine class="block size-4" />
        </button>
      </div>

      {#if lbLoading}
        <div class="space-y-1.5">
          {#each Array(5) as _, i (i)}
            <div class="bg-muted/40 flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div class="bg-muted size-8 shrink-0 animate-pulse rounded-full"></div>
              <div class="bg-muted h-3.5 flex-1 animate-pulse rounded"></div>
              <div class="bg-muted h-3.5 w-16 shrink-0 animate-pulse rounded"></div>
            </div>
          {/each}
        </div>
      {:else if lb.data.length === 0}
        <div class="bg-muted/30 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-8 text-center">
          <img src="/miku-sitting.png" alt="" aria-hidden="true" class="mb-2 block w-24" />
          <p class="text-sm font-medium">{t("levelDetail.noScores")}</p>
          <p class="text-muted-foreground text-xs">{t("levelDetail.firstScore")}</p>
        </div>
      {:else}
        <LeaderboardTable entries={lb.data} type={lbType} startRank={(lbPage - 1) * PERPAGE + 1} bg={backgroundUrl(chart)} />
        <Pager count={lb.pageCount * PERPAGE} perPage={PERPAGE} bind:page={lbPage} />
      {/if}
    </section>

    <AdSlot />

    <section class="bg-card space-y-4 rounded-3xl border p-4 sm:p-6">
      <h2 class="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
        <RiChat3Line class="text-primary block size-5" />
        {commentCount === 1 ? t("levelDetail.comment") : t("generic.comments")}
        <span class="text-muted-foreground font-normal tabular-nums">{commentCount}</span>
      </h2>

      <CommentComposer chartId={chart.id} onposted={commentPosted} />

      {#if cmLoading}
        <div class="space-y-5">
          {#each Array(3) as _, i (i)}
            <div class="flex gap-3">
              <div class="bg-muted size-9 shrink-0 animate-pulse rounded-full"></div>
              <div class="flex-1 space-y-2 py-1">
                <div class="bg-muted h-3 w-32 animate-pulse rounded"></div>
                <div class="bg-muted h-3 w-full animate-pulse rounded"></div>
                <div class="bg-muted h-3 w-2/3 animate-pulse rounded"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if cm.data.length === 0}
        <div class="bg-muted/30 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-8 text-center">
          <img src="/miku-sitting.png" alt="" aria-hidden="true" class="mb-2 block w-24" />
          <p class="text-sm font-medium">{t("levelDetail.noComments")}</p>
          <p class="text-muted-foreground text-xs">{t("levelDetail.beFirstToComment")}</p>
        </div>
      {:else}
        <CommentThread bind:comments={cm.data} chartId={chart.id} charterHandle={chart.author_handle} ondeleted={commentDeleted} />
        <Pager count={cm.pageCount * PERPAGE} perPage={PERPAGE} bind:page={cPage} />
      {/if}
    </section>


  {#await data.moreFromCharter}
    <section class="space-y-5">
      <h2 class="text-lg font-semibold tracking-tight">{t("levelDetail.moreFrom", [charterName])}</h2>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {#each Array(4) as _, i (i)}
          <div class={i >= 3 ? "hidden lg:block" : i >= 2 ? "hidden sm:block" : ""}>
            <ChartSkeleton />
          </div>
        {/each}
      </div>
    </section>
  {:then moreFromCharter}
    {#if moreFromCharter.length}
      <ChartSection
        title={t("levelDetail.moreFrom", [charterName])}
        charts={moreFromCharter}
        href={`/users/${chart.author_handle}`}
        hrefLabel={t("generic.viewProfile")}
        carousel
      />
    {/if}
  {/await}
</main>
</div>

<SiteFooter />
