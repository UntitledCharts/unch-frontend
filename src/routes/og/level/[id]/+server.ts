import { fetchChart, coverUrl, backgroundUrl, API_URL } from "$lib/data/index.js";
import { renderOgPng, toDataUrl, ogText, ogProfileUrl, ogEmojis, ogPlain } from "$lib/server/og/render.js";
import { buildLevelOg } from "$lib/server/og/templates.js";
import { miku } from "$lib/server/og/assets.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url }) => {
  const id = params.id.replace(/^unch-/i, "");
  const chart = await fetchChart(fetch, id);
  if (!chart) return new Response("Not found", { status: 404 });

  let pfpUrl = ogProfileUrl(chart.author, null, url.origin);
  try {
    const acc = await fetch(`${API_URL}/api/accounts/${chart.author}`).then((r) =>
      r.ok ? r.json() : null,
    );
    const hash = acc?.account?.profile_hash;
    if (hash) pfpUrl = ogProfileUrl(chart.author, hash, url.origin);
  } catch {
    void 0;
  }

  const [jacket, background, pfp] = await Promise.all([
    toDataUrl(coverUrl(chart)),
    toDataUrl(backgroundUrl(chart)),
    toDataUrl(pfpUrl),
  ]);

  const title = ogText(chart.title, 30);
  const artists = ogText(chart.artists, 40);
  const author = ogText(chart.chart_design || chart.author_full, 26);
  const description = ogText(chart.description, 140);

  const emojis = await ogEmojis([title, artists, author, description], url.origin);

  const markup = buildLevelOg({
    title,
    artists,
    author,
    description,
    emojis,
    rating: chart.rating,
    likeCount: chart.like_count,
    commentCount: chart.comment_count,
    staffPick: chart.staff_pick,
    jacket,
    background,
    pfp,
    miku,
  });

  const png = await renderOgPng(markup, ogPlain(title + artists + author + description));
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
