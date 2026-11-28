// mirrors the API converter's detection closely enough to catch obviously wrong files before upload
export type ChartFormat = "sus" | "usc" | "level_data" | "pjsk" | "foreign_level_data";
export type ChartPacking = "gzip" | "zip" | "base64";
export type ChartFileInfo = { format: ChartFormat; packing: ChartPacking | null };

const PARSE_LIMIT = 32 * 1024 * 1024;

type Json = Record<string, unknown>;

// archetypes only Chart Cyanvas and Untitled Sekai LevelData use, the API refuses those
const FOREIGN_ARCHETYPES = new Set(["NonDirectionalTraceFlickNote", "TimeScaleGroup", "TimeScaleChange", "Guide"]);
const isForeignArchetype = (name: string) => name.includes("Slide") || FOREIGN_ARCHETYPES.has(name);

const startsWith = (bytes: Uint8Array, magic: number[]) => magic.every((b, i) => bytes[i] === b);
const GZIP = [0x1f, 0x8b];
const ZIP = [0x50, 0x4b, 0x03, 0x04];

function decode(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch {
    return null;
  }
}

async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<{ text: string | null; complete: boolean }> {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let complete = true;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
      if (size > PARSE_LIMIT) {
        complete = false;
        await reader.cancel();
        break;
      }
    }
  } catch {
    return { text: null, complete: false };
  }
  const joined = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    joined.set(chunk, at);
    at += chunk.length;
  }
  // a cut-off stream can end mid-character so only a finished one must be valid utf-8
  const text = complete ? decode(joined) : new TextDecoder().decode(joined);
  return { text, complete };
}

function classifyJson(doc: unknown): ChartFormat | null {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  const json = doc as Json;
  if ("bgmOffset" in json && Array.isArray(json.entities)) {
    const foreign = (json.entities as Json[]).some(
      (e) => typeof e?.archetype === "string" && isForeignArchetype(e.archetype),
    );
    return foreign ? "foreign_level_data" : "level_data";
  }
  if ("usc" in json && "version" in json) return "usc";
  if ("NoteList" in json && "MusicScoreEventDataList" in json) return "pjsk";
  return null;
}

// too big to parse, sniff the keys near the start
function sniffJson(text: string): ChartFormat | null {
  const head = text.slice(0, 1024 * 1024);
  if (/"entities"\s*:/.test(head)) return /"archetype"\s*:\s*"[^"]*Slide/.test(head) ? "foreign_level_data" : "level_data";
  if (/"usc"\s*:/.test(head)) return "usc";
  if (/"NoteList"\s*:/.test(head)) return "pjsk";
  return null;
}

function looksLikeSus(text: string): boolean {
  let data = false;
  let command = false;
  for (const raw of text.split(/\r\n|\r|\n/)) {
    if (!raw.startsWith("#")) continue;
    if (/^#\w+:/.test(raw.trim())) data = true;
    else command = true;
    if (data && command) return true;
  }
  return false;
}

function classifyText(text: string, complete: boolean): ChartFormat | null {
  const body = text.replace(/^﻿/, "");
  const start = body.trimStart()[0];
  if (start === "{" || start === "[") {
    if (!complete || body.length > PARSE_LIMIT) return sniffJson(body);
    try {
      return classifyJson(JSON.parse(body));
    } catch {
      return null;
    }
  }
  return looksLikeSus(body) ? "sus" : null;
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    return Uint8Array.from(atob(text.replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function detect(file: Blob): Promise<ChartFileInfo | null> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (startsWith(bytes, ZIP)) return { format: "level_data", packing: "zip" };
  if (startsWith(bytes, GZIP)) {
    const { text, complete } = await gunzip(bytes);
    const format = text === null ? null : classifyText(text, complete);
    return format ? { format, packing: "gzip" } : null;
  }
  const text = decode(bytes);
  if (text === null) return null;
  // pjsk scores are often shared as base64 gzipped json, which always starts with H4sI
  if (/^\s*H4sI[A-Za-z0-9+/=\s]*$/.test(text)) {
    const inner = fromBase64(text);
    if (!inner || !startsWith(inner, GZIP)) return null;
    const unpacked = await gunzip(inner);
    const format = unpacked.text === null ? null : classifyText(unpacked.text, unpacked.complete);
    return format === "pjsk" ? { format, packing: "base64" } : null;
  }
  const format = classifyText(text, true);
  return format ? { format, packing: null } : null;
}

const seen = new WeakMap<Blob, Promise<ChartFileInfo | null>>();

export function detectChartFormat(file: Blob): Promise<ChartFileInfo | null> {
  let found = seen.get(file);
  if (!found) {
    found = detect(file).catch(() => null);
    seen.set(file, found);
  }
  return found;
}

const FORMAT_LABELS: Record<ChartFormat, string> = {
  sus: "SUS",
  usc: "USC",
  level_data: "LevelData",
  pjsk: "PJSK",
  foreign_level_data: "LevelData",
};

export function chartFormatLabel(info: ChartFileInfo): string {
  return FORMAT_LABELS[info.format];
}
