<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import ChartCollectionView from "$lib/components/chart-collection-view.svelte";
  import Button from "$lib/components/button.svelte";
  import { RiArrowLeftLine, RiEditLine, RiStackLine } from "$lib/icons.js";

  let { data } = $props();
  const collection = $derived(data.collection);
  const charts = $derived(data.charts);
</script>

<svelte:head>
  <title>{t("common.pageTitle", [collection.name])}</title>
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

  <section class="bg-card ring-border/70 rounded-3xl border p-5 ring-1 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 space-y-2">
        <h1 class="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {#if collection.emoji}<span class="mr-1.5">{collection.emoji}</span>{/if}{collection.name}
        </h1>
        {#if collection.description}
          <p class="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {collection.description}
          </p>
        {/if}
        <p class="text-muted-foreground inline-flex items-center gap-1.5 text-sm tabular-nums">
          <RiStackLine class="size-4" />
          <span class="text-foreground font-semibold">{charts.length}</span> {t("creators.charts")}
        </p>
      </div>
      <Button variant="outline" size="sm" class="shrink-0 rounded-full">
        <RiEditLine class="size-4" />
        {t("levelDetail.edit")}
      </Button>
    </div>
  </section>

  <div
    class="bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm"
  >
    {t("collections.previewOnlyCollectionsArenT")}
  </div>

  <ChartCollectionView {charts} emptyMessage={t("collections.emptyCollection")} />
</main>
