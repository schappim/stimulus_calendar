import { Application } from '@hotwired/stimulus';
import './styles/calendar.css';
import CalendarController from './controllers/calendar_controller.js';
import { VERSION } from './lib/version.js';

export { CalendarController, VERSION };

// Idempotency guard for start(). Two paths typically call start():
// (1) host application.js explicitly via `StimulusCalendar.start(app)`,
// (2) the Rails companion's stimulus_calendar_rails.js auto-starter
//     fires on both turbo:load and DOMContentLoaded.
// Without this WeakSet, the calendar controller gets registered against
// the same Stimulus Application twice (or three times), Stimulus mounts
// two controller instances per element, and every state operation
// (event load, broadcast apply, drag commit) fires twice — most visibly
// as duplicate event chips with the same id but divergent timestamps
// (one parse path runs before refetch lands, the other after).
const _registered = new WeakSet();

/**
 * Register every stimulus_calendar controller against a Stimulus Application.
 * Pass an existing application instance to register into; omit to bootstrap
 * a fresh one (matching stimulus_grid's convention). Safe to call multiple
 * times against the same Application — subsequent calls are no-ops.
 */
export function start(app) {
  const application = app ?? Application.start();
  if (_registered.has(application)) return application;
  _registered.add(application);
  application.register('calendar', CalendarController);
  return application;
}

// Imperative boot — for callers that don't want to register the controller
// against a global Application (e.g. mounting one calendar inside a Web
// Component, or scripted demos). Builds a temporary Stimulus Application
// scoped to the element, registers the controller, and returns the same
// element.calendarApi the Stimulus path exposes.
const SCOPED_APPS = new WeakMap();
export function create(element, options = {}) {
  if (!element || element.nodeType !== 1) {
    throw new TypeError('StimulusCalendar.create: first arg must be a DOM element');
  }
  // Stash options as data-attribute JSON so the controller picks them up.
  element.dataset.calendarOptionsValue = JSON.stringify(options);
  element.setAttribute('data-controller',
    [(element.getAttribute('data-controller') || '').trim(), 'calendar']
      .filter(Boolean).join(' '));
  const app = Application.start();
  app.register('calendar', CalendarController);
  SCOPED_APPS.set(element, app);
  return element;
}

export function destroy(element) {
  const app = SCOPED_APPS.get(element);
  if (app) app.stop();
  element.removeAttribute('data-controller');
  delete element.dataset.calendarOptionsValue;
  delete element.calendarApi;
  SCOPED_APPS.delete(element);
}

const StimulusCalendar = {
  start,
  create,
  destroy,
  CalendarController,
  VERSION,
};

export default StimulusCalendar;

if (typeof window !== 'undefined' && !window.__stimulusCalendarStarted) {
  window.__stimulusCalendarStarted = true;
  window.StimulusCalendar = StimulusCalendar;
}
