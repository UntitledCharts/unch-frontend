import { fetchCharts, fetchChartsWindow } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const staff = await fetchCharts(fetch, { type: "advanced", staff_pick: 1, limit: 10 });

  return {
    featured: staff.data.slice(0, 5),
    staffPicks: staff.data,
    trending: fetchCharts(fetch, { type: "advanced", sort_by: "decaying_likes", limit: 10 }).then(
      (r) => r.data,
    ),
    // 12 fills every row whether the grid has 2, 3 or 4 columns
    newest: fetchChartsWindow(fetch, { type: "quick", sort_by: "created_at", sort_order: "desc" }, 0, 12).then(
      (r) => r.data,
    ),
  };
};
