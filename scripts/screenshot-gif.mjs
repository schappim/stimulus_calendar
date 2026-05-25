// Capture an animated GIF of a demo page that exposes step-frame controls.
//
// Usage:
//   node scripts/screenshot-gif.mjs <demo-page> <output.gif> <selector>
//
// The demo page must:
//   1. Read `window.__SCREENSHOT__` and not run any auto-animation when true.
//   2. Expose `window.demo` with named mutation helpers we call between
//      frames (see demo/11-broadcast.html for the canonical shape).
//
// We collect a sequence of PNG frames via Playwright, then hand them to
// ffmpeg which produces the output GIF using a generated palette so the
// colours stay clean (especially the live-pulse badge).

import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const [, , page, output, selector = '.ec'] = process.argv;
if (!page || !output) {
  console.error('usage: node scripts/screenshot-gif.mjs <demo-page> <output.gif> [selector]');
  process.exit(2);
}

const repoRoot = resolve(import.meta.dirname, '..');
const outDir = resolve(repoRoot, 'docs/images');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, output);
const frameDir = mkdtempSync(resolve(tmpdir(), 'sc-gif-'));

// Storyboard for the broadcast demo: each step either lets time pass or
// calls a `window.demo.*` mutation, then captures a frame. Captions appear
// over the screenshot (rendered into a stripe above the selector via
// page.addStyleTag).
const STORYBOARD = [
  { caption: 'Both windows in sync — initial state',           hold: 600 },
  { caption: 'Alex drags Design crit on the left',             call: 'moveDesignCritLate',      hold: 700 },
  { caption: 'Sam sees the move arrive within ~50 ms',         hold: 1100 },
  { caption: 'Alex undoes the move',                           call: 'moveDesignCritOriginal',  hold: 700 },
  { caption: 'Both windows back in sync',                      hold: 900 },
];

// Boot Vite.
const vite = spawn('npx', ['vite', '--port', '5174', '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((r) => vite.stdout.on('data', (c) => /ready in/i.test(c) && r()));

try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__SCREENSHOT__ = true; });
  await p.goto(`http://localhost:5174/demo/${page}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('[data-calendar-mounted="true"]');
  await p.waitForFunction(() => typeof window.demo === 'object');

  // Caption strip mounted above the target.
  await p.addStyleTag({ content: `
    .__caption {
      font: 600 14px/1.4 system-ui, -apple-system, sans-serif;
      color: #1f2937; background: #f8fafc; padding: 10px 16px;
      border: 1px solid #cbd5e1; border-bottom: none; border-radius: 8px 8px 0 0;
      margin-bottom: -1px; max-width: ${selector === '.windows' ? '936px' : '920px'};
    }
  ` });
  await p.evaluate((sel) => {
    const el = document.querySelector(sel);
    const cap = document.createElement('div');
    cap.className = '__caption';
    cap.id = '__caption';
    el.parentElement.insertBefore(cap, el);
  }, selector);

  // Helper that selects "caption + target" together so the GIF includes both.
  const captureSelector = async () => {
    return await p.evaluate((sel) => {
      const t = document.querySelector(sel);
      const cap = document.getElementById('__caption');
      const rectT = t.getBoundingClientRect();
      const rectC = cap.getBoundingClientRect();
      return {
        x: Math.min(rectT.left, rectC.left),
        y: Math.min(rectT.top, rectC.top),
        width: Math.max(rectT.right, rectC.right) - Math.min(rectT.left, rectC.left),
        height: Math.max(rectT.bottom, rectC.bottom) - Math.min(rectT.top, rectC.top),
      };
    }, selector);
  };

  let frame = 0;
  const fps = 6;          // ffmpeg input rate
  const msPerFrame = 1000 / fps;
  for (const step of STORYBOARD) {
    await p.evaluate((cap) => {
      document.getElementById('__caption').textContent = cap;
    }, step.caption);
    if (step.call) await p.evaluate((fn) => window.demo[fn](), step.call);
    // How many frames to hold for: enough that the user can read the caption.
    const frames = Math.max(1, Math.round(step.hold / msPerFrame));
    for (let i = 0; i < frames; ++i) {
      const clip = await captureSelector();
      const path = `${frameDir}/${String(frame++).padStart(4, '0')}.png`;
      await p.screenshot({ path, clip });
      await p.waitForTimeout(msPerFrame);
    }
  }
  console.log(`captured ${frame} frames → ${frameDir}`);
  await browser.close();

  // Build palette then encode the GIF — produces noticeably cleaner colour
  // than the default palette in ffmpeg, especially for the live-badge.
  const palette = `${frameDir}/palette.png`;
  const r1 = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', `${frameDir}/%04d.png`,
    '-vf', 'palettegen=stats_mode=diff', palette,
  ], { stdio: 'inherit' });
  if (r1.status !== 0) throw new Error('ffmpeg palettegen failed');
  const r2 = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', `${frameDir}/%04d.png`, '-i', palette,
    '-lavfi', 'paletteuse=dither=bayer:bayer_scale=5',
    '-loop', '0', outPath,
  ], { stdio: 'inherit' });
  if (r2.status !== 0) throw new Error('ffmpeg paletteuse failed');
  console.log(`saved ${outPath}`);
} finally {
  vite.kill('SIGTERM');
  rmSync(frameDir, { recursive: true, force: true });
}
