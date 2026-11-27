<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Select from "$lib/components/select.svelte";
  import { cn } from "$lib/utils.js";
  import {
    searchTypes,
    sortByOptions,
    orderOptions,
    type Filters,
  } from "$lib/data/index.js";
  import { RiStarFill, RiEqualizerLine } from "$lib/icons.js";

  let { filters = $bindable() }: { filters: Filters } = $props();

  const showSort = $derived(filters.searchType !== "random" && filters.searchType !== "newest");
  const isAdvanced = $derived(filters.searchType === "advanced");

  const inputClass =
    "bg-card focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";
</script>

<div
  class="bg-card/60 supports-backdrop-filter:bg-card/40 relative z-30 space-y-3 rounded-2xl border p-3 backdrop-blur-xl sm:p-4"
>
  <div class="flex flex-wrap items-center gap-2.5">
    <RiEqualizerLine class="text-muted-foreground size-4" />

    <Select
      bind:value={filters.searchType}
      options={searchTypes}
      label={t("browse.type")}
      ariaLabel={t("browse.searchType")}
      class="sm:w-40"
    />

    {#if showSort}
      <Select
        bind:value={filters.sortBy}
        options={sortByOptions}
        label={t("dashboard.sort")}
        ariaLabel={t("dashboard.sortBy")}
        class="sm:w-48"
      />

      <Select
        bind:value={filters.sortOrder}
        options={orderOptions}
        label={t("search.order")}
        ariaLabel={t("search.order")}
        class="sm:w-40"
      />

      <button
        type="button"
        onclick={() => (filters.staffPick = !filters.staffPick)}
        aria-pressed={filters.staffPick}
        class={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
          filters.staffPick
            ? "border-amber-400/40 bg-amber-400/15 text-amber-600 dark:text-amber-300"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
        )}
      >
        <RiStarFill class="size-3" /> {t("home.staffPicks2")}
      </button>
    {/if}
  </div>

  {#if isAdvanced}
    <div class="grid gap-2.5 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3">
      <label class="space-y-1">
        <span class="text-muted-foreground text-xs">{t("browse.minRating")}</span>
        <input type="number" min="1" max="99" placeholder="e.g. 25" bind:value={filters.minRating} class={inputClass} />
      </label>
      <label class="space-y-1">
        <span class="text-muted-foreground text-xs">{t("browse.maxRating")}</span>
        <input type="number" min="1" max="99" placeholder="e.g. 32" bind:value={filters.maxRating} class={inputClass} />
      </label>
      <label class="space-y-1">
        <span class="text-muted-foreground text-xs">{t("browse.authorHandle")}</span>
        <input type="text" placeholder="e.g. 78302" bind:value={filters.authorHandle} class={inputClass} />
      </label>
      <label class="space-y-1">
        <span class="text-muted-foreground text-xs">{t("browse.titleIncludes")}</span>
        <input type="text" placeholder={t("browse.searchInTitles")} bind:value={filters.titleIncludes} class={inputClass} />
      </label>
      <label class="space-y-1">
        <span class="text-muted-foreground text-xs">{t("browse.artistsIncludes")}</span>
        <input type="text" placeholder={t("browse.searchInArtists")} bind:value={filters.artistsIncludes} class={inputClass} />
      </label>
      <label class="space-y-1">
        <span class="text-muted-foreground text-xs">{t("browse.descriptionIncludes")}</span>
        <input type="text" placeholder={t("browse.searchInDescriptions")} bind:value={filters.descriptionIncludes} class={inputClass} />
      </label>
      <label class="space-y-1 sm:col-span-2 lg:col-span-3">
        <span class="text-muted-foreground text-xs">{t("search.tags")}</span>
        <input type="text" placeholder={t("browse.commaSeparatedTags")} bind:value={filters.tags} class={inputClass} />
      </label>
    </div>
  {/if}
</div>
