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
  import { cn } from "$lib/utils.js";
  import { page } from "$app/state";
  import {
    fetchChartsWindow,
    filtersToApiParams,
    defaultFilters,
    isDefault,
    sortByOptions,
    type Filters,
    type SortBy,
    type Chart,
  } from "$lib/data/index.js";
  import { RiListUnordered, RiGridFill, RiEmotionSadLine, RiSearchLine } from "$lib/icons.js";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";

  const LIMIT = 12;

  function initFilters(): Filters {
    const p = page.url.searchParams;
    const f: Filters = { ...defaultFilters };
    if (p.get("staff") === "1") f.staffPick = true;
    const type = p.get("type");
    if (type === "newest" || type === "quick" || type === "advanced" || type === "random") {
      f.searchType = type;
    }
    const sort = p.get("sort");
    if (sort) {
      const [by, order] = sort.split(":");
      if (sortByOptions.some((o) => o.value === by)) f.sortBy = by as SortBy;
      if (order === "asc" || order === "desc") f.sortOrder = order;
    }
    const q = p.get("q");
    if (q) f.keywords = q;
    const handle = p.get("sonolus_handle_is");
    if (handle) {
      f.authorHandle = handle;
      f.searchType = "advanced";
    }
    return f;
  }

  let filters = $state<Filters>(initFilters());
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

  let charts = $state<Chart[]>([]);
  let pageCount = $state(1);
  let loading = $state(true);

  const filterKey = $derived(
    [
      filters.searchType,
      filters.staffPick,
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
    const params = filtersToApiParams(filters, current - 1, LIMIT);
    const mine = ++reqToken;
    loading = true;
    fetchChartsWindow(fetch, params, (current - 1) * LIMIT, LIMIT).then((r) => {
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
  title={t("nav.browse")}
  description={t("browse.filterTheCatalogByDifficulty2")}
  image="/og?title=Browse&subtitle=Filter+the+catalog+by+difficulty%2C+level+and+staff+picks"
/>

<SiteHeader />

<main class="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:space-y-5 sm:px-6 sm:py-8">
  <header class="space-y-1">
    <h1 class="font-heading text-xl font-bold tracking-tight sm:text-2xl">{t("error.browseCharts")}</h1>
    <p class="text-muted-foreground hidden text-sm sm:block">
      {t("browse.filterTheCatalogByDifficulty")}
    </p>
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
        placeholder={t("browse.searchChartsSongsCharters")}
        aria-label={t("nav.searchCharts")}
        class="bg-card focus-visible:ring-ring/50 h-11 w-full rounded-xl border pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
      />
    </div>
    <BrowseFilters bind:filters />
  </div>

  <div class="flex items-center justify-between gap-3">
    <p class="text-muted-foreground text-sm">
      {#if loading}
        {t("common.loading")}
      {:else}
        {charts.length === 1 ? t("browse.onThisPage_singular", [charts.length]) : t("browse.onThisPage_plural", [charts.length])}
      {/if}
      {#if !isDefault(filters)}
        <button onclick={reset} class="text-primary ml-2 hover:underline">{t("browse.clear")}</button>
      {/if}
    </p>

    <div class="bg-muted/50 hidden items-center rounded-lg border p-0.5 md:flex">
      <button
        type="button"
        onclick={() => (view = "grid")}
        aria-pressed={view === "grid"}
        aria-label={t("browse.gridView")}
        class={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <RiGridFill class="size-3.5" /> {t("browse.grid")}
      </button>
      <button
        type="button"
        onclick={() => (view = "list")}
        aria-pressed={view === "list"}
        aria-label={t("browse.listView")}
        class={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <RiListUnordered class="size-3.5" /> {t("browse.list")}
      </button>
    </div>
  </div>

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
      <p class="text-sm">{t("browse.noChartsMatchTheseFilters")}</p>
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
