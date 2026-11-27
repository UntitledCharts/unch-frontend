import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	vitePlugin: {
		// Pre-bundle Svelte component libraries (e.g. the remixicon icon set) so dev
		// doesn't serve dozens of separate icon modules per page.
		prebundleSvelteLibraries: true
	},
	kit: {
		// Deployed on Cloudflare Pages; wrangler.toml holds the runtime settings.
		adapter: adapter(),
		alias: {
			'$lib': './src/lib',
			'$lib/*': './src/lib/*',
			'remixicon-icon': './node_modules/remixicon-svelte/dist/icons',
			'remixicon-icon/*': './node_modules/remixicon-svelte/dist/icons/*'
		}
	}
};

export default config;
