import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SITE_URL } from "$lib/config.js";

export const GET: RequestHandler = ({ url }) => {
  const author = url.searchParams.get("author") ?? "";
  const handle = url.searchParams.get("handle") ?? "";
  const title = url.searchParams.get("title") ?? "UntitledCharts";
  const footer = url.searchParams.get("footer");

  const payload: Record<string, unknown> = {
    version: "1.0",
    type: "link",
    title,
    provider_name: "UntitledCharts",
    provider_url: SITE_URL,
  };
  if (footer) {
    payload.type = "rich";
    payload.provider_name = footer;
    const page = url.searchParams.get("page");
    if (page?.startsWith("/")) payload.provider_url = SITE_URL + page;
  } else if (author) {
    payload.author_name = author;
    payload.author_url = handle ? `${SITE_URL}/creators/${handle}` : SITE_URL;
  }

  return json(payload, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
};
