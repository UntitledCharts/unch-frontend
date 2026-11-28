<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Checklist from "./checklist.svelte";

  // Going public needs a saved audio preview, ticked automatically. Staff with the chart.visibility
  // permission can tick force to go ahead without one.
  let {
    complete = $bindable(false),
    invalid = false,
    previewMissing = false,
    canForce = false,
    force = $bindable(false),
  }: {
    complete?: boolean;
    invalid?: boolean;
    previewMissing?: boolean;
    canForce?: boolean;
    force?: boolean;
  } = $props();

  const items = [
    "visibility.confirmNotWip",
    "visibility.confirmNotJoke",
    "visibility.confirmNotOfficial",
    "visibility.confirmJacket",
    "visibility.confirmTitle",
    "visibility.confirmBpm",
  ];
  let ticked = $state(false);
  let list = $state<{ focusFirst: (whenDone?: HTMLElement | null) => void } | null>(null);
  let forceBox = $state<HTMLInputElement | null>(null);

  const previewBlocked = $derived(previewMissing && !(canForce && force));

  $effect(() => {
    complete = ticked && !previewBlocked;
  });

  export function focusFirst() {
    list?.focusFirst(previewBlocked ? forceBox : null);
  }
</script>

<Checklist
  bind:this={list}
  bind:complete={ticked}
  {invalid}
  title={t("visibility.checklistTitle")}
  hint={t("visibility.checklistHint")}
  items={items.map((key) => t(key))}
  required={t("generic.confirmRequired")}
  locked={[
    {
      label: t("visibility.confirmPreview"),
      checked: !previewMissing,
      failing: previewBlocked,
      note: previewMissing ? t("edit.previewRequired") : undefined,
    },
  ]}
>
  {#if previewMissing && canForce}
    <label class="flex cursor-pointer items-center gap-3 pl-7 text-sm leading-snug">
      <input
        bind:this={forceBox}
        type="checkbox"
        bind:checked={force}
        class="checkbox checkbox-sm checkbox-primary shrink-0 rounded-[4px]"
      />
      <span>{t("edit.forceWithoutPreview")}</span>
    </label>
  {/if}
</Checklist>
