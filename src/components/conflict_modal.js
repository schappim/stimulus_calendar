// Default conflict-resolution modal (S13).
//
// Rendered when `op="conflict"` arrives over the broadcast bus and
// the host hasn't provided a `conflictRenderer`. Shows both the
// server's value and the client's pending value side by side and
// fires `calendar:conflictResolved` with the user's choice.
//
// The library applies the resolution to local state — the host's job
// is to (a) emit any server-side write the resolution implies (e.g.
// "Keep mine" → PATCH the server with the client value), and (b)
// optionally dismiss any pending optimistic UI keyed off the
// original change. Hosts can intercept the
// `calendar:conflictResolved` DOM event for both signals.
//
// All elements carry `ec-conflict-*` class names so hosts can theme
// the appearance with their own CSS without overriding the
// component itself.

import { createElement } from '../lib/dom.js';

// Render the modal into `hostEl` and return a controller object with
// a single `close()` method. The caller is responsible for managing
// the lifetime — but the modal closes itself on any user action
// (accept / reject / backdrop click / Escape key) and resolves the
// returned Promise with the user's choice.
//
//   const { promise, close } = renderConflictModal({
//     hostEl: this.element,
//     eventId, serverValue, clientValue,
//     locale: options.locale,
//     onResolve: ({ resolution, eventId, serverValue, clientValue }) => { … },
//   });
//
// Resolutions: 'theirs' (apply server value) | 'mine' (apply client
// value) | 'dismissed' (backdrop click / Escape — same effect as
// 'theirs' for safety).
export function renderConflictModal({
  hostEl,
  eventId,
  serverValue,
  clientValue,
  locale,
  buttonText,
  onResolve,
}) {
  const backdrop = createElement('div', 'ec-conflict-backdrop', '', [
    ['role', 'presentation'],
  ]);
  const modal = createElement('div', 'ec-conflict-modal', '', [
    ['role', 'dialog'],
    ['aria-modal', 'true'],
    ['aria-labelledby', 'ec-conflict-title'],
  ]);

  const title = createElement('h2', 'ec-conflict-title',
    (buttonText?.conflictTitle ?? 'Edit conflict'),
    [['id', 'ec-conflict-title']]);
  const description = createElement('p', 'ec-conflict-message',
    (buttonText?.conflictMessage ??
     'This event was changed by someone else while you were editing it. Pick which version to keep.'));

  const values = createElement('div', 'ec-conflict-values');
  values.append(
    renderSide('theirs', buttonText?.conflictTheirs ?? 'Theirs (server)', serverValue),
    renderSide('mine',   buttonText?.conflictMine ?? 'Yours',             clientValue),
  );

  const actions = createElement('div', 'ec-conflict-actions');
  const btnTheirs = createElement('button', 'ec-conflict-action ec-conflict-action-theirs',
    (buttonText?.conflictUseTheirs ?? 'Use theirs'),
    [['type', 'button']]);
  const btnMine = createElement('button', 'ec-conflict-action ec-conflict-action-mine',
    (buttonText?.conflictKeepMine ?? 'Keep mine'),
    [['type', 'button']]);
  actions.append(btnTheirs, btnMine);

  modal.append(title, description, values, actions);
  backdrop.append(modal);
  hostEl.append(backdrop);

  let resolved = false;
  function resolve(resolution) {
    if (resolved) return;
    resolved = true;
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
    onResolve?.({ resolution, eventId, serverValue, clientValue });
  }

  btnTheirs.addEventListener('click', () => resolve('theirs'));
  btnMine.addEventListener('click',   () => resolve('mine'));
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) resolve('dismissed');
  });
  const onKey = (e) => { if (e.key === 'Escape') resolve('dismissed'); };
  document.addEventListener('keydown', onKey);

  // Move focus into the modal so keyboard users land on a button.
  queueMicrotask(() => btnTheirs.focus?.());

  return { close: () => resolve('dismissed'), root: backdrop };
}

function renderSide(kind, label, value) {
  const side = createElement('div', `ec-conflict-value ec-conflict-value-${kind}`);
  side.append(createElement('h3', 'ec-conflict-value-label', label));
  const pre = createElement('pre', 'ec-conflict-value-body');
  pre.textContent = stringify(value);
  side.append(pre);
  return side;
}

// Pretty-print the value as JSON, falling back to String() for things
// that don't survive structured cloning. Dates round-trip through
// toISOString so the diff is readable.
function stringify(value) {
  if (value == null) return '(none)';
  try {
    return JSON.stringify(value, replacer, 2);
  } catch {
    return String(value);
  }
}

function replacer(_key, val) {
  if (val instanceof Date) return val.toISOString();
  return val;
}
