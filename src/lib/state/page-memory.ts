const PREFIX = "unch:page:";

export function recallPage(scope: string): number {
  try {
    const value = Number(sessionStorage.getItem(PREFIX + scope));
    return Number.isInteger(value) && value >= 1 ? value : 1;
  } catch {
    return 1;
  }
}

export function rememberPage(scope: string, value: number) {
  try {
    if (value > 1) sessionStorage.setItem(PREFIX + scope, String(value));
    else sessionStorage.removeItem(PREFIX + scope);
  } catch {
    void 0;
  }
}

export function recallValue<T extends string>(scope: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = sessionStorage.getItem(PREFIX + scope);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function rememberValue(scope: string, value: string, fallback: string) {
  try {
    if (value !== fallback) sessionStorage.setItem(PREFIX + scope, value);
    else sessionStorage.removeItem(PREFIX + scope);
  } catch {
    void 0;
  }
}
