<script lang="ts" module>
  // one row in any options menu; rows in the phone sheet are bigger to tap
  export const menuRow = (big: boolean, danger = false) =>
    [
      big ? "flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px] font-medium hover:bg-muted" : "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
      "disabled:opacity-60",
      danger && "text-rose-500 dark:text-rose-400",
    ]
      .filter(Boolean)
      .join(" ");
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import Sheet from "./sheet.svelte";
  import { portal } from "$lib/portal.js";
  import { cn } from "$lib/utils.js";
  import { RiMoreFill } from "$lib/icons.js";

  // The site's "⋯" menu: a list pinned to the viewport on wider screens (so a card or box can't clip
  // it), a sheet from the bottom on phones. `items` draws the rows; it gets whether it's in the sheet
  // (bigger rows) and a function that closes the menu.
  let {
    label,
    items,
    class: className,
    iconClass = "size-5",
  }: { label: string; items: Snippet<[{ big: boolean; close: () => void }]>; class?: string; iconClass?: string } = $props();

  let open = $state(false);
  let asSheet = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let menu = $state<HTMLDivElement>();
  let pos = $state({ top: 0, right: 0, up: false });
  const close = () => (open = false);

  function toggle() {
    if (open) return close();
    asSheet = matchMedia("(max-width: 639px)").matches;
    if (!asSheet && trigger) {
      const r = trigger.getBoundingClientRect();
      // open upward when the trigger sits low on the screen
      const up = r.bottom > window.innerHeight - 260;
      pos = { top: up ? r.top - 8 : r.bottom + 8, right: window.innerWidth - r.right, up };
    }
    open = true;
  }

  // the floating list closes on an outside click, Escape, or once the page scrolls away from it
  $effect(() => {
    if (!open || asSheet) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menu?.contains(target) && !trigger?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close);
    };
  });
</script>

<button
  bind:this={trigger}
  type="button"
  onclick={toggle}
  aria-label={label}
  title={label}
  aria-haspopup="menu"
  aria-expanded={open}
  class={cn("grid shrink-0 place-items-center rounded-full transition-colors", className)}
>
  <RiMoreFill class={iconClass} />
</button>

{#if open && !asSheet}
  <div
    bind:this={menu}
    use:portal
    role="menu"
    tabindex="-1"
    class={cn("bg-popover/95 text-popover-foreground ring-foreground/10 fixed z-[80] w-64 rounded-xl p-1.5 shadow-lg ring-1 backdrop-blur-2xl", pos.up && "-translate-y-full")}
    style={`top:${pos.top}px;right:${pos.right}px`}
  >
    {@render items({ big: false, close })}
  </div>
{/if}

{#if asSheet}
  <Sheet bind:open>
    <div role="menu" tabindex="-1" class="p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {@render items({ big: true, close })}
    </div>
  </Sheet>
{/if}
