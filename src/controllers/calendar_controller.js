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
import { createDate, addDuration, subtractDuration, cloneDate, setMidnight, toISOString } from '../lib/date.js';
import { createEvents } from '../lib/events.js';
import { createDuration } from '../lib/duration.js';
import { isArray, isFunction, isPlainObject } from '../lib/utils.js';
import { renderToolbar } from '../components/toolbar.js';
import { resolvePluginNames } from '../plugins/index.js';
import { BroadcastBus, resolveAdapter } from '../lib/broadcast/index.js';

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
    date: String,
    duration: Object,
    dateIncrement: Object,
    firstDay: Number,
    hiddenDays: Array,
    validRange: Object,
    height: String,
    theme: Object,
    locale: String,
    timeZone: String,
    customScrollbars: Boolean,
    views: Object,
    lazyFetching: Boolean,
    highlightedDates: Array,
    titleFormat: Object,
    dayHeaderFormat: Object,
    dayHeaderAriaLabelFormat: Object,
    icons: Object,
    buttonText: Object,
    customButtons: Object,
    headerToolbar: Object,
    // DayGrid plugin options surfaced as Stimulus values so they're
    // settable via data-calendar-<name>-value attributes too.
    dayMaxEvents: Number,
    dayCellFormat: Object,
    dayPopoverFormat: Object,
    moreLinkContent: String,
    weekNumbers: Boolean,
    weekNumberContent: String,
    // Resource + ResourceTimeGrid plugin options
    resources: Array,
    refetchResourcesOnNavigate: Boolean,
    datesAboveResources: Boolean,
    filterResourcesWithEvents: Boolean,
    filterEventsWithResources: Boolean,
    // ResourceTimeline plugin options
    monthHeaderFormat: Object,
    slotWidth: Number,
    resourceExpand: String,
    // Broadcast / live-sync options
    broadcast: String,
    broadcastChannel: String,
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
    this._installBroadcastBus();
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
    if (!isArray(names) || !names.length) return [];
    const resolved = resolvePluginNames(names);
    return normalisePlugins(resolved);
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
      // options.events can be an array, a function, a URL string, or an
      // EventSource object — only an array is iterable here, so route
      // non-arrays to refetchEvents() (called by datesSet effect) and
      // fall back to an empty list while we wait for the fetch to land.
      const eventsRaw = state.get('events') ?? options.events ?? [];
      const eventsArr = Array.isArray(eventsRaw) ? eventsRaw : [];
      const resourcesRaw = state.get('resources') ?? options.resources ?? [];
      const resourcesArr = Array.isArray(resourcesRaw) ? resourcesRaw : [];
      state.set('filteredEvents', filteredEvents(
        eventsArr,
        state.get('view'),
        {
          eventFilter: options.eventFilter,
          eventOrder: options.eventOrder,
          filterEventsWithResources: options.filterEventsWithResources,
          resources: resourcesArr,
        },
      ));
    };
    this._recompute();
  }

  // Build the optional BroadcastBus from options.broadcast +
  // options.broadcastChannel. When set, inbound messages drive the local
  // calendar API; outbound messages fire via _publishBroadcast for every
  // local mutation.
  _installBroadcastBus() {
    const options = this._state.get('options');
    const adapter = resolveAdapter(options.broadcast, options.broadcastChannel);
    if (!adapter) return;
    this._bus = new BroadcastBus(adapter, { filter: options.broadcastFilter });
    this._teardowns.push(this._bus.subscribe((message) => this._applyBroadcast(message)));
    this._teardowns.push(() => this._bus?.close());
  }

  _publishBroadcast(op, event, meta) {
    if (!this._bus) return;
    this._bus.publish({ op, event, meta });
    this.dispatch('broadcast:out', { detail: { message: { op, event, meta } } });
  }

  _applyBroadcast(message) {
    if (!message) return;
    this.dispatch('broadcast:in', { detail: { message } });
    const { op, event } = message;
    if (op === 'add' && event) this._applyEventChange('add', event);
    else if (op === 'update' && event) this._applyEventChange('update', event);
    else if (op === 'remove' && event?.id) this._applyEventChange('remove', event);
    else if (op === 'refetch' && typeof this.element.calendarApi?.refetchEvents === 'function') {
      this.element.calendarApi.refetchEvents();
    }
  }

  _applyEventChange(op, event) {
    const events = this._state.get('events') ?? this._state.get('options').events ?? [];
    const parsedEvent = op === 'remove'
      ? event
      : createEvents([event], this._state.get('offset'))[0];
    let next;
    if (op === 'add') next = [...events.filter((e) => e.id !== String(event.id)), parsedEvent];
    else if (op === 'update') next = events.map((e) =>
      e.id === String(event.id) ? { ...e, ...parsedEvent } : e);
    else if (op === 'remove') next = events.filter((e) => e.id !== String(event.id));
    if (next) {
      this._state.set('events', next);
      this._recompute();
    }
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
    this._toolbarEl = toolbar;
    this.element.dataset.calendarMounted = 'true';

    // Initial toolbar render + re-render on viewTitle change.
    const actions = {
      prev: () => this._navigate(-1),
      next: () => this._navigate(+1),
      today: () => this.setOption('date', new Date()),
      gotoView: (name) => this.setOption('view', name),
      fireCustomButton: (name) => {
        const button = this._state.get('options').customButtons?.[name];
        if (typeof button?.click === 'function') button.click();
      },
    };
    renderToolbar(this._toolbarEl, this._state, actions);
    this._teardowns.push(
      this._state.on('change:viewTitle', () => renderToolbar(this._toolbarEl, this._state, actions)),
    );

    // Mount the view renderer. setViewOptions returns the view's
    // component factory; for our ported plugins it returns a render
    // function that takes (container, state) and returns a teardown.
    this._mainEl = main;
    this._mountView();
    this._teardowns.push(
      this._state.on('change:options', () => this._mountView()),
    );

    // Aux components contributed by plugins (e.g. Interaction). Each is
    // { name, mount(rootEl, state) -> teardown }. Mounted on the root
    // element so they can delegate listeners across all view contents.
    const auxComponents = this._state.get('auxComponents') ?? [];
    for (const aux of auxComponents) {
      const teardown = aux.mount?.(this._root, this._state);
      if (typeof teardown === 'function') this._teardowns.push(teardown);
    }
  }

  _mountView() {
    if (this._viewTeardown) this._viewTeardown();
    const factory = this._state.get('viewComponent');
    if (typeof factory === 'function') {
      this._viewTeardown = factory(this._mainEl, this._state);
    } else {
      this._mainEl.replaceChildren();
      this._viewTeardown = null;
    }
  }

  // -- Public API (`element.calendarApi`) ----------------------------------

  _exposeApi() {
    const api = {
      // Events (full impls land in Phase 10/12)
      addEvent: (event) => {
        const [parsed] = createEvents([event], this._state.get('offset'));
        const events = [...(this._state.get('events') ?? this._state.get('options').events ?? [])];
        events.push(parsed);
        this._state.set('events', events);
        this._recompute();
        this._publishBroadcast('add', event);
        return parsed;
      },
      updateEvent: (event) => {
        const events = (this._state.get('events') ?? this._state.get('options').events ?? [])
          .map((e) => {
            if (e.id !== String(event.id)) return e;
            const [parsed] = createEvents([{ ...e, ...event }], this._state.get('offset'));
            return parsed;
          });
        this._state.set('events', events);
        this._recompute();
        this._publishBroadcast('update', event);
        return event;
      },
      removeEventById: (id) => {
        const target = String(id);
        this._state.set('events',
          (this._state.get('events') ?? this._state.get('options').events ?? [])
            .filter((e) => e.id !== target),
        );
        this._recompute();
        this._publishBroadcast('remove', { id: target });
      },
      getEvents: () => this._state.get('filteredEvents') ?? [],
      getEventById: (id) => (this._state.get('filteredEvents') ?? []).find((e) => e.id === id),
      refetchEvents: async () => this._refetchEvents(),

      // Resources
      refetchResources: async () => this._refetchResources(),
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

      // Selection — clears any active select range + fires the user
      // callback if registered.
      unselect: (jsEvent) => this._unselect(jsEvent),

      // Pointer geometry — find the calendar cell whose [data-date]
      // covers (x, y) and return a Date pointing at that day or slot.
      dateFromPoint: (x, y) => this._dateFromPoint(x, y),
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

  // Pull fresh event data from options.eventSources (function or URL) +
  // any legacy options.events function and replace state.events. Called
  // by the public refetchEvents() and on dates-set when lazyFetching is
  // on. URL sources are fetched against the active range as
  // ?start=&end= ISO strings.
  async _refetchEvents() {
    const options = this._state.get('options');
    const sources = [];
    if (options.events !== undefined) sources.push(options.events);
    if (Array.isArray(options.eventSources)) sources.push(...options.eventSources);

    const ar = this._state.get('activeRange');
    const params = ar ? {
      start: toISOString(ar.start, 10),
      end:   toISOString(ar.end,   10),
    } : {};

    const out = [];
    for (const src of sources) {
      const resolved = await this._resolveSource(src, params);
      if (Array.isArray(resolved)) out.push(...resolved);
    }
    if (out.length || sources.length) {
      const parsed = createEvents(out, this._state.get('offset'));
      this._state.set('events', parsed);
      this._recompute();
      this.dispatch('eventSourceSuccess', { detail: { events: parsed } });
    }
    return out;
  }

  async _refetchResources() {
    const options = this._state.get('options');
    if (options.resources === undefined) return [];
    const resolved = await this._resolveSource(options.resources, {});
    if (Array.isArray(resolved)) {
      this._state.set('resources', resolved);
      this._recompute();
      this.dispatch('resourceSourceSuccess', { detail: { resources: resolved } });
    }
    return resolved;
  }

  // Resolves a source descriptor (array | function | URL string | object
  // with .url and optional .extraParams) into an array of events/resources.
  async _resolveSource(src, params) {
    if (Array.isArray(src)) return src;
    if (typeof src === 'function') {
      return await src({ ...params, start: params.start && new Date(params.start), end: params.end && new Date(params.end) });
    }
    if (typeof src === 'string') return this._fetchJSON(src, params);
    if (src && typeof src === 'object' && src.url) {
      const merged = { ...params, ...(src.extraParams ?? {}) };
      return this._fetchJSON(src.url, merged);
    }
    return null;
  }

  async _fetchJSON(url, params) {
    const u = new URL(url, globalThis.location?.href ?? 'http://localhost');
    for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
    try {
      const res = await fetch(u.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        this.dispatch('eventSourceFailure', { detail: { url: u.toString(), status: res.status } });
        return null;
      }
      return await res.json();
    } catch (err) {
      this.dispatch('eventSourceFailure', { detail: { url: u.toString(), error: err.message } });
      return null;
    }
  }

  // Clear the active selection (set by the Interaction plugin) and call
  // options.unselect when registered.
  _unselect(jsEvent) {
    const sel = this._state.get('selection');
    if (sel) {
      this._state.set('selection', null);
      const options = this._state.get('options');
      if (typeof options.unselect === 'function') {
        options.unselect({ jsEvent, view: this._state.get('view') });
      }
      this.dispatch('unselect', { detail: { jsEvent } });
    }
  }

  // Lookup a Date from a viewport (x,y) point by walking the elements
  // under the point until we hit one carrying [data-date]. TimeGrid
  // cells additionally have y-offset → minutes via slot height.
  _dateFromPoint(x, y) {
    if (!this._root) return null;
    const els = (typeof document !== 'undefined' && document.elementsFromPoint)
      ? document.elementsFromPoint(x, y)
      : [];
    for (const el of els) {
      const cell = el.closest?.('[data-date]');
      if (cell && this._root.contains(cell)) {
        const dateStr = cell.getAttribute('data-date');
        const date = createDate(dateStr);
        // TimeGrid: derive the time-of-day from the y offset within the col.
        const timeCol = el.closest?.('.ec-time-col');
        if (timeCol) {
          const rect = timeCol.getBoundingClientRect();
          const options = this._state.get('options');
          const slotMinutes = ((options.slotDuration?.seconds ?? 1800) / 60) || 30;
          const pxPerMin = (options.slotHeight ?? 22) / slotMinutes;
          const minutes = Math.max(0, Math.round((y - rect.top) / pxPerMin));
          date.setUTCMinutes(date.getUTCMinutes() + minutes);
        }
        return date;
      }
    }
    return null;
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
CalendarController.OPTION_KEYS = [
  'view', 'date', 'duration', 'dateIncrement', 'firstDay', 'hiddenDays',
  'validRange', 'height', 'theme', 'locale', 'timeZone', 'customScrollbars',
  'views', 'lazyFetching', 'highlightedDates', 'titleFormat', 'dayHeaderFormat',
  'dayHeaderAriaLabelFormat', 'icons', 'buttonText', 'customButtons',
  'headerToolbar',
  'dayMaxEvents', 'dayCellFormat', 'dayPopoverFormat', 'moreLinkContent',
  'weekNumbers', 'weekNumberContent',
  'resources', 'refetchResourcesOnNavigate', 'datesAboveResources',
  'filterResourcesWithEvents', 'filterEventsWithResources',
  'monthHeaderFormat', 'slotWidth', 'resourceExpand',
  'broadcast', 'broadcastChannel',
];

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
