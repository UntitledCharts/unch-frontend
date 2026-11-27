import { error } from "@sveltejs/kit";
import { getCollection, collectionCharts } from "$lib/data/index.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  const collection = getCollection(params.id);
  if (!collection) error(404, "That collection doesn't exist.");
  return { collection, charts: collectionCharts(collection) };
};
