// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import StimulusCalendar, { start, create, destroy } from '../src/index.js';

describe('StimulusCalendar.create / destroy (IIFE convenience)', () => {
  it('create + destroy round-trips', async () => {
    const el = document.createElement('div');
    document.body.append(el);
    create(el, { view: 'dayGridMonth' });
    await new Promise((r) => queueMicrotask(r));
    await new Promise((r) => queueMicrotask(r));
    expect(el.calendarApi).toBeDefined();
    destroy(el);
    expect(el.calendarApi).toBeUndefined();
  });

  it('default export exposes create + destroy', () => {
    expect(typeof StimulusCalendar.create).toBe('function');
    expect(typeof StimulusCalendar.destroy).toBe('function');
    expect(StimulusCalendar.start).toBe(start);
  });
});
