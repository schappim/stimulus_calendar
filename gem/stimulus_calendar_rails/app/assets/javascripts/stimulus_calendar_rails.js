// Rails-side glue: auto-starts the calendar controller against the host
// app's Stimulus Application once both have loaded.
//
// Loaded by `<%= javascript_importmap_tags %>` via config/importmap.rb.
// Host apps can opt out by setting `window.__stimulusCalendarAutoStart =
// false` before this file loads, and call `StimulusCalendar.start(app)`
// manually instead.

(function () {
  if (typeof window === 'undefined') return;

  const tryAutoStart = () => {
    if (window.__stimulusCalendarAutoStart === false) return;
    const sc  = window.StimulusCalendar;
    const app = window.Stimulus || window.application;
    if (sc && app && typeof sc.start === 'function') sc.start(app);
  };

  if (window.StimulusCalendar && (window.Stimulus || window.application)) {
    tryAutoStart();
  } else {
    document.addEventListener('turbo:load', tryAutoStart);
    document.addEventListener('DOMContentLoaded', tryAutoStart);
  }
})();
