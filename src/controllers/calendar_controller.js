import { Controller } from '@hotwired/stimulus';

import { createPluginState, normalisePlugins } from '../lib/plugins.js';
import {
  installEffects,
  switchViewEffect, datesSetEffect, viewDidMountEffect,
  eventAllUpdatedEffect, nowAndTodayEffect, timeZoneChangeEffect,
} from '../lib/effects.js';
import {
  currentRange, activeRange, viewDates, viewTitle,
  filteredEvents, offset, view as makeView, intlRange,
} from '../lib/derived.js';
import { createDate, addDuration, subtractDuration, cloneDate, setMidnight } from '../lib/date.js';
import { createDuration } from '../lib/duration.js';
import { isArray, isFunction, isPlainObject } from '../lib/utils.js';

// Stimulus calendar controller. One Stimulus controller per calendar; each
// owns its own MainState, plugin set, and DOM tree. The HTML attribute
// surface is the configuration:
//
//   <div data-controller="calendar"
//        data-calendar-view-value="timeGridWeek"
//        data-calendar-plugins-value='["TimeGrid", "Interaction"]'
//        data-calendar-options-value='{"events": [...]}'>
//   </div>
//
// data-calendar-options-value bundles the full options object as JSON;
// individual data-calendar-<option>-value attributes layer on top so
// users can mix-and-match. After connect(), `element.calendarApi` exposes
// the public method surface; a `calendar:ready` event fires with the same
// API on detail.
//
// Real per-view rendering lands in PLAN.md Phases 5-9. This commit ships
// the lifecycle (connect/disconnect, plugin wiring, state, effects, root
// DOM, public API surface) so subsequent option commits can layer in.
export default class CalendarController extends Controller {
  static values = {
    plugins: { type: Array, default: [] },
    options: { type: Object, default: {} },
    view: String,
  };

  connect() {
    this._teardowns = [];
    const userOptions = this._collectUserOptions();
    const plugins = this._loadPlugins(this.pluginsValue);

    const { state, setOption, setViewOptions } =
      createPluginState(plugins, userOptions);
    this._state = state;
    this._setOption = setOption;
    this._setViewOptions = setViewOptions;

    this._installDerivations();
    this._installEffectsPipeline();
    this._mountRootDOM();
    this._exposeApi();

    this.dispatch('ready', { detail: { api: this.element.calendarApi } });
  }

  disconnect() {
    for (const t of this._teardowns) t();
    this._teardowns = [];
    delete this.element.calendarApi;
    if (this._root) this._root.remove();
    this._state?.destroy();
  }

  // -- Internal wiring ------------------------------------------------------

  _collectUserOptions() {
    // Start with the bundle (data-calendar-options-value), then layer on
    // individual data-calendar-<opt>-value attributes that the per-option
    // Phase 3 commits will register via static values.
    const merged = { ...this.optionsValue };
    for (const [key, value] of Object.entries(this._individualValues())) {
      merged[key] = value;
    }
    return merged;
  }

  // Each option commit may register a `<name>Value` property via
  // `static values`. Subclasses (and this controller as it grows) add to
  // _OPTION_KEYS to surface them here. The set is intentionally explicit:
  // Stimulus's `has<Name>Value` is the truth.
  _individualValues() {
    const out = {};
    for (const key of CalendarController.OPTION_KEYS ?? []) {
      const hasFlag = `has${capitalise(key)}Value`;
      const accessor = `${key}Value`;
      if (this[hasFlag]) out[key] = this[accessor];
    }
    return out;
  }

  _loadPlugins(names) {
    // Names like ["DayGrid", "TimeGrid", ...] need resolving to plugin
    // factories. Until the per-view plugins are ported (Phases 5-9), we
    // pass through pre-resolved plugin objects only.
    if (!isArray(names)) return [];
    if (!names.length) return [];
    if (typeof names[0] === 'string') {
      // No plugins registered yet — silently drop and warn so HTML written
      // against the eventual surface doesn't blow up during the port.
      // eslint-disable-next-line no-console
      console.warn('[stimulus_calendar] plugin lookup by name is not yet implemented; ignoring', names);
      return [];
    }
    return normalisePlugins(names);
  }

  // Install the derived-state pipeline. _recompute() is exposed on `this`
  // so setOption can call it directly after mutating the live options.
  // (state.set('options', {...}) doesn't work for this — the options
  // identity inside options_store is mutated in place; replacing the
  // state ref would desync them.)
  _installDerivations() {
    const state = this._state;
    this._recompute = () => {
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
        {
          eventFilter: options.eventFilter,
          eventOrder: options.eventOrder,
          filterEventsWithResources: options.filterEventsWithResources,
          resources: state.get('resources') ?? options.resources ?? [],
        },
      ));
    };
    this._recompute();
  }

  _installEffectsPipeline() {
    // nowAndTodayEffect installs a setInterval that's only needed once the
    // TimeGrid / nowIndicator views actually consume `state.now`. It gets
    // wired in by those views (Phase 6+) rather than here, so the bare
    // controller stays fast and side-effect-free.
    const uninstall = installEffects(this._state, [
      switchViewEffect(this._setViewOptions),
      datesSetEffect(),
      viewDidMountEffect(),
      eventAllUpdatedEffect(),
      timeZoneChangeEffect((k, v) => this.setOption(k, v)),
    ]);
    this._teardowns.push(uninstall);
  }

  _mountRootDOM() {
    const options = this._state.get('options');
    const root = document.createElement('div');
    root.className = options.theme.calendar;
    root.dataset.calendarRoot = '';
    // Toolbar + view slots — empty until Phase 4/5+ ports the templates.
    const toolbar = document.createElement('div');
    toolbar.className = options.theme.toolbar;
    toolbar.dataset.calendarSlot = 'toolbar';
    const main = document.createElement('div');
    main.className = options.theme.main;
    main.dataset.calendarSlot = 'view';
    root.append(toolbar, main);
    if (options.height) root.style.height =
      typeof options.height === 'number' ? `${options.height}px` : options.height;
    this.element.replaceChildren(root);
    this._root = root;
    this.element.dataset.calendarMounted = 'true';
  }

  // -- Public API (`element.calendarApi`) ----------------------------------

  _exposeApi() {
    const api = {
      // Events (full impls land in Phase 10/12)
      addEvent: (event) => {
        const events = [...(this._state.get('events') ?? this._state.get('options').events ?? [])];
        events.push(event);
        this._state.set('events', events);
        this._recompute();
        return event;
      },
      updateEvent: (event) => {
        const events = (this._state.get('events') ?? this._state.get('options').events ?? [])
          .map((e) => (e.id === event.id ? { ...e, ...event } : e));
        this._state.set('events', events);
        this._recompute();
        return event;
      },
      removeEventById: (id) => {
        this._state.set('events',
          (this._state.get('events') ?? this._state.get('options').events ?? [])
            .filter((e) => e.id !== id),
        );
        this._recompute();
      },
      getEvents: () => this._state.get('filteredEvents') ?? [],
      getEventById: (id) => (this._state.get('filteredEvents') ?? []).find((e) => e.id === id),
      refetchEvents: async () => { /* fetch wiring lands in Phase 10 */ },

      // Resources (impl in Phase 8)
      refetchResources: async () => {},
      getResources: () => this._state.get('resources') ?? [],

      // Navigation
      next: () => this._navigate(+1),
      prev: () => this._navigate(-1),
      today: () => this.setOption('date', new Date()),
      gotoDate: (date) => this.setOption('date', date),
      getView: () => this._state.get('view'),

      // Options
      setOption: (key, value) => this.setOption(key, value),
      getOption: (key) => this._state.get('options')[key],

      // Selection (impl in Phase 11)
      unselect: () => {},

      // Pointer geometry (impl in Phase 11)
      dateFromPoint: () => null,
    };
    this.element.calendarApi = api;
  }

  _navigate(direction) {
    const options = this._state.get('options');
    const date = cloneDate(options.date);
    const inc = options.dateIncrement ?? options.duration;
    if (direction > 0) addDuration(date, inc);
    else subtractDuration(date, inc);
    this.setOption('date', date);
  }

  // Public setOption — used by the API and by attribute-watcher callbacks.
  // Normalises Date strings / duration shapes and re-runs the derivation
  // pipeline so subscribers see the new options effect immediately.
  setOption(key, value) {
    if (key === 'date' && typeof value === 'string') value = createDate(value);
    if (key === 'duration' && (typeof value === 'string' || typeof value === 'number' || isPlainObject(value))) {
      value = createDuration(value);
    }
    if (key === 'dateIncrement' && value !== undefined && !isFunction(value)) {
      value = createDuration(value);
    }
    this._setOption(key, value);
    this._recompute();
  }
}

// List of option keys that the controller treats as individual
// data-calendar-<key>-value attributes. Each Phase 3 option commit appends
// here and adds the matching `static values` entry.
CalendarController.OPTION_KEYS = ['view'];

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
