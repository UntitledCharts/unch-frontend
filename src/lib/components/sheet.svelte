<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";

  let {
    open = $bindable(false),
    class: className,
    children,
  }: { open?: boolean; class?: string; children?: Snippet } = $props();

  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    const d = dialog;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  });
</script>

<dialog bind:this={dialog} class="modal modal-bottom" onclose={() => (open = false)}>
  <div
    class={cn(
      "modal-box text-popover-foreground bg-popover flex max-h-[85vh] flex-col rounded-t-2xl rounded-b-none border-t p-0",
      className,
    )}
  >
    <div class="bg-muted mx-auto mt-3 h-1 w-[100px] shrink-0 rounded-full"></div>
    {@render children?.()}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button aria-label={t("common.close2")}>{t("common.close")}</button>
  </form>
</dialog>
