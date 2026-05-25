// Port of calendar/packages/core/src/lib/a11y.js (vkurko/calendar v5.7.1).
// Keyboard / aria helpers.

// Wrap a click handler so it also fires on Enter and Space — pressing Space
// also prevents the default page-down scroll so the button "click" feels
// keyboard-native. Returns the handler's result on hit, undefined otherwise.
export function keyEnter(fn, _this = undefined) {
  return function (e) {
    if (e.key === 'Enter') return fn.call(_this, e);
    if (e.key === ' ') {
      e.preventDefault();
      return fn.call(_this, e);
    }
    return undefined;
  };
}
