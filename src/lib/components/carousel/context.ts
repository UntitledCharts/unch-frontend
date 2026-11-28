import { getContext, setContext } from "svelte";

export type CarouselOptions = {
  loop?: boolean;
  align?: "start" | "center" | "end";
  dragFree?: boolean;
  containScroll?: string;
};

export type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number, jump?: boolean) => void;
  selectedScrollSnap: () => number;
  on: (event: "select", cb: () => void) => void;
  off: (event: "select", cb: () => void) => void;
};

export type CarouselContext = {
  setTrack: (el: HTMLElement | null) => void;
  onScroll: () => void;
};

const KEY = Symbol("daisy-carousel");

export function setCarouselContext(ctx: CarouselContext) {
  setContext(KEY, ctx);
}

export function getCarouselContext(): CarouselContext {
  return getContext<CarouselContext>(KEY);
}
