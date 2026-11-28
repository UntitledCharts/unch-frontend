import { t } from "$lib/i18n.svelte.js";

// Generic wording for an HTTP status. Codes a route expects (a 409 for a missing preview, say) are worded by
// that route; everything else falls back to these. A 404 has no title, its message says it all.
const KNOWN: Record<number, { title?: string; body: string }> = {
  400: { title: "error.badRequest", body: "error.badRequestBody" },
  401: { title: "error.unauthorized", body: "error.unauthorizedBody" },
  403: { title: "error.forbidden", body: "error.forbiddenBody" },
  404: { body: "error.notFound" },
  429: { title: "error.rateLimited", body: "error.rateLimitedBody" },
  500: { title: "error.internalServerError", body: "error.internalServerErrorBody" },
};
const UNKNOWN = { title: "error.unknown", body: "error.unknownBody" };

export function statusTitle(status: number): string | null {
  const title = (KNOWN[status] ?? UNKNOWN).title;
  return title ? t(title) : null;
}

export function statusMessage(status: number): string {
  return t((KNOWN[status] ?? UNKNOWN).body);
}
