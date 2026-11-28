<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { tick } from "svelte";
  import Modal from "./modal.svelte";
  import Button from "./button.svelte";
  import Select from "./select.svelte";
  import PublicChecklist from "./public-checklist.svelte";
  import ReleaseTime, { toLocalInput } from "./release-time.svelte";
  import { session } from "$lib/state/session.svelte";
  import { setChartVisibility, type ChartDetails, type Failure } from "$lib/data/index.js";
  import { formatTime } from "$lib/data/format.js";

  // Visibility and the scheduled release are saved together in one request, apart from the chart's
  // details and files. An unlisted or private chart keeps its schedule when switched between the two.
  type Status = ChartDetails["status"];
  let {
    open = $bindable(false),
    chart,
    onsaved,
  }: {
    open?: boolean;
    chart: ChartDetails;
    onsaved: (change: { status: Status; scheduled_publish: string | null }) => void;
  } = $props();

  const options: { value: Status; label: string }[] = [
    { value: "PUBLIC", get label() { return t("generic.public"); } },
    { value: "UNLISTED", get label() { return t("generic.unlisted"); } },
    { value: "PRIVATE", get label() { return t("generic.private"); } },
  ];

  let status = $state<Status>("PRIVATE");
  let scheduled = $state(false);
  let releaseAt = $state("");
  let force = $state(false);
  let confirmed = $state(false);
  let checklistInvalid = $state(false);
  let error = $state<string | null>(null);
  let saving = $state(false);
  let checklist = $state<{ focusFirst: () => void } | null>(null);
  let errorBox = $state<HTMLDivElement | null>(null);

  const wasPublic = $derived(chart.status === "PUBLIC");
  const wasScheduled = $derived(!wasPublic && !!chart.scheduled_publish);
  const canForce = $derived(chart.viewer.staff_permissions.includes("chart.visibility"));
  // a public chart can't be pulled back into a scheduled release
  const canSchedule = $derived(status !== "PUBLIC" && !wasPublic);
  const willSchedule = $derived(canSchedule && scheduled);
  const needsConfirm = $derived((status === "PUBLIC" && !wasPublic) || (willSchedule && !wasScheduled));

  $effect(() => {
    if (!open) return;
    status = chart.status;
    scheduled = wasScheduled;
    releaseAt = toLocalInput(wasScheduled ? new Date(chart.scheduled_publish!) : new Date(Date.now() + 24 * 3600 * 1000));
    force = false;
    checklistInvalid = false;
    error = null;
  });

  function failure(res: Failure): string {
    if (res.code === "error.chart.preview_required") return t("edit.previewRequired");
    if (res.code === "error.chart.too_short")
      return t("files.chartTooShort", [formatTime(Number(res.params?.seconds ?? 0)), String(res.params?.min_seconds ?? "")]);
    return t("dashboard.updateFailed", [res.error]);
  }

  async function fail(message: string) {
    error = message;
    await tick();
    errorBox?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    errorBox?.focus({ preventScroll: true });
  }

  // undefined keeps the schedule as it is, null cancels it
  function publishAt(): Date | null | undefined {
    if (status === "PUBLIC") return undefined;
    if (!willSchedule) return wasScheduled ? null : undefined;
    const at = new Date(releaseAt);
    return wasScheduled && at.getTime() === new Date(chart.scheduled_publish!).getTime() ? undefined : at;
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    checklistInvalid = false;
    const key = session.sessionKey;
    if (!key) return fail(t("error.unauthorizedBody"));
    const at = publishAt();
    if (status === chart.status && at === undefined) {
      open = false;
      return;
    }
    if (at && !(at.getTime() > Date.now())) return fail(t("edit.scheduleInPast"));
    if (needsConfirm && !confirmed) {
      checklistInvalid = true;
      await tick();
      checklist?.focusFirst();
      return;
    }
    saving = true;
    const res = await setChartVisibility(key, chart.id, status, canForce && force, at);
    saving = false;
    if (!res.ok) return fail(failure(res));
    const kept = status === "PUBLIC" ? null : chart.scheduled_publish;
    onsaved({ status, scheduled_publish: at === undefined ? kept : (at?.toISOString() ?? null) });
    open = false;
  }
</script>

<Modal bind:open labelledby="visibility-title" class="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto">
  <form onsubmit={save} class="space-y-4 p-1">
    <h2 id="visibility-title" class="text-lg font-semibold">{t("generic.visibility")}</h2>
    {#if error}
      <div
        bind:this={errorBox}
        tabindex="-1"
        role="alert"
        class="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-600 outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 dark:text-rose-300"
      >
        {error}
      </div>
    {/if}
    <div class="space-y-1.5">
      <Select bind:value={status} {options} ariaLabel={t("generic.visibility")} class="w-full" />
      <p class="text-muted-foreground text-xs">{t(`visibility.hint${status}`)}</p>
    </div>
    {#if canSchedule}
      <label class="flex cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" bind:checked={scheduled} class="checkbox checkbox-sm checkbox-primary shrink-0 rounded-[4px]" />
        {t("dashboard.schedulePublish")}
      </label>
      {#if scheduled}<ReleaseTime bind:value={releaseAt} />{/if}
    {/if}
    {#if needsConfirm}
      <PublicChecklist
        bind:this={checklist}
        bind:complete={confirmed}
        bind:force
        invalid={checklistInvalid}
        previewMissing={!chart.files.preview}
        {canForce}
      />
    {/if}
    <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (open = false)}>
        {t("generic.cancel")}
      </Button>
      <Button type="submit" disabled={saving} class="rounded-full">
        {saving ? t("generic.saving") : t("generic.save")}
      </Button>
    </div>
  </form>
</Modal>
