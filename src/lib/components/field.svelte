<script lang="ts" module>
  // the one look for anything typed into; exported for selects and textareas that can't use <Field>
  export const fieldClass =
    "bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-base outline-none focus-visible:ring-2 sm:text-sm";
</script>

<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "$lib/utils.js";

  // A text input with its label above and, when there is one, its error below. Text is 16px on
  // phones so iOS doesn't zoom the page when the field is focused.
  let {
    id,
    label,
    value = $bindable(""),
    hint,
    error,
    class: className,
    ...rest
  }: Omit<HTMLInputAttributes, "value" | "class"> & {
    id: string;
    label: string;
    value?: string;
    hint?: string;
    error?: string | null;
    class?: string;
  } = $props();
</script>

<div class={cn("space-y-1.5", className)}>
  <label for={id} class="block text-sm font-medium">{label}</label>
  <input {id} bind:value aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} class={fieldClass} {...rest} />
  {#if error}
    <p id={`${id}-note`} class="text-destructive text-xs">{error}</p>
  {:else if hint}
    <p id={`${id}-note`} class="text-muted-foreground text-xs">{hint}</p>
  {/if}
</div>
