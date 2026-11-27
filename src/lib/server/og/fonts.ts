export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

const cache = new Map<string, ArrayBuffer>();
const CJK_RE = /[぀-ヿ　-鿿가-힯＀-￯]/;

async function fetchFont(family: string, weight: number, text?: string): Promise<ArrayBuffer> {
  const key = `${family}:${weight}:${text ?? "*"}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
    (text ? `&text=${encodeURIComponent(text)}` : "");
  const css = await fetch(url).then((r) => r.text());
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
  if (!match) throw new Error(`Could not resolve font ${family} ${weight}`);

  const data = await fetch(match[1]).then((r) => r.arrayBuffer());
  cache.set(key, data);
  return data;
}

export async function loadFonts(text: string): Promise<OgFont[]> {
  const [regular, bold, display] = await Promise.all([
    fetchFont("Inter", 400),
    fetchFont("Inter", 700),
    fetchFont("Unbounded", 700),
  ]);
  const fonts: OgFont[] = [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
    { name: "Unbounded", data: display, weight: 700, style: "normal" },
  ];

  const cjk = Array.from(new Set(Array.from(text).filter((c) => CJK_RE.test(c)))).join("");
  if (cjk) {
    const [jpR, jpB] = await Promise.all([
      fetchFont("Noto Sans JP", 400, cjk),
      fetchFont("Noto Sans JP", 700, cjk),
    ]);
    fonts.push(
      { name: "Noto Sans JP", data: jpR, weight: 400, style: "normal" },
      { name: "Noto Sans JP", data: jpB, weight: 700, style: "normal" },
    );
  }
  return fonts;
}

export const OG_FONT_FAMILY = "Inter, 'Noto Sans JP'";
