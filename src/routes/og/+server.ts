import { renderOgPng, toDataUrl, ogText } from "$lib/server/og/render.js";
import { buildGenericOg } from "$lib/server/og/templates.js";
import { logo, miku } from "$lib/server/og/assets.js";
import { fetchCharts, coverUrl } from "$lib/data/index.js";
import type { RequestHandler } from "./$types";

const DEFAULT_SUBTITLE = "A community catalog of Sonolus rhythm-game charts";

export const GET: RequestHandler = async ({ url, fetch }) => {
  const rawTitle = url.searchParams.get("title");
  const title = ogText(rawTitle || "UntitledCharts", 34);
  const subtitle = ogText(url.searchParams.get("subtitle") || DEFAULT_SUBTITLE, 80);

  const staff = await fetchCharts(fetch, { type: "advanced", staff_pick: 1, limit: 3 });
  const jackets = (await Promise.all(staff.data.map((c) => toDataUrl(coverUrl(c))))).filter(
    (j): j is string => !!j,
  );

  const markup = buildGenericOg({ title, subtitle, isHome: !rawTitle, logo, miku, jackets });
  const png = await renderOgPng(markup, title + subtitle);
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
