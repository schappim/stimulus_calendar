import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const PORT = 5182;
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

  // LEFT swipe — finger moves from right to left (dx negative).
  await page.evaluate(async () => {
    const pager = document.querySelector('.ec-pager');
    const r = pager.getBoundingClientRect();
    const x0 = r.x + r.width * 0.6;  // start at right
    const y0 = r.y + r.height * 0.45;
    const dx = -r.width * 0.35;       // move left
    const fire = (type, x, y) => pager.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true,
      pointerId: 1, pointerType: 'touch', isPrimary: true,
      clientX: x, clientY: y, button: 0, buttons: 1,
    }));
    fire('pointerdown', x0, y0);
    for (let i = 1; i <= 10; ++i) {
      fire('pointermove', x0 + dx * (i / 10), y0);
      await new Promise(r => setTimeout(r, 16));
    }
  });
  await page.waitForTimeout(150);

  await page.screenshot({ path: 'docs/images/swipe-02-leftswipe.png' });

  const probes = await page.evaluate(() => {
    const yy = document.querySelector('.ec-pager').getBoundingClientRect().y + 300;
    return [10, 30, 50, 80, 100, 130, 160, 200, 300].map((x) => {
      const top = document.elementsFromPoint(x, yy)[0];
      return {
        x,
        topTag: top?.tagName?.toLowerCase(),
        topCls: top?.className?.toString().slice(0, 50) || '',
        topPage: top?.closest('.ec-pager-page')?.className?.toString().match(/ec-pager-page-(prev|current|next)/)?.[1] || '?',
      };
    });
  });
  console.log('LEFT swipe — top element at each x (mid swipe):');
  for (const p of probes) {
    console.log(`  x=${p.x.toString().padStart(3)}: <${p.topTag} class="${p.topCls}"> page=${p.topPage}`);
  }

  await page.evaluate(() => {
    document.querySelector('.ec-pager').dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch',
    }));
  });
  await page.waitForTimeout(500);
  await browser.close();
} finally {
  vite.kill('SIGTERM');
}
