// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createPluginState } from '../../src/lib/plugins.js';
import { installEffects, datesSetEffect, viewDidMountEffect,
         eventAllUpdatedEffect, switchViewEffect, timeZoneChangeEffect }
  from '../../src/lib/effects.js';
import { currentRange, activeRange, viewDates, viewTitle,
         filteredEvents, offset, view as makeView, intlRange } from '../../src/lib/derived.js';

describe('debug', () => {
  it('full pipeline runs', () => {
    const { state, setOption, setViewOptions } = createPluginState([], { view: 'dayGridMonth' });
    state.set('extensions', {});
    const recompute = () => {
      const options = state.get('options');
      const cr = currentRange(options.date, options.duration, options.firstDay);
      state.set('currentRange', cr);
      const ar = activeRange(cr, state.get('extensions')?.activeRange);
      state.set('activeRange', ar);
      state.set('viewDates', viewDates(ar, options.hiddenDays ?? []));
      state.set('offset', offset(options.timeZone ?? 'local'));
      const intlTitle = intlRange(options.locale, options.titleFormat);
      state.set('intlTitle', intlTitle);
      state.set('viewTitle', viewTitle(intlTitle, cr));
      state.set('view', makeView(options.view, state.get('viewTitle'), cr, ar));
      state.set('filteredEvents', filteredEvents(
        state.get('events') ?? options.events ?? [],
        state.get('view'),
        { eventFilter: options.eventFilter, eventOrder: options.eventOrder,
          filterEventsWithResources: options.filterEventsWithResources,
          resources: state.get('resources') ?? options.resources ?? [] },
      ));
    };
    recompute();
    const offAny = state.onAny(({ key }) => {
      if (key === 'options' || key === 'events' || key === 'resources') recompute();
    });
    const uninstall = installEffects(state, [
      switchViewEffect(setViewOptions),
      datesSetEffect(),
      viewDidMountEffect(),
      eventAllUpdatedEffect(),
      timeZoneChangeEffect(setOption),
    ]);
    state.set('options', { ...state.get('options'), firstDay: 1 });
    offAny();
    uninstall();
    expect(state.get('viewDates').length).toBeGreaterThan(0);
  });
});
