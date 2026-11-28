import { error } from "@sveltejs/kit";
import { fetchAccountByHandle, fetchAccountStats, fetchCharts } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const result = await fetchAccountByHandle(fetch, params.handle);
  if (!result) error(404);

  return {
    account: result.account,
    collaborations: result.collaborations,
    stats: await fetchAccountStats(fetch, result.account.sonolus_id),
    // first page of "Newest"; the page fetches other sorts and pages itself
    firstPage: fetchCharts(fetch, {
      owner_handle: result.account.sonolus_handle,
      sort_by: "published_at",
      sort_order: "desc",
      page: 0,
    }),
  };
};
