<script lang="ts">
  import { emojis, emojiSrc } from "$lib/data/index.js";

  let {
    text = "",
    linkify = false,
    class: className,
  }: { text?: string | null; linkify?: boolean; class?: string } = $props();

  const keys = Object.keys(emojis).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(:(?:${keys.join("|")}):)`, "g");
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  type Part =
    | { kind: "text"; value: string }
    | { kind: "emoji"; name: string; src: string }
    | { kind: "link"; value: string; href: string };

  const parts = $derived.by<Part[]>(() => {
    if (!text) return [];
    return text
      .split(pattern)
      .filter((p) => p !== "")
      .flatMap((p): Part[] => {
        const m = p.match(/^:([^:]+):$/);
        if (m) {
          const src = emojiSrc(m[1]);
          if (src) return [{ kind: "emoji", name: m[1], src }];
        }
        if (!linkify) return [{ kind: "text", value: p }];
        return p
          .split(urlPattern)
          .filter((s) => s !== "")
          .map((s): Part =>
            /^https?:\/\//.test(s)
              ? { kind: "link", value: s, href: s }
              : { kind: "text", value: s },
          );
      });
  });
</script>

<span class={className}>
  {#each parts as part, i (i)}
    {#if part.kind === "emoji"}
      <img
        src={part.src}
        alt={`:${part.name}:`}
        title={`:${part.name}:`}
        class="mx-[0.1em] inline-block size-[1.8em] object-contain align-[-0.5em]"
        loading="lazy"
        decoding="async"
      />
    {:else if part.kind === "link"}
      <a
        href={part.href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="font-medium break-all text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
        >{part.value}</a
      >
    {:else}{part.value}{/if}
  {/each}
</span>
