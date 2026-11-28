import {
  PUBLIC_ADSENSE_CLIENT,
  PUBLIC_ADSENSE_SLOT,
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
// the site name is a brand, so it isn't translated and every page title ends with it
export const SITE_NAME = "UntitledCharts";
// link previews are read by crawlers, not visitors, so everything a page puts in them is English
export const SITE_DESCRIPTION = "Play and discover the largest Sonolus community's custom charts!";

// The Sonolus server this site belongs to, as a bare host (e.g. untitledcharts.com).
export const SONOLUS_HOST = PUBLIC_SONOLUS_HOST.replace(/^https?:\/\//, "").replace(/\/+$/, "");
export const SONOLUS_SERVER_URL = `https://${SONOLUS_HOST}`;

export const ADSENSE_CLIENT = PUBLIC_ADSENSE_CLIENT.trim();
export const ADSENSE_SLOT = PUBLIC_ADSENSE_SLOT.trim();
export const ADS_ENABLED = !!ADSENSE_CLIENT && !!ADSENSE_SLOT;

export function sonolusOpenUrl(path = ""): string {
  return `https://open.sonolus.com/${SONOLUS_HOST}/${path}`;
}

// Link preview images are drawn by the API. The site image takes an optional title and subtitle; without
// a title it's the home page design.
export function ogSiteUrl(title?: string, subtitle?: string): string {
  const query = new URLSearchParams();
  if (title) query.set("title", title);
  if (subtitle) query.set("subtitle", subtitle);
  const qs = query.toString();
  return `${API_URL}/v1/og/site${qs ? `?${qs}` : ""}`;
}

export const ogChartUrl = (chartId: string) => `${API_URL}/v1/og/charts/${chartId}`;

export const ogAccountUrl = (accountId: string) => `${API_URL}/v1/og/accounts/${accountId}`;
