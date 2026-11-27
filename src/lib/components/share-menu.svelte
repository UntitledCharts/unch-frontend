<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { portal } from "$lib/portal.js";
  import Sheet from "./sheet.svelte";
  import { RiShareLine, RiLinksLine, RiCheckLine, RiFileList3Line, RiExternalLinkLine } from "$lib/icons.js";
  import { cn } from "$lib/utils.js";

  // Sharing a chart. Besides the link, people who record charts need a credit line to paste under
  // their videos, so that's one tap too.
  let { url, credit, title, class: className }: { url: string; credit: string; title: string; class?: string } = $props();

  let open = $state(false);
  let asSheet = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let menu = $state<HTMLDivElement>();
  let pos = $state({ top: 0, right: 0 });
  let copied = $state<"link" | "credit" | null>(null);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  function toggle() {
    if (open) return (open = false);
    asSheet = matchMedia("(max-width: 639px)").matches;
    if (!asSheet && trigger) {
      const r = trigger.getBoundingClientRect();
      pos = { top: r.bottom + 8, right: window.innerWidth - r.right };
    }
    open = true;
  }

  $effect(() => {
    if (!open || asSheet) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menu?.contains(target) && !trigger?.contains(target)) open = false;
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (open = false);
    const onScroll = () => (open = false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  });

  async function copy(kind: "link" | "credit") {
    try {
      await navigator.clipboard.writeText(kind === "link" ? url : credit);
      copied = kind;
      setTimeout(() => (copied = null), 1500);
    } catch {
      void 0;
    }
  }
  async function nativeShare() {
    open = false;
    try {
      await navigator.share({ title, url });
    } catch {
      void 0;
    }
  }
</script>

{#snippet items(big: boolean)}
  {@const row = big ? "flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px] font-medium hover:bg-muted" : "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"}
  <button type="button" onclick={() => copy("link")} class={row}>
    {#if copied === "link"}<RiCheckLine class="size-4 shrink-0" />{:else}<RiLinksLine class="size-4 shrink-0" />{/if}
    {copied === "link" ? t("levelDetail.linkCopied") : t("levelDetail.copyLink")}
  </button>
  <button type="button" onclick={() => copy("credit")} class={row}>
    {#if copied === "credit"}<RiCheckLine class="size-4 shrink-0" />{:else}<RiFileList3Line class="size-4 shrink-0" />{/if}
    <span class="min-w-0">
      <span class="block">{copied === "credit" ? t("levelDetail.creditCopied") : t("levelDetail.copyCredit")}</span>
      <span class="text-muted-foreground block truncate text-xs">{t("levelDetail.copyCreditHint")}</span>
    </span>
  </button>
  {#if canShare}
    <button type="button" onclick={nativeShare} class={row}>
      <RiExternalLinkLine class="size-4 shrink-0" />{t("levelDetail.shareVia")}
    </button>
  {/if}
{/snippet}

<button
  bind:this={trigger}
  type="button"
  onclick={toggle}
  aria-label={t("levelDetail.share")}
  title={t("levelDetail.share")}
  aria-haspopup="menu"
  aria-expanded={open}
  class={cn("grid size-11 shrink-0 place-items-center rounded-full border transition-colors", className)}
>
  <RiShareLine class="size-4" />
</button>

{#if open && !asSheet}
  <div
    bind:this={menu}
    use:portal
    role="menu"
    tabindex="-1"
    class="bg-popover/95 text-popover-foreground ring-foreground/10 fixed z-[80] w-72 rounded-xl p-1.5 shadow-lg ring-1 backdrop-blur-2xl"
    style={`top:${pos.top}px;right:${pos.right}px`}
  >
    {@render items(false)}
  </div>
{/if}

{#if asSheet}
  <Sheet bind:open>
    <div class="p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">{@render items(true)}</div>
  </Sheet>
{/if}
