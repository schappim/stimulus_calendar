import { defineConfig } from 'vitest/config';

/* Unit-test config for the JS core. Kept separate from vite.config.js (which
 * serves the demo pages) so the two never entangle. Vitest auto-prefers this
 * file over vite.config.js.
 *
 * Pure modules under src/lib/ (date math, event parsers, slot generators) run
 * fine under `node`. Switch to `jsdom` later when we start testing controllers
 * that touch the DOM. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    globals: false,
  },
});
