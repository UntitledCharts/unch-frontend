const RELOAD_KEY = "load-failure-reload";
const RELOAD_COOLDOWN_MS = 10_000;

let pendingUrl: string | null = null;

export function setPendingNavigation(url: string | null): void {
  pendingUrl = url;
}

export function isLoadFailure(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload/i.test(
    message,
  );
}

export function recoverFromLoadFailure(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  if (pendingUrl && pendingUrl !== location.href) location.assign(pendingUrl);
  else location.reload();
  return true;
}
