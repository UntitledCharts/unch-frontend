import { API_URL } from "$lib/config.js";

// Chart and account actions for the owner and for staff. Every call carries the signed-in user's own
// session, so the API decides who's allowed to do what; nothing here uses a shared privileged token.

type Result = { ok: true } | { ok: false; error: string };

async function call(sessionKey: string, method: string, path: string, body?: unknown): Promise<Result> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: sessionKey,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const json = (await res.json().catch(() => ({}))) as { message?: string; detail?: string };
    return { ok: false, error: json.message || json.detail || `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error, please try again." };
  }
}

export const deleteChart = (key: string, id: string) => call(key, "DELETE", `/api/charts/${id}/delete/`);

export const setChartVisibility = (key: string, id: string, status: "PUBLIC" | "UNLISTED" | "PRIVATE") =>
  call(key, "PATCH", `/api/charts/${id}/visibility/`, { status });

export const setStaffPick = (key: string, id: string, value: boolean) =>
  call(key, "PATCH", `/api/charts/${id}/stpick/`, { value });

export const setChartConstant = (key: string, id: string, constant: number) =>
  call(key, "PATCH", `/api/charts/${id}/constant_rate`, { constant });

export type AccountAction = "ban" | "unban" | "makeMod" | "unmod" | "makeAdmin" | "unadmin";

const ACCOUNT_PATHS: Record<AccountAction, (id: string) => string> = {
  ban: (id) => `/api/accounts/${id}/moderation/ban/?delete=false`,
  unban: (id) => `/api/accounts/${id}/moderation/unban/`,
  makeMod: (id) => `/api/accounts/${id}/staff/mod/`,
  unmod: (id) => `/api/accounts/${id}/staff/unmod/`,
  makeAdmin: (id) => `/api/accounts/${id}/staff/admin/`,
  unadmin: (id) => `/api/accounts/${id}/staff/unadmin/`,
};

export const accountAction = (key: string, accountId: string, action: AccountAction) =>
  call(key, "PATCH", ACCOUNT_PATHS[action](accountId));

// The chart's owner, mods and admins can remove a comment.
export const deleteComment = (key: string, chartId: string, commentId: number) =>
  call(key, "DELETE", `/api/charts/${chartId}/comment/${commentId}`);
