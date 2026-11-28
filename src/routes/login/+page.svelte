<script lang="ts">
  import Seo from "$lib/components/seo.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import LoginPanel from "$lib/components/login-panel.svelte";
  import { session } from "$lib/state/session.svelte";

  function safeNext(raw: string | null): string {
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/dashboard";
  }

  const next = $derived(safeNext(page.url.searchParams.get("next")));

  $effect(() => {
    if (!session.loading && session.isLoggedIn) {
      goto(next, { replaceState: true });
    }
  });
</script>

<Seo title={t("generic.logIn")} metaTitle="Log in" />

<SiteHeader />

{#if session.loading || session.isLoggedIn}
  <main class="mx-auto flex min-h-[55vh] items-center justify-center px-4 py-16">
    <span class="loading loading-spinner text-muted-foreground size-8"></span>
  </main>
{:else}
  <LoginPanel />
{/if}

<SiteFooter />
