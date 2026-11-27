import { CDN_URL } from "$lib/config.js";
import type { RequestHandler } from "./$types";

// Serves CDN images from our own origin so the browser can read their pixels (the CDN sends no CORS
// headers). Only CDN URLs are accepted, so this can't be used as an open proxy.
export const GET: RequestHandler = async ({ url, fetch }) => {
  const target = url.searchParams.get("url");
  if (!target || !target.startsWith(`${CDN_URL}/`)) {
    return new Response("Only CDN images can be proxied", { status: 400 });
  }

  const res = await fetch(target).catch(() => null);
  const type = res?.headers.get("Content-Type") ?? "";
  if (!res?.ok || !res.body || !type.startsWith("image/")) {
    return new Response("Image unavailable", { status: 502 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
};
