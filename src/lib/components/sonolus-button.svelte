<script lang="ts">
  import { cn } from "$lib/utils.js";

  // The one way out of the site. Nothing else is drawn in Sonolus's navy, so this pill always means
  // "this opens Sonolus". `text` is the translated sentence with {1} where the wordmark goes
  // ("Open via {1}").
  let {
    text,
    href,
    onclick,
    class: className,
  }: { text: string; href?: string; onclick?: () => void; class?: string } = $props();

  const parts = $derived(text.split("{1}").map((s) => s.trim()));
  const classes = $derived(
    cn(
      "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap text-white! transition-opacity hover:opacity-90",
      className,
    ),
  );
</script>

{#snippet label()}
  {#if parts[0]}<span>{parts[0]}</span>{/if}
  <img src="https://sonolus.com/logo.png" alt="Sonolus" width="1775" height="360" class="h-3.5 w-auto" />
  {#if parts[1]}<span>{parts[1]}</span>{/if}
{/snippet}

{#if href}
  <a {href} target="_blank" rel="noopener noreferrer" class={classes} style="background-color: #000020">
    {@render label()}
  </a>
{:else}
  <button type="button" {onclick} class={classes} style="background-color: #000020">
    {@render label()}
  </button>
{/if}
