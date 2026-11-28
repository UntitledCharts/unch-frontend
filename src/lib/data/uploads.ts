import { t } from "$lib/i18n.svelte.js";
import { chartFormatLabel, detectChartFormat, type ChartFileInfo } from "./chart-format.js";
import { formatTime, grouped } from "./format.js";
import type { Failure } from "./api.js";

export type FileKind = "jacket" | "background" | "chart" | "audio" | "preview" | "avatar" | "banner";
export type FileMedia = "image" | "audio" | "chart";

export type FileDetails = { width?: number; height?: number; duration?: number; chart?: ChartFileInfo };
export type FileCheck = { ok: true; details: FileDetails } | { ok: false; error: string };

type Magic = (head: Uint8Array) => boolean;

const PNG: Magic = (h) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => h[i] === b);
const JPEG: Magic = (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff;
const WEBP: Magic = (h) =>
  String.fromCharCode(...h.subarray(0, 4)) === "RIFF" && String.fromCharCode(...h.subarray(8, 12)) === "WEBP";

// same test as the API: an ID3 tag or an mpeg layer III frame header
const MP3: Magic = (h) => {
  if (String.fromCharCode(...h.subarray(0, 3)) === "ID3") return true;
  if (h.length < 3 || h[0] !== 0xff || (h[1] & 0xe0) !== 0xe0) return false;
  const version = (h[1] >> 3) & 0b11;
  const layer = (h[1] >> 1) & 0b11;
  return version !== 0b01 && layer === 0b01 && h[2] >> 4 !== 0b1111 && ((h[2] >> 2) & 0b11) !== 0b11;
};

type Rule = { media: FileMedia; accept?: string; magic?: Magic[] };

export const FILE_RULES: Record<FileKind, Rule> = {
  jacket: { media: "image", accept: "image/png,image/jpeg", magic: [PNG, JPEG] },
  background: { media: "image", accept: "image/png", magic: [PNG] },
  chart: { media: "chart" },
  audio: { media: "audio", accept: "audio/mpeg,audio/mp3,.mp3", magic: [MP3] },
  preview: { media: "audio", accept: "audio/mpeg,audio/mp3,.mp3", magic: [MP3] },
  avatar: { media: "image", accept: "image/png,image/jpeg,image/webp", magic: [PNG, JPEG, WEBP] },
  banner: { media: "image", accept: "image/png,image/jpeg,image/webp", magic: [PNG, JPEG, WEBP] },
};

export const formatsLabel = (kind: FileKind) => t(`files.formats.${kind}`);

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return t("files.bytes", [bytes]);
  if (bytes < 1024 * 1024) return t("files.kilobytes", [Math.max(1, Math.round(bytes / 1024))]);
  return t("files.megabytes", [Math.round((bytes / 1048576) * 10) / 10]);
}

export function acceptsLabel(kind: FileKind, limit: number, minSeconds = 0): string {
  const accepts = t("files.accepts", [formatsLabel(kind), formatBytes(limit)]);
  return minSeconds > 0 ? t("files.acceptsMinLength", [accepts, minSeconds]) : accepts;
}

export function describeFile(file: File, details: FileDetails | null): string {
  const parts = [formatBytes(file.size)];
  if (details?.width && details.height) parts.push(t("files.dimensions", [details.width, details.height]));
  if (details?.duration !== undefined) parts.push(formatTime(details.duration));
  if (details?.chart) parts.push(chartFormatLabel(details.chart));
  return parts.join(" · ");
}

async function imageSize(file: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

function audioDuration(file: Blob): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | undefined) => {
      clearTimeout(timer);
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(undefined), 5000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : undefined);
    audio.onerror = () => done(undefined);
    audio.src = url;
  });
}

const checked = new WeakMap<File, { key: string; result: Promise<FileCheck> }>();

async function inspect(kind: FileKind, file: File, limit: number, minSeconds: number): Promise<FileCheck> {
  if (file.size === 0) return { ok: false, error: t("files.empty", [file.name]) };
  if (file.size > limit) return { ok: false, error: t("upload.fileTooLarge", [file.name, formatBytes(limit)]) };
  const rule = FILE_RULES[kind];
  const wrongType: FileCheck = { ok: false, error: t("files.wrongType", [file.name, formatsLabel(kind)]) };
  if (rule.magic) {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!rule.magic.some((test) => test(head))) return wrongType;
  }
  if (rule.media === "image") {
    const size = await imageSize(file);
    return size ? { ok: true, details: size } : { ok: false, error: t("files.unreadableImage", [file.name]) };
  }
  if (rule.media === "audio") {
    const duration = await audioDuration(file);
    if (duration !== undefined && duration < minSeconds)
      return { ok: false, error: t("files.audioTooShort", [file.name, formatTime(duration), minSeconds]) };
    return { ok: true, details: { duration } };
  }
  const chart = await detectChartFormat(file);
  if (!chart || chart.format === "foreign_level_data") return wrongType;
  return { ok: true, details: { chart } };
}

// cached per file and limits so the dialog and the field share one check
export function checkFile(kind: FileKind, file: File, limit: number, minSeconds = 0): Promise<FileCheck> {
  const key = `${kind}:${limit}:${minSeconds}`;
  const cached = checked.get(file);
  if (cached?.key === key) return cached.result;
  const result = inspect(kind, file, limit, minSeconds);
  checked.set(file, { key, result });
  return result;
}

// every chart has to follow these, whatever its visibility
export const uploadRules = (minMusicSeconds: number): string[] => [
  t("uploadPolicy.noInappropriate"),
  t("uploadPolicy.noAbuse"),
  t("uploadPolicy.commonSense"),
  t("uploadPolicy.minSongLength", [minMusicSeconds]),
];

const FIELD_KINDS: Record<string, FileKind> = {
  chart_file: "chart",
  jacket_image: "jacket",
  audio_file: "audio",
  preview_file: "preview",
  background_image: "background",
};
const FILE_LABELS: Record<FileKind, string> = {
  chart: "generic.chartFile",
  jacket: "generic.jacket",
  audio: "generic.musicFile",
  preview: "generic.musicPreview",
  background: "generic.backgroundImage",
  avatar: "settings.profilePicture",
  banner: "settings.background",
};
const TEXT_LABELS: Record<string, string> = {
  title: "generic.title",
  artists: "generic.artists",
  author: "generic.charter",
  description: "generic.description",
  rating: "generic.rating",
  tag: "generic.tags",
  content: "levelDetail.comment",
};

// Wording for the errors a chart, profile or comment form can expect from the API, mostly for files that got
// past the browser's own checks. `kind` names the file when the API doesn't (profile images); anything else
// keeps the generic message for its status.
export function formFailure(res: Failure, options: { kind?: FileKind; minSeconds?: number } = {}): string {
  const params = res.params ?? {};
  const field = typeof params.field === "string" ? params.field : "";
  const kind = FIELD_KINDS[field] ?? options.kind;
  const label = kind ? t(FILE_LABELS[kind]) : "";
  const number = (value: unknown) => (typeof value === "number" ? value : Number(value));
  switch (res.code) {
    case "error.chart.too_short":
      return t("files.chartTooShort", [formatTime(number(params.seconds)), String(params.min_seconds ?? "")]);
    case "error.file.audio_too_short": {
      const min = params.min_seconds;
      return t("upload.audioTooShort", [typeof min === "number" ? min : (options.minSeconds ?? 0)]);
    }
    case "error.file.too_large":
      return kind ? t("upload.fileTooLarge", [label, formatBytes(number(params.limit))]) : res.error;
    case "error.file.invalid_image_type":
    case "error.file.invalid_png":
    case "error.file.invalid_audio_type":
      return kind ? t("files.wrongType", [label, formatsLabel(kind)]) : res.error;
    case "error.file.audio_processing_failed":
      return kind ? t("files.audioProcessingFailed", [label]) : res.error;
    case "error.chart.invalid_format":
    case "error.chart.unsupported_format":
    case "error.chart.wrong_level_data":
    case "error.chart.invalid_level_data":
      return t("files.wrongType", [t("generic.chartFile"), formatsLabel("chart")]);
    case "error.file.invalid_image":
      return t("files.imageUnreadable");
    case "error.file.image_too_large":
      return t("files.imageTooManyPixels", [grouped(number(params.max_pixels))]);
    case "error.file.corrupt":
      return t("files.chartCorrupt");
    case "error.chart.conversion_failed":
      return t("files.conversionFailed");
    case "error.chart.conversion_timed_out":
      return t("files.conversionTimedOut");
    case "error.file.decompressed_too_large":
    case "error.chart.conversion_too_large":
      return t("files.conversionTooLarge");
    case "error.chart.conversion_busy":
      return t("files.conversionBusy");
    case "error.chart.field_required":
      return TEXT_LABELS[field] ? t("generic.required", [t(TEXT_LABELS[field])]) : res.error;
    case "error.text.too_long":
      return TEXT_LABELS[field] ? t("generic.textTooLong", [t(TEXT_LABELS[field]), number(params.limit)]) : res.error;
    case "error.text.too_many_tags":
      return t("upload.tooManyTags", [String(params.limit)]);
    case "error.chart.rating_out_of_range":
      return params.min !== undefined && params.max !== undefined
        ? t("upload.ratingRange", [String(params.min), String(params.max)])
        : res.error;
    default:
      return res.error;
  }
}
