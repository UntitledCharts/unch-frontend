import { API_URL } from "$lib/config.js";
import { bearer, jsonBody, send, type Result } from "./api.js";
import { ADMIN_ONLY_PERMISSIONS, MOD_PERMISSIONS } from "./types.js";

// Chart and account actions for the owner and for staff. Every call carries the signed-in user's own
// session, so the API decides who's allowed to do what; nothing here uses a shared privileged token.

function call(sessionKey: string, method: string, path: string, body?: unknown): Promise<Result> {
  const json = body === undefined ? { headers: {}, body: undefined } : jsonBody(body);
  return send(`${API_URL}${path}`, { method, headers: { ...json.headers, ...bearer(sessionKey) }, body: json.body });
}

export const deleteChart = (key: string, id: string) => call(key, "DELETE", `/v1/charts/${id}`);

// `force` lets staff with chart.visibility skip the public chart rules. `publishAt` schedules an unlisted or
// private chart's release, null cancels the schedule and leaving it out keeps it
export const setChartVisibility = (
  key: string,
  id: string,
  status: "PUBLIC" | "UNLISTED" | "PRIVATE",
  force = false,
  publishAt?: Date | null,
) =>
  call(key, "PUT", `/v1/charts/${id}/visibility`, {
    status,
    force,
    ...(publishAt === undefined ? {} : { publish_at: publishAt?.toISOString() ?? null }),
  });

export const setStaffPick = (key: string, id: string, value: boolean) =>
  call(key, "PUT", `/v1/charts/${id}/staff-pick`, { value });

export const setChartConstant = (key: string, id: string, constant: number) =>
  call(key, "PUT", `/v1/charts/${id}/rating`, { rating: constant });

export type AccountAction = "ban" | "unban" | "makeMod" | "unmod" | "makeAdmin" | "unadmin";

// each staff permission is granted and revoked on its own
async function setPermissions(
  key: string,
  accountId: string,
  method: "PUT" | "DELETE",
  permissions: readonly string[],
): Promise<Result> {
  for (const permission of permissions) {
    const res = await call(key, method, `/v1/accounts/${accountId}/permissions/${permission}`);
    if (!res.ok) return res;
  }
  return { ok: true };
}

export function accountAction(key: string, accountId: string, action: AccountAction): Promise<Result> {
  switch (action) {
    case "ban":
      return call(key, "PUT", `/v1/accounts/${accountId}/ban`, { delete: false });
    case "unban":
      return call(key, "DELETE", `/v1/accounts/${accountId}/ban`);
    case "makeMod":
      return setPermissions(key, accountId, "PUT", MOD_PERMISSIONS);
    case "unmod":
      return setPermissions(key, accountId, "DELETE", MOD_PERMISSIONS);
    case "makeAdmin":
      return setPermissions(key, accountId, "PUT", [...MOD_PERMISSIONS, ...ADMIN_ONLY_PERMISSIONS]);
    case "unadmin":
      return setPermissions(key, accountId, "DELETE", ADMIN_ONLY_PERMISSIONS);
  }
}

// The comment's writer and staff with comment.delete can remove a comment.
export const deleteComment = (key: string, chartId: string, commentId: number) =>
  call(key, "DELETE", `/v1/charts/${chartId}/comments/${commentId}`);
