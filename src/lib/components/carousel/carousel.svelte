<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import {
    setCarouselContext,
    type CarouselApi,
    type CarouselOptions,
  } from "./context.js";

  let {
    opts = {},
    setApi = () => {},
    class: className,
    children,
    ...rest
  }: HTMLAttributes<HTMLDivElement> & {
    opts?: CarouselOptions;
    setApi?: (api: CarouselApi) => void;
    class?: string;
    children?: Snippet;
  } = $props();

  let track: HTMLElement | null = null;
  let selected = $state(0);
  let raf = 0;
  const listeners = new Set<() => void>();

  const items = () => (track ? (Array.from(track.children) as HTMLElement[]) : []);

  function scrollTo(index: number, jump = false) {
    const el = items()[index];
    if (!el || !track) return;
    const delta = el.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({ left: track.scrollLeft + delta, behavior: jump ? "auto" : "smooth" });
  }

  function scrollNext() {
    const last = items().length - 1;
    if (selected >= last) {
      if (opts.loop) scrollTo(0, true);
    } else {
      scrollTo(selected + 1);
    }
  }

  function scrollPrev() {
    if (selected <= 0) {
      if (opts.loop) scrollTo(items().length - 1, true);
    } else {
      scrollTo(selected - 1);
    }
  }

  function computeSelected() {
    const its = items();
    if (!its.length || !track) return;
    const left = track.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    its.forEach((el, i) => {
      const d = Math.abs(el.getBoundingClientRect().left - left);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best !== selected) {
      selected = best;
      listeners.forEach((cb) => cb());
    }
  }

  const api: CarouselApi = {
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedScrollSnap: () => selected,
    on: (_event, cb) => listeners.add(cb),
    off: (_event, cb) => listeners.delete(cb),
  };

  setCarouselContext({
    setTrack: (el) => (track = el),
    onScroll: () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeSelected);
    },
  });

  $effect(() => {
    setApi(api);
    return () => {
      listeners.clear();
      cancelAnimationFrame(raf);
    };
  });
</script>

<div
  class={cn("relative", className)}
  role="region"
  aria-roledescription="carousel"
  {...rest}
>
  {@render children?.()}
</div>
