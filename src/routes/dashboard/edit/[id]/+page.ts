import { error } from "@sveltejs/kit";
import { fetchChart } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const ssr = false;

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id.replace(/^unch-/i, "");
  const key = typeof localStorage !== "undefined" ? localStorage.getItem("session") : null;
  const chart = await fetchChart(fetch, id, key ?? undefined);
  if (!chart) error(404, "That chart doesn't exist (or isn't yours).");
  return { chart };
};
