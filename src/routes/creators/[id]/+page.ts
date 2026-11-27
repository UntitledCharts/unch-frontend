import { error } from "@sveltejs/kit";
import { fetchAccountByHandle, fetchAccountStats, fetchCharts } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const result = await fetchAccountByHandle(fetch, params.id);
  if (!result) error(404, "That charter doesn't exist.");

  return {
    account: result.account,
    stats: await fetchAccountStats(fetch, result.account.sonolus_id),
    // first page of "Newest"; the page fetches other sorts and pages itself
    firstPage: fetchCharts(fetch, {
      type: "advanced",
      sonolus_handle_is: String(result.account.sonolus_handle),
      sort_by: "created_at",
      sort_order: "desc",
      page: 0,
      limit: 12,
    }),
  };
};
