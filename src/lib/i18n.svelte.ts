import en from "../../languages/en.json";
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

export const TEST_LANGUAGE = "test";
export const LANGUAGES: Record<string, Language> = {
  ...(supported as Record<string, Language>),
  [TEST_LANGUAGE]: { country: "un", name: "Test", english_name: "Pseudo-locale", file: "", locale: "en-US" },
};
export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_COOKIE = "language";

const EN = en as Messages;
const files = import.meta.glob<Messages>("../../languages/*.json", { import: "default" });

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
    const match = Object.entries(LANGUAGES).find(([code, l]) => code !== TEST_LANGUAGE && l.locale.toLowerCase() === tag);
    if (match) return match[0];
  }
  for (const tag of wanted) {
    const base = tag.split("-")[0];
    if (isLanguage(base)) return base;
  }
  return null;
}

export async function loadMessages(code: string): Promise<Messages> {
  if (!isLanguage(code) || code === DEFAULT_LANGUAGE || code === TEST_LANGUAGE) return EN;
  const load = files[`../../languages/${LANGUAGES[code].file}`];
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

const ACCENTS: Record<string, string> = {
  a: "á", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "í", j: "ĵ", k: "ķ", l: "ĺ", m: "ḿ",
  n: "ñ", o: "ó", p: "þ", q: "ǫ", r: "ŕ", s: "ś", t: "ţ", u: "ú", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ź",
  A: "Á", B: "Ɓ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ĝ", H: "Ĥ", I: "Í", J: "Ĵ", K: "Ķ", L: "Ĺ", M: "Ḿ",
  N: "Ñ", O: "Ó", P: "Þ", Q: "Ǫ", R: "Ŕ", S: "Ś", T: "Ţ", U: "Ú", V: "Ṽ", W: "Ŵ", X: "Ẋ", Y: "Ý", Z: "Ź",
};

function pseudo(text: string): string {
  const body = text
    .split(/(\{\w+\})/)
    .map((part) => (/^\{\w+\}$/.test(part) ? part : part.replace(/[A-Za-z]/g, (c) => ACCENTS[c] ?? c)))
    .join("");
  return `[${body}]`;
}

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = Array.isArray(params) ? params[Number(name) - 1] : params[name];
    return value === undefined ? match : String(value);
  });
}

export function t(key: string, params?: Params): string {
  const found = lookup(current.messages, key) ?? lookup(EN, key);
  if (found === undefined) return fill(key, params);
  return fill(current.lang === TEST_LANGUAGE ? pseudo(found) : found, params);
}

// Numbers and dates come from Intl, which already localizes them, but they never pass through t().
// In the test language, mark them too so only genuinely hard-coded text shows up unmarked.
export function localized(text: string): string {
  return current.lang === TEST_LANGUAGE ? pseudo(text) : text;
}

export function tn(key: string, count: number, display: string | number = count): string {
  return t(`${key}_${count === 1 ? "singular" : "plural"}`, [display]);
}
