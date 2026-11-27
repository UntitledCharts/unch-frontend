import { json } from "@sveltejs/kit";
import { buildStatus, parseStatusId } from "$lib/server/activity.js";
import type { RequestHandler } from "./$types";
import { SITE_URL } from "$lib/config.js";

export const GET: RequestHandler = async ({ params, url, fetch }) => {
  const ref = parseStatusId(params.id);
  const body = ref ? await buildStatus(fetch, ref, SITE_URL) : null;
  if (!body) return json({ error: "Record not found" }, { status: 404 });
  return json(body, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
};
