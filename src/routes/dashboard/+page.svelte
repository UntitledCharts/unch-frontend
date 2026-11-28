<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import OwnerChartCard from "$lib/components/owner-chart-card.svelte";
  import OwnerChartSkeleton from "$lib/components/owner-chart-skeleton.svelte";
  import Seo from "$lib/components/seo.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";
  import { ogSiteUrl } from "$lib/config.js";
  import CoverArt from "$lib/components/cover-art.svelte";
  import Button from "$lib/components/button.svelte";
  import Select from "$lib/components/select.svelte";
  import { cn } from "$lib/utils.js";
  import DashboardFilters from "$lib/components/dashboard-filters.svelte";
  import { session } from "$lib/state/session.svelte";
  import { page } from "$app/state";
  import { replaceState } from "$app/navigation";
  import {
    fetchMyCharts,
    sortByOptions,
    orderOptions,
    fieldsFromQuery,
    fieldsToQuery,
    fieldsToApiParams,
    activeFilterCount,
    type Chart,
    type ChartFilterFields,
    type ChartParams,
  } from "$lib/data/index.js";
  import { RiUpload2Line, RiSearchLine, RiSortAsc, RiSortDesc, RiEqualizerLine, RiArrowDownSLine } from "$lib/icons.js";
  import { prefs } from "$lib/state/preferences.svelte.js";
  import Pager from "$lib/components/pager.svelte";
  import { recallValue, rememberValue } from "$lib/state/page-memory.js";

  const user = $derived(session.user);

  const STATUSES = ["ALL", "PUBLIC", "UNLISTED", "PRIVATE"] as const;
  type Status = (typeof STATUSES)[number];
  const isStatus = (value: string | null): value is Status => (STATUSES as readonly (string | null)[]).includes(value);
  const statusOptions: { value: Status; label: string }[] = [
    { value: "ALL", get label() { return t("generic.all"); } },
    { value: "PUBLIC", get label() { return t("generic.public"); } },
    { value: "UNLISTED", get label() { return t("generic.unlisted"); } },
    { value: "PRIVATE", get label() { return t("generic.private"); } },
  ];

  // the filters live in the URL; sort and status the URL leaves out come back from earlier in the session
  function fromUrl(p: URLSearchParams): { fields: ChartFilterFields; status: Status; search: string } {
    const fields: ChartFilterFields = {
      staffPick: false,
      sortBy: recallValue("dashboard:sortBy", sortByOptions.map((o) => o.value), "created_at"),
      sortOrder: recallValue("dashboard:order", ["asc", "desc"] as const, "desc"),
      minRating: null,
      maxRating: null,
      titleIncludes: "",
      descriptionIncludes: "",
      artistsIncludes: "",
      tags: "",
    };
    fieldsFromQuery(p, fields);
    const status = p.get("status");
    return {
      fields,
      status: isStatus(status) ? status : recallValue("dashboard:status", STATUSES, "ALL"),
      search: p.get("q") ?? "",
    };
  }

  // the API pages the charts itself; this only has to match its page size for the pager to count right
  const PER_PAGE = 10;
  const start = fromUrl(page.url.searchParams);
  let dashPage = $state(1);
  let search = $state(start.search);
  let fields = $state(start.fields);
  let status = $state<Status>(start.status);
  let filtersOpen = $state(activeFilterCount(start.fields) > 0);
  const filterCount = $derived(activeFilterCount(fields));

  $effect(() => {
    rememberValue("dashboard:sortBy", fields.sortBy, "created_at");
    rememberValue("dashboard:order", fields.sortOrder, "desc");
    rememberValue("dashboard:status", status, "ALL");
  });

  function toQuery(): string {
    const q = new URLSearchParams();
    if (search.trim()) q.set("q", search.trim());
    if (status !== "ALL") q.set("status", status);
    fieldsToQuery(fields, q, fields.sortBy !== "created_at" || fields.sortOrder !== "desc");
    return q.toString();
  }

  let written = toQuery();
  $effect(() => {
    const qs = toQuery();
    if (qs === written) return;
    written = qs;
    replaceState(qs ? `${page.url.pathname}?${qs}` : page.url.pathname, page.state);
  });

  let filterSig = "";
  $effect(() => {
    const sig = toQuery();
    if (filterSig && sig !== filterSig) dashPage = 1;
    filterSig = sig;
  });

  let myCharts = $state<Chart[]>([]);
  let pageCount = $state(0);
  let loading = $state(true);
  let reqToken = 0;
  $effect(() => {
    const loggedIn = session.isLoggedIn;
    const key = session.sessionKey;
    const q = search.trim();
    const params: ChartParams = {
      status,
      sort_by: fields.sortBy,
      sort_order: fields.sortOrder,
      page: dashPage - 1,
      ...fieldsToApiParams(fields),
    };
    if (fields.staffPick) params.staff_pick = true;
    if (q) params.meta_includes = q;
    if (!loggedIn || !key) {
      myCharts = [];
      pageCount = 0;
      loading = false;
      return;
    }
    const mine = ++reqToken;
    loading = true;
    fetchMyCharts(fetch, key, params).then((result) => {
      if (mine !== reqToken) return;
      myCharts = result.data;
      pageCount = result.pageCount;
      loading = false;
    });
  });
</script>

<Seo title={t("generic.dashboard")} metaTitle="Dashboard" image={ogSiteUrl("Dashboard", "Charts you've uploaded")} />

<main class="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8">
  <section class="flex items-center gap-4">
    <CoverArt
      id={user?.username ?? "guest"}
      title={user?.username ?? "?"}
      src={user?.avatar ?? null}
      rounded="rounded-2xl"
      class="size-14 shrink-0 sm:size-16"
    />
    <div class="min-w-0">
      <p class="text-muted-foreground text-sm">{t("dashboard.welcomeBack")}</p>
      <h1 class="font-heading truncate text-2xl font-bold tracking-tight sm:text-3xl">
        {user?.username ?? "there"}
      </h1>
    </div>
  </section>

  <AdSlot />

  <section class="space-y-5">
    <div class="flex items-end justify-between gap-3">
      <div class="space-y-0.5">
        <h2 class="text-lg font-semibold tracking-tight">{t("dashboard.yourCharts")}</h2>
        <p class="text-muted-foreground text-sm">{t("dashboard.yourChartsHint")}</p>
      </div>
      <Button href="/dashboard/upload" size="sm" class="shrink-0 rounded-full">
        <RiUpload2Line class="size-4" />
        {t("generic.uploadChart")}
      </Button>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="relative min-w-0 flex-1">
        <RiSearchLine
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          bind:value={search}
          type="search"
          placeholder={t("dashboard.searchYourCharts")}
          aria-label={t("dashboard.searchYourCharts")}
          class="bg-card focus-visible:ring-ring/50 h-10 w-full rounded-xl border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
        />
      </div>
      <div class="grid grid-cols-[1fr_1fr_auto_auto] gap-2 sm:flex sm:shrink-0">
        <Select bind:value={status} options={statusOptions} ariaLabel={t("dashboard.status")} class="min-w-0 sm:w-36" />
        <Select bind:value={fields.sortBy} options={sortByOptions} ariaLabel={t("generic.sortBy")} class="min-w-0 sm:w-40" />
        <!-- order is a toggle rather than a dropdown so it never gets squeezed -->
        <button
          type="button"
          onclick={() => (fields.sortOrder = fields.sortOrder === "desc" ? "asc" : "desc")}
          aria-label={`${t("generic.order")}: ${orderOptions.find((o) => o.value === fields.sortOrder)?.label}`}
          title={orderOptions.find((o) => o.value === fields.sortOrder)?.label}
          class="bg-card hover:bg-muted inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm transition-colors"
        >
          {#if fields.sortOrder === "desc"}<RiSortDesc class="size-4" />{:else}<RiSortAsc class="size-4" />{/if}
          <span class="hidden truncate sm:inline">{orderOptions.find((o) => o.value === fields.sortOrder)?.label}</span>
        </button>
        <button
          type="button"
          onclick={() => (filtersOpen = !filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="dashboard-filters"
          aria-label={t("generic.filters")}
          class={cn(
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm transition-colors",
            filterCount > 0 ? "border-primary/40 bg-primary/10 text-primary" : "bg-card hover:bg-muted",
          )}
        >
          <RiEqualizerLine class="size-4" />
          <span class="hidden sm:inline">{t("generic.filters")}</span>
          {#if filterCount > 0}<span class="tabular-nums">{filterCount}</span>{/if}
          <RiArrowDownSLine class={cn("hidden size-4 transition-transform sm:block", filtersOpen && "rotate-180")} />
        </button>
      </div>
    </div>

    <div id="dashboard-filters" hidden={!filtersOpen}>
      <DashboardFilters bind:fields />
    </div>

    {#if loading}
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _, i (i)}
          <OwnerChartSkeleton />
        {/each}
      </div>
    {:else if myCharts.length === 0}
      {#if search.trim() || status !== "ALL" || filterCount > 0}
        <div
          class="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm"
        >
          <RiSearchLine class="size-8 opacity-50" />
          <p>{t("dashboard.noMatches")}</p>
        </div>
      {:else}
        <div
          class="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-sm"
        >
          <RiUpload2Line class="size-8 opacity-50" />
          <p>{t("dashboard.empty")}</p>
          <Button href="/dashboard/upload" size="sm" variant="outline" class="rounded-full">
            {t("generic.uploadChart")}
          </Button>
        </div>
      {/if}
    {:else}
      <div
        class={cn(
          "grid gap-5",
          prefs.dashboardCards === "cover"
            ? "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            : prefs.dashboardCards === "background"
              ? "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {#each myCharts as chart (chart.id)}
          <OwnerChartCard {chart} />
        {/each}
      </div>
      <Pager count={pageCount * PER_PAGE} perPage={PER_PAGE} bind:page={dashPage} />
    {/if}
  </section>

  <AdSlot />
</main>
