// @cf-wasm builds pick the right wasm loader for Node (dev) and Cloudflare workerd (prod)
import { satori } from "@cf-wasm/satori";
import { Resvg } from "@cf-wasm/resvg";
import { loadFonts } from "./fonts.js";
import { emojis } from "$lib/data/emojis.js";
import { CDN_URL } from "$lib/config.js";

const WIDTH = 1200;
const HEIGHT = 630;

export type OgNode = {
  type: string;
  props: Record<string, unknown> & { children?: OgChildren };
};
export type OgChildren = OgNode | string | null | undefined | Array<OgNode | string | null | undefined>;

export function h(
  type: string,
  props: Record<string, unknown> = {},
  children?: OgChildren,
): OgNode {
  return { type, props: { ...props, children } };
}

export async function renderOgPng(tree: OgNode, text: string): Promise<ArrayBuffer> {
  const fonts = await loadFonts(text);
  const svg = await satori(tree as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts });
  const resvg = await Resvg.async(svg, { fitTo: { mode: "width", value: WIDTH } });
  const png = resvg.render().asPng();
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
}

export async function toDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const EMOJI_TOKEN = /:([a-zA-Z0-9_]+):/g;

export function ogText(value: string | null | undefined, max = 40): string {
  const cleaned = (value ?? "")
    .replace(EMOJI_TOKEN, (m, name: string) => (emojis[name] ? ` ${m} ` : ""))
    .replace(/\s+/g, " ")
    .trim();
  let out = "";
  let used = 0;
  for (const part of cleaned.split(/(:[a-zA-Z0-9_]+:)/)) {
    if (!part) continue;
    const isEmoji = /^:[a-zA-Z0-9_]+:$/.test(part);
    const cost = isEmoji ? 2 : part.length;
    if (used + cost > max - 1) {
      if (!isEmoji) out += part.slice(0, Math.max(0, max - 1 - used));
      return out.trimEnd() + "…";
    }
    out += part;
    used += cost;
  }
  return out;
}

export function ogPlain(value: string): string {
  return value.replace(EMOJI_TOKEN, "");
}

export async function ogEmojis(texts: string[], origin: string): Promise<Record<string, string>> {
  const names = new Set<string>();
  for (const t of texts) for (const m of t.matchAll(EMOJI_TOKEN)) if (emojis[m[1]]) names.add(m[1]);
  const entries = await Promise.all(
    [...names].map(async (n) => [n, await toDataUrl(`${origin}/emojis/og/${n}.png`)] as const),
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => !!e[1]));
}


export function ogProfileUrl(sonolusId: string, hash: string | null, origin: string): string {
  return hash ? `${CDN_URL}/${sonolusId}/profile/${hash}` : `${origin}/defpfp.png`;
}

export function ogBannerUrl(sonolusId: string, hash: string | null, origin: string): string {
  return hash ? `${CDN_URL}/${sonolusId}/banner/${hash}` : `${origin}/def.png`;
}
