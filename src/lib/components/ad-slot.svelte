<script lang="ts">
  import { dev } from "$app/environment";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { t } from "$lib/i18n.svelte.js";
  import { ADSENSE_CLIENT, ADSENSE_SLOT, ADS_ENABLED } from "$lib/config.js";
  import { adScript } from "$lib/state/ads.svelte.js";
  import { cn } from "$lib/utils.js";

  // the box is server rendered at ad height, the <ins> only in the browser; pages stay alive across
  // URLs of the same route, so a new URL (or `refresh` value) asks for a new ad
  let {
    fullWidth = true,
    refresh = "",
    class: className,
  }: { fullWidth?: boolean; refresh?: string | number; class?: string } = $props();

  const request = $derived(`${page.url.pathname}${page.url.search}|${refresh}`);
  let mounted = $state(false);
  onMount(() => (mounted = true));

  const push: Attachment<HTMLModElement> = (node) => {
    const params = {};
    try {
      (window.adsbygoogle ??= [] as object[]).push(params);
    } catch {
      void 0;
    }
    return () => {
      // still queued because the script hasn't run yet; left in, it would fill some other slot
      const queue = window.adsbygoogle;
      if (!Array.isArray(queue) || node.dataset.adsbygoogleStatus) return;
      const at = queue.indexOf(params);
      if (at >= 0) queue.splice(at, 1);
    };
  };
</script>

{#if ADS_ENABLED}
<aside
  aria-label={t("ads.advertisement")}
  class={cn(
    "min-h-[280px] w-full text-center has-[[data-ad-status=unfilled]]:hidden",
    mounted && adScript.failed && "hidden",
    className,
  )}
>
  {#if dev}
    <div
      class="text-muted-foreground bg-muted/30 grid min-h-[280px] place-items-center rounded-2xl border border-dashed text-xs"
    >
      {t("ads.advertisement")}
    </div>
  {:else if mounted && !adScript.failed}
    {#key request}
      <ins
        {@attach push}
        class="adsbygoogle"
        style="display:block"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive={fullWidth ? "true" : "false"}
      ></ins>
    {/key}
  {/if}
</aside>
{/if}
