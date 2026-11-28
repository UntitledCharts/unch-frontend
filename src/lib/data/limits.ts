import { API_URL } from "$lib/config.js";
import { t } from "$lib/i18n.svelte.js";

// What the API accepts for a chart's text, tags, level and files (GET /v1/limits).
// The defaults mirror the API so the forms still enforce sensible limits if the request fails.
export type Limits = {
  files: { jacket: number; chart: number; audio: number; preview: number; background: number; avatar: number; banner: number };
  text: { title: number; artists: number; author: number; description: number; per_tag: number; tags_count: number; comment: number };
  rating: { min: number; max: number };
  min_music_seconds: number;
};

export const DEFAULT_LIMITS: Limits = {
  files: { jacket: 7864320, chart: 20971520, audio: 52428800, preview: 5242880, background: 15728640, avatar: 20971520, banner: 41943040 },
  text: { title: 50, artists: 50, author: 50, description: 1000, per_tag: 20, tags_count: 5, comment: 1500 },
  rating: { min: -999, max: 999 },
  min_music_seconds: 20,
};

export async function fetchLimits(fetchFn: typeof fetch = fetch): Promise<Limits> {
  try {
    const res = await fetchFn(`${API_URL}/v1/limits`);
    if (!res.ok) return DEFAULT_LIMITS;
    const json = (await res.json()) as {
      files?: Partial<Limits["files"]>;
      text?: Partial<Omit<Limits["text"], "per_tag">> & { tag?: number };
      rating?: Partial<Limits["rating"]>;
      min_music_seconds?: number;
    };
    const { tag, ...text } = json.text ?? {};
    return {
      files: { ...DEFAULT_LIMITS.files, ...json.files },
      text: { ...DEFAULT_LIMITS.text, ...text, ...(tag === undefined ? {} : { per_tag: tag }) },
      rating: { ...DEFAULT_LIMITS.rating, ...json.rating },
      min_music_seconds: json.min_music_seconds ?? DEFAULT_LIMITS.min_music_seconds,
    };
  } catch {
    return DEFAULT_LIMITS;
  }
}

const mb = (bytes: number) => `${Math.round((bytes / 1048576) * 10) / 10} MB`;

// The first thing that breaks a limit, worded for the person filling the form, or null when all is fine.
export function checkLimits(
  limits: Limits,
  input: { tags: string[]; rating: number; files: Partial<Record<keyof Limits["files"], File | null | undefined>> },
): string | null {
  if (input.tags.length > limits.text.tags_count) return t("upload.tooManyTags", [String(limits.text.tags_count)]);
  const long = input.tags.find((tag) => tag.length > limits.text.per_tag);
  if (long) return t("upload.tagTooLong", [long, String(limits.text.per_tag)]);
  if (input.rating < limits.rating.min || input.rating > limits.rating.max)
    return t("upload.ratingRange", [String(limits.rating.min), String(limits.rating.max)]);
  for (const [kind, file] of Object.entries(input.files) as [keyof Limits["files"], File | null | undefined][]) {
    if (file && file.size > limits.files[kind]) return t("upload.fileTooLarge", [file.name, mb(limits.files[kind])]);
  }
  return null;
}
