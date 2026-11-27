<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { RiArrowLeftSLine, RiArrowRightSLine } from "$lib/icons.js";

  let {
    count,
    perPage = 10,
    page = $bindable(1),
  }: { count: number; perPage?: number; page?: number } = $props();

  const total = $derived(Math.max(1, Math.ceil(count / perPage)));

  function go(p: number) {
    page = Math.min(Math.max(1, p), total);
  }

  function onChange(e: Event) {
    const v = parseInt((e.currentTarget as HTMLInputElement).value, 10);
    if (!Number.isNaN(v)) go(v);
  }
</script>

{#if total > 1}
  <nav class="flex items-center justify-center gap-2 pt-2" aria-label={t("common.pagination")}>
    <button
      type="button"
      class="btn btn-sm btn-circle"
      onclick={() => go(page - 1)}
      disabled={page === 1}
      aria-label={t("common.previousPage")}
    >
      <RiArrowLeftSLine class="size-4" />
    </button>

    <div class="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
      <span>{t("common.page")}</span>
      <input
        type="number"
        min="1"
        max={total}
        value={page}
        onchange={onChange}
        aria-label={t("common.pageNumber")}
        class="bg-card focus-visible:ring-ring/50 h-8 w-14 rounded-lg border text-center text-sm tabular-nums outline-none focus-visible:ring-2"
      />
      <span>{t("common.ofPages", [total])}</span>
    </div>

    <button
      type="button"
      class="btn btn-sm btn-circle"
      onclick={() => go(page + 1)}
      disabled={page === total}
      aria-label={t("common.nextPage")}
    >
      <RiArrowRightSLine class="size-4" />
    </button>
  </nav>
{/if}
