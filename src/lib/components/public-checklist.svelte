<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";

  let { complete = $bindable(false), invalid = false }: { complete?: boolean; invalid?: boolean } = $props();

  const items = ["upload.confirmFinished", "upload.confirmJacket", "upload.confirmTitle", "upload.confirmBpm"];
  const uid = $props.id();
  let checked = $state(items.map(() => false));
  let boxes = $state<HTMLInputElement[]>([]);

  $effect(() => {
    complete = checked.every(Boolean);
  });

  const showError = $derived(invalid && !complete);

  export function focusFirst() {
    const index = checked.findIndex((c) => !c);
    const target = boxes[index === -1 ? 0 : index];
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  }
</script>

<fieldset
  aria-describedby={`${uid}-hint${showError ? ` ${uid}-error` : ""}`}
  class="bg-card rounded-2xl border p-5"
>
  <legend class="float-left mb-1 w-full text-base font-semibold">{t("upload.checklistTitle")}</legend>
  <p id={`${uid}-hint`} class="text-muted-foreground clear-both mb-4 text-sm">
    {t("upload.checklistHint")}
  </p>
  <div class={cn(showError && "border-l-4 border-rose-500 pl-4")}>
    {#if showError}
      <p id={`${uid}-error`} class="mb-3 text-sm font-medium text-rose-600 dark:text-rose-400">
        <span class="sr-only">{t("common.error")}:</span>
        {t("upload.checklistRequired")}
      </p>
    {/if}
    <div class="space-y-3">
      {#each items as item, i (item)}
        <label class="flex cursor-pointer items-start gap-3 text-sm leading-snug">
          <input
            bind:this={boxes[i]}
            type="checkbox"
            bind:checked={checked[i]}
            aria-invalid={showError && !checked[i]}
            class="checkbox checkbox-sm checkbox-primary mt-px shrink-0 rounded-[4px]"
          />
          <span>{t(item)}</span>
        </label>
      {/each}
    </div>
  </div>
</fieldset>
