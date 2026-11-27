const KEY = "unch:prefs";

export type DashboardCardStyle = "simple" | "background" | "cover";

// how the dashboard shows a long list of charts: pages of a chosen number of cards, or loading more on scroll
export type DashboardPaging = "pages" | "infinite";
export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_MIN = 1;
export const PAGE_SIZE_MAX = 100;

type Preferences = { dashboardCards: DashboardCardStyle; dashboardPaging: DashboardPaging; dashboardPageSize: number };

export const prefs = $state<Preferences>({ dashboardCards: "simple", dashboardPaging: "pages", dashboardPageSize: DEFAULT_PAGE_SIZE });

export const clampPageSize = (n: number) => Math.min(PAGE_SIZE_MAX, Math.max(PAGE_SIZE_MIN, Math.round(n)));

let loaded = false;

export function loadPrefs() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (["simple", "background", "cover"].includes(saved.dashboardCards)) {
      prefs.dashboardCards = saved.dashboardCards;
    }
    if (saved.dashboardPaging === "infinite" || saved.dashboardPaging === "pages") {
      prefs.dashboardPaging = saved.dashboardPaging;
    } else if (typeof saved.dashboardPaging === "number") {
      // older saves stored the page size itself (12, 24 or 48)
      prefs.dashboardPaging = "pages";
      prefs.dashboardPageSize = clampPageSize(saved.dashboardPaging);
    }
    if (typeof saved.dashboardPageSize === "number" && Number.isFinite(saved.dashboardPageSize)) {
      prefs.dashboardPageSize = clampPageSize(saved.dashboardPageSize);
    }
  } catch {
    void 0;
  }
}

export function setPref<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  prefs[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    void 0;
  }
}
