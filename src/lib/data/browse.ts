import { t } from "$lib/i18n.svelte.js";
import { SORT_OPTIONS, type SortBy } from "./types.js";
import type { ChartParams } from "./api.js";

export type SearchType = "newest" | "random" | "quick" | "advanced";

export const searchTypes: { value: SearchType; label: string }[] = [
  { value: "newest", get label() { return t("generic.newest"); } },
  { value: "quick", get label() { return t("search.quick"); } },
  { value: "advanced", get label() { return t("search.advanced"); } },
  { value: "random", get label() { return t("search.random"); } },
];

export const sortByOptions: { value: SortBy; label: string }[] = [
  { value: "created_at", get label() { return t("search.recent"); } },
  { value: "rating", get label() { return t("generic.rating"); } },
  { value: "likes", get label() { return t("generic.likes"); } },
  { value: "abc", get label() { return t("search.alphabetical"); } },
  { value: "decaying_likes", get label() { return t("search.decayingLikes"); } },
];

// public charts are "recent" by when they first went public; the dashboard's own list goes by upload date
export const browseSortOptions: { value: SortBy; label: string }[] = sortByOptions.map((o) =>
  o.value === "created_at" ? { value: "published_at", get label() { return o.label; } } : o,
);

export const orderOptions: { value: "asc" | "desc"; label: string }[] = [
  { value: "desc", get label() { return t("search.descending"); } },
  { value: "asc", get label() { return t("search.ascending"); } },
];

// the chart fields that both browse and the dashboard filter on
export type ChartFilterFields = {
  staffPick: boolean;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  // number inputs bind to number | null
  minRating: number | null;
  maxRating: number | null;
  titleIncludes: string;
  descriptionIncludes: string;
  artistsIncludes: string;
  tags: string;
};

export type Filters = ChartFilterFields & {
  searchType: SearchType;
  likedByMe: boolean;
  keywords: string;
  authorHandle: string;
};

export const defaultFilters: Filters = {
  searchType: "newest",
  staffPick: false,
  likedByMe: false,
  sortBy: "published_at",
  sortOrder: "desc",
  keywords: "",
  minRating: null,
  maxRating: null,
  titleIncludes: "",
  descriptionIncludes: "",
  artistsIncludes: "",
  tags: "",
  authorHandle: "",
};

const isSortBy = (value: string | undefined): value is SortBy => (SORT_OPTIONS as readonly (string | undefined)[]).includes(value);

const rating = (value: string | null): number | null =>
  value !== null && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null;

const splitTags = (tags: string) => tags.split(",").map((tag) => tag.trim()).filter(Boolean);

// min/max rating, the substring filters and tags, as GET /v1/charts names them
export function fieldsToApiParams(f: ChartFilterFields): ChartParams {
  const params: ChartParams = {};
  if (f.titleIncludes.trim()) params.title_includes = f.titleIncludes.trim();
  if (f.descriptionIncludes.trim()) params.description_includes = f.descriptionIncludes.trim();
  if (f.artistsIncludes.trim()) params.artists_includes = f.artistsIncludes.trim();
  if (f.minRating !== null) params.min_rating = Math.trunc(f.minRating);
  if (f.maxRating !== null) params.max_rating = Math.trunc(f.maxRating);
  const tags = splitTags(f.tags);
  if (tags.length) params.tags = tags;
  return params;
}

// query for GET /v1/charts; the random search type goes to fetchRandomCharts instead
export function filtersToApiParams(f: Filters): ChartParams {
  const params: ChartParams = {};

  if (f.staffPick) params.staff_pick = true;
  if (f.likedByMe) params.liked_by = true;
  if (f.authorHandle.trim()) params.owner_handle = f.authorHandle.trim();

  if (f.searchType === "newest" || f.searchType === "quick") {
    if (f.keywords.trim()) params.meta_includes = f.keywords.trim();
    params.sort_by = f.searchType === "newest" ? "published_at" : f.sortBy;
    params.sort_order = f.sortOrder;
  } else if (f.searchType === "advanced") {
    Object.assign(params, fieldsToApiParams(f));
    if (!f.titleIncludes.trim() && f.keywords.trim()) params.title_includes = f.keywords.trim();
    params.sort_by = f.sortBy;
    params.sort_order = f.sortOrder;
  }
  return params;
}

// the URL names of the shared fields; a sort goes in as "by:order"
export function fieldsFromQuery(p: URLSearchParams, f: ChartFilterFields): void {
  if (p.get("staff") === "1") f.staffPick = true;
  const [by, order] = (p.get("sort") ?? "").split(":");
  if (isSortBy(by)) f.sortBy = by;
  if (order === "asc" || order === "desc") f.sortOrder = order;
  f.minRating = rating(p.get("min_rating"));
  f.maxRating = rating(p.get("max_rating"));
  f.titleIncludes = p.get("title") ?? "";
  f.artistsIncludes = p.get("artists") ?? "";
  f.descriptionIncludes = p.get("description") ?? "";
  f.tags = p.get("tags") ?? "";
}

export function fieldsToQuery(f: ChartFilterFields, q: URLSearchParams, withSort: boolean): void {
  if (f.staffPick) q.set("staff", "1");
  if (withSort) q.set("sort", `${f.sortBy}:${f.sortOrder}`);
  if (f.minRating !== null) q.set("min_rating", String(f.minRating));
  if (f.maxRating !== null) q.set("max_rating", String(f.maxRating));
  if (f.titleIncludes.trim()) q.set("title", f.titleIncludes.trim());
  if (f.artistsIncludes.trim()) q.set("artists", f.artistsIncludes.trim());
  if (f.descriptionIncludes.trim()) q.set("description", f.descriptionIncludes.trim());
  if (f.tags.trim()) q.set("tags", f.tags.trim());
}

export function filtersFromQuery(p: URLSearchParams): Filters {
  const f: Filters = { ...defaultFilters };
  fieldsFromQuery(p, f);
  if (p.get("liked") === "1") f.likedByMe = true;
  const type = p.get("type");
  if (type === "newest" || type === "quick" || type === "advanced" || type === "random") {
    f.searchType = type;
  } else if (p.get("sort")) {
    // an explicit sort means it's kept; "newest" always sorts by when charts went public
    f.searchType = f.sortBy === "published_at" && f.sortOrder === "desc" ? "newest" : "quick";
  }
  f.keywords = p.get("q") ?? "";
  const handle = p.get("sonolus_handle_is");
  if (handle) {
    f.authorHandle = handle;
    f.searchType = "advanced";
  }
  return f;
}

export function filtersToQuery(f: Filters): URLSearchParams {
  const q = new URLSearchParams();
  if (f.searchType !== defaultFilters.searchType) q.set("type", f.searchType);
  if (f.keywords.trim()) q.set("q", f.keywords.trim());
  if (f.likedByMe) q.set("liked", "1");
  if (f.authorHandle.trim()) q.set("sonolus_handle_is", f.authorHandle.trim());
  if (f.searchType === "advanced") fieldsToQuery(f, q, true);
  else {
    if (f.staffPick) q.set("staff", "1");
    if (f.searchType === "quick") q.set("sort", `${f.sortBy}:${f.sortOrder}`);
  }
  return q;
}

export function isDefault(f: Filters): boolean {
  return (
    f.searchType === defaultFilters.searchType &&
    !f.staffPick &&
    !f.likedByMe &&
    f.sortBy === defaultFilters.sortBy &&
    f.sortOrder === "desc" &&
    f.keywords.trim() === "" &&
    f.minRating === null &&
    f.maxRating === null &&
    f.titleIncludes === "" &&
    f.descriptionIncludes === "" &&
    f.artistsIncludes === "" &&
    f.tags === "" &&
    f.authorHandle === ""
  );
}

export function activeFilterCount(f: ChartFilterFields & { authorHandle?: string }): number {
  let n = 0;
  if (f.staffPick) n++;
  if (f.minRating !== null || f.maxRating !== null) n++;
  if (f.tags.trim()) n++;
  if (f.authorHandle?.trim()) n++;
  if (f.titleIncludes || f.descriptionIncludes || f.artistsIncludes) n++;
  return n;
}
