<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Button from "./button.svelte";
  import { session } from "$lib/state/session.svelte";
  import { RiCloseLine, RiLoginBoxLine, RiTimeLine } from "$lib/icons.js";

  function logInAgain() {
    session.expired = false;
    session.login();
  }
</script>

<div
  aria-live="polite"
  class="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:inset-x-auto md:right-6 md:bottom-6 md:px-0"
>
  {#if session.expired}
    <div
      class="bg-popover text-popover-foreground ring-foreground/10 pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl p-4 shadow-xl ring-1 motion-safe:animate-[session-notice-in_180ms_ease-out]"
    >
      <span class="grid size-9 shrink-0 place-items-center rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300">
        <RiTimeLine class="size-5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">{t("login.sessionExpiredTitle")}</p>
        <p class="text-muted-foreground mt-0.5 text-sm">{t("login.sessionExpiredBody")}</p>
        <Button size="sm" class="mt-3 rounded-full" onclick={logInAgain}>
          <RiLoginBoxLine class="size-4" />
          {t("login.logInAgain")}
        </Button>
      </div>
      <button
        type="button"
        aria-label={t("generic.close")}
        title={t("generic.close")}
        onclick={() => (session.expired = false)}
        class="text-muted-foreground hover:bg-muted hover:text-foreground -mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full transition-colors"
      >
        <RiCloseLine class="size-4" />
      </button>
    </div>
  {/if}
</div>

<style>
  @keyframes -global-session-notice-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
</style>
