<script lang="ts">
  import { t, i18n } from "$lib/i18n.svelte.js";
  import { compact, relativeTime } from "$lib/data/index.js";
  import { cn } from "$lib/utils.js";
  import { RiHeart3Fill, RiChat3Line, RiTimeLine } from "$lib/icons.js";

  // Likes, comments and a date as icon and number, the way the chart cards show them. Counts are
  // shortened here because they are in passing; the exact date is on hover.
  let {
    likes,
    comments,
    date,
    size = "md",
    class: className,
  }: { likes: number; comments: number; date?: string | number; size?: "sm" | "md"; class?: string } = $props();

  const icon = $derived(size === "sm" ? "size-3.5" : "size-4");
</script>

<p
  class={cn(
    "text-muted-foreground flex flex-wrap items-center gap-y-1 tabular-nums [&>span]:inline-flex [&>span]:items-center",
    size === "sm" ? "gap-x-3 text-xs [&>span]:gap-1" : "gap-x-4 text-sm [&>span]:gap-1.5",
    className,
  )}
>
  <span title={t("levelDetail.likes")}><RiHeart3Fill class={cn(icon, "text-like")} />{compact(likes)}</span>
  <span title={t("levelDetail.comments")}><RiChat3Line class={icon} />{compact(comments)}</span>
  {#if date !== undefined}
    <span title={new Date(date).toLocaleString(i18n.locale, { dateStyle: "long", timeStyle: "short" })}>
      <RiTimeLine class={icon} /><time datetime={new Date(date).toISOString()}>{relativeTime(date)}</time>
    </span>
  {/if}
</p>
