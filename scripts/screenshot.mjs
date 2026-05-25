// Capture per-feature screenshots from the running Vite dev server.
//
// Usage:   node scripts/screenshot.mjs <demo-page> <output-name> [selector]
// Example: node scripts/screenshot.mjs 05-day-grid-month.html cal-month.png .ec

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const [, , page, output, selector = '.ec'] = process.argv;
if (!page || !output) {
  console.error('usage: node scripts/screenshot.mjs <demo-page> <output-name> [selector]');
  process.exit(2);
}

const repoRoot = resolve(import.meta.dirname, '..');
const outDir = resolve(repoRoot, 'docs/images');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, output);

// Boot Vite in dev mode on a free port.
const vite = spawn('npx', ['vite', '--port', '5174', '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});

// Wait for "ready in" log.
await new Promise((resolveReady) => {
  vite.stdout.on('data', (chunk) => {
    const out = chunk.toString();
    process.stdout.write(out);
    if (/ready in/i.test(out)) resolveReady();
  });
});

try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:5174/demo/${page}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('[data-calendar-mounted="true"]');
  const target = await p.locator(selector).first();
  await target.screenshot({ path: outPath });
  console.log(`saved ${outPath}`);
  await browser.close();
} finally {
  vite.kill('SIGTERM');
}
