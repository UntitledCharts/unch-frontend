import { API_URL } from "$lib/config.js";
import type { LayoutServerLoad } from "./$types";

const ASSETS_TTL_MS = 300_000;
const ASSETS_RETRY_MS = 30_000;

let assets: { banner: string | null; expires: number } = { banner: null, expires: 0 };

async function defaultBanner(fetchFn: typeof fetch): Promise<string | null> {
  if (Date.now() < assets.expires) return assets.banner;
  try {
    const res = await fetchFn(`${API_URL}/v1/assets`);
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { banner_webp?: { url: string } | null; banner?: { url: string } | null };
    assets = { banner: body.banner_webp?.url ?? body.banner?.url ?? null, expires: Date.now() + ASSETS_TTL_MS };
  } catch {
    assets = { banner: assets.banner, expires: Date.now() + ASSETS_RETRY_MS };
  }
  return assets.banner;
}

export const load: LayoutServerLoad = async ({ locals, fetch }) => ({
  lang: locals.lang,
  discord: locals.discord,
  defaultBanner: await defaultBanner(fetch),
});
