<script lang="ts">
  import { cn } from "$lib/utils.js";

  let {
    id,
    title = "",
    src = null,
    ring,
    rounded = "rounded-xl",
    // for the one image that's the page's main content (LCP): load right away, ahead of everything else
    priority = false,
    class: className,
  }: {
    id?: string;
    title?: string;
    src?: string | null;
    ring?: string;
    rounded?: string;
    priority?: boolean;
    class?: string;
  } = $props();

  let failed = $state(false);
  let loaded = $state(false);
  const showImage = $derived(!!src && !failed);
</script>

<div
  class={cn(
    "bg-muted relative isolate shrink-0 overflow-hidden",
    rounded,
    ring && `ring-2 ${ring}`,
    className,
  )}
  aria-hidden={showImage && loaded ? undefined : "true"}
>
  {#if showImage}
    <img
      src={src}
      alt={title}
      loading={priority ? "eager" : "lazy"}
      fetchpriority={priority ? "high" : "auto"}
      decoding="async"
      width="512"
      height="512"
      onload={() => (loaded = true)}
      onerror={() => (failed = true)}
      class={cn(
        "absolute inset-0 size-full object-cover transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
    {#if !loaded}
      <div class="bg-muted absolute inset-0 animate-pulse"></div>
    {/if}
  {/if}
</div>
