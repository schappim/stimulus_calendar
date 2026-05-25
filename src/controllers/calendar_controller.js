import { Controller } from '@hotwired/stimulus';

/**
 * Calendar controller — root of the calendar instance.
 *
 * This is the scaffold-stage skeleton: it acknowledges the mount and exposes
 * its options/plugins surface for inspection by tests. Real rendering arrives
 * in subsequent commits as PLAN.md is worked through.
 */
export default class CalendarController extends Controller {
  static values = {
    view: String,
    plugins: { type: Array, default: [] },
    options: { type: Object, default: {} },
  };

  connect() {
    this.element.dataset.calendarMounted = 'true';
  }

  disconnect() {
    delete this.element.dataset.calendarMounted;
  }
}
