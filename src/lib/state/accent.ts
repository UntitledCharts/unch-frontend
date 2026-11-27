// Blue is the theme default from app.css, so it carries no override.
export const accents = [
  { name: "Blue", color: "oklch(0.62 0.16 244)", fg: "oklch(0.98 0.01 244)" },
  { name: "Sky", color: "oklch(0.76 0.13 228)", fg: "oklch(0.2 0.04 228)" },
  { name: "Miku", color: "oklch(0.76 0.12 188)", fg: "oklch(0.2 0.04 188)" },
  { name: "Ocean", color: "oklch(0.52 0.12 225)", fg: "oklch(0.98 0.01 225)" },
]

const KEY = "accent";
const DEFAULT = "Blue";

function applyColor(color: string, fg: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", color);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--ring", color);
}

export function storedAccentName(): string {
  try {
    return localStorage.getItem(KEY) ?? DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setAccent(name: string) {
  const a = accents.find((x) => x.name === name);
  if (!a) return;
  if (a.name === DEFAULT) return resetAccent();
  applyColor(a.color, a.fg);
  try {
    localStorage.setItem(KEY, name);
  } catch {
    void 0;
  }
}

export function resetAccent() {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-foreground");
  root.style.removeProperty("--ring");
  try {
    localStorage.removeItem(KEY);
  } catch {
    void 0;
  }
}

export function restoreAccent() {
  const a = accents.find((x) => x.name === storedAccentName());
  if (a && a.name !== DEFAULT) applyColor(a.color, a.fg);
}
