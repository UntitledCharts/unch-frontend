// Bundled as data URLs so the OG routes never fetch their own site (a Worker can't request its own hostname).
import logo from "./logo.png?inline";
import miku from "./miku.png?inline";

export { logo, miku };
