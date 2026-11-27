<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";

  let {
    level,
    size = "md",
    onImage = false,
    class: className,
  }: { level?: number; size?: "sm" | "md"; onImage?: boolean; class?: string } = $props();
</script>

<span
  class={cn(
    "font-heading inline-flex items-baseline gap-0.5 rounded-full font-semibold whitespace-nowrap tabular-nums",
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
    onImage ? "bg-black/65 text-white" : "bg-muted text-foreground",
    className,
  )}
>
  <span class={cn("text-[0.8em] font-medium", onImage ? "text-white/70" : "text-muted-foreground")}>{t("common.levelShort")}</span>{level ?? "?"}
</span>
