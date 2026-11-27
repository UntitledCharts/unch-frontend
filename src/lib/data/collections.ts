
import type { Chart } from "./types.js";
import { DIFFICULTIES, difficultyFromTags, type Difficulty } from "./format.js";
import { mockChartsById } from "./mock-charts.js";

export type Collection = {
  id: string;
  name: string;
  description: string | null;

  chartIds: string[];

  updatedAt: string;

  emoji?: string;
};

export const mockCollections: Collection[] = [
  {
    id: "favorites",
    name: "Favorites",
    description: "The charts I keep coming back to.",
    emoji: "❤️",
    chartIds: ["c-013", "c-010", "c-001", "c-007", "c-008"],
    updatedAt: "2026-07-05T20:00:00Z",
  },
  {
    id: "practice-later",
    name: "Practice Later",
    description: "Tough ones to grind when I have the patience.",
    emoji: "⏳",
    chartIds: ["c-011", "c-006", "c-005", "c-002"],
    updatedAt: "2026-07-02T09:00:00Z",
  },
  {
    id: "other-good-charts",
    name: "Other good charts",
    description: "A grab-bag of solid picks that don't fit elsewhere.",
    emoji: "✨",
    chartIds: ["c-009", "c-014", "c-008", "c-002", "c-011"],
    updatedAt: "2026-06-20T12:00:00Z",
  },
  {
    id: "polly-pocket-good-day",
    name: "Polly Pocket: All Good Day Difficulties",
    description: "Every difficulty of “Good Day” in one folder.",
    emoji: "🎀",
    chartIds: ["c-003", "c-004", "c-005", "c-006"],
    updatedAt: "2026-06-28T15:00:00Z",
  },
  {
    id: "master-30-plus",
    name: "Master Lv. 30+",
    description: "Endgame charts — rating 30 and above only.",
    emoji: "🔥",
    chartIds: ["c-007", "c-015", "c-001", "c-012", "c-010", "c-013"],
    updatedAt: "2026-07-06T11:00:00Z",
  },
  {
    id: "staff-picks-saved",
    name: "Staff Picks I Saved",
    description: "Community-highlighted charts worth keeping.",
    emoji: "⭐",
    chartIds: ["c-001", "c-007", "c-010", "c-013"],
    updatedAt: "2026-07-01T08:00:00Z",
  },
];

export function getCollection(id: string): Collection | undefined {
  return mockCollections.find((c) => c.id === id);
}

export function listCollections(): Collection[] {
  return mockCollections;
}

export function collectionCharts(c: Collection): Chart[] {
  return c.chartIds
    .map((id) => mockChartsById.get(id))
    .filter((x): x is Chart => x !== undefined);
}

export function collectionDifficulties(charts: Chart[]): Difficulty[] {
  const present = new Set<Difficulty>();
  for (const c of charts) present.add(difficultyFromTags(c.tags, c.rating));
  return DIFFICULTIES.filter((d) => present.has(d)).reverse();
}

export function savedCharts(): Chart[] {
  const seen = new Set<string>();
  const out: Chart[] = [];
  for (const col of mockCollections) {
    for (const ch of collectionCharts(col)) {
      if (!seen.has(ch.id)) {
        seen.add(ch.id);
        out.push(ch);
      }
    }
  }
  return out.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

export type DashboardStats = {
  saved: number;
  collections: number;
  creators: number;
  played: number;
};

export function dashboardStats(): DashboardStats {
  const saved = savedCharts();
  const creators = new Set(saved.map((c) => c.author_handle));
  return {
    saved: saved.length,
    collections: mockCollections.length,
    creators: creators.size,
    played: 24,
  };
}
