<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";

  // Nothing to show: one sentence saying what is missing and, if there is something to do about it,
  // one action passed as children. No picture, no box.
  let { text, class: className, children }: { text: string; class?: string; children?: Snippet } = $props();
</script>

<div class={cn("flex flex-col items-center gap-4 px-4 py-10 text-center", className)}>
  <p class="text-muted-foreground max-w-prose text-sm">{text}</p>
  {@render children?.()}
</div>
