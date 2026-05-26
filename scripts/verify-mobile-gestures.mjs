// Playwright verification for the mobile-demo gesture fixes.
//
// Boots vite on a fresh port, runs an iPhone-emulated chromium against
// demo/18-mobile.html, and reports a pass/fail line per assertion.
//
// Usage: node scripts/verify-mobile-gestures.mjs

import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const PORT = 5177;
const repoRoot = resolve(import.meta.dirname, '..');
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});
const ready = new Promise((r) => {
  vite.stdout.on('data', (chunk) => {
    if (/ready in/i.test(chunk.toString())) r();
  });
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
  const ctx = await browser.newContext({
    ...devices['iPhone 13'],
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/demo/18-mobile.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-calendar-mounted="true"]');
  await page.waitForTimeout(250);

  // ── 1. Architecture sanity
  const layout = await page.evaluate(() => {
    const rail = document.querySelector('.ec-sidebar-rail');
    const railSidebar = document.querySelector('.ec-sidebar-rail > .ec-sidebar');
    const colsScroll = document.querySelector('.ec-cols-scroll');
    const body = document.querySelector('[data-row="body"]');
    return {
      hasRail: !!rail,
      hasRailSidebar: !!railSidebar,
      hasColsScroll: !!colsScroll,
      bodyOverflowY: body ? getComputedStyle(body).overflowY : null,
      railSidebarPosition: railSidebar ? getComputedStyle(railSidebar).position : null,
    };
  });
  check('sidebar-rail in DOM', layout.hasRail);
  check('rail-internal sidebar exists', layout.hasRailSidebar && layout.railSidebarPosition === 'absolute');
  check('cols-scroll is the scroller', layout.hasColsScroll);
  check('body overflow visible (not auto)', layout.bodyOverflowY === 'visible', `body overflow-y=${layout.bodyOverflowY}`);

  // ── 2. Cols-scroll dimensions + content height
  const dims = await page.evaluate(() => {
    const c = document.querySelector('.ec-cols-scroll');
    if (!c) return null;
    const cs = getComputedStyle(c);
    return {
      offsetHeight: c.offsetHeight,
      scrollHeight: c.scrollHeight,
      clientHeight: c.clientHeight,
      overflowY: cs.overflowY,
      webkitOverflowScrolling: cs.webkitOverflowScrolling,
      touchAction: cs.touchAction,
    };
  });
  check('cols-scroll has scrollable content',
    dims && dims.scrollHeight > dims.offsetHeight,
    dims ? `scrollHeight=${dims.scrollHeight} offsetHeight=${dims.offsetHeight}` : 'not found');
  check('cols-scroll overflow-y=auto', dims?.overflowY === 'auto');

  // ── 3. What's at the touch point in the middle of the cols-scroll?
  const hitChain = await page.evaluate(() => {
    const c = document.querySelector('.ec-cols-scroll');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const cx = r.x + r.width * 0.6;
    const cy = r.y + r.height * 0.5;
    const els = document.elementsFromPoint(cx, cy);
    return els.slice(0, 8).map((el) => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: el.className?.toString().slice(0, 80) || '',
        pointerEvents: cs.pointerEvents,
        touchAction: cs.touchAction,
        zIndex: cs.zIndex,
      };
    });
  });
  console.log('  elements at middle of cols-scroll (top → bottom of stack):');
  for (const el of hitChain ?? []) {
    console.log(`    <${el.tag} class="${el.cls}"> touch-action=${el.touchAction} pointer-events=${el.pointerEvents} z=${el.zIndex}`);
  }
  check('top hit element does NOT have touch-action: none',
    hitChain && hitChain[0]?.touchAction !== 'none',
    hitChain && hitChain[0] ? `top=${hitChain[0].cls} touch-action=${hitChain[0].touchAction}` : '');

  // ── 4. Native scroll: drive scrollTop and check sidebar Y syncs
  const scrollSync = await page.evaluate(async () => {
    const c = document.querySelector('.ec-cols-scroll');
    const s = document.querySelector('.ec-sidebar-rail > .ec-sidebar');
    if (!c || !s) return null;
    c.scrollTop = 200;
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    return {
      scrollTop: c.scrollTop,
      sidebarY: s.style.getPropertyValue('--ec-cols-scroll-y').trim(),
      transform: getComputedStyle(s).transform,
    };
  });
  check('cols-scroll accepts scrollTop',
    scrollSync && scrollSync.scrollTop > 0,
    scrollSync ? `scrollTop=${scrollSync.scrollTop}` : '');
  check('sidebar tracks scrollTop via --ec-cols-scroll-y',
    scrollSync && scrollSync.sidebarY === `${scrollSync.scrollTop}px`,
    scrollSync ? `var=${scrollSync.sidebarY}` : '');

  // ── 5. CDP-level touch swipe (mimics what iOS Safari does on a finger
  //      drag). Drives the browser's real touch dispatch pipeline so the
  //      native scroller engages exactly as it would on a real device.
  const cdp = await ctx.newCDPSession(page);
  const colBox = await page.evaluate(() => {
    const c = document.querySelector('.ec-cols-scroll');
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width * 0.6, top: r.y + 20, bottom: r.y + r.height - 20 };
  });
  // Reset scrollTop so we measure the gesture, not the prior assertion.
  await page.evaluate(() => {
    document.querySelector('.ec-cols-scroll').scrollTop = 0;
  });
  await page.waitForTimeout(80);

  const swipe = async (xs, ys, xe, ye, frames = 10) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: xs, y: ys }],
    });
    for (let i = 1; i <= frames; ++i) {
      const t = i / frames;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: xs + (xe - xs) * t, y: ys + (ye - ys) * t }],
      });
      await page.waitForTimeout(15);
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  };

  // Vertical swipe up = scroll the timeline down.
  await swipe(colBox.x, colBox.bottom, colBox.x, colBox.top);
  await page.waitForTimeout(400);

  const afterTouchScroll = await page.evaluate(() => ({
    scrollTop: document.querySelector('.ec-cols-scroll').scrollTop,
    sheetOpen: document.querySelector('#sheet')?.classList.contains('open') ?? false,
  }));
  check('vertical touch swipe scrolls the cols-scroll',
    afterTouchScroll.scrollTop > 0,
    `scrollTop=${afterTouchScroll.scrollTop}`);
  check('vertical touch swipe did NOT open the sheet',
    afterTouchScroll.sheetOpen === false);

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
