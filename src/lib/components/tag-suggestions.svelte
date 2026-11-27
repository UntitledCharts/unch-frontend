<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { RiAddLine } from "$lib/icons.js";

  // Optional quick-adds for the comma-separated tags field. Nothing is added unless clicked,
  // and these don't affect the chart's rating.
  const SUGGESTED = ["Easy", "Normal", "Hard", "Expert", "Master", "Append"];

  let { value = $bindable("") }: { value?: string } = $props();

  const current = $derived(
    value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
  );
  const remaining = $derived(SUGGESTED.filter((tag) => !current.includes(tag.toLowerCase())));

  function add(tag: string) {
    const trimmed = value.trim().replace(/,$/, "");
    value = trimmed ? `${trimmed}, ${tag}` : tag;
  }
</script>

{#if remaining.length}
  <div class="flex flex-wrap items-center gap-1.5">
    <span class="text-muted-foreground mr-0.5 text-xs">{t("upload.suggestedTags")}</span>
    {#each remaining as tag (tag)}
      <button
        type="button"
        onclick={() => add(tag)}
        class="text-muted-foreground hover:text-foreground hover:border-foreground/30 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition-colors"
      >
        <RiAddLine class="size-3" />
        {tag}
      </button>
    {/each}
  </div>
{/if}
