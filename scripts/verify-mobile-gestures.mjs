// Playwright verification of the mobile-demo behaviour:
//   - sidebar + day cols share ONE scroll container (the body), so Y
//     scroll is 1:1 native (no JS in the loop).
//   - clock-icon SVG carries width/height/fill/stroke as presentation
//     attributes (kills the drag-ghost giant black disc).
//   - a CDP-driven vertical touch swipe scrolls the timeline and does
//     NOT open the create sheet.
//   - "now" is centered vertically on first mount.
//
// Usage: node scripts/verify-mobile-gestures.mjs

import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const PORT = 5177;
const repoRoot = resolve(import.meta.dirname, '..');
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'],
});
const ready = new Promise((r) => {
  vite.stdout.on('data', (chunk) => { if (/ready in/i.test(chunk.toString())) r(); });
});
vite.stderr.on('data', (c) => process.stderr.write(c));

const results = [];
const check = (name, ok, details) => {
  results.push({ name, ok, details });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${details ? `  — ${details}` : ''}`);
};

try {
  await ready;
  console.log('vite ready, launching iPhone-emulated chromium');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/demo/18-mobile.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-calendar-mounted="true"]');
  await page.waitForTimeout(250);

  // ── 1. Architecture sanity: single scroll container.
  const layout = await page.evaluate(() => {
    const body = document.querySelector('[data-row="body"]');
    const sidebar = document.querySelector('[data-row="body"] > .ec-sidebar');
    const days = document.querySelector('[data-row="body"] > .ec-days');
    return {
      hasBody: !!body,
      hasSidebarDirectChild: !!sidebar,
      hasDaysDirectChild: !!days,
      bodyOverflowY: body ? getComputedStyle(body).overflowY : null,
      bodyDisplay: body ? getComputedStyle(body).display : null,
    };
  });
  check('body in DOM', layout.hasBody);
  check('sidebar is a direct child of body', layout.hasSidebarDirectChild);
  check('days is a direct child of body', layout.hasDaysDirectChild);
  check('body overflow-y=auto (it is the scroller)', layout.bodyOverflowY === 'auto');
  check('body display=grid', layout.bodyDisplay === 'grid');

  // ── 2. Clock-icon SVG: width + fill are self-contained.
  const svg = await page.evaluate(() => {
    const ic = document.querySelector('.ec-event .ec-clock-icon');
    if (!ic) return null;
    return {
      widthAttr: ic.getAttribute('width'),
      fillAttr: ic.getAttribute('fill'),
      computedWidth: ic.getBoundingClientRect().width,
    };
  });
  check('clock SVG has width="11"', svg?.widthAttr === '11');
  check('clock SVG has fill="none"', svg?.fillAttr === 'none');
  check('clock SVG renders ≤ 16px wide', svg && svg.computedWidth <= 16, svg ? `${svg.computedWidth}px` : 'no chip');

  // ── 3. "Now" is centered on first mount.
  const center = await page.evaluate(() => {
    const body = document.querySelector('[data-row="body"]');
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const pxPerMin = 56 / 30;  // demo's slotHeight / slotDuration
    const expectedY = nowMin * pxPerMin;
    const idealScrollTop = Math.max(0, expectedY - body.clientHeight / 2);
    return {
      scrollTop: body.scrollTop,
      idealScrollTop,
      diff: Math.abs(body.scrollTop - idealScrollTop),
    };
  });
  check('first-mount scrollTop ≈ centered on now',
    center.diff < 30,
    `actual=${Math.round(center.scrollTop)} ideal=${Math.round(center.idealScrollTop)} diff=${Math.round(center.diff)}`);

  // ── 4. CDP touch swipe scrolls the body 1:1 (no JS in the loop).
  const cdp = await ctx.newCDPSession(page);
  const bodyBox = await page.evaluate(() => {
    const b = document.querySelector('[data-row="body"]');
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width * 0.6, top: r.y + 20, bottom: r.y + r.height - 20 };
  });
  // Reset scrollTop so we measure the gesture, not the centering.
  await page.evaluate(() => {
    document.querySelector('[data-row="body"]').scrollTop = 0;
  });
  await page.waitForTimeout(80);

  const swipe = async (xs, ys, xe, ye, frames = 10) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: xs, y: ys }] });
    for (let i = 1; i <= frames; ++i) {
      const t = i / frames;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: xs + (xe - xs) * t, y: ys + (ye - ys) * t }],
      });
      await page.waitForTimeout(15);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  await swipe(bodyBox.x, bodyBox.bottom, bodyBox.x, bodyBox.top);
  await page.waitForTimeout(400);

  const afterTouchScroll = await page.evaluate(() => ({
    scrollTop: document.querySelector('[data-row="body"]').scrollTop,
    sheetOpen: document.querySelector('#sheet')?.classList.contains('open') ?? false,
  }));
  check('vertical touch swipe scrolls the body', afterTouchScroll.scrollTop > 0,
    `scrollTop=${afterTouchScroll.scrollTop}`);
  check('vertical touch swipe did NOT open the sheet', afterTouchScroll.sheetOpen === false);

  // ── 5. touch-action: pan-y on the document elements (blocks
  //      browser back-gesture).
  const touchAction = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).touchAction,
    body: getComputedStyle(document.body).touchAction,
    shell: getComputedStyle(document.querySelector('.shell')).touchAction,
  }));
  check('html has touch-action that blocks horizontal browser pan',
    touchAction.html === 'pan-y',
    `html touch-action=${touchAction.html}`);
  check('body has touch-action that blocks horizontal browser pan',
    touchAction.body === 'pan-y');
  check('shell has touch-action that blocks horizontal browser pan',
    touchAction.shell === 'pan-y');

  await browser.close();
} catch (err) {
  console.error('verification crashed:', err);
  results.push({ name: 'script', ok: false, details: err.message });
} finally {
  vite.kill('SIGTERM');
}

const failed = results.filter((r) => !r.ok);
console.log('');
console.log(`${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length === 0 ? 0 : 1);
