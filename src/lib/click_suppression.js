// Suppression of the synthesised post-gesture `click` event on event
// chips.
//
// After a drag/resize gesture ends — whether it committed or aborted —
// the browser synthesises a `click` event on the original target as
// part of the standard pointer event sequence. Without intervention,
// that click runs the chip's own click handler, which fires
// `eventClick`. Host apps that wire single-tap → open-popover (a
// common mobile pattern) then see a popover after every drag/resize
// commit, which is uniformly wrong.
//
// The fix is a small flag on state. The Interaction plugin arms it
// at each gesture's *Stop fire site (covering both commit and abort
// paths) and the calendar controller installs a capture-phase `click`
// listener on the calendar root that consumes the flag, stops the
// click before any chip handler runs, and clears the flag so the
// next real tap behaves normally.
//
// A 400 ms safety timer clears the flag in case the synthesised click
// never arrives (e.g. iOS / Android cancelled the gesture pre-up, or
// the user moved the chip and the click landed elsewhere). 400 ms is
// generous — well past any browser's pointerup→click latency, and
// short enough that two intentional taps in quick succession don't
// both get swallowed.

const FLAG = '_suppressNextChipClick';
const TIMER = '_suppressNextChipClickTimer';

export function armChipClickSuppression(state, ms = 400) {
  if (!state) return;
  state.set(FLAG, true);
  const prev = state.get(TIMER);
  if (prev) clearTimeout(prev);
  state.set(TIMER, setTimeout(() => {
    state.set(FLAG, false);
    state.set(TIMER, null);
  }, ms));
}

// Read-and-clear. Returns true if the flag was armed, false otherwise.
// Calling this clears the flag so a subsequent intentional click
// passes through normally.
export function consumeChipClickSuppression(state) {
  if (!state) return false;
  const armed = state.get(FLAG) === true;
  if (armed) {
    const t = state.get(TIMER);
    if (t) clearTimeout(t);
    state.set(FLAG, false);
    state.set(TIMER, null);
  }
  return armed;
}
