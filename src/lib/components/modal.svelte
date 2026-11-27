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

<dialog bind:this={dialog} class="modal" onclose={() => (open = false)}>
  <div
    class={cn(
      "modal-box text-popover-foreground bg-popover w-[calc(100vw-2rem)] max-w-md rounded-2xl border",
      className,
    )}
  >
    {@render children?.()}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button aria-label={t("common.close2")}>{t("common.close")}</button>
  </form>
</dialog>
