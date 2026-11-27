import { t } from "$lib/i18n.svelte.js";
import type { SortBy } from "./types.js";

export type SearchType = "newest" | "random" | "quick" | "advanced";

export const searchTypes: { value: SearchType; label: string }[] = [
  { value: "newest", get label() { return t("search.newest"); } },
  { value: "quick", get label() { return t("search.quick"); } },
  { value: "advanced", get label() { return t("search.advanced"); } },
  { value: "random", get label() { return t("search.random"); } },
];

export const sortByOptions: { value: SortBy; label: string }[] = [
  { value: "created_at", get label() { return t("search.createdDate"); } },
  { value: "rating", get label() { return t("search.rating"); } },
  { value: "likes", get label() { return t("search.likes"); } },
  { value: "abc", get label() { return t("search.alphabetical"); } },
  { value: "decaying_likes", get label() { return t("search.decayingLikes"); } },
];

export const orderOptions: { value: "asc" | "desc"; label: string }[] = [
  { value: "desc", get label() { return t("search.descending"); } },
  { value: "asc", get label() { return t("search.ascending"); } },
];

export type Filters = {
  searchType: SearchType;
  staffPick: boolean;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  keywords: string;
  minRating: string;
  maxRating: string;
  titleIncludes: string;
  descriptionIncludes: string;
  artistsIncludes: string;
  tags: string;
  authorHandle: string;
};

export const defaultFilters: Filters = {
  searchType: "newest",
  staffPick: false,
  sortBy: "decaying_likes",
  sortOrder: "desc",
  keywords: "",
  minRating: "",
  maxRating: "",
  titleIncludes: "",
  descriptionIncludes: "",
  artistsIncludes: "",
  tags: "",
  authorHandle: "",
};

export function filtersToApiParams(
  f: Filters,
  page: number,
  limit: number,
): Record<string, string | number> {
  const actualType = f.searchType === "newest" ? "quick" : f.searchType;
  const params: Record<string, string | number> = { type: actualType, page, limit };

  if (f.staffPick && actualType !== "random") params.staff_pick = 1;
  if (f.authorHandle.trim()) params.sonolus_handle_is = f.authorHandle.trim();

  if (actualType === "quick") {
    if (f.keywords.trim()) params.meta_includes = f.keywords.trim();
    params.sort_by = f.searchType === "newest" ? "created_at" : f.sortBy;
    params.sort_order = f.sortOrder;
  } else if (f.searchType === "advanced") {
    if (f.titleIncludes.trim()) params.title_includes = f.titleIncludes.trim();
    else if (f.keywords.trim()) params.title_includes = f.keywords.trim();
    if (f.descriptionIncludes.trim()) params.description_includes = f.descriptionIncludes.trim();
    if (f.artistsIncludes.trim()) params.artists_includes = f.artistsIncludes.trim();
    if (f.minRating.trim()) params.minR = f.minRating.trim();
    if (f.maxRating.trim()) params.maxR = f.maxRating.trim();
    if (f.tags.trim()) params.tags = f.tags.trim();
    params.sort_by = f.sortBy;
    params.sort_order = f.sortOrder;
  }
  return params;
}

export function isDefault(f: Filters): boolean {
  return (
    f.searchType === defaultFilters.searchType &&
    !f.staffPick &&
    f.sortBy === defaultFilters.sortBy &&
    f.sortOrder === "desc" &&
    f.keywords.trim() === "" &&
    f.minRating === "" &&
    f.maxRating === "" &&
    f.titleIncludes === "" &&
    f.descriptionIncludes === "" &&
    f.artistsIncludes === "" &&
    f.tags === "" &&
    f.authorHandle === ""
  );
}

export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.staffPick) n++;
  if (f.minRating || f.maxRating) n++;
  if (f.tags.trim()) n++;
  if (f.authorHandle.trim()) n++;
  if (f.titleIncludes || f.descriptionIncludes || f.artistsIncludes) n++;
  return n;
}
