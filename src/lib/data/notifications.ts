import { API_URL } from "./api.js";

export type UserNotification = {
  id: string;
  title: string;
  content: string | null;
  // optional, where clicking the row should go (a chart, the dmca page, ...)
  href?: string;
  is_read: boolean;
  created_at: string;
};

export async function fetchNotifications(
  fetchFn: typeof fetch,
  sessionKey: string,
  page = 0,
  onlyUnread = false,
): Promise<{ data: UserNotification[]; pageCount: number }> {
  try {
    const res = await fetchFn(
      `${API_URL}/api/accounts/notifications/?page=${page}&only_unread=${onlyUnread}`,
      { headers: { Authorization: sessionKey } },
    );
    if (!res.ok) return { data: [], pageCount: 1 };
    const json = await res.json();
    // TODO: map fields once the response shape is confirmed
    return { data: Array.isArray(json.data) ? json.data : [], pageCount: json.pageCount ?? 1 };
  } catch {
    return { data: [], pageCount: 1 };
  }
}

export async function markNotificationRead(sessionKey: string, id: string, isRead = true): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/accounts/notifications/${id}/`, {
      method: "PATCH",
      headers: { Authorization: sessionKey, "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: isRead }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
