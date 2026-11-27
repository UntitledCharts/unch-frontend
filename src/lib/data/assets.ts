import type { Chart } from "./types.js";

import { CDN_URL } from "$lib/config.js";

export const ASSET_BASE_URL = CDN_URL;

export const DEFAULT_AVATAR = "/defpfp.webp";
export const DEFAULT_BANNER = "/def.webp";

export function assetUrl(author: string, id: string, hash: string | null | undefined): string | null {
  if (!author || !id || !hash) return null;
  return `${ASSET_BASE_URL}/${author}/${id}/${hash}`;
}

export function coverUrl(chart: Chart): string | null {
  return assetUrl(chart.author, chart.id, chart.jacket_file_hash);
}

export function bgmUrl(chart: Chart): string | null {
  return assetUrl(chart.author, chart.id, chart.music_file_hash);
}

// About the first 15 seconds of a typical MP3; used when a chart has no preview clip of its own.
const SONG_PREVIEW_BYTES = 300_000;

// The charter's preview clip if there is one, otherwise just the start of the song, so every card can
// draw a real waveform without downloading whole songs. Goes through the proxy because the waveform has
// to decode the audio, and the CDN doesn't send CORS headers.
export function previewProxyUrl(chart: Chart): string | null {
  const clip = assetUrl(chart.author, chart.id, chart.preview_file_hash);
  if (clip) return `/api/audio-proxy?url=${encodeURIComponent(clip)}`;
  const song = bgmUrl(chart);
  return song ? `/api/audio-proxy?url=${encodeURIComponent(song)}&bytes=${SONG_PREVIEW_BYTES}` : null;
}

export function chartFileUrl(chart: Chart): string | null {
  return assetUrl(chart.author, chart.id, chart.chart_file_hash);
}

export function backgroundUrl(chart: Chart): string | null {
  return assetUrl(chart.author, chart.id, chart.background_file_hash) ?? coverUrl(chart);
}

export function bgmProxyUrl(chart: Chart): string | null {
  const url = bgmUrl(chart);
  return url ? `/api/audio-proxy?url=${encodeURIComponent(url)}` : null;
}

export function chartFileProxyUrl(chart: Chart): string | null {
  const url = chartFileUrl(chart);
  return url ? `/api/audio-proxy?url=${encodeURIComponent(url)}` : null;
}

export function profileUrl(account: { sonolus_id: string; profile_hash: string | null }): string {
  if (!account.profile_hash || !account.sonolus_id) return DEFAULT_AVATAR;
  return `${ASSET_BASE_URL}/${account.sonolus_id}/profile/${account.profile_hash}_webp`;
}

export function bannerUrl(account: { sonolus_id: string; banner_hash: string | null }): string {
  if (!account.banner_hash || !account.sonolus_id) return DEFAULT_BANNER;
  return `${ASSET_BASE_URL}/${account.sonolus_id}/banner/${account.banner_hash}_webp`;
}
