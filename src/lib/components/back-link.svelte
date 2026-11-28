<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { RiArrowLeftLine } from "$lib/icons.js";

  // The way back, at the top of a page: an arrow and the name of the place it returns to.
  let { href, label, class: className }: { href: string; label: string; class?: string } = $props();
</script>

<a {href} class={cn("text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors", className)}>
  <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
  {label}
</a>
