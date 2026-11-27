import {
  fetchChart,
  fetchAccountById,
  fetchAccountByHandle,
  type Account,
} from "$lib/data/index.js";
import { ogProfileUrl } from "$lib/server/og/render.js";
import { levelStatusId, userStatusId } from "$lib/activity-id.js";

type Fetch = typeof fetch;

export type StatusRef = { kind: "level"; id: string } | { kind: "user"; handle: string };

export function parseStatusId(id: string): StatusRef | null {
  if (!/^\d+$/.test(id)) return null;
  if (id.startsWith("1")) return { kind: "level", id: BigInt(id.slice(1)).toString(16).padStart(32, "0") };
  if (id.startsWith("2")) return { kind: "user", handle: id.slice(1) };
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plain(value: string | null | undefined): string {
  return (value ?? "").replace(/:([a-zA-Z0-9_]+):/g, "").trim();
}

function paragraphs(value: string): string {
  return escapeHtml(value)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .replace(/\r?\n/g, "<br> ");
}

function account(id: string, name: string, handle: string, avatar: string, url: string) {
  return {
    id,
    display_name: name,
    username: handle,
    acct: handle,
    url,
    uri: url,
    created_at: "2024-01-01T00:00:00.000Z",
    locked: false,
    bot: false,
    discoverable: true,
    indexable: false,
    group: false,
    avatar,
    avatar_static: avatar,
    header: "",
    header_static: "",
    followers_count: 0,
    following_count: 0,
    statuses_count: 0,
    hide_collections: false,
    noindex: false,
    emojis: [],
    roles: [],
    fields: [],
  };
}

function status(opts: {
  id: string;
  url: string;
  createdAt: string;
  content: string;
  author: ReturnType<typeof account>;
  image: string;
}) {
  return {
    id: opts.id,
    url: opts.url,
    uri: opts.url,
    created_at: opts.createdAt,
    edited_at: null,
    reblog: null,
    in_reply_to_id: null,
    in_reply_to_account_id: null,
    language: "en",
    content: opts.content,
    spoiler_text: "",
    visibility: "public",
    application: { name: "UntitledCharts", website: null },
    media_attachments: [
      {
        id: "0",
        type: "image",
        url: opts.image,
        preview_url: opts.image,
        remote_url: null,
        preview_remote_url: null,
        text_url: null,
        description: null,
        meta: { original: { width: 1200, height: 630, size: "1200x630", aspect: 1200 / 630 } },
      },
    ],
    account: opts.author,
    mentions: [],
    tags: [],
    emojis: [],
    card: null,
    poll: null,
  };
}

export async function buildStatus(fetchFn: Fetch, ref: StatusRef, origin: string) {
  if (ref.kind === "level") {
    const chart = await fetchChart(fetchFn, ref.id);
    if (!chart) return null;
    const author: Account | null = await fetchAccountById(fetchFn, chart.author).catch(() => null);
    const page = `${origin}/levels/UnCh-${chart.id}`;
    const meta = chart.staff_pick ? "⭐ Staff Pick" : "";
    const description = plain(chart.description);
    const content = [
      `<b>${escapeHtml(plain(chart.title))}</b>`,
      escapeHtml(plain(chart.artists)),
      escapeHtml(meta),
      description ? `<br> ${paragraphs(description)}` : "",
    ]
      .filter(Boolean)
      .join("<br> ");
    return status({
      id: levelStatusId(chart.id) ?? "0",
      url: page,
      createdAt: new Date(chart.published_at).toISOString(),
      content,
      author: account(
        userStatusId(chart.author_handle) ?? "0",
        plain(chart.chart_design) || plain(author?.sonolus_username) || "UntitledCharts",
        String(chart.author_handle),
        ogProfileUrl(chart.author, author?.profile_hash ?? null, origin),
        page,
      ),
      image: `${origin}/og/level/UnCh-${chart.id}`,
    });
  }

  const result = await fetchAccountByHandle(fetchFn, ref.handle);
  if (!result) return null;
  const { account: acc, charts } = result;
  const page = `${origin}/creators/${acc.sonolus_handle}`;
  const bio = plain(acc.description);
  const role = acc.admin ? "Admin" : acc.mod ? "Moderator" : "";
  const latest = charts.map((c) => c.published_at).sort().at(-1);
  const content = [role ? `<b>${role}</b>` : "", bio ? paragraphs(bio) : ""].filter(Boolean).join("<br> <br> ");
  return status({
    id: userStatusId(acc.sonolus_handle) ?? "0",
    url: page,
    createdAt: new Date(latest ?? Date.now()).toISOString(),
    content,
    author: account(
      userStatusId(acc.sonolus_handle) ?? "0",
      plain(acc.sonolus_username) || String(acc.sonolus_handle),
      String(acc.sonolus_handle),
      ogProfileUrl(acc.sonolus_id, acc.profile_hash, origin),
      page,
    ),
    image: `${origin}/og/user/${acc.sonolus_handle}`,
  });
}
