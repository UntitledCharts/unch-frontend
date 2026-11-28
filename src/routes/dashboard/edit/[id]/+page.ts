import { error } from "@sveltejs/kit";
import { fetchChart, fetchScheduledChart } from "$lib/data/index.js";
import { storedSessionKey } from "$lib/state/session.svelte";
import type { PageLoad } from "./$types";

export const ssr = false;

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id.replace(/^unch-/i, "");
  const key = storedSessionKey();
  const chart = await fetchChart(fetch, id, key);
  if (chart?.viewer.chart_permissions.some((p) => p === "edit.metadata" || p === "edit.files")) return { chart };
  // a private chart without a public countdown stays hidden; one people can already find asks for the right account
  if (!chart && !(await fetchScheduledChart(fetch, id))) error(404);
  error(key ? 403 : 401);
};
