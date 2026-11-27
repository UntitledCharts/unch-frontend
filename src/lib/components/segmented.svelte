<script lang="ts" generics="T extends string">
  import type { Component } from "svelte";
  import { cn } from "$lib/utils.js";

  // A few choices in one track, the chosen one raised. With `tabs` it switches a panel (and says so
  // to screen readers); without, it is a setting with one value.
  type Option = { value: T; label: string; count?: string | number; icon?: Component<{ class?: string }> };

  let {
    value = $bindable(),
    options,
    ariaLabel,
    tabs = false,
    size = "md",
    fill = false,
    class: className,
  }: {
    value: T;
    options: readonly Option[];
    ariaLabel: string;
    tabs?: boolean;
    size?: "sm" | "md";
    // on phones the track spans the width and the choices share it
    fill?: boolean;
    class?: string;
  } = $props();

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = options.findIndex((o) => o.value === value);
    value = options[(i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length].value;
  }
</script>

<div
  role={tabs ? "tablist" : "radiogroup"}
  aria-label={ariaLabel}
  tabindex="-1"
  {onkeydown}
  class={cn("bg-muted/50 items-center rounded-lg border p-0.5", fill ? "grid auto-cols-fr grid-flow-col sm:inline-flex" : "inline-flex", className)}
>
  {#each options as o (o.value)}
    {@const on = o.value === value}
    <button
      type="button"
      role={tabs ? "tab" : "radio"}
      aria-selected={tabs ? on : undefined}
      aria-checked={tabs ? undefined : on}
      tabindex={on ? 0 : -1}
      onclick={() => (value = o.value)}
      class={cn(
        "focus-visible:ring-ring/50 inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors outline-none focus-visible:ring-2",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {#if o.icon}<o.icon class="size-3.5" />{/if}
      {o.label}
      {#if o.count !== undefined}<span class="text-muted-foreground text-xs tabular-nums">{o.count}</span>{/if}
    </button>
  {/each}
</div>
