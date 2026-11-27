import { compact } from "$lib/data/format.js";

export function levelStatusId(chartId: string): string | null {
  return /^[0-9a-f]+$/i.test(chartId) ? `1${BigInt(`0x${chartId}`).toString()}` : null;
}

export function userStatusId(handle: string | number): string | null {
  return /^\d+$/.test(String(handle)) ? `2${handle}` : null;
}

export function levelFooter(rating: number, likes: number, comments: number): string {
  return `Lv. ${rating} ❤️ ${compact(likes)} 💬 ${compact(comments)} · UntitledCharts`;
}

export function userFooter(charts: number, likes: number, comments: number): string {
  return `🎵 ${compact(charts)} ❤️ ${compact(likes)} 💬 ${compact(comments)} · UntitledCharts`;
}
