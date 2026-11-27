import { API_URL, profileUrl, bannerUrl } from "$lib/data/index.js";
import { SONOLUS_HOST } from "$lib/config.js";

export type UserRole = "User" | "Mod" | "Admin";

export type SessionUser = {
  sonolus_id: string;
  username: string;
  avatar: string | null;
  banner: string | null;
  description: string | null;
  handle: number;
  role: UserRole;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_KEY = "session";
const EXPIRY_KEY = "expiry";

class SessionState {
  isLoggedIn = $state(false);
  user = $state<SessionUser | null>(null);
  loading = $state(true);
  pending = $state(false);
  // set while a login is waiting on the Sonolus page; lets the UI reopen it if the browser blocked the popup
  loginUrl = $state<string | null>(null);
  popupBlocked = $state(false);
  // true while a page shows its own "awaiting verification" state, so the login modal stays hidden
  inlineLogin = $state(false);

  sessionKey: string | null = null;

  private loginInterval: ReturnType<typeof setInterval> | null = null;
  private loginResolve: ((value: string | null) => void) | null = null;

  init = async () => {
    if (typeof localStorage === "undefined") return;
    const key = localStorage.getItem(SESSION_KEY);
    const expiry = Number(localStorage.getItem(EXPIRY_KEY));
    if (!key || !expiry || expiry < Date.now()) {
      this.clear();
      this.loading = false;
      return;
    }
    await this.loadUser(key);
    this.loading = false;
  };

  login = async () => {
    if (this.pending || typeof window === "undefined") return;
    this.pending = true;
    try {
      const res = await fetch(`${API_URL}/api/accounts/session/external/id/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      const { id } = await res.json();

      this.loginUrl = `https://open.sonolus.com/external-login/${SONOLUS_HOST}/sonolus/authenticate_external?id=${id}`;
      this.openLoginWindow();

      const key = await this.pollForSession(id);
      if (!key) return;

      localStorage.setItem(SESSION_KEY, key);
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + WEEK_MS));
      await this.loadUser(key);
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
  };

  cancelLogin = () => {
    this.finishPoll(null);
    this.pending = false;
  };

  private finishPoll(key: string | null) {
    if (this.loginInterval) {
      clearInterval(this.loginInterval);
      this.loginInterval = null;
    }
    if (this.loginResolve) {
      this.loginResolve(key);
      this.loginResolve = null;
    }
  }

  pollForSession = (id: string): Promise<string | null> => {
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
          const res = await fetch(`${API_URL}/api/accounts/session/external/get/?id=${id}`);
          if (res.status === 202) {
            const { session_key } = await res.json();
            this.finishPoll(session_key);
          }
        } catch {
        }
      }, 1000);
    });
  };

  loadUser = async (key: string) => {
    try {
      const res = await fetch(`${API_URL}/api/accounts/session/account/`, {
        headers: { Authorization: key },
      });
      if (!res.ok) {
        if (res.status === 401) this.clear();
        return;
      }
      const me = await res.json();
      const sonolusId = typeof me.sonolus_id === "string" ? me.sonolus_id : "";

      let profileHash: string | null = typeof me.profile_hash === "string" ? me.profile_hash : null;
      let bannerHash: string | null = typeof me.banner_hash === "string" ? me.banner_hash : null;
      let description: string | null = typeof me.description === "string" ? me.description : null;
      if (sonolusId) {
        try {
          const p = await fetch(`${API_URL}/api/accounts/${sonolusId}`);
          if (p.ok) {
            const pj = await p.json();
            const acc = pj.account ?? pj;
            if (typeof acc.profile_hash === "string") profileHash = acc.profile_hash;
            if (typeof acc.banner_hash === "string") bannerHash = acc.banner_hash;
            if (typeof acc.description === "string") description = acc.description;
          }
        } catch {
        }
      }

      this.sessionKey = key;
      this.user = {
        sonolus_id: sonolusId,
        username: me.sonolus_username ?? "User",
        handle: me.sonolus_handle ?? 0,
        role: me.admin ? "Admin" : me.mod ? "Mod" : "User",
        avatar: profileUrl({ sonolus_id: sonolusId, profile_hash: profileHash }),
        banner: bannerUrl({ sonolus_id: sonolusId, banner_hash: bannerHash }),
        description,
      };
      this.isLoggedIn = true;
    } catch {
    }
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
