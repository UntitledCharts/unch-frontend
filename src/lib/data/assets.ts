import { siteAssets } from "$lib/state/site-assets.svelte.js";
import type { Chart, ImageUrls } from "./types.js";

export const DEFAULT_AVATAR = "/defpfp.webp";

export function coverUrl(chart: Chart): string | null {
  return chart.files.jacket;
}

export function bgmUrl(chart: Chart): string | null {
  return chart.files.music;
}

const proxied = (url: string | null) => (url ? `/api/audio-proxy?url=${encodeURIComponent(url)}` : null);

// The charter's preview clip if there is one, otherwise the whole song. Goes through the proxy because the
// waveform has to decode the audio, and the CDN doesn't send CORS headers.
export function previewProxyUrl(chart: Chart): string | null {
  return proxied(chart.files.preview ?? bgmUrl(chart));
}

export function chartFileUrl(chart: Chart): string | null {
  return chart.files.chart;
}

export function backgroundUrl(chart: Chart): string | null {
  return chart.files.background ?? chart.files.background_v3 ?? chart.files.background_v1 ?? coverUrl(chart);
}

export function bgmProxyUrl(chart: Chart): string | null {
  return proxied(bgmUrl(chart));
}

export function chartFileProxyUrl(chart: Chart): string | null {
  return proxied(chartFileUrl(chart));
}

export function profileUrl(account: { avatar: ImageUrls | null }): string {
  return account.avatar?.webp_url ?? DEFAULT_AVATAR;
}

export function bannerUrl(account: { banner: ImageUrls | null }): string {
  return account.banner?.webp_url ?? siteAssets.banner ?? "";
}
