import {
  PUBLIC_API_URL,
  PUBLIC_CDN_URL,
  PUBLIC_SITE_URL,
  PUBLIC_SONOLUS_HOST,
} from "$env/static/public";

// Everything here comes from .env (see .env.example). Trailing slashes are dropped so paths can be appended with "/".
const trim = (url: string) => url.replace(/\/+$/, "");

export const API_URL = trim(PUBLIC_API_URL);
export const CDN_URL = trim(PUBLIC_CDN_URL);
// Where this site is deployed. Used for links that leave the site: canonical URLs, embeds, shared links.
export const SITE_URL = trim(PUBLIC_SITE_URL);

// The Sonolus server this site belongs to, as a bare host (e.g. untitledcharts.com).
export const SONOLUS_HOST = PUBLIC_SONOLUS_HOST.replace(/^https?:\/\//, "").replace(/\/+$/, "");
export const SONOLUS_SERVER_URL = `https://${SONOLUS_HOST}`;

export function sonolusOpenUrl(path = ""): string {
  return `https://open.sonolus.com/${SONOLUS_HOST}/${path}`;
}
