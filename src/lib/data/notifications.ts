import { API_URL, apiFetch, bearer, jsonBody } from "./api.js";

export type UserNotification = {
  id: string;
  title: string;
  content: string | null;
  // optional, where clicking the row should go (a chart, the dmca page, ...)
  href?: string;
  is_read: boolean;
  created_at: string;
};

type RawNotification = { id: number; title: string; content: string | null; is_read: boolean; created_at: string };

const mapNotification = (n: RawNotification): UserNotification => ({
  id: String(n.id),
  title: n.title,
  content: n.content,
  is_read: n.is_read,
  created_at: n.created_at,
});

// the list leaves out each notification's content; opening one (GET /v1/me/notifications/{id}) returns it
export async function fetchNotifications(
  fetchFn: typeof fetch,
  sessionKey: string,
  page = 0,
  onlyUnread = false,
): Promise<{ data: UserNotification[]; pageCount: number }> {
  try {
    const res = await apiFetch(fetchFn, `${API_URL}/v1/me/notifications?page=${page}&only_unread=${onlyUnread}`, {
      headers: bearer(sessionKey),
    });
    if (!res.ok) return { data: [], pageCount: 1 };
    const json = (await res.json()) as { items?: RawNotification[]; page_count?: number };
    return { data: (json.items ?? []).map(mapNotification), pageCount: Math.max(1, json.page_count ?? 1) };
  } catch {
    return { data: [], pageCount: 1 };
  }
}

export async function markNotificationRead(sessionKey: string, id: string, isRead = true): Promise<boolean> {
  const { headers, body } = jsonBody({ is_read: isRead });
  try {
    const res = await apiFetch(fetch, `${API_URL}/v1/me/notifications/${id}`, {
      method: "PATCH",
      headers: { ...headers, ...bearer(sessionKey) },
      body,
    });
    return res.ok;
  } catch {
    return false;
  }
}
