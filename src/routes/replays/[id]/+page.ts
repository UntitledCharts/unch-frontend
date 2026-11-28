import { error } from "@sveltejs/kit";
import { browser } from "$app/environment";
import { fetchChart, fetchScore } from "$lib/data/index.js";
import { storedSessionKey } from "$lib/state/session.svelte";
import type { PageLoad } from "./$types";

// replay names look like UnCh-<chart id>-<score id>
const NAME = /^unch-([0-9a-f]{32})-(\d+)$/i;

export const load: PageLoad = async ({ params, fetch }) => {
  const match = NAME.exec(params.id);
  if (!match) error(404);

  const [, chartId, scoreId] = match;
  const key = storedSessionKey();
  const chart = await fetchChart(fetch, chartId, key);
  if (!chart) error(404, { message: "Not Found", needsSession: !browser });

  return {
    name: params.id,
    chart,
    score: fetchScore(fetch, chart.id, Number(scoreId), key),
  };
};
