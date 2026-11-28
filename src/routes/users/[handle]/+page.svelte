<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import AccountMenu from "$lib/components/account-menu.svelte";
  import { session } from "$lib/state/session.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import ChartCard from "$lib/components/chart-card.svelte";
  import ChartSkeleton from "$lib/components/chart-skeleton.svelte";
  import FormattedText from "$lib/components/formatted-text.svelte";
  import AccountBadges from "$lib/components/account-badges.svelte";
  import Seo from "$lib/components/seo.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";
  import { userEmbed } from "$lib/discord-embed.js";
  import { SITE_URL, ogAccountUrl } from "$lib/config.js";
  import { userStatusId, userFooter } from "$lib/activity-id.js";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import Pager from "$lib/components/pager.svelte";
  import { recallPage, rememberPage, recallValue, rememberValue } from "$lib/state/page-memory.js";
  import { cn } from "$lib/utils.js";
  import { ambientFrom, ambientStyle, tintPage, type Ambient } from "$lib/ambient.js";
  import {
    fetchCharts,
    compact,
    profileUrl,
    bannerUrl,
    type Chart,
  } from "$lib/data/index.js";
  import { RiArrowLeftLine, RiHeart3Fill, RiShareLine, RiEditLine } from "$lib/icons.js";

  let { data } = $props();
  const account = $derived(data.account);
  const isMe = $derived(session.user?.sonolus_id === account.sonolus_id);

  // tint the page with the banner's main colour
  let ambient = $state<Ambient | null>(null);
  $effect(() => {
    let alive = true;
    ambient = null;
    ambientFrom(account.banner ? bannerUrl(account) : null).then((a) => {
      if (alive) ambient = a;
    });
    return () => {
      alive = false;
    };
  });
  $effect(() => tintPage(ambient));

  type SortKey = "new" | "liked" | "level";
  const SORTS: { key: SortKey; label: string }[] = [
    { key: "new", label: "generic.newest" },
    { key: "liked", label: "userProfile.sortMostLiked" },
    { key: "level", label: "userProfile.sortHighestLevel" },
  ];
  let sort = $state<SortKey>("new");
  const PER_PAGE = 12;
  let chartPage = $state(1);

  $effect.pre(() => {
    const handle = account.sonolus_handle;
    untrack(() => {
      sort = recallValue(`user:${handle}:sort`, ["new", "liked", "level"] as const, "new");
      chartPage = recallPage(`user:${handle}:charts`);
    });
  });
  $effect(() => {
    rememberValue(`user:${account.sonolus_handle}:sort`, sort, "new");
    rememberPage(`user:${account.sonolus_handle}:charts`, chartPage);
  });

  // sorting happens on the API so every sort covers all of the charter's charts, not just one page
  const SORT_BY: Record<SortKey, string> = { new: "published_at", liked: "likes", level: "rating" };
  let charts = $state<Chart[]>([]);
  let pageCount = $state(1);
  let chartsLoading = $state(true);
  let chartsRequest = 0;

  $effect(() => {
    const handle = account.sonolus_handle;
    const sortBy = SORT_BY[sort];
    const pageIndex = chartPage - 1;
    const mine = ++chartsRequest;
    chartsLoading = true;
    const request =
      sort === "new" && pageIndex === 0
        ? data.firstPage
        : fetchCharts(fetch, {
            owner_handle: handle,
            sort_by: sortBy,
            sort_order: "desc",
            page: pageIndex,
          });
    request.then((result) => {
      if (mine !== chartsRequest) return;
      charts = result.data;
      pageCount = result.pageCount;
      chartsLoading = false;
    });
  });


  // five stats fill the 2 and 3 column rows when the last one takes the leftover width
  const lastStat = "col-span-2 lg:col-span-1";

  let copied = $state(false);
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: account.sonolus_username, url });
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
</script>

<Seo
  title={account.sonolus_username}
  description={`${account.sonolus_username}'s charts on UntitledCharts${account.description ? ` · ${account.description}` : ""}`}
  image={ogAccountUrl(account.sonolus_id)}
  discord={userEmbed(account, data.stats, SITE_URL)}
  oembed={`/oembed?title=${encodeURIComponent(account.sonolus_username.replace(/:([a-zA-Z0-9_]+):/g, "").trim())}&page=${encodeURIComponent(`/users/${account.sonolus_handle}`)}&footer=${encodeURIComponent(userFooter(data.stats?.chartsPublished ?? 0, data.stats?.likesReceived ?? 0, data.stats?.commentsReceived ?? 0))}`}
  activity={userStatusId(account.sonolus_handle) ? `/users/${account.sonolus_handle}/statuses/${userStatusId(account.sonolus_handle)}` : null}
  type="profile"
/>

<SiteHeader />

<div class={cn(ambient && "ambient")} style={ambientStyle(ambient)}>
<main class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  <a
    href="/browse"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
    {t("generic.browse")}
  </a>

  <section class="bg-card overflow-hidden rounded-3xl border">
    <div class="relative h-32 sm:h-52">
      <div class="absolute inset-0 bg-cover bg-center" style={`background-image:url(${bannerUrl(account)})`}></div>
      <div class="from-card via-card/40 absolute inset-0 bg-linear-to-t to-transparent"></div>
    </div>

    <div class="relative -mt-14 px-4 pb-5 sm:-mt-20 sm:px-7 sm:pb-7">
      <div class="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
        <div class="relative shrink-0">
          <img
            src="/art/avatar-ring.svg"
            alt=""
            aria-hidden="true"
            class="pointer-events-none absolute -top-3.5 -left-3.5 size-[calc(100%+1.75rem)] max-w-none animate-[spin_40s_linear_infinite] motion-reduce:animate-none"
          />
          <CoverArt
            id={account.sonolus_id}
            title={account.sonolus_username}
            src={profileUrl(account)}
            rounded="rounded-full"
            class="relative size-28 shadow-lg sm:size-36"
          />
        </div>

        <div class="w-full min-w-0 flex-1 space-y-1.5">
          <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 class="font-heading text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              <FormattedText text={account.sonolus_username} />
            </h1>
            <AccountBadges badges={account.badges} class="size-6 sm:size-7" />
          </div>
          <p class="text-muted-foreground text-sm tabular-nums">#{account.sonolus_handle}</p>
        </div>

        <div class="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
          <a
            href={`/browse?sonolus_handle_is=${account.sonolus_handle}`}
            class="bg-primary text-primary-foreground! inline-flex h-11 flex-1 items-center justify-center rounded-xl px-5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 sm:flex-none"
          >
            {t("generic.browseCharts")}
          </a>
          <button
            type="button"
            onclick={share}
            class="hover:bg-muted inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
          >
            <RiShareLine class="block size-4" />
            <span>{copied ? t("generic.linkCopied") : t("generic.share")}</span>
          </button>
          {#if isMe}
            <a
              href="/dashboard/settings#profile"
              class="hover:bg-muted inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
            >
              <RiEditLine class="block size-4" />
              <span>{t("userProfile.editProfile")}</span>
            </a>
          {/if}
          <!-- admins only; it checks that itself -->
          <AccountMenu {account} />
        </div>
      </div>

      <dl class="bg-border mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-3 lg:grid-cols-5">
        {#await data.stats}
          {#each ["userProfile.chartsPublished", "userProfile.likesReceived", "userProfile.commentsReceived", "userProfile.chartsLiked", "userProfile.commentsMade"] as label, i (label)}
            <div class={cn("bg-card px-4 py-2.5", i === 4 && lastStat)}>
              <dt class="text-muted-foreground text-xs">{t(label)}</dt>
              <dd class="bg-muted mt-1.5 h-5 w-12 animate-pulse rounded"></dd>
            </div>
          {/each}
        {:then stats}
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("userProfile.chartsPublished")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{stats ? compact(stats.chartsPublished) : "–"}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("userProfile.likesReceived")}</dt>
            <dd class="font-heading inline-flex items-center gap-1.5 text-lg font-bold tabular-nums">
              <RiHeart3Fill class="block size-4 text-rose-400" />{stats ? compact(stats.likesReceived) : "–"}
            </dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("userProfile.commentsReceived")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{stats ? compact(stats.commentsReceived) : "–"}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("userProfile.chartsLiked")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{stats ? compact(stats.likedCharts) : "–"}</dd>
          </div>
          <div class={cn("bg-card px-4 py-2.5", lastStat)}>
            <dt class="text-muted-foreground text-xs">{t("userProfile.commentsMade")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{stats ? compact(stats.commentsWritten) : "–"}</dd>
          </div>
        {/await}
      </dl>
    </div>
  </section>

  <AdSlot />

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
    <aside class="space-y-6 lg:sticky lg:top-24 lg:order-last">
      <section class="bg-card space-y-3 rounded-3xl border p-5">
        <h2 class="text-base font-semibold tracking-tight">{t("userProfile.about")}</h2>
        {#if account.description}
          <p class="text-foreground/85 text-sm leading-relaxed wrap-break-word whitespace-pre-line">
            <FormattedText text={account.description} linkify />
          </p>
        {:else}
          <p class="text-muted-foreground text-sm">{t("userProfile.noBio")}</p>
        {/if}
      </section>
    </aside>

    <div class="min-w-0 space-y-6">
      <section class="bg-card min-w-0 space-y-4 rounded-3xl border p-4 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold tracking-tight">{t("generic.charts")}</h2>
          <div class="bg-muted inline-flex rounded-xl p-1" role="radiogroup" aria-label={t("userProfile.sortCharts")}>
            {#each SORTS as s (s.key)}
              <button
                type="button"
                role="radio"
                aria-checked={sort === s.key}
                onclick={() => {
                  if (sort !== s.key) chartPage = 1;
                  sort = s.key;
                }}
                class={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  sort === s.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(s.label)}
              </button>
            {/each}
          </div>
        </div>

        {#if chartsLoading && !charts.length}
          <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {#each Array(6) as _, i (i)}
              <ChartSkeleton />
            {/each}
          </div>
        {:else}
          {#if charts.length}
            <div class={cn("grid grid-cols-2 gap-3 transition-opacity sm:gap-4 md:grid-cols-3", chartsLoading && "opacity-60")}>
              {#each charts as chart (chart.id)}
                <ChartCard {chart} />
              {/each}
            </div>
            <Pager count={pageCount * PER_PAGE} perPage={PER_PAGE} bind:page={chartPage} />
          {:else}
            <div class="bg-muted/30 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-10 text-center">
              <img src="/miku-sitting.png" alt="" aria-hidden="true" class="mb-2 block w-24" />
              <p class="text-sm font-medium">{t("userProfile.noPublicCharts")}</p>
            </div>
          {/if}
        {/if}
      </section>

      {#if data.collaborations.length}
        <section class="bg-card min-w-0 space-y-4 rounded-3xl border p-4 sm:p-6">
          <h2 class="text-lg font-semibold tracking-tight">{t("userProfile.collaborationsHeading")}</h2>
          <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {#each data.collaborations as chart (chart.id)}
              <ChartCard {chart} />
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </div>
</main>
</div>

<SiteFooter />
