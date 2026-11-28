<script lang="ts">
  import { segments, t } from "$lib/i18n.svelte.js";
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
  <nav class="flex items-center justify-center gap-2 pt-2" aria-label={t("generic.pagination")}>
    <button
      type="button"
      class="btn btn-sm btn-circle"
      onclick={() => go(page - 1)}
      disabled={page === 1}
      aria-label={t("generic.previousPage")}
    >
      <RiArrowLeftSLine class="size-4" />
    </button>

    <div class="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
      {#each segments(t("generic.pageOf")) as part, i (i)}
        {#if part === 1}
          <input
            type="number"
            min="1"
            max={total}
            value={page}
            onchange={onChange}
            aria-label={t("generic.pageNumber")}
            class="bg-card focus-visible:ring-ring/50 h-8 w-14 rounded-lg border text-center text-sm tabular-nums outline-none focus-visible:ring-2"
          />
        {:else if part === 2}
          <span>{total}</span>
        {:else if typeof part === "string" && part.trim()}
          <span>{part.trim()}</span>
        {/if}
      {/each}
    </div>

    <button
      type="button"
      class="btn btn-sm btn-circle"
      onclick={() => go(page + 1)}
      disabled={page === total}
      aria-label={t("generic.nextPage")}
    >
      <RiArrowRightSLine class="size-4" />
    </button>
  </nav>
{/if}
