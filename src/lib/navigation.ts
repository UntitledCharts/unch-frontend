import { goto } from "$app/navigation";

// like the old site: back through the history when there is some, otherwise home
export function goBack() {
  if (history.length > 2) history.back();
  else goto("/");
}
