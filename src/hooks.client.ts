import type { ClientInit, HandleClientError } from "@sveltejs/kit";
import { printConsoleGreeting } from "$lib/console-greeting.js";
import { isLoadFailure, recoverFromLoadFailure } from "$lib/load-failure.js";

export const init: ClientInit = () => {
  printConsoleGreeting();
  window.addEventListener("vite:preloadError", (event) => {
    if (recoverFromLoadFailure()) event.preventDefault();
  });
};

export const handleError: HandleClientError = ({ error }) => {
  if (isLoadFailure(error)) recoverFromLoadFailure();
};
