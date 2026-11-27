<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Button from "./button.svelte";

  let {
    image,
    aspect = 1,
    round = false,
    onapply,
    oncancel,
  }: {
    image: string;
    aspect?: number;
    round?: boolean;
    onapply: (file: File) => void;
    oncancel: () => void;
  } = $props();

  const BOX_W = 300;
  const boxH = $derived(Math.round(BOX_W / aspect));

  let imgEl = $state<HTMLImageElement>();
  let natW = $state(0);
  let natH = $state(0);
  let zoom = $state(1);
  let ox = $state(0);
  let oy = $state(0);

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startOx = 0;
  let startOy = 0;

  const coverScale = $derived(natW && natH ? Math.max(BOX_W / natW, boxH / natH) : 1);
  const dispW = $derived(natW * coverScale * zoom);
  const dispH = $derived(natH * coverScale * zoom);

  function clamp() {
    ox = Math.min(0, Math.max(BOX_W - dispW, ox));
    oy = Math.min(0, Math.max(boxH - dispH, oy));
  }

  function onImgLoad() {
    if (!imgEl) return;
    natW = imgEl.naturalWidth;
    natH = imgEl.naturalHeight;
    ox = (BOX_W - dispW) / 2;
    oy = (boxH - dispH) / 2;
    clamp();
  }

  $effect(() => {
    zoom;
    clamp();
  });

  function down(e: PointerEvent) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startOx = ox;
    startOy = oy;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    ox = startOx + (e.clientX - startX);
    oy = startOy + (e.clientY - startY);
    clamp();
  }
  function up(e: PointerEvent) {
    dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      void 0;
    }
  }

  function apply() {
    if (!imgEl) return;
    const scale = coverScale * zoom;
    const sx = -ox / scale;
    const sy = -oy / scale;
    const sw = BOX_W / scale;
    const sh = boxH / scale;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onapply(new File([blob], "crop.png", { type: "image/png" }));
    }, "image/png");
  }
</script>

<div class="space-y-4">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    role="application"
    aria-label={t("common.dragToRepositionUseThe")}
    class={`relative mx-auto touch-none overflow-hidden bg-black/50 ${round ? "rounded-full" : "rounded-xl"}`}
    style={`width:${BOX_W}px;height:${boxH}px`}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  >
    <img
      bind:this={imgEl}
      src={image}
      onload={onImgLoad}
      alt=""
      draggable="false"
      class="absolute max-w-none cursor-grab select-none active:cursor-grabbing"
      style={`left:${ox}px;top:${oy}px;width:${dispW}px;height:${dispH}px`}
    />
    <div class="pointer-events-none absolute inset-0 {round ? 'rounded-full' : 'rounded-xl'} ring-1 ring-white/40">
      <div class="absolute inset-y-0 left-1/3 w-px bg-white/30"></div>
      <div class="absolute inset-y-0 left-2/3 w-px bg-white/30"></div>
      <div class="absolute inset-x-0 top-1/3 h-px bg-white/30"></div>
      <div class="absolute inset-x-0 top-2/3 h-px bg-white/30"></div>
    </div>
  </div>

  <input
    type="range"
    min="1"
    max="3"
    step="0.01"
    bind:value={zoom}
    aria-label={t("common.zoom")}
    class="range range-primary range-sm w-full"
  />

  <div class="flex justify-end gap-2">
    <Button variant="outline" size="sm" onclick={oncancel} class="rounded-full">{t("oauth.cancel")}</Button>
    <Button size="sm" onclick={apply} class="rounded-full">{t("common.apply")}</Button>
  </div>
</div>
