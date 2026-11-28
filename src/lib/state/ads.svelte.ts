import { ADSENSE_CLIENT } from "$lib/config.js";

export const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

// set when the AdSense script can't load (usually an ad blocker), so the reserved boxes fold away
export const adScript = $state({ failed: false });
