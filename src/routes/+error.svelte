<script lang="ts">
  import Seo from "$lib/components/seo.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { storedSessionKey } from "$lib/state/session.svelte";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import Button from "$lib/components/button.svelte";
  import { RiArrowLeftLine, RiCompass3Line, RiHome5Line } from "$lib/icons.js";
  import { statusMessage, statusTitle } from "$lib/errors.js";
  import { goBack } from "$lib/navigation.js";

  const title = $derived(statusTitle(page.status));

  const message = $derived(statusMessage(page.status));

  // A private chart 404s on the server, which never has the session. Until the browser has looked for one this
  // shows a spinner rather than the 404, and with a stored session it loads the page again.
  let checking = $state(true);
  const waiting = $derived(checking && !!page.error?.needsSession);
  onMount(() => {
    if (page.error?.needsSession && storedSessionKey()) {
      goto(page.url, { replaceState: true, invalidateAll: true }).finally(() => (checking = false));
    } else {
      checking = false;
    }
  });
</script>

<Seo title={String(page.status)} />

<SiteHeader />

<main class="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
  {#if waiting}
    <span class="loading loading-spinner loading-md text-primary"></span>
  {:else}
    <p class="font-heading text-primary/30 text-7xl font-bold tabular-nums select-none sm:text-8xl">
      {page.status}
    </p>
    {#if title}
      <h1 class="font-heading mt-2 text-2xl font-bold tracking-tight">{title}</h1>
      <p class="text-muted-foreground mt-2 max-w-md text-sm">{message}</p>
    {:else}
      <h1 class="font-heading mt-2 max-w-md text-2xl font-bold tracking-tight">{message}</h1>
    {/if}
    <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Button type="button" variant="outline" onclick={goBack} class="rounded-full">
        <RiArrowLeftLine class="size-4" /> {t("generic.back")}
      </Button>
      <Button href="/" class="rounded-full">
        <RiHome5Line class="size-4" /> {t("generic.home")}
      </Button>
      <Button href="/browse" variant="outline" class="rounded-full">
        <RiCompass3Line class="size-4" /> {t("generic.browseCharts")}
      </Button>
    </div>
  {/if}
</main>

<SiteFooter />
