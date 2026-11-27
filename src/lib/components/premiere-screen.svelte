<script lang="ts">
  import { t, i18n } from "$lib/i18n.svelte.js";
  import { invalidateAll } from "$app/navigation";
  import { SITE_URL } from "$lib/config.js";
  import { RiCalendarEventLine, RiTimeLine } from "$lib/icons.js";

  // Sits where the preview goes while a release is scheduled: the chart's art and a live countdown.
  // Once it reaches zero the page reloads until the chart is actually out.
  let { at, title, chartId, art }: { at: string; title: string; chartId: string; art: string | null } = $props();

  const release = $derived(new Date(at).getTime());
  let now = $state(Date.now());
  const left = $derived(Math.max(0, release - now));
  const parts = $derived([
    { value: Math.floor(left / 86_400_000), label: t("levelDetail.days") },
    { value: Math.floor(left / 3_600_000) % 24, label: t("levelDetail.hours") },
    { value: Math.floor(left / 60_000) % 60, label: t("levelDetail.mins") },
    { value: Math.floor(left / 1000) % 60, label: t("levelDetail.secs") },
  ]);

  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });
  $effect(() => {
    if (left > 0) return;
    const retry = setInterval(() => invalidateAll(), 5000);
    invalidateAll();
    return () => clearInterval(retry);
  });

  function addToCalendar() {
    const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const name = title.replace(/:[a-zA-Z0-9_]+:/g, "").trim();
    const url = `${SITE_URL}/levels/UnCh-${chartId}`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//UntitledCharts//Release//EN", "BEGIN:VEVENT",
      `UID:release-${chartId}@untitledcharts`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(release)}`,
      `DTEND:${stamp(release + 30 * 60_000)}`, `SUMMARY:${name} releases on UntitledCharts`, `URL:${url}`, `DESCRIPTION:${url}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    link.download = `${name || "release"}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
</script>

<div class="relative isolate grid aspect-video w-full place-items-center overflow-hidden bg-slate-950 text-white sm:rounded-3xl">
  {#if art}
    <img src={art} alt="" class="absolute inset-0 -z-10 size-full object-cover opacity-35" />
  {/if}
  <div class="absolute inset-0 -z-10 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-slate-950/60"></div>

  <div class="flex flex-col items-center gap-3 px-4 text-center sm:gap-4">
    <p class="inline-flex items-center gap-1.5 text-xs font-medium text-white/75 sm:text-sm">
      <RiTimeLine class="size-4" />
      {left > 0 ? t("levelDetail.releasesIn") : t("levelDetail.releasingNow")}
    </p>
    <div class="flex gap-4 sm:gap-7" role="timer" aria-live="off">
      {#each parts as part (part.label)}
        <div>
          <div class="font-heading text-3xl leading-none font-bold tabular-nums sm:text-6xl">{String(part.value).padStart(2, "0")}</div>
          <div class="mt-1 text-[11px] text-white/60 sm:text-xs">{part.label}</div>
        </div>
      {/each}
    </div>
    <p class="text-xs text-white/75 sm:text-sm">
      {new Date(at).toLocaleString(i18n.locale, { dateStyle: "full", timeStyle: "short" })}
    </p>
    <button
      type="button"
      onclick={addToCalendar}
      class="inline-flex h-9 items-center gap-2 rounded-full bg-white/12 px-4 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/20 sm:text-sm"
    >
      <RiCalendarEventLine class="size-4" />
      {t("levelDetail.addToCalendar")}
    </button>
  </div>
</div>
