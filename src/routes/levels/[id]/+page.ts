import { error } from "@sveltejs/kit";
import { browser } from "$app/environment";
import {
  fetchChart,
  fetchScheduledChart,
  fetchCharts,
  fetchTrends,
  fetchAccountById,
  type Chart,
} from "$lib/data/index.js";
import { storedSessionKey } from "$lib/state/session.svelte";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id.replace(/^unch-/i, "");
  // the server has no session, so a private chart only loads in the browser, with the viewer's session
  const key = storedSessionKey();
  const details = await fetchChart(fetch, id, key);
  // a private chart waiting on a scheduled release isn't served by the normal endpoint; the schedule one
  // gives just enough (title, artists, cover, release time) for the countdown
  const chart: Chart | null = details ?? (await fetchScheduledChart(fetch, id));
  if (!chart) error(404, { message: "Not Found", needsSession: !browser });
  const teaser = !details;

  // the scheduled endpoint doesn't send a status, so a chart that came from it is scheduled by definition
  const releaseAt = chart.scheduled_publish && (teaser || chart.status !== "PUBLIC") ? chart.scheduled_publish : null;

  const trends = await fetchTrends(fetch, chart.id, key);

  return {
    chart,
    isOwner: !!details?.viewer.is_owner,
    // owner, collaborators with read access and staff who can see hidden charts get the scheduled notice
    hasAccess:
      !!details &&
      (details.viewer.is_owner ||
        details.viewer.chart_permissions.includes("read") ||
        details.viewer.staff_permissions.includes("chart.view_hidden")),
    // rendered without the viewer's session; a signed-in browser loads a teaser again
    serverRendered: !browser,
    // set while the release is pending; teaser means only the public countdown details came back
    scheduled: releaseAt ? { at: releaseAt, teaser } : null,
    author: fetchAccountById(fetch, chart.author),
    // the charter's other charts, most liked first; there's no real "related" signal in the API
    moreFromCharter: fetchCharts(fetch, {
      owner_handle: chart.author_handle,
      sort_by: "likes",
      sort_order: "desc",
    }).then((r) =>
      r.data.filter((c) => c.id !== chart.id).slice(0, 8),
    ),
    trends,
  };
};
