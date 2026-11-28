

export type ImageUrls = { url: string; webp_url: string };

// mod and admin are sets of staff permissions: staff.manage makes an admin, any moderation permission a mod
export const MOD_PERMISSIONS = [
  "chart.visibility",
  "chart.delete",
  "chart.restore",
  "chart.view_hidden",
  "chart.rerate",
  "chart.staff_pick",
  "comment.delete",
  "leaderboard.delete",
  "notification.send",
] as const;
export const ADMIN_ONLY_PERMISSIONS = ["account.ban", "account.delete", "staff.manage"] as const;

export type AccountBadge = {
  badge: string;
  level: number;
  image: string;
  description_key: string;
};

export type Account = {
  sonolus_id: string;
  sonolus_handle: number;
  sonolus_username: string;
  avatar: ImageUrls | null;
  banner: ImageUrls | null;
  description: string | null;
  permissions: string[];
  mod: boolean;
  admin: boolean;
  banned: boolean;
  badges: AccountBadge[];
};

// full URLs of the chart's files, as the API sends them; null when the chart has none
export type ChartFiles = {
  jacket: string | null;
  music: string | null;
  chart: string | null;
  preview: string | null;
  background: string | null;
  background_v1: string | null;
  background_v3: string | null;
};

export type Chart = {
  id: string;
  rating: number;
  author: string;
  author_handle: number;
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
  files: ChartFiles;
  // set when the charter scheduled a release; the chart stays hidden until then
  scheduled_publish: string | null;
};

export type ChartViewer = {
  is_owner: boolean;
  chart_permissions: string[];
  staff_permissions: string[];
};

export type ChartDetails = Chart & { viewer: ChartViewer };

export type Comment = {
  id: number;
  content: string;
  created_at: string;
  deleted_at: string | null;
  is_own: boolean;
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
