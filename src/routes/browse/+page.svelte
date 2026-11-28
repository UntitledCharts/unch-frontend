<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import BrowseFilters from "$lib/components/browse/browse-filters.svelte";
  import MobileBrowseControls from "$lib/components/browse/mobile-browse-controls.svelte";
  import ChartRow from "$lib/components/chart-row.svelte";
  import ChartCard from "$lib/components/chart-card.svelte";
  import ChartListCard from "$lib/components/chart-list-card.svelte";
  import ChartSkeleton from "$lib/components/chart-skeleton.svelte";
  import Seo from "$lib/components/seo.svelte";
  import Pager from "$lib/components/pager.svelte";
  import Button from "$lib/components/button.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";
  import { cn } from "$lib/utils.js";
  import { page } from "$app/state";
  import { replaceState } from "$app/navigation";
  import { ogSiteUrl } from "$lib/config.js";
  import { session } from "$lib/state/session.svelte";
  import {
    fetchChartsWindow,
    fetchRandomCharts,
    filtersToApiParams,
    filtersFromQuery,
    filtersToQuery,
    defaultFilters,
    isDefault,
    type Filters,
    type Chart,
  } from "$lib/data/index.js";
  import { RiListUnordered, RiGridFill, RiEmotionSadLine, RiSearchLine } from "$lib/icons.js";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";

  const LIMIT = 12;

  let filters = $state<Filters>(filtersFromQuery(page.url.searchParams));
  let view = $state<"list" | "grid">("grid");
  let current = $state(1);
  const autofocusSearch = page.url.searchParams.get("focus") === "1";

  // the header search navigates here with ?q=, so pick it up even when already on this page
  let lastQuery = page.url.searchParams.get("q");
  $effect(() => {
    const q = page.url.searchParams.get("q");
    if (q === lastQuery) return;
    lastQuery = q;
    filters.keywords = q ?? "";
    current = 1;
  });

  // the filters live in the URL; the first state came from it, so only changes are written back
  let written = filtersToQuery(filtersFromQuery(page.url.searchParams)).toString();
  $effect(() => {
    const qs = filtersToQuery(filters).toString();
    if (qs === written) return;
    written = qs;
    lastQuery = filters.keywords.trim() || null;
    replaceState(qs ? `${page.url.pathname}?${qs}` : page.url.pathname, page.state);
  });

  let charts = $state<Chart[]>([]);
  let pageCount = $state(1);
  let loading = $state(true);

  const filterKey = $derived(
    [
      filters.searchType,
      filters.staffPick,
      filters.likedByMe,
      filters.sortBy,
      filters.sortOrder,
      filters.keywords,
      filters.minRating,
      filters.maxRating,
      filters.titleIncludes,
      filters.descriptionIncludes,
      filters.artistsIncludes,
      filters.tags,
      filters.authorHandle,
    ].join("|"),
  );
  $effect(() => {
    filterKey;
    current = 1;
  });

  let rerollNonce = $state(0);
  let reqToken = 0;
  $effect(() => {
    rerollNonce;
    // "liked by me" needs the session, so it waits for it and is dropped when signed out
    if (filters.likedByMe && session.loading) return;
    const liked = filters.likedByMe && session.isLoggedIn;
    const request =
      filters.searchType === "random"
        ? fetchRandomCharts(fetch, LIMIT)
        : fetchChartsWindow(
            fetch,
            filtersToApiParams({ ...filters, likedByMe: liked }),
            (current - 1) * LIMIT,
            LIMIT,
            liked ? session.sessionKey : null,
          );
    const mine = ++reqToken;
    loading = true;
    request.then((r) => {
      if (mine !== reqToken) return;
      charts = r.data;
      pageCount = Math.max(1, Math.ceil(r.total / LIMIT));
      loading = false;
    });
  });

  function reroll() {
    rerollNonce++;
  }

  function reset() {
    filters = { ...defaultFilters };
  }
</script>

<Seo
  title={t("generic.browse")}
  metaTitle="Browse"
  description="Filter by difficulty, level and staff picks."
  image={ogSiteUrl("Browse", "Filter by difficulty, level and staff picks")}
/>

<SiteHeader />

<main class="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-5 sm:px-6 sm:py-8">
  <header class="space-y-1">
    <h1 class="font-heading text-xl font-bold tracking-tight sm:text-2xl">{t("generic.browseCharts")}</h1>
  </header>

  <div class="md:hidden">
    <MobileBrowseControls bind:filters total={charts.length} autofocus={autofocusSearch} />
  </div>

  <div class="hidden space-y-3 md:block">
    <div class="relative">
      <RiSearchLine
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <input
        bind:value={filters.keywords}
        type="search"
        placeholder={t("browse.searchPlaceholder")}
        aria-label={t("nav.searchCharts")}
        class="bg-card focus-visible:ring-ring/50 h-11 w-full rounded-xl border pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
      />
    </div>
    <BrowseFilters bind:filters />
  </div>

  <div class="flex items-center justify-between gap-3">
    <p class="text-muted-foreground text-sm">
      {#if loading}
        {t("generic.loading")}
      {:else}
        {charts.length === 1 ? t("browse.onThisPage_singular", [charts.length]) : t("browse.onThisPage_plural", [charts.length])}
      {/if}
      {#if !isDefault(filters)}
        <button onclick={reset} class="text-primary ml-2 hover:underline">{t("generic.clear")}</button>
      {/if}
    </p>

    <div class="bg-muted/50 hidden items-center rounded-lg border p-0.5 md:flex">
      <button
        type="button"
        onclick={() => (view = "grid")}
        aria-pressed={view === "grid"}
        aria-label={t("generic.gridView")}
        class={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <RiGridFill class="size-3.5" /> {t("generic.grid")}
      </button>
      <button
        type="button"
        onclick={() => (view = "list")}
        aria-pressed={view === "list"}
        aria-label={t("generic.listView")}
        class={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <RiListUnordered class="size-3.5" /> {t("generic.list")}
      </button>
    </div>
  </div>

  <AdSlot refresh={`${current}:${rerollNonce}`} />

  {#if loading}
    <div class="space-y-2.5 md:hidden">
      {#each Array(6) as _, i (i)}
        <ChartSkeleton variant="list" />
      {/each}
    </div>
    {#if view === "list"}
      <div class="hidden space-y-2.5 md:block">
        {#each Array(8) as _, i (i)}
          <ChartSkeleton variant="list" />
        {/each}
      </div>
    {:else}
      <div class="hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-4">
        {#each Array(9) as _, i (i)}
          <ChartSkeleton />
        {/each}
      </div>
    {/if}
  {:else if charts.length === 0}
    <div
      class="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20"
    >
      <RiEmotionSadLine class="size-10 opacity-50" />
      <p class="text-sm">{t("browse.noMatches")}</p>
      <Button variant="outline" size="sm" onclick={reset}>{t("browse.resetFilters")}</Button>
    </div>
  {:else}
    <div class="space-y-2.5 md:hidden">
      {#each charts as chart (chart.id)}
        <div animate:flip={{ duration: 250 }} in:fade={{ duration: 180 }}>
          <ChartListCard {chart} />
        </div>
      {/each}
    </div>

    {#if view === "list"}
      <div class="hidden space-y-2.5 md:block">
        {#each charts as chart (chart.id)}
          <div animate:flip={{ duration: 250 }} in:fade={{ duration: 180 }}>
            <ChartRow {chart} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-4">
        {#each charts as chart (chart.id)}
          <div animate:flip={{ duration: 250 }} in:fade={{ duration: 180 }}>
            <ChartCard {chart} />
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  {#if charts.length}
    <AdSlot refresh={`${current}:${rerollNonce}`} />
  {/if}

  {#if filters.searchType === "random"}
    <div class="flex justify-center pt-2">
      <Button onclick={reroll} disabled={loading} class="rounded-full">
        {loading ? t("browse.rerolling") : t("search.reroll")}
      </Button>
    </div>
  {:else}
    <Pager count={pageCount * LIMIT} perPage={LIMIT} bind:page={current} />
  {/if}
</main>

<SiteFooter />
