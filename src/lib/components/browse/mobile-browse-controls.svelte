<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Select from "$lib/components/select.svelte";
  import { cn } from "$lib/utils.js";
  import { searchTypes, browseSortOptions, orderOptions, activeFilterCount, type Filters } from "$lib/data/index.js";
  import { RiSearchLine, RiCloseLine, RiEqualizerLine, RiStarFill, RiArrowDownSLine, RiHeart3Fill } from "$lib/icons.js";
  import { session } from "$lib/state/session.svelte";

  // Same controls as the desktop filter bar, packed for a phone: search, then type/sort/order as
  // compact dropdowns in one row, with staff picks and the advanced fields behind small chips.
  let {
    filters = $bindable(),
    autofocus = false,
  }: { filters: Filters; total?: number; autofocus?: boolean } = $props();

  let moreOpen = $state(false);
  let input = $state<HTMLInputElement | null>(null);

  const showSort = $derived(filters.searchType !== "random" && filters.searchType !== "newest");
  const isAdvanced = $derived(filters.searchType === "advanced");
  // staff picks has its own chip, so only count the advanced fields here
  const advancedCount = $derived(activeFilterCount(filters) - (filters.staffPick ? 1 : 0));

  const inputClass =
    "bg-card focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";
  const chip = "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors";

  $effect(() => {
    if (autofocus && input) input.focus();
  });
</script>

<div
  class="bg-background/85 supports-backdrop-filter:bg-background/70 sticky top-18 z-30 -mx-4 space-y-2 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6"
>
  <div class="relative">
    <RiSearchLine class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2" />
    <input
      bind:this={input}
      bind:value={filters.keywords}
      type="search"
      inputmode="search"
      enterkeyhint="search"
      placeholder={t("browse.searchPlaceholder")}
      aria-label={t("nav.searchCharts")}
      class="bg-card focus-visible:ring-ring/50 h-11 w-full rounded-2xl border pr-11 pl-11 text-[15px] shadow-sm outline-none focus-visible:ring-2"
    />
    {#if filters.keywords}
      <button
        type="button"
        onclick={() => (filters.keywords = "")}
        aria-label={t("browse.clearSearch")}
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full"
      >
        <RiCloseLine class="size-5" />
      </button>
    {/if}
  </div>

  <div class={cn("grid gap-2", showSort ? "grid-cols-3" : "grid-cols-1")}>
    <Select bind:value={filters.searchType} options={searchTypes} ariaLabel={t("browse.searchType")} compact class="min-w-0" />
    {#if showSort}
      <Select bind:value={filters.sortBy} options={browseSortOptions} ariaLabel={t("generic.sortBy")} compact class="min-w-0" />
      <Select bind:value={filters.sortOrder} options={orderOptions} ariaLabel={t("generic.order")} compact class="min-w-0" />
    {/if}
  </div>

  <div class="flex flex-wrap items-center gap-2">
    {#if filters.searchType !== "random"}
      <button
        type="button"
        onclick={() => (filters.staffPick = !filters.staffPick)}
        aria-pressed={filters.staffPick}
        class={cn(
          chip,
          filters.staffPick
            ? "border-amber-400/40 bg-amber-400/15 text-amber-600 dark:text-amber-300"
            : "border-border text-muted-foreground",
        )}
      >
        <RiStarFill class="size-3.5" />
        {t("generic.staffPicks")}
      </button>
      {#if session.isLoggedIn}
        <button
          type="button"
          onclick={() => (filters.likedByMe = !filters.likedByMe)}
          aria-pressed={filters.likedByMe}
          class={cn(
            chip,
            filters.likedByMe
              ? "border-rose-400/40 bg-rose-400/15 text-rose-600 dark:text-rose-300"
              : "border-border text-muted-foreground",
          )}
        >
          <RiHeart3Fill class="size-3.5" />
          {t("browse.likedByMe")}
        </button>
      {/if}
    {/if}
    {#if isAdvanced}
      <button
        type="button"
        onclick={() => (moreOpen = !moreOpen)}
        aria-expanded={moreOpen}
        class={cn(chip, advancedCount > 0 ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground")}
      >
        <RiEqualizerLine class="size-3.5" />
        {t("generic.filters")}
        {#if advancedCount > 0}<span class="tabular-nums">· {advancedCount}</span>{/if}
        <RiArrowDownSLine class={cn("size-4 transition-transform", moreOpen && "rotate-180")} />
      </button>
    {/if}
  </div>
</div>

{#if isAdvanced && moreOpen}
  <div class="bg-card grid grid-cols-2 gap-2.5 rounded-2xl border p-3">
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.minRating")}</span>
      <input type="number" inputmode="numeric" min="1" max="99" placeholder="25" bind:value={filters.minRating} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.maxRating")}</span>
      <input type="number" inputmode="numeric" min="1" max="99" placeholder="32" bind:value={filters.maxRating} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.charterHandle")}</span>
      <input type="text" inputmode="numeric" placeholder="78302" bind:value={filters.authorHandle} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("generic.tags")}</span>
      <input type="text" placeholder={t("generic.commaSeparatedTags")} bind:value={filters.tags} class={inputClass} />
    </label>
    <label class="col-span-2 space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.titleIncludes")}</span>
      <input type="text" placeholder={t("browse.titlePlaceholder")} bind:value={filters.titleIncludes} class={inputClass} />
    </label>
    <label class="col-span-2 space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.artistsIncludes")}</span>
      <input type="text" placeholder={t("browse.artistsPlaceholder")} bind:value={filters.artistsIncludes} class={inputClass} />
    </label>
    <label class="col-span-2 space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.descriptionIncludes")}</span>
      <input type="text" placeholder={t("browse.descriptionPlaceholder")} bind:value={filters.descriptionIncludes} class={inputClass} />
    </label>
  </div>
{/if}
