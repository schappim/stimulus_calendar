// Port of calendar/packages/core/src/lib/dom.js (vkurko/calendar v5.7.1).
// Browser-only helpers — anything in here touches `document` or DOM nodes.
//
// Also hosts `isRtl`, which was upstream in utils.js but reads `window` /
// `document` so it belongs with the browser helpers (PLAN.md routed it here).

import { hasPayload } from './payload.js';

// Create an element with class, content (string text | {domNodes} | {html}),
// and an optional array of [name, value] attributes.
export function createElement(tag, className, content, attrs = []) {
  const el = document.createElement(tag);
  el.className = className;
  if (typeof content === 'string') {
    el.innerText = content;
  } else if (content?.domNodes) {
    el.replaceChildren(...content.domNodes);
  } else if (content?.html) {
    el.innerHTML = content.html;
  }
  for (const attr of attrs) {
    el.setAttribute(...attr);
  }
  return el;
}

// Bounding rect (pass-through; named so call sites read better).
export function rect(el) {
  return el.getBoundingClientRect();
}

// Walk `up` parent nodes (1-based).
export function ancestor(el, up) {
  while (up--) {
    el = el.parentElement;
  }
  return el;
}

export function height(el) {
  return rect(el).height;
}

// Find the topmost element at (x, y) that has a payload attached, walking
// shadow roots too. Mirrors upstream behaviour fixing
// https://github.com/vkurko/calendar/issues/142.
export function getElementWithPayload(x, y, root = document, processed = []) {
  processed.push(root);
  for (const el of root.elementsFromPoint(x, y)) {
    if (hasPayload(el)) return el;
    if (el.shadowRoot && !processed.includes(el.shadowRoot)) {
      const shadowEl = getElementWithPayload(x, y, el.shadowRoot, processed);
      if (shadowEl) return shadowEl;
    }
  }
  return null;
}

// PLAN.md alias — call sites that don't need the payload-walk just want the
// topmost element under the cursor. Returns the first hit from
// `document.elementsFromPoint`, or null.
export function elementFromPoint(x, y) {
  const [el] = document.elementsFromPoint(x, y);
  return el ?? null;
}

// Add a listener, return a thunk that removes it.
export function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}

// Wrap a handler so it stopPropagations before delegating.
export function stopPropagation(fn, _this = undefined) {
  return function (jsEvent) {
    jsEvent.stopPropagation();
    if (fn) fn.call(_this, jsEvent);
  };
}

// Was upstream in utils.js; lives here because it reads `window`/`document`.
export function isRtl() {
  return window.getComputedStyle(document.documentElement).direction === 'rtl';
}
