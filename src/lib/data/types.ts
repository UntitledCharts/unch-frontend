

export type Account = {
  sonolus_id: string;
  sonolus_handle: number;
  sonolus_username: string;
  profile_hash: string | null;
  banner_hash: string | null;
  description: string | null;
  mod: boolean;
  admin: boolean;
  banned: boolean;
};

export type Chart = {
  id: string;
  rating: number;
  author: string;
  author_handle: number;
  author_full: string;
  chart_design: string;
  title: string;
  artists: string;
  tags: string[];
  description: string | null;
  staff_pick: boolean;
  status: "PUBLIC" | "UNLISTED" | "PRIVATE";
  like_count: number;
  comment_count: number;
  created_at: string;
  published_at: string;
  updated_at: string;
  jacket_file_hash: string;
  music_file_hash: string;
  background_file_hash: string;
  chart_file_hash: string;
  preview_file_hash: string;
  custom_background: boolean;
  // set when the charter scheduled a release; the chart stays hidden until then
  scheduled_publish: string | null;
};

export type Comment = {
  id: number;
  username: string;
  content: string;
  created_at: number;
  deleted_at: number | null;
  account: Account;
};

export const LEADERBOARD_TYPES = [
  "arcade_score_speed",
  "accuracy_score",
  "arcade_score_no_speed",
  "rank_match",
  "least_combo_breaks",
  "least_misses",
  "perfect",
] as const;
export type LeaderboardType = (typeof LEADERBOARD_TYPES)[number];

export type ScoreEntry = {
  id: number;
  engine: string;
  grade: string;
  nperfect: number;
  ngreat: number;
  ngood: number;
  nmiss: number;
  arcade_score: number;
  accuracy_score: number;
  speed: number;
  display_name: string;
  account: Account;
  created_at: string;
  chart_id: string;
  replay_data_hash: string | null;
};

export type Trends = { likes: number[]; comments: number[] };

export const SORT_OPTIONS = [
  "decaying_likes",
  "created_at",
  "published_at",
  "likes",
  "comments",
  "rating",
  "abc",
  "random",
] as const;
export type SortBy = (typeof SORT_OPTIONS)[number];

export type ChartQuery = {
  sort_by?: SortBy;
  sort_order?: "asc" | "desc";

  q?: string;
  staff_pick?: boolean;
  tags?: string[];

  difficulties?: string[];
  min_rating?: number;
  max_rating?: number;
  page?: number;
  limit?: number;
};
