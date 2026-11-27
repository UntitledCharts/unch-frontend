import { error } from "@sveltejs/kit";
import {
  fetchChart,
  fetchScheduledChart,
  fetchCharts,
  fetchTrends,
  fetchAccountById,
} from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id.replace(/^unch-/i, "");
  // a chart waiting on a scheduled release isn't served by the normal endpoint; the /scheduled/ one
  // gives just enough (title, artists, cover, release time) for the countdown
  let chart = await fetchChart(fetch, id);
  const teaser = !chart;
  if (!chart) chart = await fetchScheduledChart(fetch, id);
  if (!chart) error(404, "That chart doesn't exist (or isn't public).");

  // the scheduled endpoint doesn't send a status, so a chart that came from it is scheduled by definition
  const releaseAt = chart.scheduled_publish && (teaser || chart.status !== "PUBLIC") ? chart.scheduled_publish : null;

  const trends = await fetchTrends(fetch, chart.id);

  return {
    chart,
    // set while the release is pending; teaser means only the public countdown details came back
    scheduled: releaseAt ? { at: releaseAt, teaser } : null,
    author: fetchAccountById(fetch, chart.author),
    // the charter's other charts, most liked first; there's no real "related" signal in the API
    moreFromCharter: fetchCharts(fetch, {
      type: "advanced",
      sonolus_handle_is: String(chart.author_handle),
      sort_by: "likes",
      sort_order: "desc",
      limit: 10,
    }).then((r) =>
      r.data.filter((c) => c.id !== chart.id).slice(0, 8),
    ),
    trends,
  };
};
