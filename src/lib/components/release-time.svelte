<script lang="ts" module>
  // datetime-local wants "YYYY-MM-DDTHH:mm" in the browser's own time zone
  export function toLocalInput(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
</script>

<script lang="ts">
  import { t, i18n } from "$lib/i18n.svelte.js";

  // The release-time picker shown when a chart's visibility is set to Scheduled (upload and edit).
  let { value = $bindable() }: { value: string } = $props();

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const preview = $derived.by(() => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(i18n.locale, { dateStyle: "full", timeStyle: "short" });
  });
</script>

<label class="block space-y-1.5">
  <span class="text-sm font-medium">{t("edit.releaseTime")}</span>
  <input
    type="datetime-local"
    bind:value
    min={toLocalInput(new Date())}
    required
    class="bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
  />
  {#if preview}
    <span class="text-muted-foreground block text-xs">{preview} · {zone}</span>
  {/if}
</label>
