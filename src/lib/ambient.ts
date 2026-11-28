// Picks the dominant vivid colour of an image so a page can be tinted to match it (a user's banner,
// a chart's cover). Returns the CSS variables `.ambient` in app.css reads, or null for images that are
// mostly grey, where tinting would just look muddy.

export type Ambient = Record<"--amb" | "--amb-primary" | "--amb-text-dark" | "--amb-text-light", string>;

const cache = new Map<string, Promise<Ambient | null>>();

export function ambientFrom(imageUrl: string | null | undefined): Promise<Ambient | null> {
  if (!imageUrl || typeof document === "undefined") return Promise.resolve(null);
  let pending = cache.get(imageUrl);
  if (!pending) {
    pending = load(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`).then(dominant).catch(() => null);
    cache.set(imageUrl, pending);
  }
  return pending;
}

// Tints the whole page background (body) for as long as the page is open; returns the cleanup.
export function tintPage(amb: Ambient | null): () => void {
  const body = document.body;
  if (!amb) return () => {};
  for (const [k, v] of Object.entries(amb)) body.style.setProperty(k, v);
  body.classList.add("ambient-page");
  return () => {
    body.classList.remove("ambient-page");
    for (const k of Object.keys(amb)) body.style.removeProperty(k);
  };
}

export function ambientStyle(amb: Ambient | null): string | undefined {
  return amb ? Object.entries(amb).map(([k, v]) => `${k}: ${v}`).join("; ") : undefined;
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function dominant(img: HTMLImageElement): Ambient | null {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const px = ctx.getImageData(0, 0, size, size).data;

  // bucket pixels by hue, weighting vivid mid-tones over greys, near-blacks and near-whites
  const BINS = 12;
  const bins = Array.from({ length: BINS }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    const [h, s, l] = toHsl(px[i], px[i + 1], px[i + 2]);
    const w = s * (1 - Math.abs(l - 0.5) * 2);
    if (w < 0.05) continue;
    const bin = bins[Math.floor(h * BINS) % BINS];
    bin.w += w;
    bin.r += px[i] * w;
    bin.g += px[i + 1] * w;
    bin.b += px[i + 2] * w;
    total += w;
  }
  const best = bins.reduce((a, b) => (b.w > a.w ? b : a));
  if (total < 20 || best.w === 0) return null;

  const [h, s] = toHsl(best.r / best.w, best.g / best.w, best.b / best.w);
  const hue = Math.round(h * 360);
  // clamp saturation so neither dull nor neon colours end up on buttons
  const sat = Math.round(Math.min(0.85, Math.max(0.45, s)) * 100);
  return {
    "--amb": `hsl(${hue} ${sat}% 50%)`,
    "--amb-primary": `hsl(${hue} ${sat}% 45%)`,
    "--amb-text-dark": `hsl(${hue} ${sat}% 74%)`,
    "--amb-text-light": `hsl(${hue} ${sat}% 34%)`,
  };
}

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return [h, s, l];
}
