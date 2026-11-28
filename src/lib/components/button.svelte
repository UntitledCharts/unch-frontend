<script lang="ts" module>
  export type ButtonVariant =
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  export type ButtonSize = "default" | "sm" | "lg" | "icon";

  const VARIANTS: Record<ButtonVariant, string> = {
    default: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    secondary: "btn-secondary",
    destructive: "btn-error btn-outline",
    link: "btn-link",
  };

  const SIZES: Record<ButtonSize, string> = {
    default: "",
    sm: "btn-sm",
    lg: "btn-lg",
    icon: "btn-square",
  };
</script>

<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

  type Props = HTMLButtonAttributes &
    HTMLAnchorAttributes & {
      variant?: ButtonVariant;
      size?: ButtonSize;
      href?: string;
      class?: string;
      children?: Snippet;
    };

  let {
    variant = "default",
    size = "default",
    href = undefined,
    type = "button",
    disabled = false,
    class: className,
    children,
    ...rest
  }: Props = $props();

  const classes = $derived(cn("btn", VARIANTS[variant], SIZES[size], className));
</script>

{#if href}
  <a
    href={disabled ? undefined : href}
    class={classes}
    aria-disabled={disabled ? true : undefined}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    {...rest}
  >
    {@render children?.()}
  </a>
{:else}
  <button {type} class={classes} {disabled} {...rest}>
    {@render children?.()}
  </button>
{/if}
