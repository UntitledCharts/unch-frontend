<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { page } from "$app/state";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import Button from "$lib/components/button.svelte";
  import { RiCompass3Line, RiHome5Line } from "$lib/icons.js";

  const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{t("common.pageTitle", [page.status])}</title>
</svelte:head>

<SiteHeader />

<main class="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
  <p class="font-heading text-primary/30 text-7xl font-bold tabular-nums select-none sm:text-8xl">
    {page.status}
  </p>
  <h1 class="font-heading mt-2 text-2xl font-bold tracking-tight">
    {isNotFound ? t("error.pageNotFound2") : t("error.somethingWentWrong2")}
  </h1>
  <p class="text-muted-foreground mt-2 max-w-md text-sm">
    {page.error?.message ??
      t("error.weCouldnTLoadThat")}
  </p>
  <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
    <Button href="/" class="rounded-full">
      <RiHome5Line class="size-4" /> {t("nav.home")}
    </Button>
    <Button href="/browse" variant="outline" class="rounded-full">
      <RiCompass3Line class="size-4" /> {t("error.browseCharts")}
    </Button>
  </div>
</main>

<SiteFooter />
