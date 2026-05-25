import { defineConfig } from 'vite';
import { resolve } from 'path';

/* Library build — produces two flavors:
 *
 *   dist/stimulus_calendar.js       IIFE, includes @hotwired/stimulus inline.
 *                                   Drop into a static <script> tag and call
 *                                   window.StimulusCalendar.start(). Use for
 *                                   plain HTML / file:// / non-bundler users.
 *
 *   dist/stimulus_calendar.esm.js   ESM module, externalizes @hotwired/stimulus.
 *                                   Use with importmaps (Rails) or any ES-module
 *                                   consumer that pins stimulus separately.
 *
 *   dist/stimulus_calendar.css      Shared default theme, identical content.
 *
 * Switch between formats by passing the env var:
 *   FORMAT=iife npx vite build --config vite.lib.config.js
 *   FORMAT=es   npx vite build --config vite.lib.config.js
 *
 * `npm run build:lib` builds both in sequence.
 */
const FORMAT = process.env.FORMAT || 'iife';

const isES = FORMAT === 'es';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'StimulusCalendar',
      fileName: () => isES ? 'stimulus_calendar.esm.js' : 'stimulus_calendar.js',
      formats: [FORMAT],
    },
    rollupOptions: {
      external: isES ? ['@hotwired/stimulus'] : [],
      output: {
        assetFileNames: (info) => info.name.endsWith('.css') ? 'stimulus_calendar.css' : info.name,
        globals: {},
        extend: true,
      },
    },
    sourcemap: true,
    target: 'es2020',
  },
});
