// Toolbar render — pure function over the calendar state + actions.
// Reads options.headerToolbar (`{ start, center, end }`) and turns each
// slot's space-separated token string into rendered elements.
//
// Each token is rendered via the TOKEN_RENDERERS table below; subsequent
// Phase 4 commits add new entries (next, today, view names, customButtons).
// Adjacent tokens joined by `,` are grouped into a single button-group.

import { createElement } from '../lib/dom.js';

export function renderToolbar(container, state, actions = {}) {
  const options = state.get('options');
  const theme = options.theme;
  const layout = options.headerToolbar ?? {};

  container.replaceChildren();
  for (const slot of ['start', 'center', 'end']) {
    const tokens = (layout[slot] ?? '').trim();
    const slotEl = createElement('div', '', '', [['data-toolbar-slot', slot]]);
    if (tokens) renderSlot(slotEl, tokens, state, actions, theme);
    container.append(slotEl);
  }
}

function renderSlot(slotEl, tokens, state, actions, theme) {
  // Tokens are space-separated; comma-separated runs are visually grouped.
  for (const groupSrc of tokens.split(/\s+/)) {
    const group = createElement('div', theme.buttonGroup);
    for (const token of groupSrc.split(',').filter(Boolean)) {
      const el = renderToken(token, state, actions, theme);
      if (el) group.append(el);
    }
    if (group.children.length === 1) {
      // No need for a wrapper around a single button — promote the child
      // directly onto the slot so styling matches upstream.
      slotEl.append(group.firstChild);
    } else if (group.children.length > 1) {
      slotEl.append(group);
    }
  }
}

function renderToken(token, state, actions, theme) {
  const renderer = TOKEN_RENDERERS[token];
  if (renderer) return renderer(state, actions, theme);
  // Unknown token → treat as a view-switcher button if a view by that name
  // is registered (Phase 5+ plugins populate options.views).
  const options = state.get('options');
  if (options.views && Object.hasOwn(options.views, token)) {
    return renderViewButton(token, state, actions, theme);
  }
  // Custom button (Phase 4 — customButtons commit).
  if (options.customButtons && Object.hasOwn(options.customButtons, token)) {
    return renderCustomButton(token, state, actions, theme);
  }
  return null;
}

function renderViewButton(name, state, actions, theme) {
  const options = state.get('options');
  const label = options.buttonText?.[name] ?? name;
  const btn = createElement('button', `${theme.button} ec-${kebab(name)}`, label, [
    ['type', 'button'],
    ['data-toolbar-action', 'view'],
    ['data-toolbar-view', name],
  ]);
  if (options.view === name) btn.classList.add(theme.active);
  btn.addEventListener('click', () => actions?.gotoView?.(name));
  return btn;
}

function renderCustomButton(name, state, actions, theme) {
  const def = state.get('options').customButtons?.[name] ?? {};
  const btn = createElement('button', `${theme.button} ec-custom`, def.text ?? name, [
    ['type', 'button'],
    ['data-toolbar-action', 'customButton'],
    ['data-toolbar-button', name],
  ]);
  btn.addEventListener('click', () => actions?.fireCustomButton?.(name));
  return btn;
}

function kebab(name) {
  return name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()).replace(/^-/, '');
}

// Token renderer registry. Each renderer returns a DOM node (or null to skip).
const TOKEN_RENDERERS = {
  title(state, _actions, theme) {
    return createElement('h2', theme.title, state.get('viewTitle') ?? '');
  },
  prev(_state, actions, theme) {
    const btn = createElement('button', `${theme.button} ec-prev`, '', [
      ['type', 'button'],
      ['aria-label', 'Previous'],
      ['data-toolbar-action', 'prev'],
    ]);
    btn.innerHTML = '<i class="ec-icon ec-prev"></i>';
    btn.addEventListener('click', () => actions?.prev?.());
    return btn;
  },
  next(_state, actions, theme) {
    const btn = createElement('button', `${theme.button} ec-next`, '', [
      ['type', 'button'],
      ['aria-label', 'Next'],
      ['data-toolbar-action', 'next'],
    ]);
    btn.innerHTML = '<i class="ec-icon ec-next"></i>';
    btn.addEventListener('click', () => actions?.next?.());
    return btn;
  },
  today(state, actions, theme) {
    const options = state.get('options');
    const label = options.buttonText?.today ?? 'today';
    const btn = createElement('button', `${theme.button} ec-today`, label, [
      ['type', 'button'],
      ['data-toolbar-action', 'today'],
    ]);
    btn.addEventListener('click', () => actions?.today?.());
    return btn;
  },
};

// Exposed for testing — lets tests assert which tokens are registered without
// reaching into module internals. New tokens added in subsequent Phase 4
// commits show up here.
export function registeredTokens() {
  return Object.keys(TOKEN_RENDERERS);
}
