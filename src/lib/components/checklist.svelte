<script lang="ts">
  import type { Snippet } from "svelte";
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { RiExternalLinkLine } from "$lib/icons.js";

  // statements to tick before a chart goes up or out; once `invalid`, the unticked ones are marked.
  // `locked` items reflect the chart itself, can't be ticked by hand and don't count towards `complete`
  type Locked = { label: string; checked: boolean; failing: boolean; note?: string };
  let {
    title,
    hint,
    items,
    required,
    locked = [],
    complete = $bindable(false),
    invalid = false,
    children,
  }: {
    title: string;
    hint: string;
    items: string[];
    required: string;
    locked?: Locked[];
    complete?: boolean;
    invalid?: boolean;
    children?: Snippet;
  } = $props();

  const uid = $props.id();
  let checked = $state<Record<number, boolean>>({});
  let boxes = $state<HTMLInputElement[]>([]);
  let lockedRows = $state<HTMLElement[]>([]);

  const allTicked = $derived(items.every((_, i) => checked[i]));
  const showError = $derived(invalid && !allTicked);
  const lockedFailing = $derived(invalid && locked.some((item) => item.failing));

  $effect(() => {
    complete = allTicked;
  });

  export function focusFirst(whenDone?: HTMLElement | null) {
    const index = items.findIndex((_, i) => !checked[i]);
    const failing = lockedRows[locked.findIndex((item) => item.failing)];
    const target = index === -1 ? (whenDone ?? failing ?? boxes[0]) : boxes[index];
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  }
</script>

<fieldset
  aria-describedby={`${uid}-hint${showError ? ` ${uid}-error` : ""}`}
  class="bg-card rounded-2xl border p-5"
>
  <legend class="float-left mb-1 w-full text-base font-semibold">{title}</legend>
  <p id={`${uid}-hint`} class="text-muted-foreground clear-both mb-4 text-sm">{hint}</p>
  <div class={cn((showError || lockedFailing) && "border-l-4 border-rose-500 pl-4")}>
    {#if showError}
      <p id={`${uid}-error`} class="mb-3 text-sm font-medium text-rose-600 dark:text-rose-400">
        <span class="sr-only">{t("generic.error")}:</span>
        {required}
      </p>
    {/if}
    <div class="space-y-3">
      {#each items as item, i (i)}
        <label class="flex cursor-pointer items-start gap-3 text-sm leading-snug">
          <input
            bind:this={boxes[i]}
            type="checkbox"
            bind:checked={checked[i]}
            aria-invalid={showError && !checked[i]}
            class="checkbox checkbox-sm checkbox-primary mt-px shrink-0 rounded-[4px]"
          />
          <span class={cn(showError && !checked[i] && "text-rose-600 dark:text-rose-400")}>{item}</span>
        </label>
      {/each}
      {#each locked as item, i (i)}
        {@const marked = invalid && item.failing}
        <div bind:this={lockedRows[i]} tabindex="-1" class="space-y-1 outline-none">
          <label class="flex items-start gap-3 text-sm leading-snug">
            <input
              type="checkbox"
              checked={item.checked}
              disabled
              aria-invalid={marked}
              aria-describedby={item.note ? `${uid}-locked-${i}` : undefined}
              class="checkbox checkbox-sm checkbox-primary mt-px shrink-0 cursor-default! rounded-[4px] opacity-100!"
            />
            <span class={cn(marked && "text-rose-600 dark:text-rose-400")}>{item.label}</span>
          </label>
          {#if item.note}
            <p
              id={`${uid}-locked-${i}`}
              class={cn("pl-7 text-xs", marked ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}
            >
              {#if marked}<span class="sr-only">{t("generic.error")}:</span>{/if}
              {item.note}
            </p>
          {/if}
        </div>
      {/each}
      {@render children?.()}
    </div>
  </div>
  <a
    href="/upload-policy"
    target="_blank"
    rel="noopener"
    class="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
  >
    {t("upload.readPolicy")}
    <RiExternalLinkLine class="size-3.5" aria-hidden="true" />
  </a>
</fieldset>
