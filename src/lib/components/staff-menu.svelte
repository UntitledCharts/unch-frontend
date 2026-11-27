<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { goto, invalidateAll } from "$app/navigation";
  import { session } from "$lib/state/session.svelte";
  import { setChartVisibility, setStaffPick, setChartConstant } from "$lib/data/staff.js";
  import type { Chart } from "$lib/data/index.js";
  import Modal from "./modal.svelte";
  import Button from "./button.svelte";
  import OptionsMenu, { menuRow } from "./options-menu.svelte";
  import DeleteChartDialog from "./delete-chart-dialog.svelte";
  import { RiCheckLine, RiStarFill, RiPulseLine, RiDeleteBinLine } from "$lib/icons.js";

  // Moderation for one chart, next to the chart's own actions. It checks the signed-in role itself, so
  // placing it on a page can never show it to anyone but mods and admins; the API checks again on
  // every action, since each one is sent with the user's own session.
  let { chart, class: className }: { chart: Chart; class?: string } = $props();

  const isStaff = $derived(session.user?.role === "Admin" || session.user?.role === "Mod");

  let busy = $state(false);
  let error = $state<string | null>(null);
  let constantOpen = $state(false);
  let deleteOpen = $state(false);
  // svelte-ignore state_referenced_locally
  let constant = $state(String(chart.rating));

  type Action = (key: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  async function run(action: Action) {
    const key = session.sessionKey;
    if (!key || busy || !isStaff) return;
    busy = true;
    error = null;
    const res = await action(key);
    busy = false;
    if (res.ok) await invalidateAll();
    else error = res.error;
  }

  const statuses = [
    { value: "PUBLIC", label: "staff.makePublic", title: "staff.confirmPublic", body: "staff.bodyPublic" },
    { value: "UNLISTED", label: "staff.makeUnlisted", title: "staff.confirmUnlisted", body: "staff.bodyUnlisted" },
    { value: "PRIVATE", label: "staff.makePrivate", title: "staff.confirmPrivate", body: "staff.bodyPrivate" },
  ] as const;

  // every action asks once before it runs; the confirm button repeats the action's own label
  type Pending = { title: string; body: string; label: string; action: Action };
  let pending = $state<Pending | null>(null);
  let confirmOpen = $state(false);
  function ask(p: Pending) {
    pending = p;
    confirmOpen = true;
  }
  function confirm() {
    if (!pending) return;
    confirmOpen = false;
    run(pending.action);
  }
</script>

{#if isStaff}
  <OptionsMenu label={t("staff.title")} class={className ?? "bg-background/60 hover:bg-background/80 size-11 border backdrop-blur"}>
    {#snippet items({ big, close })}
      <p class="text-muted-foreground px-3 pt-1 pb-1 text-xs font-medium">{t("staff.title")}</p>
      {#each statuses as s (s.value)}
        <!-- the current one is shown checked and can't be picked again -->
        <button
          type="button"
          role="menuitem"
          disabled={busy || chart.status === s.value}
          onclick={() => {
            close();
            ask({ title: t(s.title), body: t(s.body), label: t(s.label), action: (k) => setChartVisibility(k, chart.id, s.value) });
          }}
          class={menuRow(big)}
        >
          <RiCheckLine class={chart.status === s.value ? "size-4 shrink-0" : "size-4 shrink-0 opacity-0"} />
          {t(s.label)}
        </button>
      {/each}
      <hr class="border-border/60 my-1" />
      <button
        type="button"
        role="menuitem"
        disabled={busy}
        onclick={() => {
          close();
          ask(
            chart.staff_pick
              ? { title: t("staff.confirmRemovePick"), body: t("staff.bodyRemovePick"), label: t("staff.removePick"), action: (k) => setStaffPick(k, chart.id, false) }
              : { title: t("staff.confirmAddPick"), body: t("staff.bodyAddPick"), label: t("staff.addPick"), action: (k) => setStaffPick(k, chart.id, true) },
          );
        }}
        class={menuRow(big)}
      >
        <RiStarFill class="size-4 shrink-0 text-amber-500" />
        {chart.staff_pick ? t("staff.removePick") : t("staff.addPick")}
      </button>
      <button type="button" role="menuitem" onclick={() => { close(); constantOpen = true; }} class={menuRow(big)}>
        <RiPulseLine class="size-4 shrink-0" />
        {t("staff.changeConstant")}
      </button>
      <hr class="border-border/60 my-1" />
      <button type="button" role="menuitem" onclick={() => { close(); deleteOpen = true; }} class={menuRow(big, true)}>
        <RiDeleteBinLine class="size-4 shrink-0" />
        {t("deleteChart.confirm")}
      </button>
    {/snippet}
  </OptionsMenu>

  {#if error}<p class="text-sm text-rose-500" role="alert">{error}</p>{/if}

  <Modal bind:open={constantOpen}>
    <form
      class="space-y-4 p-1"
      onsubmit={(e) => {
        e.preventDefault();
        const n = Number.parseFloat(constant);
        if (Number.isNaN(n)) return;
        constantOpen = false;
        ask({
          title: t("staff.confirmConstant", [String(n)]),
          body: t("staff.bodyConstant", [String(chart.rating), String(n)]),
          label: t("staff.changeConstant"),
          action: (k) => setChartConstant(k, chart.id, n),
        });
      }}
    >
      <h2 class="text-lg font-semibold">{t("staff.changeConstant")}</h2>
      <input
        bind:value={constant}
        inputmode="decimal"
        aria-label={t("staff.constant")}
        class="bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm tabular-nums outline-none focus-visible:ring-2"
      />
      <div class="flex justify-end gap-2">
        <Button variant="outline" type="button" class="rounded-full" onclick={() => (constantOpen = false)}>{t("oauth.cancel")}</Button>
        <Button type="submit" class="rounded-full">{t("staff.save")}</Button>
      </div>
    </form>
  </Modal>

  <Modal bind:open={confirmOpen}>
    <div role="alertdialog" aria-labelledby="staff-confirm-title" aria-describedby="staff-confirm-body" class="space-y-4 p-1">
      <div class="space-y-1.5">
        <h2 id="staff-confirm-title" class="text-lg font-semibold">{pending?.title}</h2>
        <p id="staff-confirm-body" class="text-muted-foreground text-sm">{pending?.body}</p>
      </div>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" class="rounded-full" onclick={() => (confirmOpen = false)}>{t("oauth.cancel")}</Button>
        <Button type="button" class="rounded-full" onclick={confirm}>{pending?.label}</Button>
      </div>
    </div>
  </Modal>

  <DeleteChartDialog bind:open={deleteOpen} {chart} ondeleted={() => goto("/browse")} />
{/if}
