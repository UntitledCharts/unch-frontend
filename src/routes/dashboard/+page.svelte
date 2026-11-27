<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import OwnerChartCard from "$lib/components/owner-chart-card.svelte";
  import OwnerChartSkeleton from "$lib/components/owner-chart-skeleton.svelte";
  import Seo from "$lib/components/seo.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import Button from "$lib/components/button.svelte";
  import Select from "$lib/components/select.svelte";
  import { cn } from "$lib/utils.js";
  import { session } from "$lib/state/session.svelte";
  import { fetchMyCharts, sortByOptions, orderOptions, type Chart, type SortBy } from "$lib/data/index.js";
  import { RiUpload2Line, RiSearchLine, RiSortAsc, RiSortDesc } from "$lib/icons.js";
  import { prefs } from "$lib/state/preferences.svelte.js";
  import Pager from "$lib/components/pager.svelte";
  import { recallValue, rememberValue } from "$lib/state/page-memory.js";

  const user = $derived(session.user);

  type Status = "ALL" | "PUBLIC" | "UNLISTED" | "PRIVATE";
  const statusOptions: { value: Status; label: string }[] = [
    { value: "ALL", get label() { return t("dashboard.statusAll"); } },
    { value: "PUBLIC", get label() { return t("dashboard.statusPublic"); } },
    { value: "UNLISTED", get label() { return t("dashboard.statusUnlisted"); } },
    { value: "PRIVATE", get label() { return t("dashboard.statusPrivate"); } },
  ];

  // no pages: everything is fetched up front, and cards are added in batches as you scroll
  // the dashboard follows Settings: pages of N cards, or more cards as you scroll (in batches of 24)
  const BATCH = 24;
  const perPage = $derived(prefs.dashboardPaging === "infinite" ? null : prefs.dashboardPageSize);
  let dashPage = $state(1);
  let search = $state("");
  let sortBy = $state<SortBy>(recallValue("dashboard:sortBy", sortByOptions.map((o) => o.value), "created_at"));
  let sortOrder = $state<"asc" | "desc">(recallValue("dashboard:order", ["asc", "desc"] as const, "desc"));
  let status = $state<Status>(recallValue("dashboard:status", ["ALL", "PUBLIC", "UNLISTED", "PRIVATE"] as const, "ALL"));
  let shown = $state(BATCH);

  $effect(() => {
    rememberValue("dashboard:sortBy", sortBy, "created_at");
    rememberValue("dashboard:order", sortOrder, "desc");
    rememberValue("dashboard:status", status, "ALL");
  });

  let filterSig = "";
  $effect(() => {
    const sig = `${search.trim()}|${status}|${sortBy}|${sortOrder}`;
    if (filterSig && sig !== filterSig) {
      shown = BATCH;
      dashPage = 1;
    }
    filterSig = sig;
  });

  let allMyCharts = $state<Chart[]>([]);
  let loading = $state(true);
  let reqToken = 0;
  $effect(() => {
    const loggedIn = session.isLoggedIn;
    const key = session.sessionKey;
    const q = search.trim();
    const sb = sortBy;
    const so = sortOrder;
    if (!loggedIn || !key) {
      allMyCharts = [];
      loading = false;
      return;
    }
    const mine = ++reqToken;
    loading = true;
    const params: Record<string, string | number> = {
      status: "ALL",
      sort_by: sb,
      sort_order: so,
      limit: 48,
    };
    if (q) params.meta_includes = q;
    fetchMyCharts(fetch, key, params)
      .then(async (first) => {
        const rest = await Promise.all(
          Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, i) =>
            fetchMyCharts(fetch, key, { ...params, page: i + 1 }),
          ),
        );
        return [first, ...rest].flatMap((r) => r.data);
      })
      .then((charts) => {
        if (mine !== reqToken) return;
        allMyCharts = charts;
        loading = false;
      });
  });

  const myCharts = $derived(
    status === "ALL" ? allMyCharts : allMyCharts.filter((c) => c.status === status),
  );
  const visibleCharts = $derived(
    perPage ? myCharts.slice((dashPage - 1) * perPage, dashPage * perPage) : myCharts.slice(0, shown),
  );

  // reveal the next batch when the end of the grid comes near
  let sentinel = $state<HTMLDivElement | null>(null);
  $effect(() => {
    const el = sentinel;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) shown += BATCH;
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  });
</script>

<Seo title={t("dashboard.title")} image="/og?title=Dashboard&subtitle=Your+uploaded+charts" />

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

  <section class="space-y-5">
    <div class="flex items-end justify-between gap-3">
      <div class="space-y-0.5">
        <h2 class="text-lg font-semibold tracking-tight">{t("dashboard.yourCharts")}</h2>
        <p class="text-muted-foreground text-sm">{t("dashboard.chartsYouVeUploaded")}</p>
      </div>
      <Button href="/dashboard/upload" size="sm" class="shrink-0 rounded-full">
        <RiUpload2Line class="size-4" />
        {t("dashboard.uploadANewChart")}
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
          aria-label={t("dashboard.searchYourCharts2")}
          class="bg-card focus-visible:ring-ring/50 h-10 w-full rounded-xl border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
        />
      </div>
      <div class="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:shrink-0">
        <Select bind:value={status} options={statusOptions} ariaLabel={t("dashboard.status")} class="min-w-0 sm:w-36" />
        <Select bind:value={sortBy} options={sortByOptions} ariaLabel={t("dashboard.sortBy")} class="min-w-0 sm:w-40" />
        <!-- order is a toggle rather than a dropdown so it never gets squeezed -->
        <button
          type="button"
          onclick={() => (sortOrder = sortOrder === "desc" ? "asc" : "desc")}
          aria-label={`${t("search.order")}: ${orderOptions.find((o) => o.value === sortOrder)?.label}`}
          title={orderOptions.find((o) => o.value === sortOrder)?.label}
          class="bg-card hover:bg-muted inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm transition-colors"
        >
          {#if sortOrder === "desc"}<RiSortDesc class="size-4" />{:else}<RiSortAsc class="size-4" />{/if}
          <span class="hidden truncate sm:inline">{orderOptions.find((o) => o.value === sortOrder)?.label}</span>
        </button>
      </div>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _, i (i)}
          <OwnerChartSkeleton />
        {/each}
      </div>
    {:else if myCharts.length === 0}
      {#if search.trim() || status !== "ALL"}
        <div
          class="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm"
        >
          <RiSearchLine class="size-8 opacity-50" />
          <p>{t("dashboard.noChartsMatchYourFilters")}</p>
        </div>
      {:else}
        <div
          class="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-sm"
        >
          <RiUpload2Line class="size-8 opacity-50" />
          <p>{t("dashboard.youHavenTUploadedAny")}</p>
          <Button href="/dashboard/upload" size="sm" variant="outline" class="rounded-full">
            {t("dashboard.uploadANewChart")}
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
        {#each visibleCharts as chart (chart.id)}
          <OwnerChartCard {chart} />
        {/each}
      </div>
      {#if perPage}
        <Pager count={myCharts.length} {perPage} bind:page={dashPage} />
      {:else if shown < myCharts.length}
        <div bind:this={sentinel} class="h-px"></div>
      {/if}
    {/if}
  </section>
</main>
