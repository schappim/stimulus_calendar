// Toolbar render — pure function over the calendar state. Subsequent Phase 4
// commits layer in prev/next/today/view-switcher/customButtons/disabled state.

import { createElement } from '../lib/dom.js';

// Render the toolbar root from the current state.
//   container — the .ec toolbar slot DOM element to render into.
//   state     — MainState
//   actions   — { prev, next, today, gotoView, fireCustomButton }
// Returns nothing; the container's children are replaced.
export function renderToolbar(container, state) {
  const options = state.get('options');
  const theme = options.theme;
  const title = state.get('viewTitle') ?? '';

  // Title slot — single <h2> with the formatted view title.
  const titleEl = createElement('h2', theme.title, title);
  container.replaceChildren(titleEl);
}
