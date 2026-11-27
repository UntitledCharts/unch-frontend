<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";

  // A label over a value, for use inside a <dl>. A row of them is spaced, or divided by hairlines;
  // they are never boxed one by one. The value is a number that is the point, so it takes the
  // display face.
  let { label, class: className, children }: { label: string; class?: string; children: Snippet } = $props();
</script>

<div class={cn("min-w-0", className)}>
  <dt class="text-muted-foreground text-xs">{label}</dt>
  <dd class="font-heading mt-1 text-lg font-semibold tabular-nums">{@render children()}</dd>
</div>
