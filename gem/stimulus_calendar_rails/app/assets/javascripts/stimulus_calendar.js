// Loader for the gem-shipped calendar bundle. The real bundle is built
// from src/ via `npm run build:lib` and copied here by `bin/sync-rails-assets`
// (also runs from the gem's gemspec build step).
//
// Imported in app/views/stimulus_calendar_rails/calendars/_calendar.html.erb
// via the importmap pin in config/importmap.rb. Safe to import from any
// host-app Stimulus build because the loader idempotently injects the
// bundle script tag once.

(function () {
  if (typeof window === 'undefined') return;
  if (window.StimulusCalendar) return; // bundle already loaded

  const script = document.currentScript;
  const base   = script ? script.src.replace(/[^/]+$/, '') : '';
  const url    = base + 'stimulus_calendar.bundle.js';

  const tag = document.createElement('script');
  tag.src = url;
  tag.async = false;
  tag.onerror = () => console.warn(
    '[stimulus_calendar] bundle missing at ' + url +
    ' — run `npm run build:lib && bin/sync-rails-assets` from the repo root.'
  );
  document.head.appendChild(tag);
})();
