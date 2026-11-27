<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { page } from "$app/state";
  import { SITE_URL } from "$lib/config.js";

  let {
    title,
    description = t("common.siteDescription"),
    image,
    type = "website",
    suffix = true,
    oembed,
    themeColor = "#38bdf8",
    discord,
    activity,
  }: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    suffix?: boolean;
    oembed?: string;
    themeColor?: string;
    discord?: Record<string, unknown>;
    activity?: string | null;
  } = $props();

  const strip = (s: string) => s.replace(/:([a-zA-Z0-9_]+):/g, "").replace(/\s+/g, " ").trim();
  const clean = $derived(strip(title ?? ""));
  const desc = $derived(strip(description));
  const fullTitle = $derived(!clean ? "UntitledCharts" : suffix ? `${clean} | UntitledCharts` : clean);
  const origin = SITE_URL;
  const canonical = $derived(origin + page.url.pathname);
  const absImage = $derived(
    image ? (image.startsWith("http") ? image : `${origin}${image}`) : `${origin}/og`,
  );
  const absOembed = $derived(
    oembed ? (oembed.startsWith("http") ? oembed : `${origin}${oembed}`) : undefined,
  );
  // Discord's crawler gets the component embed (?embedbeta forces it for testing in a browser); everyone
  // else, X, Telegram, Facebook and the rest, reads the Open Graph / Twitter tags below.
  // ?embedlegacy brings back the older ActivityPub-style Discord embed.
  const legacy = $derived(page.url.searchParams.has("embedlegacy"));
  const forDiscord = $derived(!legacy && (page.data.discord || page.url.searchParams.has("embedbeta")));
  const discordJson = $derived(
    discord && forDiscord ? JSON.stringify(discord).replace(/</g, "\\u003c").replace(/>/g, "\\u003e") : "",
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={desc} />
  <link rel="canonical" href={canonical} />

  <meta property="og:site_name" content="UntitledCharts" />
  <meta property="og:type" content={type} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={desc} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={absImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={fullTitle} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={desc} />
  <meta name="twitter:image" content={absImage} />
  <meta name="twitter:image:alt" content={fullTitle} />

  <meta name="theme-color" content={themeColor} />
  {#if discordJson}
    {@html `<script id="discord:component-embed" type="application/json">${discordJson}</` + `script>`}
  {/if}
  {#if activity && page.data.discord && (legacy || !discord)}
    <link href={`${origin}${activity}`} rel="alternate" type="application/activity+json" />
  {/if}
  {#if absOembed}
    <link type="application/json+oembed" rel="alternate" href={absOembed} title={fullTitle} />
  {/if}
</svelte:head>
