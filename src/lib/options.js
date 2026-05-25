// Port of calendar/packages/core/src/lib/options.js (vkurko/calendar v5.7.1),
// plus the `undefinedOr` helper hoisted here from utils.js per PLAN.md
// (it's an option-parser helper, not a general type guard).

// Wraps a per-input transform so `undefined` short-circuits through
// untouched. Used inside the parsers registry so an option without a value
// stays undefined rather than being passed to a parser that would crash on it.
//
//   parsers.dateIncrement = undefinedOr(createDuration);
//   parsers.dateIncrement(undefined);          // → undefined (no call)
//   parsers.dateIncrement({ weeks: 1 });       // → { years:0, ..., inWeeks:true }
export function undefinedOr(fn) {
  return (input) => (input === undefined ? undefined : fn(input));
}

// View-button text factories — each takes the user's per-view `buttonText`
// merge result and extends it with sensible "Next day" / "Previous day"
// aria-style labels. Returned shape: { ...text, next: 'Next <period>', prev: 'Previous <period>' }
export function btnTextDay(text)   { return _btnText(text, 'day'); }
export function btnTextWeek(text)  { return _btnText(text, 'week'); }
export function btnTextMonth(text) { return _btnText(text, 'month'); }
export function btnTextYear(text)  { return _btnText(text, 'year'); }

function _btnText(text, period) {
  return {
    ...text,
    next: 'Next ' + period,
    prev: 'Previous ' + period,
  };
}

// View-specific `theme` factory — merges the previous theme with the named
// CSS view class. Used inside per-view `views: { dayGridMonth: { theme: themeView('ec-day-grid ec-month-view') }}`.
export function themeView(view) {
  return (theme) => ({ ...theme, view });
}
