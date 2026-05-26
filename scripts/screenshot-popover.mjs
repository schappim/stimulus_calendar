// Capture the new event popover from the running Vite dev server.
// Assumes Vite is already up on the chosen port.
//
// Usage: node scripts/screenshot-popover.mjs [port] [output]

import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const port   = process.argv[2] || '5176';
const output = process.argv[3] || 'event-popover-macos.png';

const repoRoot = resolve(import.meta.dirname, '..');
const outDir   = resolve(repoRoot, 'docs/images');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, output);

const browser = await chromium.launch();
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const page    = await ctx.newPage();

await page.goto(`http://localhost:${port}/demo/16-event-popover.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('.ec-event-popover', { timeout: 5000 });
await page.waitForTimeout(150); // allow position settle

// Screenshot just the popover area plus the chip it points at.
const pop = await page.locator('.ec-event-popover').first();
const popBox = await pop.boundingBox();
const margin = 24;
const clip = {
  x: Math.max(0, popBox.x - 240),
  y: Math.max(0, popBox.y - margin),
  width:  popBox.width + 280,
  height: popBox.height + 2 * margin,
};
await page.screenshot({ path: outPath, clip });
console.log(`wrote ${outPath}`);

await browser.close();
