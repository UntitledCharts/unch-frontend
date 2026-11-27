<script lang="ts">
  import type { Snippet } from "svelte";
  import SiteHeader from "./site-header.svelte";
  import SiteFooter from "./site-footer.svelte";
  import { cn } from "$lib/utils.js";

  // Every page's outer frame: one of three widths, one padding, and the gap between its sections.
  // Pages pick a width; they don't set their own.
  const WIDTHS = { page: "max-w-6xl", form: "max-w-3xl", narrow: "max-w-md" } as const;

  let {
    width = "page",
    // dashboard pages get the header and footer from their layout
    frame = true,
    class: className,
    children,
  }: { width?: keyof typeof WIDTHS; frame?: boolean; class?: string; children: Snippet } = $props();
</script>

{#if frame}<SiteHeader />{/if}

<main class={cn("mx-auto space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8", WIDTHS[width], className)}>
  {@render children()}
</main>

{#if frame}<SiteFooter />{/if}
