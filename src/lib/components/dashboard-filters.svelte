<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { activeFilterCount, type ChartFilterFields } from "$lib/data/index.js";
  import { RiStarFill } from "$lib/icons.js";

  let { fields = $bindable() }: { fields: ChartFilterFields } = $props();

  function clear() {
    fields.staffPick = false;
    fields.minRating = null;
    fields.maxRating = null;
    fields.titleIncludes = "";
    fields.artistsIncludes = "";
    fields.descriptionIncludes = "";
    fields.tags = "";
  }

  const inputClass =
    "bg-card focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";
</script>

<div class="bg-card/60 space-y-3 rounded-2xl border p-3 sm:p-4">
  <div class="flex items-center justify-between gap-3">
    <button
      type="button"
      onclick={() => (fields.staffPick = !fields.staffPick)}
      aria-pressed={fields.staffPick}
      class={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        fields.staffPick
          ? "border-amber-400/40 bg-amber-400/15 text-amber-600 dark:text-amber-300"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
      )}
    >
      <RiStarFill class="size-3" /> {t("browse.staffPicksOnly")}
    </button>
    {#if activeFilterCount(fields) > 0}
      <button type="button" onclick={clear} class="text-primary text-sm hover:underline">{t("generic.clear")}</button>
    {/if}
  </div>
  <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.minRating")}</span>
      <input type="number" inputmode="numeric" placeholder="-999" bind:value={fields.minRating} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.maxRating")}</span>
      <input type="number" inputmode="numeric" placeholder="999" bind:value={fields.maxRating} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("generic.tags")}</span>
      <input type="text" placeholder={t("generic.commaSeparatedTags")} bind:value={fields.tags} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.titleIncludes")}</span>
      <input type="text" placeholder={t("browse.titlePlaceholder")} bind:value={fields.titleIncludes} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.artistsIncludes")}</span>
      <input type="text" placeholder={t("browse.artistsPlaceholder")} bind:value={fields.artistsIncludes} class={inputClass} />
    </label>
    <label class="space-y-1">
      <span class="text-muted-foreground text-xs">{t("browse.descriptionIncludes")}</span>
      <input type="text" placeholder={t("browse.descriptionPlaceholder")} bind:value={fields.descriptionIncludes} class={inputClass} />
    </label>
  </div>
</div>
