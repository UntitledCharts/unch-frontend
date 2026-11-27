<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { RiArrowDownSLine, RiCheckLine, RiTranslate2 } from "$lib/icons.js";
  import { LANGUAGES, i18n, setLanguage, t } from "$lib/i18n.svelte.js";

  let { up = false, class: className }: { up?: boolean; class?: string } = $props();

  let open = $state(false);
  let root = $state<HTMLDetailsElement>();
  const entries = Object.entries(LANGUAGES);
  const current = $derived(LANGUAGES[i18n.lang]);

  async function choose(code: string) {
    open = false;
    await setLanguage(code);
  }

  $effect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (root && !root.contains(e.target as Node)) open = false;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") open = false;
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  });
</script>

<details bind:this={root} bind:open class={cn("dropdown", up && "dropdown-top", className)}>
  <summary
    aria-label={t("header.language")}
    class="bg-card focus-visible:ring-ring/50 flex h-10 w-full cursor-pointer list-none items-center justify-between gap-2 rounded-xl border px-3 text-sm outline-none select-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden"
  >
    <span class="flex min-w-0 items-center gap-2 truncate">
      <RiTranslate2 class="text-muted-foreground size-4 shrink-0" />
      <span class="truncate font-medium">{current?.name ?? i18n.lang}</span>
    </span>
    <RiArrowDownSLine class={cn("text-muted-foreground size-4 shrink-0 transition-transform", open !== up && "rotate-180")} />
  </summary>

  <ul
    role="listbox"
    aria-label={t("header.language")}
    class={cn(
      "bg-popover/90 dropdown-content menu ring-foreground/10 z-50 max-h-72 w-full min-w-52 flex-nowrap overflow-y-auto rounded-xl p-1 shadow-lg ring-1 backdrop-blur-2xl backdrop-saturate-150",
      up ? "mb-1" : "mt-1",
    )}
  >
    {#each entries as [code, lang] (code)}
      {@const active = code === i18n.lang}
      <li>
        <button
          type="button"
          role="option"
          aria-selected={active}
          lang={lang.locale}
          onclick={() => choose(code)}
          class={cn("justify-between gap-3", active && "bg-accent text-accent-foreground font-medium")}
        >
          <span class="flex min-w-0 flex-col items-start leading-tight">
            <span class="truncate">{lang.name}</span>
            {#if lang.english_name !== lang.name}
              <span class="text-muted-foreground text-[11px]">{lang.english_name}</span>
            {/if}
          </span>
          {#if active}<RiCheckLine class="size-4 shrink-0" />{/if}
        </button>
      </li>
    {/each}
  </ul>
</details>
