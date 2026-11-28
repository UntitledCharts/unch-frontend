<script lang="ts">
  import { onMount } from "svelte";

  // a one-off burst over the whole page; nothing at all for people who asked for less motion
  let { count = 100, onend }: { count?: number; onend?: () => void } = $props();

  const COLORS = ["#38bdf8", "#a855f7", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"];
  const FALL = 4;
  const MAX_DELAY = 2;

  type Piece = { x: number; color: string; size: number; delay: number; rotation: number };
  let pieces = $state<Piece[]>([]);

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onend?.();
      return;
    }
    pieces = Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 5,
      delay: Math.random() * MAX_DELAY,
      rotation: Math.random() * 360,
    }));
    const done = setTimeout(() => onend?.(), (FALL + MAX_DELAY) * 1000 + 200);
    return () => clearTimeout(done);
  });
</script>

{#if pieces.length}
  <div class="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
    {#each pieces as piece, i (i)}
      <span
        class="piece"
        style={`left:${piece.x}%;width:${piece.size}px;height:${piece.size}px;background:${piece.color};animation-delay:${piece.delay}s;--turn:${piece.rotation}deg`}
      ></span>
    {/each}
  </div>
{/if}

<style>
  .piece {
    position: absolute;
    top: -20px;
    border-radius: 3px;
    transform: rotate(var(--turn));
    animation: fall 4s ease-out forwards;
  }
  @keyframes fall {
    from {
      transform: translateY(0) rotate(var(--turn));
      opacity: 1;
    }
    to {
      transform: translateY(100vh) rotate(calc(var(--turn) + 720deg));
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .piece {
      display: none;
    }
  }
</style>
