import { loadMessages } from "$lib/i18n.svelte.js";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ data }) => ({
  ...data,
  messages: await loadMessages(data.lang),
});
