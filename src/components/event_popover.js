// Floating popover for a single event. Opened by the controller on
// `eventDoubleClick` (unless suppressed via options.eventDoubleClick
// calling detail.preventDefault()), and via the public API
// `calendarApi.openEventPopover(eventId, anchorEl)`.
//
// Visual design follows macOS Calendar.app — a stack of small white
// cards (title, when, invitees, notes, other props) inside a soft
// translucent grey container. Edit / Delete buttons in a subtle
// footer fire `eventPopover:edit` / `eventPopover:delete` so host
// apps can wire their own modal flow.

import { createElement } from '../lib/dom.js';

let openedFor = null;
let popoverEl = null;
let onOutsideClick = null;
let onEscape = null;

const FMT_TIME = { hour: 'numeric', minute: '2-digit' };
const FMT_DATE = { day: 'numeric', month: 'short', year: 'numeric' };

export function openEventPopover({ event, anchorEl, state }) {
  closeEventPopover();
  if (!event || !anchorEl) return null;

  const options = state.get('options');
  const locale  = options?.locale;
  const fire    = state.get('fire');

  popoverEl = createElement('div', 'ec-event-popover', '', [
    ['role', 'dialog'],
    ['aria-modal', 'false'],
    ['data-popover', 'event'],
    ['data-event-id', event.id],
  ]);

  // --- Title card --------------------------------------------------------
  // Big title + colour swatch on the right + a subtle close button in
  // the corner. Location (if present) rides as a sub-row under the title.
  const titleCard = createElement('div', 'ec-event-popover-card ec-event-popover-card-title');
  const titleRow  = createElement('div', 'ec-event-popover-title-row');
  titleRow.append(createElement('div', 'ec-event-popover-title', event.title || '(untitled)'));
  const swatch = createElement('span', 'ec-event-popover-swatch');
  const bg = event.backgroundColor || options?.eventBackgroundColor || options?.eventColor;
  if (bg) swatch.style.background = bg;
  titleRow.append(swatch);
  titleCard.append(titleRow);

  const location = event.extendedProps?.location;
  if (location) {
    titleCard.append(createElement('div', 'ec-event-popover-location', String(location)));
  }

  const close = createElement('button', 'ec-event-popover-close', '×', [
    ['type', 'button'],
    ['aria-label', 'Close'],
  ]);
  close.addEventListener('click', closeEventPopover);
  titleCard.append(close);
  popoverEl.append(titleCard);

  // --- When card ---------------------------------------------------------
  const whenCard = createElement('div', 'ec-event-popover-card');
  whenCard.append(createElement('div', 'ec-event-popover-when', formatWhen(event, locale)));
  if (event.extendedProps?.category) {
    whenCard.append(createElement('div', 'ec-event-popover-when-meta',
                                  `Category: ${event.extendedProps.category}`));
  }
  popoverEl.append(whenCard);

  // --- Attendees card (only if present) ---------------------------------
  const attendees = event.extendedProps?.attendees;
  if (attendees) {
    const card = createElement('div', 'ec-event-popover-card');
    card.append(createElement('div', 'ec-event-popover-card-label', 'Invitees'));
    card.append(createElement('div', 'ec-event-popover-card-value', String(attendees)));
    popoverEl.append(card);
  }

  // --- Notes (description) card (only if present) -----------------------
  const desc = event.extendedProps?.description;
  if (desc) {
    const card = createElement('div', 'ec-event-popover-card');
    card.append(createElement('div', 'ec-event-popover-card-label', 'Notes'));
    card.append(createElement('p', 'ec-event-popover-desc', String(desc)));
    popoverEl.append(card);
  }

  // --- Remaining extendedProps card -------------------------------------
  // Everything not already shown above, rendered as a small definition list.
  const extras = Object.entries(event.extendedProps ?? {})
    .filter(([k]) => !['description', 'category', 'location', 'attendees'].includes(k))
    .filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (extras.length) {
    const card = createElement('div', 'ec-event-popover-card');
    const dl = createElement('dl', 'ec-event-popover-props');
    for (const [k, v] of extras) {
      dl.append(createElement('dt', '', humanise(k)));
      dl.append(createElement('dd', '', String(v)));
    }
    card.append(dl);
    popoverEl.append(card);
  }

  // --- Footer with Edit / Delete -----------------------------------------
  const footer = createElement('div', 'ec-event-popover-footer');
  const editBtn = createElement('button', 'ec-event-popover-action', 'Edit', [
    ['type', 'button'], ['data-popover-action', 'edit'],
  ]);
  const delBtn  = createElement('button', 'ec-event-popover-action ec-event-popover-danger', 'Delete', [
    ['type', 'button'], ['data-popover-action', 'delete'],
  ]);
  editBtn.addEventListener('click', () => {
    fire?.('eventPopoverEdit', { event });
    closeEventPopover();
  });
  delBtn.addEventListener('click', () => {
    fire?.('eventPopoverDelete', { event });
    closeEventPopover();
  });
  footer.append(editBtn, delBtn);
  popoverEl.append(footer);

  document.body.appendChild(popoverEl);
  positionAtAnchor(popoverEl, anchorEl);

  // Outside-click + Escape to close. Bound to next tick so the opening
  // double-click doesn't itself close the popover.
  setTimeout(() => {
    onOutsideClick = (e) => {
      if (!popoverEl) return;
      if (!popoverEl.contains(e.target) && !anchorEl.contains(e.target)) {
        closeEventPopover();
      }
    };
    onEscape = (e) => { if (e.key === 'Escape') closeEventPopover(); };
    document.addEventListener('mousedown', onOutsideClick, true);
    document.addEventListener('keydown', onEscape, true);
  }, 0);

  openedFor = event.id;
  fire?.('eventPopoverOpen', { event, el: popoverEl });
  return popoverEl;
}

export function closeEventPopover() {
  if (!popoverEl) return;
  popoverEl.remove();
  popoverEl = null;
  openedFor = null;
  if (onOutsideClick) {
    document.removeEventListener('mousedown', onOutsideClick, true);
    onOutsideClick = null;
  }
  if (onEscape) {
    document.removeEventListener('keydown', onEscape, true);
    onEscape = null;
  }
}

export function isEventPopoverOpen() { return popoverEl !== null; }
export function openEventPopoverId()  { return openedFor; }

// ----- positioning ---------------------------------------------------------

function positionAtAnchor(el, anchor) {
  const rect = anchor.getBoundingClientRect();
  const popRect = el.getBoundingClientRect();
  const margin = 8;
  let left = rect.right + margin;
  let top  = rect.top;
  let side = 'right';
  // Flip to the other side if overflowing the viewport.
  if (left + popRect.width + margin > window.innerWidth) {
    left = Math.max(margin, rect.left - popRect.width - margin);
    side = 'left';
  }
  if (top + popRect.height + margin > window.innerHeight) {
    top = Math.max(margin, window.innerHeight - popRect.height - margin);
  }
  el.style.position = 'fixed';
  el.style.left = `${Math.max(margin, left)}px`;
  el.style.top  = `${Math.max(margin, top)}px`;
  el.setAttribute('data-popover-side', side);
}

// ----- formatting ----------------------------------------------------------

function formatWhen(event, locale) {
  const dateFmt = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...FMT_DATE });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...FMT_TIME });
  if (event.allDay) {
    const start = dateFmt.format(event.start);
    if (!event.end) return start;
    const endLess1 = new Date(event.end.getTime() - 1);
    const end = dateFmt.format(endLess1);
    return start === end ? `${start} · all day` : `${start} — ${end}`;
  }
  const startDate = dateFmt.format(event.start);
  const startTime = timeFmt.format(event.start);
  const endDate   = dateFmt.format(event.end);
  const endTime   = timeFmt.format(event.end);
  if (startDate === endDate) {
    return `${startDate}  ${startTime} – ${endTime}`;
  }
  return `${startDate} ${startTime} → ${endDate} ${endTime}`;
}

function humanise(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
