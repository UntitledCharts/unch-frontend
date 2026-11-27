<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Button from "./button.svelte";
  import { session } from "$lib/state/session.svelte";

  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    const d = dialog;
    if (!d) return;
    const show = session.pending && !session.inlineLogin;
    if (show && !d.open) d.showModal();
    else if (!show && d.open) d.close();
  });

  function onClose() {
    if (session.pending) session.cancelLogin();
  }
</script>

<dialog bind:this={dialog} class="modal" onclose={onClose}>
  <div class="modal-box bg-popover text-popover-foreground max-w-sm rounded-2xl border text-center">
    <img src="https://sonolus.com/logo.png" alt="Sonolus" width="1775" height="360" class="mx-auto mb-4 h-8 w-auto" />
    <div class="mb-3 flex justify-center">
      <span class="loading loading-spinner text-primary size-8"></span>
    </div>
    <h2 class="text-lg font-semibold tracking-tight">{t("login.waitingForConfirmation")}</h2>
    <p class="text-muted-foreground mt-1 text-sm">
      {t("login.approveTheLoginInThe")}
    </p>
    <Button variant="outline" onclick={() => session.cancelLogin()} class="mt-5 w-full rounded-full">
      {t("oauth.cancel")}
    </Button>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button aria-label={t("login.cancelLogin")}>{t("login.cancel")}</button>
  </form>
</dialog>
