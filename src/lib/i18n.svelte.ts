import en from "../../i18n/en.json";
import supported from "../../supported.json";

type Messages = { [key: string]: string | Messages };
type Params = Record<string, string | number> | (string | number)[];

export type Language = {
  country: string;
  name: string;
  english_name: string;
  file: string;
  locale: string;
};

export const LANGUAGES: Record<string, Language> = supported as Record<string, Language>;
export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_COOKIE = "language";

const EN = en as Messages;
const files = import.meta.glob<Messages>("../../i18n/*.json", { import: "default" });

const current = $state<{ lang: string; messages: Messages }>({ lang: DEFAULT_LANGUAGE, messages: EN });

export function isLanguage(code: string | null | undefined): code is string {
  return !!code && Object.hasOwn(LANGUAGES, code);
}

export function matchLanguage(header: string | null | undefined): string | null {
  if (!header) return null;
  const wanted = header
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .filter(Boolean);
  for (const tag of wanted) {
    const exact = tag.replace("-", "_");
    if (isLanguage(exact)) return exact;
    const match = Object.entries(LANGUAGES).find(([, l]) => l.locale.toLowerCase() === tag);
    if (match) return match[0];
  }
  for (const tag of wanted) {
    const base = tag.split("-")[0];
    if (isLanguage(base)) return base;
  }
  return null;
}

export async function loadMessages(code: string): Promise<Messages> {
  if (!isLanguage(code) || code === DEFAULT_LANGUAGE) return EN;
  const load = files[`../../i18n/${LANGUAGES[code].file}`];
  if (!load) return EN;
  try {
    return await load();
  } catch {
    return EN;
  }
}

export function useMessages(code: string, messages: Messages) {
  current.lang = isLanguage(code) ? code : DEFAULT_LANGUAGE;
  current.messages = messages;
}

export const i18n = {
  get lang() {
    return current.lang;
  },
  get locale() {
    return LANGUAGES[current.lang]?.locale ?? "en-US";
  },
};

export async function setLanguage(code: string) {
  if (!isLanguage(code)) return;
  const messages = await loadMessages(code);
  useMessages(code, messages);
  document.cookie = `${LANGUAGE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LANGUAGE_COOKIE, code);
  } catch {
    void 0;
  }
  document.documentElement.lang = i18n.locale;
}

function lookup(messages: Messages, key: string): string | undefined {
  let value: string | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (typeof value !== "object" || value === null) return undefined;
    value = value[part];
  }
  return typeof value === "string" ? value : undefined;
}

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = Array.isArray(params) ? params[Number(name) - 1] : params[name];
    return value === undefined ? match : String(value);
  });
}

export function hasMessage(key: string): boolean {
  return lookup(current.messages, key) !== undefined || lookup(EN, key) !== undefined;
}

// splits a translated text at its {n} placeholders, so markup can go where each one sits in the sentence
export function segments(text: string): (string | number)[] {
  return text.split(/\{(\d+)\}/).map((part, i) => (i % 2 ? Number(part) : part));
}

export function t(key: string, params?: Params): string {
  const found = lookup(current.messages, key) ?? lookup(EN, key);
  if (found === undefined) return fill(key, params);
  return fill(found, params);
}

export function tn(key: string, count: number, display: string | number = count): string {
  return t(`${key}_${count === 1 ? "singular" : "plural"}`, [display]);
}
