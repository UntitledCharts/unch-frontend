<script lang="ts">
  import { authorCard, AUTHOR_CARD_ID } from "$lib/state/author-card.svelte.js";
  import { bannerUrl, profileUrl } from "$lib/data/index.js";
  import CoverArt from "./cover-art.svelte";
  import FormattedText from "./formatted-text.svelte";
  import AccountBadges from "./account-badges.svelte";

  // the one card hoverCard() triggers show; it sits above its trigger, or below when that's too close to the top
  const WIDTH = 256;
  const GAP = 8;

  const position = $derived.by(() => {
    const r = authorCard.anchor;
    if (!r) return null;
    const left = Math.max(GAP, Math.min(r.left, window.innerWidth - WIDTH - GAP));
    return r.top > 160
      ? `left:${left}px;bottom:${window.innerHeight - r.top + GAP}px`
      : `left:${left}px;top:${r.bottom + GAP}px`;
  });
  const account = $derived(authorCard.account);

  $effect(() => {
    if (!authorCard.id) return;
    const close = () => authorCard.close();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", key);
    };
  });
</script>

{#if authorCard.id && position}
  <div
    id={AUTHOR_CARD_ID}
    role="tooltip"
    style={position}
    onpointerenter={() => authorCard.keep()}
    onpointerleave={() => authorCard.hide()}
    class="bg-popover text-popover-foreground ring-foreground/10 fixed z-[70] w-64 overflow-hidden rounded-2xl shadow-xl ring-1 motion-safe:animate-[author-card-in_160ms_ease-out]"
  >
    {#if account}
      <div class="h-16 bg-cover bg-center" style={`background-image:url(${bannerUrl(account)})`}></div>
      <div class="flex items-end gap-3 px-3 pb-3">
        <CoverArt
          id={account.sonolus_id}
          title={account.sonolus_username}
          src={profileUrl(account)}
          rounded="rounded-full"
          class="ring-popover -mt-7 size-14 shrink-0 ring-4"
        />
        <div class="min-w-0 pb-0.5">
          <p class="flex min-w-0 items-center gap-1 text-sm font-semibold">
            <span class="truncate"><FormattedText text={account.sonolus_username} /></span>
            <AccountBadges badges={account.badges} class="size-4" />
          </p>
          <p class="text-muted-foreground text-xs tabular-nums">#{account.sonolus_handle}</p>
        </div>
      </div>
    {:else}
      <div class="bg-muted h-16 animate-pulse"></div>
      <div class="flex items-end gap-3 px-3 pb-3">
        <div class="bg-muted ring-popover -mt-7 size-14 shrink-0 animate-pulse rounded-full ring-4"></div>
        <div class="flex-1 space-y-1.5 pb-1">
          <div class="bg-muted h-3 w-28 animate-pulse rounded"></div>
          <div class="bg-muted h-2.5 w-16 animate-pulse rounded"></div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  @keyframes -global-author-card-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(4px);
    }
  }
</style>
