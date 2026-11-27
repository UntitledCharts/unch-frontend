
import type { Chart } from "./types.js";

type CharterKey = "luna" | "prisma" | "nova" | "volt" | "echo";

const CHARTERS: Record<CharterKey, { author: string; handle: number; name: string }> = {
  luna: { author: "acc_luna", handle: 4821, name: "Luna" },
  prisma: { author: "acc_prisma", handle: 3310, name: "Prisma" },
  nova: { author: "acc_nova", handle: 6690, name: "Nova" },
  volt: { author: "acc_volt", handle: 5567, name: "Volt" },
  echo: { author: "acc_echo", handle: 2204, name: "Echo" },
};

function mk(o: {
  id: string;
  title: string;
  artists: string;
  charter: CharterKey;
  rating: number;
  tags: string[];
  likes: number;
  comments: number;
  created: string;
  updated?: string;
  staff_pick?: boolean;
  description?: string;
}): Chart {
  const c = CHARTERS[o.charter];
  return {
    id: o.id,
    rating: o.rating,
    author: c.author,
    author_handle: c.handle,
    author_full: `${c.name}#${c.handle}`,
    chart_design: c.name,
    title: o.title,
    artists: o.artists,
    tags: o.tags,
    description: o.description ?? null,
    staff_pick: o.staff_pick ?? false,
    status: "PUBLIC",
    like_count: o.likes,
    comment_count: o.comments,
    created_at: o.created,
    published_at: o.created,
    updated_at: o.updated ?? o.created,
    jacket_file_hash: "",
    music_file_hash: "",
    background_file_hash: "",
    preview_file_hash: "",
    custom_background: false,
    chart_file_hash: "",
    scheduled_publish: null,
  };
}

export const mockCharts: Chart[] = [
  mk({
    id: "c-001", title: "Hibana", artists: "DECO*27", charter: "luna",
    rating: 32, tags: ["master", "vocaloid"], staff_pick: true,
    likes: 2841, comments: 132, created: "2026-05-02T10:00:00Z", updated: "2026-06-20T18:30:00Z",
    description: "BPM: 160\nNote count: 1,024\nA fiery master chart.",
  }),
  mk({
    id: "c-002", title: "Tell Your World", artists: "livetune", charter: "prisma",
    rating: 19, tags: ["hard", "vocaloid"],
    likes: 1204, comments: 44, created: "2026-03-11T10:00:00Z", updated: "2026-05-01T09:00:00Z",
    description: "BPM: 150\nNote count: 612",
  }),
  mk({
    id: "c-003", title: "Good Day (Easy)", artists: "Polly Pocket", charter: "nova",
    rating: 8, tags: ["easy"],
    likes: 312, comments: 9, created: "2026-06-25T10:00:00Z",
  }),
  mk({
    id: "c-004", title: "Good Day (Normal)", artists: "Polly Pocket", charter: "nova",
    rating: 14, tags: ["normal"],
    likes: 388, comments: 12, created: "2026-06-25T11:00:00Z",
  }),
  mk({
    id: "c-005", title: "Good Day (Hard)", artists: "Polly Pocket", charter: "nova",
    rating: 21, tags: ["hard"],
    likes: 501, comments: 18, created: "2026-06-26T10:00:00Z",
  }),
  mk({
    id: "c-006", title: "Good Day (Expert)", artists: "Polly Pocket", charter: "nova",
    rating: 27, tags: ["expert"],
    likes: 742, comments: 31, created: "2026-06-27T10:00:00Z", updated: "2026-06-28T10:00:00Z",
  }),
  mk({
    id: "c-007", title: "Senbonzakura", artists: "Kurousa-P", charter: "volt",
    rating: 30, tags: ["master", "vocaloid"], staff_pick: true,
    likes: 3980, comments: 205, created: "2026-02-14T10:00:00Z", updated: "2026-06-30T12:00:00Z",
    description: "BPM: 154\nNote count: 1,180\nCombo: 1180",
  }),
  mk({
    id: "c-008", title: "World is Mine", artists: "ryo", charter: "echo",
    rating: 25, tags: ["expert", "vocaloid"],
    likes: 2210, comments: 88, created: "2026-04-18T10:00:00Z", updated: "2026-05-22T10:00:00Z",
  }),
  mk({
    id: "c-009", title: "Melt", artists: "ryo", charter: "echo",
    rating: 16, tags: ["normal", "vocaloid"],
    likes: 1670, comments: 63, created: "2026-01-30T10:00:00Z", updated: "2026-04-10T10:00:00Z",
  }),
  mk({
    id: "c-010", title: "Ghost Rule", artists: "DECO*27", charter: "luna",
    rating: 34, tags: ["append", "vocaloid"], staff_pick: true,
    likes: 4521, comments: 260, created: "2026-06-01T10:00:00Z", updated: "2026-07-03T14:00:00Z",
    description: "BPM: 172\nNote count: 1,410",
  }),
  mk({
    id: "c-011", title: "Roki", artists: "MikitoP", charter: "prisma",
    rating: 28, tags: ["expert", "vocaloid"],
    likes: 1930, comments: 77, created: "2026-05-19T10:00:00Z", updated: "2026-06-15T10:00:00Z",
  }),
  mk({
    id: "c-012", title: "Gimme×Gimme", artists: "Hachioji-P", charter: "volt",
    rating: 33, tags: ["master", "vocaloid"],
    likes: 2755, comments: 121, created: "2026-03-28T10:00:00Z", updated: "2026-06-05T10:00:00Z",
  }),
  mk({
    id: "c-013", title: "Teo", artists: "Omoi", charter: "luna",
    rating: 35, tags: ["append"], staff_pick: true,
    likes: 5104, comments: 318, created: "2026-06-10T10:00:00Z", updated: "2026-07-05T20:00:00Z",
    description: "BPM: 190\nNote count: 1,620\nCombo: 1620",
  }),
  mk({
    id: "c-014", title: "Alien Alien", artists: "Nayutan Seijin", charter: "echo",
    rating: 12, tags: ["normal", "vocaloid"],
    likes: 940, comments: 27, created: "2026-02-02T10:00:00Z", updated: "2026-03-15T10:00:00Z",
  }),
  mk({
    id: "c-015", title: "Marshall Maximizer", artists: "Rerulili", charter: "volt",
    rating: 31, tags: ["master", "vocaloid"],
    likes: 2088, comments: 95, created: "2026-04-05T10:00:00Z", updated: "2026-06-25T10:00:00Z",
  }),
];

export const mockChartsById: Map<string, Chart> = new Map(
  mockCharts.map((c) => [c.id, c]),
);

export function getChart(id: string): Chart | undefined {
  return mockChartsById.get(id);
}
