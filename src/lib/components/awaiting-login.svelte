<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { onMount } from "svelte";
  import Button from "./button.svelte";
  import { session } from "$lib/state/session.svelte";

  let attempted = $state(false);

  onMount(() => {
    session.inlineLogin = true;
    return () => {
      session.inlineLogin = false;
    };
  });

  // start the Sonolus login as soon as we know the visitor isn't signed in
  $effect(() => {
    if (session.loading || session.isLoggedIn || attempted) return;
    attempted = true;
    session.login();
  });
</script>

<main class="mx-auto flex min-h-[55vh] max-w-sm flex-col items-center justify-center gap-4 px-4 py-20 text-center">
  <span class="loading loading-spinner text-primary size-8"></span>
  <h1 class="font-heading text-xl font-semibold">{t("login.awaitingVerification")}</h1>

  {#if session.pending && session.popupBlocked}
    <Button onclick={() => session.openLoginWindow()} class="rounded-full">{t("login.openLoginAgain")}</Button>
  {:else if attempted && !session.pending && !session.loading && !session.isLoggedIn}
    <Button onclick={() => session.login()} class="rounded-full">{t("login.tryAgain")}</Button>
  {/if}
</main>
