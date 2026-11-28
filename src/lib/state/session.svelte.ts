import { API_URL, bearer, mapAccount, onUnauthorized, profileUrl, bannerUrl } from "$lib/data/index.js";
import { browser } from "$app/environment";
import { SONOLUS_HOST } from "$lib/config.js";

export type UserRole = "User" | "Mod" | "Admin";

type NewSession = { key: string; expiresAt: number };

export type SessionUser = {
  sonolus_id: string;
  username: string;
  avatar: string | null;
  banner: string | null;
  description: string | null;
  handle: number;
  role: UserRole;
  permissions: string[];
};

const SESSION_KEY = "session";
const EXPIRY_KEY = "expiry";

// the stored session, readable before the session has loaded (e.g. in load functions); null on the server
export function storedSessionKey(): string | null {
  if (!browser) return null;
  const key = localStorage.getItem(SESSION_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY));
  return key && expiry > Date.now() ? key : null;
}

class SessionState {
  isLoggedIn = $state(false);
  user = $state<SessionUser | null>(null);
  loading = $state(true);
  pending = $state(false);
  // set while a login is waiting on the Sonolus page; lets the UI reopen it if the browser blocked the popup
  loginUrl = $state<string | null>(null);
  popupBlocked = $state(false);
  // the stored session stopped working; the visitor is logged out and told so until they dismiss it
  expired = $state(false);

  sessionKey: string | null = null;

  private loginInterval: ReturnType<typeof setInterval> | null = null;
  private loginResolve: ((value: NewSession | null) => void) | null = null;

  init = async () => {
    if (typeof localStorage === "undefined") return;
    onUnauthorized(this.reject);
    const key = localStorage.getItem(SESSION_KEY);
    const expiry = Number(localStorage.getItem(EXPIRY_KEY));
    if (!key || !expiry) this.clear();
    else if (expiry < Date.now()) this.reject(key);
    else await this.loadUser(key);
    this.loading = false;
  };

  login = async () => {
    if (this.pending || typeof window === "undefined") return;
    this.pending = true;
    try {
      const res = await fetch(`${API_URL}/v1/sessions/website/login-requests`, { method: "POST" });
      if (!res.ok) return;
      const { id, poll_secret } = (await res.json()) as { id: string; poll_secret: string };

      this.loginUrl = `https://open.sonolus.com/external-login/${SONOLUS_HOST}/sonolus/authenticate_external?id=${id}`;
      this.openLoginWindow();

      const session = await this.pollForSession(id, poll_secret);
      if (!session) return;

      localStorage.setItem(SESSION_KEY, session.key);
      localStorage.setItem(EXPIRY_KEY, String(session.expiresAt));
      await this.loadUser(session.key);
    } catch {
    } finally {
      this.pending = false;
      this.loginUrl = null;
      this.popupBlocked = false;
    }
  };

  // no "noopener" here: with it, window.open always returns null and a blocked popup can't be detected
  openLoginWindow = () => {
    if (!this.loginUrl) return;
    const win = window.open(this.loginUrl, "_blank");
    if (win) win.opener = null;
    this.popupBlocked = !win;
  };

  logout = () => {
    this.clear();
    this.expired = false;
  };

  cancelLogin = () => {
    this.finishPoll(null);
    this.pending = false;
  };

  private finishPoll(session: NewSession | null) {
    if (this.loginInterval) {
      clearInterval(this.loginInterval);
      this.loginInterval = null;
    }
    if (this.loginResolve) {
      this.loginResolve(session);
      this.loginResolve = null;
    }
  }

  // 202 while the login waits in Sonolus, 200 with the session once approved, 404 once it expired
  pollForSession = (id: string, secret: string): Promise<NewSession | null> => {
    return new Promise((resolve) => {
      this.loginResolve = resolve;
      let tries = 0;
      this.loginInterval = setInterval(async () => {
        tries += 1;
        if (tries > 300) {
          this.finishPoll(null);
          return;
        }
        try {
          const res = await fetch(
            `${API_URL}/v1/sessions/website/login-requests/${encodeURIComponent(id)}?poll_secret=${encodeURIComponent(secret)}`,
          );
          if (res.status === 200) {
            const { session, expires_at } = (await res.json()) as { session: string; expires_at: string };
            this.finishPoll({ key: session, expiresAt: Date.parse(expires_at) });
          } else if (res.status === 404) {
            this.finishPoll(null);
          }
        } catch {
        }
      }, 1000);
    });
  };

  loadUser = async (key: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/me`, { headers: bearer(key) });
      if (!res.ok) {
        if (res.status === 401) this.reject(key);
        return;
      }
      const me = (await res.json()) as { account?: Record<string, unknown> };
      const account = mapAccount(me.account);

      this.sessionKey = key;
      this.user = {
        sonolus_id: account.sonolus_id,
        username: account.sonolus_username,
        handle: account.sonolus_handle,
        role: account.admin ? "Admin" : account.mod ? "Mod" : "User",
        permissions: account.permissions,
        avatar: profileUrl(account),
        banner: bannerUrl(account),
        description: account.description,
      };
      this.isLoggedIn = true;
      this.expired = false;
    } catch {
    }
  };

  // only the session this tab or the browser still holds counts, so a deliberate logout never shows the
  // notice and parallel requests show it once; another tab's newer login is picked up instead
  private reject = (key: string) => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored && stored !== key) {
      if (key === this.sessionKey) void this.loadUser(stored);
      return;
    }
    if (key !== stored && key !== this.sessionKey) return;
    this.clear();
    this.expired = true;
  };

  clear = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
    this.sessionKey = null;
    this.isLoggedIn = false;
    this.user = null;
  };
}

export const session = new SessionState();
