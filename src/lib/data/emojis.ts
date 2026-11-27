export type Emoji = { image: string };

export const emojis: Record<string, Emoji> = {
  mikuslain: { image: "mikuslain.png" },
  taki_smile: { image: "taki_smile.webp" },
  yaminabe: { image: "yaminabe.webp" },
  os_uweh: { image: "uweh.webp" },
  headbang: { image: "headbang.gif" },
  punish_natz: { image: "punish_natz.webp" },
  silly_3d_printed_cat: { image: "silly_3d_printed_cat.webp" },
  bugcat_swim: { image: "bugcat_swim.gif" },
  ilovesharks: { image: "shark.webp" },
};

export function emojiSrc(name: string): string | null {
  const cfg = emojis[name];
  if (!cfg?.image) return null;
  if (cfg.image.startsWith("http://") || cfg.image.startsWith("https://")) return cfg.image;
  return `/emojis/${cfg.image}`;
}
