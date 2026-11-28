import { dev } from "$app/environment";
import type { Handle } from "@sveltejs/kit";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, LANGUAGES, isLanguage, matchLanguage } from "$lib/i18n.svelte.js";

// paths of the old site that moved
function movedPath(pathname: string): string | null {
  if (/^\/DMCA\/?$/.test(pathname)) return "/dmca";
  const user = pathname.match(/^\/user\/([^/]+)\/?$/);
  return user ? `/users/${user[1]}` : null;
}

export const handle: Handle = async ({ event, resolve }) => {
  const moved = movedPath(event.url.pathname);
  if (moved) return new Response(null, { status: 301, headers: { location: moved + event.url.search } });

  const saved = event.cookies.get(LANGUAGE_COOKIE);
  const lang = isLanguage(saved) ? saved : (matchLanguage(event.request.headers.get("accept-language")) ?? DEFAULT_LANGUAGE);
  event.locals.lang = lang;
  event.locals.discord =
    /discordbot/i.test(event.request.headers.get("user-agent") ?? "") || (dev && event.url.searchParams.has("discordbot"));

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", LANGUAGES[lang]?.locale ?? "en-US"),
  });
  if (dev && event.request.headers.get("origin") === "null") {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  return response;
};
