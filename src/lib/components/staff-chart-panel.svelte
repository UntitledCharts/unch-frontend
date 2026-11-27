<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { goto, invalidateAll } from "$app/navigation";
  import { session } from "$lib/state/session.svelte";
  import { setChartVisibility, setStaffPick, setChartConstant } from "$lib/data/staff.js";
  import type { Chart } from "$lib/data/index.js";
  import DeleteChartDialog from "./delete-chart-dialog.svelte";
  import { RiShieldCheckLine, RiStarFill, RiDeleteBinLine } from "$lib/icons.js";

  // Moderation tools on a level page, shown to mods and admins only.
  let { chart }: { chart: Chart } = $props();

  type Status = "PUBLIC" | "UNLISTED" | "PRIVATE";
  const statuses: { value: Status; key: string }[] = [
    { value: "PUBLIC", key: "dashboard.statusPublic" },
    { value: "UNLISTED", key: "dashboard.statusUnlisted" },
    { value: "PRIVATE", key: "dashboard.statusPrivate" },
  ];

  let busy = $state(false);
  let message = $state<{ ok: boolean; text: string } | null>(null);
  // svelte-ignore state_referenced_locally
  let constant = $state(String(chart.rating));
  let deleteOpen = $state(false);

  async function run(action: (key: string) => Promise<{ ok: true } | { ok: false; error: string }>, done: string) {
    const key = session.sessionKey;
    if (!key || busy) return;
    busy = true;
    message = null;
    const res = await action(key);
    busy = false;
    message = res.ok ? { ok: true, text: done } : { ok: false, text: res.error };
    if (res.ok) await invalidateAll();
  }

  const pill = "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-50";
</script>

<section class="bg-card space-y-4 rounded-3xl border border-amber-400/30 p-4 sm:p-5">
  <h2 class="inline-flex items-center gap-2 text-base font-semibold">
    <RiShieldCheckLine class="size-5 text-amber-500" />
    {t("staff.title")}
  </h2>

  <div class="space-y-1.5">
    <p class="text-muted-foreground text-xs">{t("dashboard.visibility")}</p>
    <div class="flex flex-wrap gap-1.5">
      {#each statuses as s (s.value)}
        <button
          type="button"
          disabled={busy || chart.status === s.value}
          aria-pressed={chart.status === s.value}
          onclick={() => run((k) => setChartVisibility(k, chart.id, s.value), t("staff.saved"))}
          class={cn(pill, chart.status === s.value ? "border-primary/50 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          {t(s.key)}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-wrap items-end gap-3">
    <button
      type="button"
      disabled={busy}
      onclick={() => run((k) => setStaffPick(k, chart.id, !chart.staff_pick), t("staff.saved"))}
      class={cn(pill, chart.staff_pick ? "border-amber-400/50 bg-amber-400/15 text-amber-600 dark:text-amber-300" : "text-muted-foreground hover:text-foreground")}
    >
      <RiStarFill class="size-3.5" />
      {chart.staff_pick ? t("levelDetail.removeStaffPick") : t("levelDetail.makeStaffPick")}
    </button>

    <form
      class="flex items-end gap-1.5"
      onsubmit={(e) => {
        e.preventDefault();
        const n = Number.parseFloat(constant);
        if (!Number.isNaN(n)) run((k) => setChartConstant(k, chart.id, n), t("staff.saved"));
      }}
    >
      <label class="space-y-1">
        <span class="text-muted-foreground block text-xs">{t("staff.constant")}</span>
        <input
          bind:value={constant}
          inputmode="decimal"
          class="bg-background focus-visible:ring-ring/50 h-8 w-20 rounded-full border px-3 text-xs tabular-nums outline-none focus-visible:ring-2"
        />
      </label>
      <button type="submit" disabled={busy} class={cn(pill, "text-muted-foreground hover:text-foreground")}>{t("staff.save")}</button>
    </form>

    <button
      type="button"
      onclick={() => (deleteOpen = true)}
      class={cn(pill, "ml-auto border-rose-500/40 text-rose-500 hover:bg-rose-500/10")}
    >
      <RiDeleteBinLine class="size-3.5" />
      {t("deleteChart.confirm")}
    </button>
  </div>

  {#if message}
    <p class={cn("text-xs", message.ok ? "text-emerald-500" : "text-rose-500")}>{message.text}</p>
  {/if}
</section>

<DeleteChartDialog bind:open={deleteOpen} {chart} ondeleted={() => goto("/browse")} />
