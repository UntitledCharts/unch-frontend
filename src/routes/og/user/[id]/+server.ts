import { fetchAccountByHandle, fetchAccountStats, coverUrl } from "$lib/data/index.js";
import { renderOgPng, toDataUrl, ogText, ogProfileUrl, ogBannerUrl, ogEmojis, ogPlain } from "$lib/server/og/render.js";
import { buildUserOg } from "$lib/server/og/templates.js";
import { miku } from "$lib/server/og/assets.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url }) => {
  const result = await fetchAccountByHandle(fetch, params.id);
  if (!result) return new Response("Not found", { status: 404 });

  const { account, charts } = result;
  const role = account.admin ? "Admin" : account.mod ? "Moderator" : null;
  const top = [...charts].sort((a, b) => b.like_count - a.like_count).slice(0, 3);

  const [stats, avatar, banner, ...jackets] = await Promise.all([
    fetchAccountStats(fetch, account.sonolus_id),
    toDataUrl(ogProfileUrl(account.sonolus_id, account.profile_hash, url.origin)),
    toDataUrl(ogBannerUrl(account.sonolus_id, account.banner_hash, url.origin)),
    ...top.map((c) => toDataUrl(coverUrl(c))),
  ]);

  const username = ogText(account.sonolus_username, 22);
  const bio = ogText(account.description, 110);
  const emojis = await ogEmojis([username, bio], url.origin);
  const markup = buildUserOg({
    username,
    handle: account.sonolus_handle,
    role,
    bio,
    emojis,
    charts: stats?.chartsPublished ?? charts.length,
    likes: stats?.likesReceived ?? charts.reduce((s, c) => s + c.like_count, 0),
    comments: stats?.commentsReceived ?? charts.reduce((s, c) => s + c.comment_count, 0),
    avatar,
    banner,
    miku,
    jackets: jackets.filter((j): j is string => !!j),
  });

  const png = await renderOgPng(markup, ogPlain(username + (role ?? "") + bio));
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
