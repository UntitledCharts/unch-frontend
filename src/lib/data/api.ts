import type {
  Account,
  AccountBadge,
  Chart,
  ChartDetails,
  ChartFiles,
  ChartViewer,
  Comment,
  ImageUrls,
  ScoreEntry,
  Trends,
  LeaderboardType,
} from "./types.js";

import { MOD_PERMISSIONS } from "./types.js";
import { API_URL } from "$lib/config.js";
import { statusMessage } from "$lib/errors.js";

export { API_URL };

type Fetch = typeof fetch;

type Raw = Record<string, unknown>;

export type Failure = { ok: false; error: string; code: string | null; params?: Record<string, unknown> };

export type Result = { ok: true } | Failure;


function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

export function bearer(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}` };
}

let unauthorized: ((key: string) => void) | null = null;

export function onUnauthorized(handler: (key: string) => void): void {
  unauthorized = handler;
}

function sentKey(init?: RequestInit): string | null {
  const header = new Headers(init?.headers).get("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

// a 401 means the session sent along stopped working: the session state hears about it, and reads are
// tried again without it so public pages still load
export async function apiFetch(fetchFn: Fetch, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetchFn(url, init);
  const key = res.status === 401 ? sentKey(init) : null;
  if (!key) return res;
  unauthorized?.(key);
  if ((init?.method ?? "GET").toUpperCase() !== "GET") return res;
  const headers = new Headers(init?.headers);
  headers.delete("Authorization");
  return fetchFn(url, { ...init, headers });
}

// Failures come back as {"error": "error.x.y", "params": {...}}. The message is the generic one for the status;
// callers that expect a code word it themselves from `code` and `params`.
export async function readError(res: Response): Promise<Failure> {
  const body = (await res.json().catch(() => null)) as { error?: unknown; params?: Raw } | null;
  const code = typeof body?.error === "string" ? body.error : null;
  if (!code) return { ok: false, error: statusMessage(res.status), code: null };
  return { ok: false, error: statusMessage(res.status), code, params: body?.params ?? {} };
}

export async function send(url: string, init: RequestInit): Promise<Result> {
  try {
    const res = await apiFetch(fetch, url, init);
    return res.ok ? { ok: true } : await readError(res);
  } catch {
    return { ok: false, error: statusMessage(0), code: null };
  }
}

const auth = (sessionKey?: string | null): RequestInit | undefined =>
  sessionKey ? { headers: bearer(sessionKey) } : undefined;

export function jsonBody(body: unknown): { headers: Record<string, string>; body: string } {
  return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

async function getJson(
  fetchFn: Fetch,
  url: string,
  init?: RequestInit,
): Promise<Raw | null> {
  try {
    const res = await apiFetch(fetchFn, url, init);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getList(fetchFn: Fetch, url: string, init?: RequestInit): Promise<Raw[] | null> {
  try {
    const res = await apiFetch(fetchFn, url, init);
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

function query(params: Record<string, string | number | boolean | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) qs.append(name, String(item));
  }
  return qs.toString();
}

function fileUrl(files: Raw, name: keyof ChartFiles): string | null {
  const file = files[name] as Raw | null | undefined;
  return file && typeof file.url === "string" ? file.url : null;
}

function mapFiles(files: Raw): ChartFiles {
  return {
    jacket: fileUrl(files, "jacket"),
    music: fileUrl(files, "music"),
    chart: fileUrl(files, "chart"),
    preview: fileUrl(files, "preview"),
    background: fileUrl(files, "background"),
    background_v1: fileUrl(files, "background_v1"),
    background_v3: fileUrl(files, "background_v3"),
  };
}

export function mapChart(r: Raw): Chart {
  const created = str(r.created_at);
  const owner = (r.owner ?? {}) as Raw;
  return {
    id: str(r.id),
    rating: num(r.rating),
    author: str(owner.id),
    author_handle: num(owner.handle),
    chart_design: str(r.charter) || str(owner.username),
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
    files: mapFiles((r.files ?? {}) as Raw),
    scheduled_publish: str(r.scheduled_publish) || null,
  };
}

function mapViewer(v: Raw = {}): ChartViewer {
  const list = (value: unknown) => (Array.isArray(value) ? (value as string[]) : []);
  return {
    is_owner: !!v.is_owner,
    chart_permissions: list(v.chart_permissions),
    staff_permissions: list(v.staff_permissions),
  };
}

function mapImage(v: unknown): ImageUrls | null {
  const image = v as Raw | null | undefined;
  return image && typeof image.url === "string" && typeof image.webp_url === "string"
    ? { url: image.url, webp_url: image.webp_url }
    : null;
}

function mapBadges(v: unknown): AccountBadge[] {
  if (!Array.isArray(v)) return [];
  return (v as Raw[])
    .filter((b) => typeof b.badge === "string" && typeof b.image === "string")
    .map((b) => ({ badge: str(b.badge), level: num(b.level, 1), image: str(b.image), description_key: str(b.description_key) }));
}

export function mapAccount(a: Raw = {}): Account {
  const permissions = Array.isArray(a.permissions) ? (a.permissions as string[]) : [];
  return {
    sonolus_id: str(a.id),
    sonolus_handle: num(a.handle),
    sonolus_username: str(a.username, "Unknown"),
    avatar: mapImage(a.avatar),
    banner: mapImage(a.banner),
    description: typeof a.description === "string" ? a.description : null,
    permissions,
    mod: permissions.some((p) => (MOD_PERMISSIONS as readonly string[]).includes(p)),
    admin: permissions.includes("staff.manage"),
    banned: !!a.banned,
    badges: mapBadges(a.badges),
  };
}

export type ChartParams = Record<string, string | number | boolean | string[] | undefined>;

function mapPage(json: Raw | null): { data: Chart[]; pageCount: number } {
  if (!json) return { data: [], pageCount: 1 };
  const data = Array.isArray(json.items) ? (json.items as Raw[]).map(mapChart) : [];
  return { data, pageCount: Math.max(1, num(json.page_count, 1)) };
}

export async function fetchCharts(
  fetchFn: Fetch,
  params: ChartParams,
  sessionKey?: string | null,
): Promise<{ data: Chart[]; pageCount: number }> {
  return mapPage(await getJson(fetchFn, `${API_URL}/v1/charts?${query(params)}`, auth(sessionKey)));
}

// The charts API always pages by 10. Grids want 12 (fills 2, 3 or 4 columns), so this reads `count`
// charts starting at `offset` from whichever API pages cover them.
const API_PAGE = 10;
export async function fetchChartsWindow(
  fetchFn: Fetch,
  params: ChartParams,
  offset: number,
  count: number,
  sessionKey?: string | null,
): Promise<{ data: Chart[]; total: number }> {
  const first = Math.floor(offset / API_PAGE);
  const last = Math.floor((offset + count - 1) / API_PAGE);
  const pages = await Promise.all(
    Array.from({ length: last - first + 1 }, (_, i) =>
      fetchCharts(fetchFn, { ...params, page: first + i }, sessionKey),
    ),
  );
  // random sorts can repeat a chart across two pages
  const seen = new Set<string>();
  const all = pages.flatMap((r) => r.data).filter((c) => !seen.has(c.id) && seen.add(c.id));
  const start = offset - first * API_PAGE;
  return { data: all.slice(start, start + count), total: (pages[0]?.pageCount ?? 1) * API_PAGE };
}

// The random endpoint hands out 5 charts a call, so a grid takes a few calls; they can repeat a chart.
const RANDOM_BATCH = 5;
export async function fetchRandomCharts(fetchFn: Fetch, count: number): Promise<{ data: Chart[]; total: number }> {
  const url = `${API_URL}/v1/charts/random`;
  const batches = await Promise.all(
    Array.from({ length: Math.ceil(count / RANDOM_BATCH) }, () => getList(fetchFn, url)),
  );
  const seen = new Set<string>();
  const data = batches
    .flatMap((b) => (b ?? []).map(mapChart))
    .filter((c) => !seen.has(c.id) && seen.add(c.id))
    .slice(0, count);
  return { data, total: data.length };
}

// private charts, and their comments and leaderboards, only come back with the owner's or staff's session
export async function fetchChart(
  fetchFn: Fetch,
  id: string,
  sessionKey?: string | null,
): Promise<ChartDetails | null> {
  const json = await getJson(fetchFn, `${API_URL}/v1/charts/${id}`, auth(sessionKey));
  return json && json.id ? { ...mapChart(json), viewer: mapViewer(json.viewer as Raw) } : null;
}

// Public details of a chart that's scheduled but not released yet (title, artists, cover, release
// time). Returns null for charts that aren't scheduled.
export async function fetchScheduledChart(fetchFn: Fetch, id: string): Promise<Chart | null> {
  const json = await getJson(fetchFn, `${API_URL}/v1/charts/${id}/schedule`);
  if (!json || !json.id) return null;
  return mapChart({
    ...json,
    files: { jacket: json.jacket, background: json.background, background_v3: json.background_v3 },
  });
}

export async function fetchMyCharts(
  fetchFn: Fetch,
  sessionKey: string,
  params: ChartParams = {},
): Promise<{ data: Chart[]; pageCount: number }> {
  const merged: ChartParams = {
    status: "ALL",
    sort_by: "created_at",
    sort_order: "desc",
    page: 0,
    ...params,
  };
  return mapPage(await getJson(fetchFn, `${API_URL}/v1/charts?${query(merged)}`, { headers: bearer(sessionKey) }));
}

export type UploadData = {
  rating: number;
  title: string;
  artists: string;
  author: string;
  description: string;
  status: "PRIVATE" | "UNLISTED";
  includes_background: boolean;
  includes_preview: boolean;
  tags: string[];
};

export type UploadFiles = {
  chart_file: File;
  jacket_image: File;
  audio_file: File;
  preview_file?: File | null;
  background_image?: File | null;
};

type FileFields = { [K in keyof UploadFiles]?: File | null };

function appendFiles(fd: FormData, files: FileFields) {
  for (const [field, file] of Object.entries(files)) if (file) fd.append(field, file);
}

// uploads always land private; making them public is a separate step on the edit page
export async function uploadChart(
  sessionKey: string,
  data: UploadData,
  files: UploadFiles,
): Promise<{ ok: true; id: string } | Failure> {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  appendFiles(fd, files);
  try {
    const res = await apiFetch(fetch, `${API_URL}/v1/charts`, { method: "POST", headers: bearer(sessionKey), body: fd });
    if (!res.ok) return await readError(res);
    const result = await res.json();
    return { ok: true, id: str(result.id) };
  } catch {
    return { ok: false, error: statusMessage(0), code: null };
  }
}

async function uploadAccountImage(url: string, key: string, file: File): Promise<{ ok: true; image: ImageUrls | null } | Failure> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await apiFetch(fetch, url, { method: "PUT", headers: bearer(key), body: fd });
    if (!res.ok) return await readError(res);
    return { ok: true, image: mapImage(await res.json().catch(() => null)) };
  } catch {
    return { ok: false, error: statusMessage(0), code: null };
  }
}

export function uploadProfileImage(key: string, file: File): Promise<{ ok: true; image: ImageUrls | null } | Failure> {
  return uploadAccountImage(`${API_URL}/v1/me/avatar`, key, file);
}

export function uploadBanner(key: string, file: File): Promise<{ ok: true; image: ImageUrls | null } | Failure> {
  return uploadAccountImage(`${API_URL}/v1/me/banner`, key, file);
}

export function removeProfileImage(key: string): Promise<Result> {
  return send(`${API_URL}/v1/me/avatar`, { method: "DELETE", headers: bearer(key) });
}

export function removeBanner(key: string): Promise<Result> {
  return send(`${API_URL}/v1/me/banner`, { method: "DELETE", headers: bearer(key) });
}

export function updateAccount(key: string, fields: { description: string }): Promise<Result> {
  const { headers, body } = jsonBody({ description: fields.description });
  return send(`${API_URL}/v1/me`, { method: "PATCH", headers: { ...headers, ...bearer(key) }, body });
}

// only the fields that are present get changed
export type EditData = {
  title?: string;
  artists?: string;
  author?: string;
  rating?: number;
  description?: string;
  tags?: string[];
  includes_jacket?: boolean;
  includes_audio?: boolean;
  includes_chart?: boolean;
  includes_preview?: boolean;
  includes_background?: boolean;
  delete_background?: boolean;
};

export function editChart(sessionKey: string, id: string, data: EditData, files: FileFields): Promise<Result> {
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  appendFiles(fd, files);
  return send(`${API_URL}/v1/charts/${id}`, { method: "PATCH", headers: bearer(sessionKey), body: fd });
}

export type Profile = { account: Account; charts: Chart[]; collaborations: Chart[] };

async function fetchProfile(fetchFn: Fetch, id: string): Promise<Profile | null> {
  const j = await getJson(fetchFn, `${API_URL}/v1/accounts/${encodeURIComponent(id)}`);
  if (!j || !j.account) return null;
  const charts = (value: unknown) => (Array.isArray(value) ? (value as Raw[]).map(mapChart) : []);
  return { account: mapAccount(j.account as Raw), charts: charts(j.charts), collaborations: charts(j.collaborations) };
}

// profile pages are addressed by handle, but an account id works too
export async function fetchAccountByHandle(fetchFn: Fetch, handle: string): Promise<Profile | null> {
  const h = /^\d+$/.test(handle) ? await getJson(fetchFn, `${API_URL}/v1/accounts/by-handle/${handle}`) : null;
  return fetchProfile(fetchFn, h && typeof h.id === "string" ? h.id : handle);
}

function mapComment(r: Raw): Comment {
  return {
    id: num(r.id),
    content: str(r.content),
    created_at: str(r.created_at),
    deleted_at: str(r.deleted_at) || null,
    is_own: !!r.is_own,
    account: mapAccount(r.author as Raw),
  };
}

// the API pages comments by 10 and lists deleted ones too (blanked unless you moderate); the page only shows live ones
export async function fetchComments(
  fetchFn: Fetch,
  id: string,
  page = 0,
  sessionKey?: string | null,
): Promise<{ data: Comment[]; pageCount: number }> {
  const json = await getJson(fetchFn, `${API_URL}/v1/charts/${id}/comments?page=${page}`, auth(sessionKey));
  if (!json) return { data: [], pageCount: 1 };
  const items = Array.isArray(json.items) ? (json.items as Raw[]) : [];
  const data = items.filter((c) => !c.deleted).map(mapComment);
  return { data, pageCount: Math.max(1, num(json.page_count, 1)) };
}

export async function postComment(
  sessionKey: string,
  chartId: string,
  content: string,
): Promise<{ ok: true; comment: Comment } | Failure> {
  const { headers, body } = jsonBody({ content });
  try {
    const res = await apiFetch(fetch, `${API_URL}/v1/charts/${chartId}/comments`, {
      method: "POST",
      headers: { ...headers, ...bearer(sessionKey) },
      body,
    });
    if (!res.ok) return await readError(res);
    return { ok: true, comment: mapComment(await res.json()) };
  } catch {
    return { ok: false, error: statusMessage(0), code: null };
  }
}

export async function fetchTrends(fetchFn: Fetch, id: string, sessionKey?: string | null): Promise<Trends> {
  const json = await getJson(fetchFn, `${API_URL}/v1/charts/${id}/trends`, auth(sessionKey));
  if (!json) return { likes: [], comments: [] };
  return {
    likes: Array.isArray(json.likes) ? (json.likes as number[]) : [],
    comments: Array.isArray(json.comments) ? (json.comments as number[]) : [],
  };
}

function mapScore(r: Raw): ScoreEntry {
  const replay = ((r.replay ?? {}) as Raw).data as Raw | undefined;
  return {
    id: num(r.id),
    engine: str(r.engine),
    grade: str(r.grade),
    nperfect: num(r.perfect),
    ngreat: num(r.great),
    ngood: num(r.good),
    nmiss: num(r.miss),
    arcade_score: num(r.arcade_score),
    accuracy_score: num(r.accuracy_score),
    speed: num(r.speed),
    display_name: str(r.display_name),
    account: mapAccount(r.submitter as Raw),
    created_at: str(r.created_at),
    chart_id: str(r.chart_id),
    replay_data_hash: replay && typeof replay.hash === "string" ? replay.hash : null,
  };
}

// The API only allows limit=3 or limit=10.
export async function fetchLeaderboard(
  fetchFn: Fetch,
  id: string,
  type: LeaderboardType,
  page = 0,
  limit = 10,
  sessionKey?: string | null,
): Promise<{ data: ScoreEntry[]; pageCount: number }> {
  const json = await getJson(
    fetchFn,
    `${API_URL}/v1/charts/${id}/leaderboards?${query({ page, limit, leaderboard_type: type })}`,
    auth(sessionKey),
  );
  if (!json) return { data: [], pageCount: 1 };
  const data = Array.isArray(json.items) ? (json.items as Raw[]).map(mapScore) : [];
  return { data, pageCount: Math.max(1, num(json.page_count, 1)) };
}

export async function fetchScore(
  fetchFn: Fetch,
  chartId: string,
  scoreId: number,
  sessionKey?: string | null,
): Promise<ScoreEntry | null> {
  const json = await getJson(fetchFn, `${API_URL}/v1/charts/${chartId}/leaderboards/${scoreId}`, auth(sessionKey));
  return json && json.record ? mapScore(json.record as Raw) : null;
}

export function replayName(chartId: string, scoreId: number): string {
  return `UnCh-${chartId}-${scoreId}`;
}

export async function fetchAccountById(fetchFn: Fetch, id: string): Promise<Account | null> {
  return (await fetchProfile(fetchFn, id))?.account ?? null;
}

export type AccountStats = {
  chartsPublished: number;
  likesReceived: number;
  commentsReceived: number;
  likedCharts: number;
  commentsWritten: number;
};

export async function fetchAccountStats(fetchFn: Fetch, id: string): Promise<AccountStats | null> {
  const j = await getJson(fetchFn, `${API_URL}/v1/accounts/${encodeURIComponent(id)}/stats`);
  if (!j) return null;
  return {
    chartsPublished: num(j.charts_published),
    likesReceived: num(j.likes_received),
    commentsReceived: num(j.comments_received),
    likedCharts: num(j.liked_charts),
    commentsWritten: num(j.comments),
  };
}
