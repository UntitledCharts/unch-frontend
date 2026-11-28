import { error } from "@sveltejs/kit";
import { ADSENSE_CLIENT } from "$lib/config.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
  if (!ADSENSE_CLIENT) error(404);
  const publisher = ADSENSE_CLIENT.replace(/^ca-/, "");
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
};
