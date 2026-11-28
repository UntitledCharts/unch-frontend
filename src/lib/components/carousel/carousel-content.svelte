<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getCarouselContext } from "./context.js";

  let {
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & { class?: string; children?: Snippet } = $props();

  const ctx = getCarouselContext();
  let el: HTMLElement;

  $effect(() => {
    ctx.setTrack(el);
    return () => ctx.setTrack(null);
  });
</script>

<div
  bind:this={el}
  class={cn("carousel w-full snap-x snap-mandatory", className)}
  onscroll={ctx.onScroll}
  {...rest}
>
  {@render children?.()}
</div>
