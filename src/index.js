import { Application } from '@hotwired/stimulus';
import './styles/calendar.css';
import CalendarController from './controllers/calendar_controller.js';
import { VERSION } from './lib/version.js';

export { CalendarController, VERSION };

/**
 * Register every stimulus_calendar controller against a Stimulus Application.
 * Pass an existing application instance to register into; omit to bootstrap
 * a fresh one (matching stimulus_grid's convention).
 */
export function start(app) {
  const application = app ?? Application.start();
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
