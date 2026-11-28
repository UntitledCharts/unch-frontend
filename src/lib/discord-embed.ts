import type { Account, Chart } from "$lib/data/index.js";
import { coverUrl, profileUrl, bannerUrl, parseDescriptionMeta } from "$lib/data/index.js";
import { CDN_URL, sonolusOpenUrl } from "$lib/config.js";

// Discord component embeds: https://docs.discord.com/developers/link-previews/component-embeds
// Limits worth knowing: one top-level container, at most 40 components, 3,000 bytes of JSON, link buttons
// only (style 5). Built from the chart's own artwork rather than a rendered OG image.
// Discord flattens line breaks inside a link preview's text block, which also breaks line-start markdown
// (# headings, -# subtext). So every line gets its own text block, and emphasis is bold, not headings.

type Component = Record<string, unknown>;

const BLUE = 0x3b8bfd;
const MIKU = 0x39c5bb;

function clean(value: string | null | undefined, max = 300): string {
  const text = (value ?? "")
    .replace(/:([a-zA-Z0-9_]+):/g, "")
    .replace(/[*_~`|\\[\]#]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

// descriptions are often written one fact per line; joined with dots they still read once flattened
function oneLine(value: string | null | undefined, max: number): string {
  const lines = (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return clean(lines.join(" · "), max);
}

function absolute(url: string, origin: string) {
  return url.startsWith("http") ? url : `${origin}${url}`;
}

// Discord wants image URLs that end in an image extension; CDN URLs are bare hashes, so route them
// through /cdn on our own domain (see routes/cdn). Local files like /defpfp.webp already have one.
function media(url: string | null, origin: string): string | null {
  if (!url) return null;
  if (!CDN_URL || !url.startsWith(`${CDN_URL}/`)) return absolute(url, origin);
  const path = url.slice(CDN_URL.length + 1);
  return `${origin}/cdn/${path}${path.endsWith("_webp") ? ".webp" : ".png"}`;
}

// numbers in bold so they stand out in the stats lines
function plural(n: number, one: string, many: string) {
  return `**${n.toLocaleString("en-US")}** ${n === 1 ? one : many}`;
}

function container(accent: number, components: (Component | null)[]) {
  return { component: { type: 17, accent_color: accent, components: components.filter(Boolean) } };
}

const text = (content: string): Component => ({ type: 10, content });
const link = (label: string, url: string): Component => ({ type: 2, style: 5, label, url });
// a single gallery image always spans the full embed width; two share the row at half width each
const gallery = (...images: [url: string, description: string][]): Component => ({
  type: 12,
  items: images.map(([url, description]) => ({ media: { url }, description })),
});
const thumbnailSection = (lines: Component[], url: string | null, description: string): Component[] =>
  url ? [{ type: 9, components: lines, accessory: { type: 11, media: { url }, description } }] : lines;

// Discord drops the whole embed past 3,000 bytes (CJK text is 3 bytes a character), so the description
// starts long and is trimmed until the finished payload fits, with a little headroom.
const EMBED_BYTE_BUDGET = 2900;

export function levelEmbed(chart: Chart, origin: string) {
  for (let max = 600; max > 0; max -= 50) {
    const embed = buildLevelEmbed(chart, origin, max);
    // measured as served: seo.svelte escapes < and > as six-character \u003c / \u003e sequences,
    // and Discord counts those in full
    const served = JSON.stringify(embed).replace(/[<>]/g, "\\u003c");
    if (new TextEncoder().encode(served).length <= EMBED_BYTE_BUDGET) return embed;
  }
  return buildLevelEmbed(chart, origin, 0);
}

function buildLevelEmbed(chart: Chart, origin: string, descriptionLength: number) {
  const page = `${origin}/levels/UnCh-${chart.id}`;
  const charter = `${origin}/users/${chart.author_handle}`;
  const bpm = parseDescriptionMeta(chart.description).bpm;
  const description = descriptionLength > 0 ? oneLine(chart.description, descriptionLength) : "";

  const stats = [
    `❤️ ${plural(chart.like_count, "like", "likes")}`,
    `💬 ${plural(chart.comment_count, "comment", "comments")}`,
    bpm ? `**${bpm}** BPM` : null,
    chart.staff_pick ? "✨ **Staff Pick**" : null,
  ].filter(Boolean);

  const cover = media(coverUrl(chart), origin);
  const heading = [
    text(`**[${clean(chart.title, 70)}](${page})**`),
    text(clean(chart.artists, 80)),
    text(`Lv. **${chart.rating}** · charted by [${clean(chart.chart_design, 50)}](${charter})`),
  ];

  return container(BLUE, [
    ...thumbnailSection(heading, cover, "Jacket"),
    description ? text(description) : null,
    { type: 14, divider: true, spacing: 1 },
    text(stats.join(" · ")),
    {
      type: 1,
      components: [
        link("Open in Sonolus", sonolusOpenUrl(`levels/UnCh-${chart.id}`)),
        link("View chart", page),
        link("View charter profile", charter),
      ],
    },
  ]);
}

export function userEmbed(
  account: Account,
  stats: { chartsPublished: number; likesReceived: number; commentsReceived: number } | null,
  origin: string,
) {
  const page = `${origin}/users/${account.sonolus_handle}`;
  const role = account.admin ? " · Administrator" : account.mod ? " · Moderator" : "";
  const bio = oneLine(account.description, 220);

  return container(MIKU, [
    account.banner ? gallery([media(bannerUrl(account), origin)!, `${clean(account.sonolus_username, 60)}'s banner`]) : null,
    ...thumbnailSection(
      [text(`**[${clean(account.sonolus_username, 60)}](${page})**`), text(`#${account.sonolus_handle}${role}`)],
      media(profileUrl(account), origin),
      "Avatar",
    ),
    bio ? text(bio) : null,
    stats
      ? text(
          `🎵 ${plural(stats.chartsPublished, "chart", "charts")} · ❤️ ${plural(stats.likesReceived, "like", "likes")} · 💬 ${plural(stats.commentsReceived, "comment", "comments")}`,
        )
      : null,
    {
      type: 1,
      components: [
        link("View profile", page),
        link("Browse charts", `${origin}/browse?sonolus_handle_is=${account.sonolus_handle}`),
      ],
    },
  ]);
}
