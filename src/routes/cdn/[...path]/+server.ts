import { CDN_URL } from "$lib/config.js";
import type { RequestHandler } from "./$types";

// CDN files under our own domain with a file extension, e.g. /cdn/<author>/<chart>/<hash>.png.
// Discord's component embeds only accept image URLs that end in an image extension, and the CDN's are
// bare hashes. The extension is dropped before fetching; the real content type comes from the CDN.
export const GET: RequestHandler = async ({ params, fetch }) => {
  const path = params.path.replace(/\.(png|jpe?g|webp|gif|avif)$/i, "");
  if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

  const res = await fetch(`${CDN_URL}/${path}`).catch(() => null);
  const type = res?.headers.get("Content-Type") ?? "";
  if (!res?.ok || !res.body || !type.startsWith("image/")) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": type,
      // CDN paths are content hashes, so a given URL never changes
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
