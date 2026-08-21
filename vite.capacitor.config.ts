/**
 * Standalone SPA build used for the Capacitor (Android / iOS) app.
 *
 * Nothing from TanStack Start, Nitro or the Lovable server runtime is used —
 * `bun run build:native` emits a plain static bundle in dist/ with relative
 * asset paths so it works from the webview's local file root.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'node:path'

export default defineConfig({
  base: './',
  plugins: [tsconfigPaths(), react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_NATIVE': JSON.stringify('1'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: resolve(process.cwd(), 'index.native.html'),
    },
  },
})
