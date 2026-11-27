<script lang="ts">
  import { page } from "$app/state";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import AwaitingLogin from "$lib/components/awaiting-login.svelte";
  import { session } from "$lib/state/session.svelte";

  let { children } = $props();

  // settings also holds site preferences (theme, accent, language), so it's open to everyone
  const isPublic = $derived(page.url.pathname.startsWith("/dashboard/settings"));
</script>

<SiteHeader />

{#if isPublic || (!session.loading && session.isLoggedIn)}
  {@render children()}
{:else if session.loading}
  <main class="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4 py-20">
    <span class="loading loading-spinner text-muted-foreground size-8"></span>
  </main>
{:else}
  <AwaitingLogin />
{/if}

<SiteFooter />
