<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";

  // A surface about one chart (or one person): the card colour with their own image blurred into a
  // tint behind the content. The same recipe as the chart cards. With no image it is a plain surface.
  // The tint is only ever on the surface; controls inside keep the site's colours.
  let { image, class: className, children }: { image?: string | null; class?: string; children: Snippet } = $props();
</script>

<div class={cn("bg-card clip-rounded relative isolate overflow-hidden rounded-3xl", className)}>
  {#if image}
    <img
      src={image}
      alt=""
      decoding="async"
      class="pointer-events-none absolute -inset-1/3 -z-10 size-[166%] max-w-none object-cover opacity-20 blur-2xl saturate-150"
    />
  {/if}
  {@render children()}
</div>
