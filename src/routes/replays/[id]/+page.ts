import { error } from "@sveltejs/kit";
import { fetchChart, findScore } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

// replay names look like UnCh-<chart id>-<score id>
const NAME = /^unch-([0-9a-f]{32})-(\d+)$/i;

export const load: PageLoad = async ({ params, fetch }) => {
  const match = NAME.exec(params.id);
  if (!match) error(404, "That isn't a valid replay link.");

  const [, chartId, scoreId] = match;
  const chart = await fetchChart(fetch, chartId);
  if (!chart) error(404, "The chart for this replay doesn't exist (or isn't public).");

  return {
    name: params.id,
    chart,
    score: findScore(fetch, chart.id, Number(scoreId)),
  };
};
