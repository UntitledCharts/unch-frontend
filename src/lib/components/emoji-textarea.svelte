<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { emojis, emojiSrc } from "$lib/data/index.js";
  import { cn } from "$lib/utils.js";
  import Sheet from "./sheet.svelte";
  import { RiEmotionLine, RiSearchLine } from "$lib/icons.js";

  // A text box for fields that support the site's custom :emoji: codes. Typing ":" still suggests names,
  // but that's awkward on phones (":" sits on a second keyboard page and the list can end up under the
  // keyboard), so there's also an emoji button that opens a picker: a panel on desktop, a sheet on phones.
  let {
    value = $bindable(""),
    class: className,
    multiline = true,
    rows = 4,
    maxlength,
    placeholder,
    required = false,
  }: {
    value?: string;
    class?: string;
    // false renders a single-line input, for titles and names
    multiline?: boolean;
    rows?: number;
    maxlength?: number;
    placeholder?: string;
    required?: boolean;
  } = $props();

  const names = Object.keys(emojis);

  let field = $state<HTMLTextAreaElement | HTMLInputElement>();
  let open = $state(false);
  let query = $state("");
  let start = $state(-1);
  let active = $state(0);

  const matches = $derived(
    open ? (query ? names.filter((n) => n.toLowerCase().includes(query.toLowerCase())) : names).slice(0, 8) : [],
  );

  function update() {
    if (!field) return;
    const caret = field.selectionStart ?? value.length;
    const m = value.slice(0, caret).match(/(?:^|\s)(:([a-zA-Z0-9_]*))$/);
    if (m) {
      start = caret - m[1].length;
      query = m[2];
      open = true;
      active = 0;
    } else {
      open = false;
    }
  }

  // replaces value[from, to) with the emoji code and puts the caret right after it
  function insert(name: string, from: number, to: number) {
    const before = value.slice(0, from);
    const after = value.slice(to);
    const code = `:${name}:`;
    const spaced = (before && !/\s$/.test(before) ? " " : "") + code + (after.startsWith(" ") ? "" : " ");
    value = before + spaced + after;
    const pos = before.length + spaced.length;
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(pos, pos);
    });
  }

  function choose(name: string) {
    if (start < 0 || !field) return;
    insert(name, start, field.selectionStart ?? value.length);
    open = false;
  }

  function onkeydown(e: KeyboardEvent) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      active = (active + 1) % matches.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = (active - 1 + matches.length) % matches.length;
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      open = false;
    }
  }

  // picker
  let pickerOpen = $state(false);
  let asSheet = $state(false);
  let search = $state("");
  // where the caret was when the picker opened; focus moves into the picker, so read it up front
  let saved = { from: 0, to: 0 };
  const pickerMatches = $derived(search ? names.filter((n) => n.toLowerCase().includes(search.toLowerCase())) : names);

  function openPicker() {
    saved = { from: field?.selectionStart ?? value.length, to: field?.selectionEnd ?? value.length };
    asSheet = matchMedia("(max-width: 639px)").matches;
    search = "";
    open = false;
    pickerOpen = true;
  }

  function pick(name: string) {
    insert(name, saved.from, saved.to);
    pickerOpen = false;
  }
</script>

{#snippet grid()}
  <label class="bg-background flex h-9 items-center gap-2 rounded-lg border px-2.5">
    <RiSearchLine class="text-muted-foreground size-4 shrink-0" />
    <input
      bind:value={search}
      placeholder={t("common.searchEmoji")}
      aria-label={t("common.searchEmoji")}
      class="min-w-0 flex-1 bg-transparent text-sm outline-none"
    />
  </label>
  {#if pickerMatches.length}
    <div class="grid max-h-60 grid-cols-6 gap-1 overflow-y-auto sm:grid-cols-7">
      {#each pickerMatches as name (name)}
        <button
          type="button"
          onclick={() => pick(name)}
          title={`:${name}:`}
          aria-label={`:${name}:`}
          class="hover:bg-muted grid aspect-square place-items-center rounded-lg p-1.5"
        >
          <img src={emojiSrc(name)} alt="" loading="lazy" class="size-full object-contain" />
        </button>
      {/each}
    </div>
  {:else}
    <p class="text-muted-foreground py-6 text-center text-sm">{t("common.noEmoji")}</p>
  {/if}
{/snippet}

<div class="relative">
  {#if multiline}
    <textarea
      bind:this={field}
      bind:value
      {rows}
      {maxlength}
      {placeholder}
      {required}
      oninput={update}
      onkeyup={update}
      onclick={update}
      {onkeydown}
      onblur={() => setTimeout(() => (open = false), 150)}
      class={cn(className, "pr-10")}
    ></textarea>
  {:else}
    <input
      bind:this={field}
      bind:value
      type="text"
      {maxlength}
      {placeholder}
      {required}
      oninput={update}
      onkeyup={update}
      onclick={update}
      {onkeydown}
      onblur={() => setTimeout(() => (open = false), 150)}
      class={cn(className, "pr-10")}
    />
  {/if}

  <button
    type="button"
    onclick={openPicker}
    aria-label={t("common.insertEmoji")}
    title={t("common.insertEmoji")}
    class={cn(
      "text-muted-foreground hover:text-foreground hover:bg-muted absolute right-1.5 grid size-8 place-items-center rounded-lg transition-colors",
      multiline ? "top-1.5" : "top-1/2 -translate-y-1/2",
    )}
  >
    <RiEmotionLine class="size-5" />
  </button>

  {#if open && matches.length}
    <ul
      class="bg-popover text-popover-foreground ring-foreground/10 absolute top-full left-0 z-[70] mt-1 max-h-56 w-64 max-w-full overflow-y-auto rounded-xl p-1 shadow-lg ring-1 backdrop-blur-2xl"
    >
      {#each matches as name, i (name)}
        <li>
          <button
            type="button"
            onpointerdown={(e) => {
              e.preventDefault();
              choose(name);
            }}
            class={cn(
              "hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm",
              i === active && "bg-accent",
            )}
          >
            <img src={emojiSrc(name)} alt="" class="size-5 shrink-0" />
            <span class="truncate">:{name}:</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if pickerOpen && !asSheet}
    <button
      type="button"
      aria-label={t("common.close2")}
      onclick={() => (pickerOpen = false)}
      class="fixed inset-0 z-[69] cursor-default"
    ></button>
    <div class="bg-popover text-popover-foreground absolute top-full right-0 z-[70] mt-1 w-80 max-w-[calc(100vw-2rem)] space-y-2 rounded-xl border p-2 shadow-lg">
      {@render grid()}
    </div>
  {/if}
</div>

{#if asSheet}
  <Sheet bind:open={pickerOpen}>
    <div class="space-y-2 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {@render grid()}
    </div>
  </Sheet>
{/if}
