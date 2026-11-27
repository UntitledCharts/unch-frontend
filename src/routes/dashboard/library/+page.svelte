<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import ChartCollectionView from "$lib/components/chart-collection-view.svelte";
  import Button from "$lib/components/button.svelte";
  import { savedCharts } from "$lib/data/index.js";
  import { RiArrowLeftLine, RiBookmarkLine, RiCompass3Line } from "$lib/icons.js";

  const charts = savedCharts();
</script>

<svelte:head>
  <title>{t("library.libraryUntitledcharts")}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  <a
    href="/dashboard"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine
      class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    />
    {t("nav.dashboard")}
  </a>

  <header class="space-y-1">
    <h1 class="font-heading inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
      <RiBookmarkLine class="text-primary size-6" />
      {t("library.library")}
    </h1>
    <p class="text-muted-foreground text-sm">
      {t("library.savedChartsAcrossAllYour", [charts.length])}
    </p>
  </header>

  <ChartCollectionView {charts} emptyMessage={t("library.empty")} />

  <section
    class="from-primary/12 via-card to-card ring-border/70 relative overflow-hidden rounded-3xl border bg-linear-to-br p-6 ring-1 sm:p-8"
  >
    <div
      class="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="space-y-1">
        <h2 class="text-lg font-semibold tracking-tight sm:text-xl">
          {t("library.lookingForSomethingNew")}
        </h2>
        <p class="text-muted-foreground text-sm">
          {t("library.discoverFreshChartsAndStaff")}
        </p>
      </div>
      <Button href="/browse" class="shrink-0 rounded-full">
        <RiCompass3Line class="size-4" />
        {t("library.continueBrowsing")}
      </Button>
    </div>
  </section>
</main>
