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

const StimulusCalendar = {
  start,
  CalendarController,
  VERSION,
};

export default StimulusCalendar;

if (typeof window !== 'undefined' && !window.__stimulusCalendarStarted) {
  window.__stimulusCalendarStarted = true;
  window.StimulusCalendar = StimulusCalendar;
}
