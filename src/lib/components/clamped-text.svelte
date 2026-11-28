<script lang="ts">
  import type { Snippet } from "svelte";
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";

  // Shows the first `lines` lines with a Read more toggle, only when the text runs past them at the current width
  let { lines, class: className, children }: { lines: number; class?: string; children: Snippet } = $props();

  const uid = $props.id();
  let expanded = $state(false);
  let overflows = $state(false);
  let box = $state<HTMLDivElement | null>(null);

  $effect(() => {
    const el = box;
    if (!el || expanded) return;
    const measure = () => (overflows = el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={box}
  id={uid}
  class={cn(className, !expanded && "overflow-hidden")}
  style={expanded ? undefined : `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${lines}; line-clamp: ${lines};`}
>
  {@render children()}
</div>
{#if overflows}
  <button
    type="button"
    aria-expanded={expanded}
    aria-controls={uid}
    onclick={() => (expanded = !expanded)}
    class="text-primary text-sm font-medium hover:underline"
  >
    {expanded ? t("generic.readLess") : t("generic.readMore")}
  </button>
{/if}
