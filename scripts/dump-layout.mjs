import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const PORT = 5181;
const repoRoot = resolve(import.meta.dirname, '..');
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((r) => {
  vite.stdout.on('data', (chunk) => { if (/ready in/i.test(chunk.toString())) r(); });
});

try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/demo/18-mobile.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-calendar-mounted="true"]');
  await page.waitForTimeout(300);

  const dump = await page.evaluate(() => {
    const rect = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      pager: rect('.ec-pager'),
      pageCurrent: rect('.ec-pager-page-current'),
      timeGrid: rect('.ec-time-grid'),
      body: rect('[data-row="body"]'),
      sidebarRail: rect('.ec-sidebar-rail'),
      sidebar: rect('.ec-pager-page-current .ec-sidebar-rail > .ec-sidebar'),
      colsScroll: rect('.ec-cols-scroll'),
      cols: rect('.ec-cols-scroll .ec-days'),
      timeCol: rect('.ec-cols-scroll .ec-time-col'),
      firstChip: rect('.ec-cols-scroll .ec-event'),
      sidebarWidthVar: getComputedStyle(document.querySelector('.ec')).getPropertyValue('--ec-sidebar-width').trim(),
    };
  });
  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
} finally {
  vite.kill('SIGTERM');
}
