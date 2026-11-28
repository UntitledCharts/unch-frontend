const KEY = "unch:prefs";

export type DashboardCardStyle = "simple" | "background" | "cover";

type Preferences = { dashboardCards: DashboardCardStyle };

export const prefs = $state<Preferences>({ dashboardCards: "simple" });

let loaded = false;

export function loadPrefs() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (["simple", "background", "cover"].includes(saved.dashboardCards)) {
      prefs.dashboardCards = saved.dashboardCards;
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
