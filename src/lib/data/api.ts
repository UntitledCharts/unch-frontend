import type {
  Account,
  Chart,
  Comment,
  ScoreEntry,
  Trends,
  LeaderboardType,
} from "./types.js";

import { API_URL } from "$lib/config.js";

export { API_URL };

type Fetch = typeof fetch;

type RawChart = Record<string, unknown>;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

async function getJson(
  fetchFn: Fetch,
  url: string,
  init?: RequestInit,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetchFn(url, init);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function mapChart(r: RawChart): Chart {
  const created = str(r.created_at);
  return {
    id: str(r.id),
    rating: num(r.rating),
    author: str(r.author),
    author_handle: num(r.author_handle),
    author_full: str(r.author_full),
    chart_design: str(r.chart_design) || str(r.author_full),
    title: str(r.title),
    artists: str(r.artists),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    description: typeof r.description === "string" ? r.description : null,
    staff_pick: !!r.staff_pick,
    status: (str(r.status, "PUBLIC") as Chart["status"]) || "PUBLIC",
    like_count: num(r.like_count),
    comment_count: num(r.comment_count),
    created_at: created,
    published_at: str(r.published_at) || created,
    updated_at: str(r.updated_at) || created,
    jacket_file_hash: str(r.jacket_file_hash),
    music_file_hash: str(r.music_file_hash),
    background_file_hash:
      str(r.background_file_hash) || str(r.background_v3_file_hash) || str(r.background_v1_file_hash),
    chart_file_hash: str(r.chart_file_hash),
    preview_file_hash: str(r.preview_file_hash),
    custom_background: !!str(r.background_file_hash),
    scheduled_publish: str(r.scheduled_publish) || null,
  };
}

function mapAccount(a: Record<string, unknown> = {}): Account {
  return {
    sonolus_id: str(a.sonolus_id),
    sonolus_handle: num(a.sonolus_handle),
    sonolus_username: str(a.sonolus_username, "Unknown"),
    profile_hash: typeof a.profile_hash === "string" ? a.profile_hash : null,
    banner_hash: typeof a.banner_hash === "string" ? a.banner_hash : null,
    description: typeof a.description === "string" ? a.description : null,
    mod: !!a.mod,
    admin: !!a.admin,
    banned: !!a.banned,
  };
}

export async function fetchCharts(
  fetchFn: Fetch,
  params: Record<string, string | number | boolean>,
): Promise<{ data: Chart[]; pageCount: number }> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const json = await getJson(fetchFn, `${API_URL}/api/charts?${qs}`);
  if (!json) return { data: [], pageCount: 1 };
  const data = Array.isArray(json.data) ? (json.data as RawChart[]).map(mapChart) : [];
  return { data, pageCount: num(json.pageCount, 1) };
}

// The charts API always pages by 10 and ignores `limit`. Grids want 12 (fills 2, 3 or 4 columns), so
// this reads `count` charts starting at `offset` from whichever API pages cover them.
const API_PAGE = 10;
export async function fetchChartsWindow(
  fetchFn: Fetch,
  params: Record<string, string | number | boolean>,
  offset: number,
  count: number,
): Promise<{ data: Chart[]; total: number }> {
  const first = Math.floor(offset / API_PAGE);
  const last = Math.floor((offset + count - 1) / API_PAGE);
  const pages = await Promise.all(
    Array.from({ length: last - first + 1 }, (_, i) => fetchCharts(fetchFn, { ...params, page: first + i })),
  );
  // random searches can repeat a chart across two pages
  const seen = new Set<string>();
  const all = pages.flatMap((r) => r.data).filter((c) => !seen.has(c.id) && seen.add(c.id));
  const start = offset - first * API_PAGE;
  return { data: all.slice(start, start + count), total: (pages[0]?.pageCount ?? 1) * API_PAGE };
}

export async function fetchChart(
  fetchFn: Fetch,
  id: string,
  sessionKey?: string,
): Promise<Chart | null> {
  const init = sessionKey ? { headers: { Authorization: sessionKey } } : undefined;
  const json = await getJson(fetchFn, `${API_URL}/api/charts/${id}`, init);
  if (!json) return null;
  const raw = (json.data ?? json) as RawChart;
  return raw && raw.id ? mapChart(raw) : null;
}

// Public details of a chart that's scheduled but not released yet (title, artists, cover, release
// time). Returns null for charts that aren't scheduled.
export async function fetchScheduledChart(fetchFn: Fetch, id: string): Promise<Chart | null> {
  const json = await getJson(fetchFn, `${API_URL}/api/charts/${id}/scheduled/`);
  const raw = json?.data as RawChart | undefined;
  return raw && raw.id ? mapChart(raw) : null;
}

// Schedules a chart to go public at `at`, or cancels the schedule when `at` is null.
export async function scheduleChart(sessionKey: string, id: string, at: Date | null): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/charts/${id}/visibility/schedule-public/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: sessionKey },
      body: JSON.stringify({ publish_time: at ? Math.floor(at.getTime() / 1000) : null }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchMyCharts(
  fetchFn: Fetch,
  sessionKey: string,
  params: Record<string, string | number> = {},
): Promise<{ data: Chart[]; pageCount: number }> {
  const merged: Record<string, string | number> = {
    type: "advanced",
    status: "ALL",
    sort_by: "created_at",
    sort_order: "desc",
    page: 0,
    limit: 24,
    ...params,
  };
  const qs = new URLSearchParams(
    Object.entries(merged).map(([k, v]) => [k, String(v)]),
  ).toString();
  try {
    const res = await fetchFn(`${API_URL}/api/charts?${qs}`, {
      headers: { Authorization: sessionKey },
    });
    if (!res.ok) return { data: [], pageCount: 1 };
    const json = await res.json();
    const data = Array.isArray(json.data) ? (json.data as RawChart[]).map(mapChart) : [];
    return { data, pageCount: num(json.pageCount, 1) };
  } catch {
    return { data: [], pageCount: 1 };
  }
}

export type UploadData = {
  rating: number;
  title: string;
  artists: string;
  author: string;
  description: string;
  includes_background: boolean;
  includes_preview: boolean;
  status: string;
  tags: string[];
};

export type UploadFiles = {
  chart_file: File;
  jacket_image: File;
  audio_file: File;
  preview_file?: File | null;
  background_image?: File | null;
};

export async function uploadChart(
  sessionKey: string,
  data: UploadData,
  files: UploadFiles,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  fd.append("jacket_image", files.jacket_image);
  fd.append("audio_file", files.audio_file);
  fd.append("chart_file", files.chart_file);
  if (files.preview_file) fd.append("preview_file", files.preview_file);
  if (files.background_image) fd.append("background_image", files.background_image);

  try {
    const res = await fetch(`${API_URL}/api/charts/upload/`, {
      method: "POST",
      headers: { Authorization: sessionKey },
      body: fd,
    });
    if (!res.ok) {
      let msg = `Upload failed (${res.status})`;
      try {
        const e = await res.json();
        msg = e.detail || e.message || JSON.stringify(e);
      } catch {
        try {
          msg = (await res.text()) || msg;
        } catch {
        }
      }
      return { ok: false, error: msg };
    }
    const result = await res.json();
    return { ok: true, id: str(result.id) };
  } catch {
    return { ok: false, error: "Network error, please try again." };
  }
}

async function uploadAccountImage(url: string, key: string, file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch(url, { method: "POST", headers: { Authorization: key }, body: fd });
    if (!res.ok) return null;
    const j = await res.json().catch(() => ({}) as Record<string, unknown>);
    return typeof j.hash === "string" ? j.hash : null;
  } catch {
    return null;
  }
}

export function uploadProfileImage(key: string, sonolusId: string, file: File): Promise<string | null> {
  return uploadAccountImage(`${API_URL}/api/accounts/${sonolusId}/profile/upload`, key, file);
}

export function uploadBanner(key: string, sonolusId: string, file: File): Promise<string | null> {
  return uploadAccountImage(`${API_URL}/api/accounts/${sonolusId}/banner/upload`, key, file);
}

export async function updateAccount(
  key: string,
  sonolusId: string,
  fields: { description: string; profile_hash?: string; banner_hash?: string },
): Promise<boolean> {
  const body: Record<string, unknown> = { description: fields.description };
  if (fields.profile_hash) {
    body.profile_hash = fields.profile_hash;
    body.profile_image_hash = fields.profile_hash;
    body.pfp = fields.profile_hash;
    body.hash = fields.profile_hash;
  }
  if (fields.banner_hash) {
    body.banner_hash = fields.banner_hash;
    body.banner_image_hash = fields.banner_hash;
    body.banner = fields.banner_hash;
  }
  try {
    const res = await fetch(`${API_URL}/api/accounts/${sonolusId}/description`, {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type EditData = {
  title: string;
  artists: string;
  author: string;
  rating: number;
  description: string;
  status: string;
  tags: string[];
  includes_jacket: boolean;
  includes_audio: boolean;
  includes_chart: boolean;
  includes_preview: boolean;
  includes_background: boolean;
  delete_background: boolean;
  delete_preview: boolean;
};

export async function editChart(
  sessionKey: string,
  id: string,
  data: EditData,
  files: Partial<UploadFiles>,
  statusChanged: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  if (files.jacket_image) fd.append("jacket_image", files.jacket_image);
  if (files.audio_file) fd.append("audio_file", files.audio_file);
  if (files.chart_file) fd.append("chart_file", files.chart_file);
  if (files.preview_file) fd.append("preview_file", files.preview_file);
  if (files.background_image) fd.append("background_image", files.background_image);

  try {
    const res = await fetch(`${API_URL}/api/charts/${id}/edit/`, {
      method: "PATCH",
      headers: { Authorization: sessionKey },
      body: fd,
    });
    if (!res.ok) {
      let msg = `Edit failed (${res.status})`;
      try {
        const e = await res.json();
        msg = e.detail || e.message || JSON.stringify(e);
      } catch {
        try {
          msg = (await res.text()) || msg;
        } catch {
        }
      }
      return { ok: false, error: msg };
    }
    if (statusChanged) {
      await fetch(`${API_URL}/api/charts/${id}/visibility/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: sessionKey },
        body: JSON.stringify({ status: data.status }),
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error, please try again." };
  }
}

export async function fetchAccountByHandle(
  fetchFn: Fetch,
  handle: string,
): Promise<{ account: Account; charts: Chart[] } | null> {
  let sonolusId = "";
  const h = await getJson(fetchFn, `${API_URL}/api/accounts/handle/${handle}/`);
  if (h && typeof h.sonolus_id === "string") sonolusId = h.sonolus_id;

  const j = await getJson(fetchFn, `${API_URL}/api/accounts/${sonolusId || handle}`);
  if (j && j.account) {
    const account = mapAccount(j.account as Record<string, unknown>);
    const charts = Array.isArray(j.charts) ? (j.charts as RawChart[]).map(mapChart) : [];
    return { account, charts };
  }

  const list = await fetchCharts(fetchFn, {
    type: "advanced",
    sonolus_handle_is: handle,
    sort_by: "created_at",
    sort_order: "desc",
    limit: 50,
  });
  if (list.data.length === 0) return null;

  const account: Account = {
    sonolus_id: list.data[0].author,
    sonolus_handle: Number(handle) || 0,
    sonolus_username: str(list.data[0].author_full).split("#")[0] || "Unknown",
    profile_hash: null,
    banner_hash: null,
    description: null,
    mod: false,
    admin: false,
    banned: false,
  };
  return { account, charts: list.data };
}

function mapComment(r: Record<string, unknown>): Comment {
  return {
    id: num(r.id),
    username: str(r.username),
    content: str(r.content),
    created_at: num(r.created_at),
    deleted_at: typeof r.deleted_at === "number" ? r.deleted_at : null,
    account: mapAccount(r.account as Record<string, unknown>),
  };
}

export async function fetchComments(
  fetchFn: Fetch,
  id: string,
  page = 0,
  limit = 10,
): Promise<{ data: Comment[]; pageCount: number }> {
  const json = await getJson(fetchFn, `${API_URL}/api/charts/${id}/comment/?page=${page}&limit=${limit}`);
  if (!json) return { data: [], pageCount: 1 };
  const data = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]).map(mapComment) : [];
  return { data, pageCount: num(json.pageCount, 1) };
}

export async function fetchTrends(fetchFn: Fetch, id: string): Promise<Trends> {
  const json = await getJson(fetchFn, `${API_URL}/api/charts/${id}/trends/`);
  if (!json) return { likes: [], comments: [] };
  return {
    likes: Array.isArray(json.likes) ? (json.likes as number[]) : [],
    comments: Array.isArray(json.comments) ? (json.comments as number[]) : [],
  };
}

function mapScore(r: Record<string, unknown>): ScoreEntry {
  return {
    id: num(r.id),
    engine: str(r.engine),
    grade: str(r.grade),
    nperfect: num(r.nperfect),
    ngreat: num(r.ngreat),
    ngood: num(r.ngood),
    nmiss: num(r.nmiss),
    arcade_score: num(r.arcade_score),
    accuracy_score: num(r.accuracy_score),
    speed: num(r.speed),
    display_name: str(r.display_name),
    account: mapAccount(r.account as Record<string, unknown>),
    created_at: str(r.created_at),
    chart_id: str(r.chart_id),
    replay_data_hash: typeof r.replay_data_hash === "string" ? r.replay_data_hash : null,
  };
}

export async function fetchLeaderboard(
  fetchFn: Fetch,
  id: string,
  type: LeaderboardType,
  page = 0,
  limit = 10,
): Promise<{ data: ScoreEntry[]; pageCount: number }> {
  const json = await getJson(
    fetchFn,
    `${API_URL}/api/charts/${id}/leaderboards/?page=${page}&leaderboard_type=${type}&limit=${limit}`,
  );
  if (!json) return { data: [], pageCount: 1 };
  const data = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]).map(mapScore) : [];
  return { data, pageCount: num(json.pageCount, 1) };
}

// There's no single-score endpoint, so walk the chart's leaderboard until the id shows up.
// The API only allows limit=3 or limit=10.
export async function findScore(
  fetchFn: Fetch,
  chartId: string,
  scoreId: number,
  maxPages = 30,
): Promise<ScoreEntry | null> {
  for (let page = 0; page < maxPages; page++) {
    const { data, pageCount } = await fetchLeaderboard(fetchFn, chartId, "arcade_score_speed", page, 10);
    const hit = data.find((e) => e.id === scoreId);
    if (hit) return hit;
    if (page + 1 >= pageCount) break;
  }
  return null;
}

export function replayName(chartId: string, scoreId: number): string {
  return `UnCh-${chartId}-${scoreId}`;
}

export async function fetchAccountById(fetchFn: Fetch, id: string): Promise<Account | null> {
  const j = await getJson(fetchFn, `${API_URL}/api/accounts/${id}`);
  if (!j) return null;
  const raw = (j.account ?? j) as Record<string, unknown>;
  return raw && raw.sonolus_id ? mapAccount(raw) : null;
}

export type AccountStats = {
  chartsPublished: number;
  likesReceived: number;
  commentsReceived: number;
  likedCharts: number;
  commentsWritten: number;
};

export async function fetchAccountStats(fetchFn: Fetch, id: string): Promise<AccountStats | null> {
  const j = await getJson(fetchFn, `${API_URL}/api/accounts/${id}/stats`);
  if (!j) return null;
  return {
    chartsPublished: num(j.charts_published),
    likesReceived: num(j.likes_received),
    commentsReceived: num(j.comments_received),
    likedCharts: num(j.liked_charts_count),
    commentsWritten: num(j.comments_count),
  };
}
