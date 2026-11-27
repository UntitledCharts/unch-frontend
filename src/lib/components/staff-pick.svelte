<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { RiStarFill } from "$lib/icons.js";

  // The Staff Pick mark, drawn one way everywhere. `compact` keeps only the star, for tight spots.
  let { compact = false, class: className }: { compact?: boolean; class?: string } = $props();
</script>

<span
  title={t("common.staff")}
  class={cn(
    "bg-staff text-staff-foreground inline-flex shrink-0 items-center gap-1 rounded-full text-2xs font-bold",
    compact ? "p-1" : "px-2 py-0.5",
    className,
  )}
>
  <RiStarFill class="size-2.5" />
  {#if !compact}{t("common.staff")}{:else}<span class="sr-only">{t("common.staff")}</span>{/if}
</span>
