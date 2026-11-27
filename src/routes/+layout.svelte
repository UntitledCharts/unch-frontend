<script lang="ts">
	import { ModeWatcher } from "mode-watcher";
	import MobileNav from "$lib/components/mobile-nav.svelte";
	import LoginModal from "$lib/components/login-modal.svelte";
	import { onMount, untrack } from "svelte";
	import { session } from "$lib/state/session.svelte";
	import { restoreAccent } from "$lib/state/accent.js";
	import { loadPrefs } from "$lib/state/preferences.svelte.js";
	import { useMessages } from "$lib/i18n.svelte.js";

	let { children, data } = $props();
	import "../app.css";

	$effect.pre(() => {
		useMessages(data.lang, data.messages);
	});
	untrack(() => useMessages(data.lang, data.messages));

	onMount(() => {
		restoreAccent();
		loadPrefs();
		session.init();
	});
</script>

<svelte:head>
	<link rel="icon" href="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" />
</svelte:head>

<ModeWatcher defaultMode="dark" />

<div class="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
	{@render children()}
</div>

<MobileNav />

<LoginModal />
