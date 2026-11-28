import { fetchCharts, fetchChartsWindow } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const staff = await fetchCharts(fetch, { staff_pick: true });

  return {
    featured: staff.data.slice(0, 5),
    staffPicks: staff.data,
    trending: fetchCharts(fetch, { sort_by: "decaying_likes" }).then(
      (r) => r.data,
    ),
    // 12 fills every row whether the grid has 2, 3 or 4 columns
    newest: fetchChartsWindow(fetch, { sort_by: "published_at", sort_order: "desc" }, 0, 12).then(
      (r) => r.data,
    ),
  };
};
