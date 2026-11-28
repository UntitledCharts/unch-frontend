import { fetchLimits } from "$lib/data/limits.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => ({ limits: await fetchLimits(fetch) });
