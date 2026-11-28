<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & { class?: string; children?: Snippet } = $props();
</script>

<div
  role="group"
  aria-roledescription="slide"
  class={cn("box-border min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
  {...rest}
>
  {@render children?.()}
</div>
