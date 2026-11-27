<script lang="ts">
  let { variant = "card" }: { variant?: "card" | "list" } = $props();
</script>

{#if variant === "list"}
  <article class="bg-card flex items-center gap-3 rounded-2xl p-2.5">
    <div class="bg-muted size-16 shrink-0 animate-pulse rounded-xl"></div>
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="bg-muted h-4 w-3/4 animate-pulse rounded-full"></div>
      <div class="bg-muted h-3 w-1/2 animate-pulse rounded-full"></div>
      <div class="bg-muted h-3 w-20 animate-pulse rounded-full"></div>
    </div>
  </article>
{:else}
  <div class="bg-card flex h-full flex-col gap-2.5 rounded-3xl p-2">
    <div class="bg-muted mx-auto mt-3 aspect-square w-[58%] animate-pulse rounded-2xl"></div>
    <div class="flex flex-1 flex-col gap-2 px-2 pb-1.5">
      <div class="bg-muted h-3.5 w-3/4 animate-pulse rounded-full"></div>
      <div class="bg-muted h-3 w-1/2 animate-pulse rounded-full"></div>
      <div class="bg-muted mt-1 h-6 w-full animate-pulse rounded-full"></div>
      <div class="bg-muted mt-1 h-3 w-2/3 animate-pulse rounded-full"></div>
    </div>
  </div>
{/if}
