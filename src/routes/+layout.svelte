<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import MobileNav from "$lib/components/mobile-nav.svelte";
	import LoginModal from "$lib/components/login-modal.svelte";
	import SessionExpiredNotice from "$lib/components/session-expired-notice.svelte";
	import AuthorCard from "$lib/components/author-card.svelte";
	import { onMount, untrack } from "svelte";
	import { session } from "$lib/state/session.svelte";
	import { restoreAccent } from "$lib/state/accent.js";
	import { loadPrefs } from "$lib/state/preferences.svelte.js";
	import { useMessages } from "$lib/i18n.svelte.js";
	import { useSiteAssets } from "$lib/state/site-assets.svelte.js";
	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { setPendingNavigation } from "$lib/load-failure.js";
	import { dev } from "$app/environment";
	import { ADSENSE_SRC, adScript } from "$lib/state/ads.svelte.js";
	import { ADS_ENABLED } from "$lib/config.js";

	let { children, data } = $props();

	beforeNavigate(({ to, willUnload }) => setPendingNavigation(!willUnload && to?.url ? to.url.href : null));
	afterNavigate(() => setPendingNavigation(null));
	import "../app.css";

	$effect.pre(() => {
		useMessages(data.lang, data.messages);
		useSiteAssets(data.defaultBanner);
	});
	untrack(() => {
		useMessages(data.lang, data.messages);
		useSiteAssets(data.defaultBanner);
	});

	onMount(() => {
		restoreAccent();
		loadPrefs();
		session.init();
	});
</script>

<svelte:head>
	<link rel="icon" href="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" />
	{#if !dev && ADS_ENABLED}
		<script async src={ADSENSE_SRC} crossorigin="anonymous" onerror={() => (adScript.failed = true)}></script>
	{/if}
</svelte:head>

<ModeWatcher defaultMode="dark" />

<div class="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
	{@render children()}
</div>

<MobileNav />

<LoginModal />

<SessionExpiredNotice />

<AuthorCard />
