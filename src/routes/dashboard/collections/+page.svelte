<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import CollectionGrid from "$lib/components/collection-grid.svelte";
  import Button from "$lib/components/button.svelte";
  import { listCollections } from "$lib/data/index.js";
  import { RiArrowLeftLine, RiAddLine } from "$lib/icons.js";

  const collections = listCollections();
</script>

<svelte:head>
  <title>{t("collections.collectionsUntitledcharts")}</title>
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

  <div class="flex items-end justify-between gap-3">
    <div class="space-y-1">
      <h1 class="font-heading text-2xl font-bold tracking-tight">{t("collections.playlistsCollections")}</h1>
      <p class="text-muted-foreground text-sm">{t("collections.foldersInYourLibrary", [collections.length])}</p>
    </div>
    <Button variant="outline" size="sm" class="shrink-0 rounded-full">
      <RiAddLine class="size-4" />
      {t("collections.newCollection")}
    </Button>
  </div>

  <div
    class="bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm"
  >
    {t("collections.previewOnlyCollectionsArenT")}
  </div>

  <CollectionGrid {collections} />
</main>
