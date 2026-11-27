<script lang="ts">
  import type { Collection } from "$lib/data/index.js";
  import CollectionFolderCard from "./collection-folder-card.svelte";
  import EmptyDashboardState from "./empty-dashboard-state.svelte";

  let {
    collections,
    emptyTitle,
    emptyMessage,
  }: {
    collections: Collection[];
    emptyTitle?: string;
    emptyMessage?: string;
  } = $props();
</script>

{#if collections.length}
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
    {#each collections as collection (collection.id)}
      <CollectionFolderCard {collection} />
    {/each}
  </div>
{:else}
  <EmptyDashboardState title={emptyTitle} message={emptyMessage} />
{/if}
