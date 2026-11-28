<script lang="ts">
  import { page } from "$app/state";
  import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, ogSiteUrl } from "$lib/config.js";

  // `title` is the browser tab in the visitor's language; link previews use `metaTitle`, which is English,
  // and fall back to `title` for names that aren't translated anyway (charts, accounts)
  let {
    title,
    metaTitle,
    description = SITE_DESCRIPTION,
    image,
    type = "website",
    suffix = true,
    oembed,
    themeColor = "#38bdf8",
    discord,
    activity,
  }: {
    title?: string;
    metaTitle?: string;
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
  const fullTitle = $derived(!clean ? SITE_NAME : suffix ? `${clean} | ${SITE_NAME}` : clean);
  const cleanMeta = $derived(strip(metaTitle ?? title ?? ""));
  const previewTitle = $derived(!cleanMeta ? SITE_NAME : suffix ? `${cleanMeta} | ${SITE_NAME}` : cleanMeta);
  const origin = SITE_URL;
  const canonical = $derived(origin + page.url.pathname);
  const absImage = $derived(
    image ? (image.startsWith("http") ? image : `${origin}${image}`) : ogSiteUrl(),
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

  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:type" content={type} />
  <meta property="og:title" content={previewTitle} />
  <meta property="og:description" content={desc} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={absImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={previewTitle} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={previewTitle} />
  <meta name="twitter:description" content={desc} />
  <meta name="twitter:image" content={absImage} />
  <meta name="twitter:image:alt" content={previewTitle} />

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
