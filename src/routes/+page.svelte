<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import FeaturedHero from "$lib/components/featured-hero.svelte";
  import ChartSection from "$lib/components/chart-section.svelte";
  import ChartSkeleton from "$lib/components/chart-skeleton.svelte";
  import Seo from "$lib/components/seo.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";

  let { data } = $props();
</script>

<Seo />

{#snippet skeletonRow(title: string)}
  <section class="space-y-5">
    <h2 class="text-lg font-semibold tracking-tight">{title}</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {#each Array(4) as _, i (i)}
        <div class={i >= 3 ? "hidden lg:block" : i >= 2 ? "hidden sm:block" : ""}>
          <ChartSkeleton />
        </div>
      {/each}
    </div>
  </section>
{/snippet}

<SiteHeader />

<main class="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6">
  <FeaturedHero charts={data.featured} />

  <AdSlot fullWidth={false} />

  <ChartSection title={t("generic.staffPicks")} charts={data.staffPicks} href="/browse?staff=1" carousel />

  {#await data.trending}
    {@render skeletonRow(t("home.trendingNow"))}
  {:then trending}
    <ChartSection title={t("home.trendingNow")} charts={trending} href="/browse?sort=decaying_likes:desc" carousel />
  {/await}

  <AdSlot fullWidth={false} />

  {#await data.newest}
    {@render skeletonRow(t("home.newCharts"))}
  {:then newest}
    <ChartSection
      title={t("home.newCharts")}
      charts={newest}
      href="/browse?sort=published_at:desc"
    />
  {/await}
</main>

<SiteFooter />
