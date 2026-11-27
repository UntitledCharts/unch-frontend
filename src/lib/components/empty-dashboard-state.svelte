<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Button from "./button.svelte";
  import { RiFolder3Line, RiCompass3Line } from "$lib/icons.js";

  let {
    title = t("dashboard.emptyTitle"),
    message = t("dashboard.emptyMessage"),
    ctaHref = "/browse",
    ctaLabel = t("error.browseCharts"),
  }: {
    title?: string;
    message?: string;
    ctaHref?: string;
    ctaLabel?: string;
  } = $props();
</script>

<div
  class="text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center"
>
  <RiFolder3Line class="size-10 opacity-50" />
  <div class="space-y-1">
    <p class="text-foreground text-sm font-medium">{title}</p>
    <p class="max-w-xs text-sm">{message}</p>
  </div>
  <Button variant="outline" size="sm" href={ctaHref}>
    <RiCompass3Line class="size-4" />
    {ctaLabel}
  </Button>
</div>
