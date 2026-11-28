<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Modal from "./modal.svelte";
  import Button from "./button.svelte";
  import { session } from "$lib/state/session.svelte";
  import { deleteChart } from "$lib/data/staff.js";
  import type { Chart } from "$lib/data/index.js";
  import { RiDeleteBinLine, RiErrorWarningLine } from "$lib/icons.js";

  // Deleting can't be undone, so the button stays locked until the chart's title is typed out.
  let {
    open = $bindable(false),
    chart,
    ondeleted,
  }: { open?: boolean; chart: Chart; ondeleted?: () => void } = $props();

  const name = $derived(chart.title.replace(/:[a-zA-Z0-9_]+:/g, "").trim() || chart.id);
  let typed = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  const matches = $derived(typed.trim().toLowerCase() === name.toLowerCase());

  $effect(() => {
    if (open) {
      typed = "";
      error = null;
    }
  });

  async function confirm() {
    const key = session.sessionKey;
    if (!matches || !key) return;
    busy = true;
    const res = await deleteChart(key, chart.id);
    busy = false;
    if (res.ok) {
      open = false;
      ondeleted?.();
    } else {
      error = res.error;
    }
  }
</script>

<Modal bind:open>
  <div role="alertdialog" aria-labelledby="delete-chart-title" aria-describedby="delete-chart-body" class="space-y-4 p-1">
    <div class="flex gap-3">
      <span class="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-500">
        <RiErrorWarningLine class="size-5" />
      </span>
      <div class="space-y-1.5">
        <h2 id="delete-chart-title" class="text-lg font-semibold">{t("deleteChart.title")}</h2>
        <p id="delete-chart-body" class="text-muted-foreground text-sm">{t("deleteChart.body")}</p>
      </div>
    </div>

    <label class="block space-y-1.5">
      <span class="text-sm">{t("deleteChart.typeToConfirm", [name])}</span>
      <input
        bind:value={typed}
        autocomplete="off"
        spellcheck="false"
        placeholder={name}
        class="bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
      />
    </label>

    {#if error}<p class="text-sm text-rose-500">{error}</p>{/if}

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (open = false)}>
        {t("generic.cancel")}
      </Button>
      <Button
        type="button"
        disabled={!matches || busy}
        onclick={confirm}
        class="rounded-full border-rose-600 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
      >
        <RiDeleteBinLine class="size-4" />
        {busy ? t("generic.deleting") : t("generic.deleteChart")}
      </Button>
    </div>
  </div>
</Modal>
