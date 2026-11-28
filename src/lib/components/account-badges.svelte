<script lang="ts">
  import { hasMessage, t } from "$lib/i18n.svelte.js";
  import type { AccountBadge } from "$lib/data/index.js";
  import { cn } from "$lib/utils.js";

  let { badges, class: className }: { badges: AccountBadge[]; class?: string } = $props();
</script>

{#each badges as b (b.badge)}
  {@const label = hasMessage(b.description_key) ? t(b.description_key) : undefined}
  <img
    src={b.image}
    alt={label ?? ""}
    title={label}
    width="128"
    height="128"
    loading="lazy"
    draggable="false"
    class={cn("inline-block size-[1.15em] shrink-0 select-none", className)}
  />
{/each}
