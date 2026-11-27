import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
  ],
  ssr: {
    noExternal: [/remixicon-svelte/],
  },
  optimizeDeps: {
    include: [
      'wavesurfer.js',
      'mode-watcher',
    ],
    // Only the /og server endpoints import these, and they load .wasm files the optimizer can't handle.
    exclude: ['@cf-wasm/resvg', '@cf-wasm/satori'],
  },
  server: {
    warmup: {
      ssrFiles: [
        './src/routes/**/+page.svelte',
        './src/routes/**/+layout.svelte',
        './src/lib/components/**/*.svelte',
      ],
    },
  },
});