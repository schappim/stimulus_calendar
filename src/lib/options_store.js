// Phase 2 — options store. Owns option defaults + per-view overrides,
// the parsers registry, and the setOption/getOption surface that the
// MainState wraps.
//
// Upstream (calendar/packages/core/src/storage/options.js) uses Svelte 5
// runes + a Proxy. The Stimulus port keeps the same merge semantics but
// applies them eagerly: setOption() recomputes the effective per-view
// options and pushes them back into the MainState that owns the store.

import { assign, hasOwn, isArray, isFunction, isPlainObject, keys } from './utils.js';
import { createDate, setMidnight } from './date.js';
import { createDuration } from './duration.js';
import { createDateRange } from './range.js';
import { createEvents, createEventSources } from './events.js';
import { createResources } from './resources.js';
import { undefinedOr } from './options.js';

// Options whose setter receives the previous (default) value — so a user
// can pass a function (prev) => merged to extend rather than replace.
const FUNCTION_MERGEABLE = ['buttonText', 'customButtons', 'icons', 'theme'];

// Build the initial options store + the setter surface.
//
//   plugins      — array of registered plugins (each may contribute defaults
//                  and parsers via createOptions / createParsers)
//   userOptions  — the user's options as passed to the controller
//
// Returns { options, setOption, setViewOptions, viewComponents }.
//   - options             — the *effective* current option set (defaults +
//                           user + per-view overrides for the active view).
//   - setOption(key, val, parsed?) — change one option at runtime.
//   - setViewOptions(view)         — switch to a new view; returns that
//                                    view's component factory (if any).
//   - viewComponents               — map of viewName → component factory.
export function createOptionsStore(plugins, userOptions = {}) {
  const defaults = buildDefaults(plugins);
  const parsers = buildParsers(plugins);

  let parsedDefaults = parseOptions(defaults, parsers);
  const parsedUser = parseOptions(userOptions, parsers);

  // Pull `views` out — it's not a regular option, it's the per-view override
  // table.
  const defViews = extractOption(parsedDefaults, 'views') ?? {};
  const userViews = extractOption(parsedUser, 'views') ?? {};

  const options = { ...parsedDefaults };
  // The user can override the initial view name explicitly.
  if (userOptions.view) options.view = userOptions.view;

  // Per-view setters + the merged option set per view.
  const setters = {};
  const viewOptions = {};
  const viewComponents = {};
  const viewNames = new Set([...keys(defViews), ...keys(userViews)]);

  for (const view of viewNames) {
    const userViewOpts = userViews[view] ?? {};
    const defOpts = mergeOpts(
      parsedDefaults,
      defViews[view] ?? defViews[userViewOpts.type] ?? {},
    );
    const opts = mergeOpts(defOpts, parsedUser, userViewOpts);

    const component = extractOption(opts, 'component');
    // `view` doesn't belong inside the per-view bag.
    delete opts.view;

    for (const key of keys(opts)) {
      if (hasOwn(options, key)) {
        if (!setters[key]) setters[key] = [];
        setters[key].push(
          FUNCTION_MERGEABLE.includes(key)
            ? (value) => (opts[key] = isFunction(value) ? value(defOpts[key]) : value)
            : (value) => (opts[key] = value),
        );
      } else {
        delete opts[key];
      }
    }

    viewOptions[view] = opts;
    viewComponents[view] = component;
  }

  // Activate the initial view's options on the live options object.
  // When no view is registered (e.g. the bare controller in tests before any
  // view plugin loads), still merge user options on top so the user's
  // explicit settings aren't lost.
  if (viewOptions[options.view]) {
    assign(options, viewOptions[options.view]);
  } else {
    // Per-view bags are empty; apply parsedUser directly so the user
    // attributes take effect even without a plugin-registered view.
    assign(options, parsedUser);
  }

  function setOption(key, value, parsed = true) {
    if (!hasOwn(options, key)) return;
    if (!parsed) {
      if (key in parsers) {
        value = parsers[key](value);
      } else if (isPlainObject(value)) {
        value = { ...value };
      } else if (isArray(value)) {
        value = [...value];
      }
    }
    setters[key]?.forEach((set) => set(value));
    options[key] = value;
  }

  function setViewOptions(view) {
    if (!viewOptions[view]) return undefined;
    assign(options, viewOptions[view]);
    return viewComponents[view];
  }

  return {
    options,
    setOption,
    setViewOptions,
    viewComponents,
    // Sorted list of every view name registered by defaults + plugins +
    // the user. The controller exposes this on state so the toolbar can
    // tokenise view-switcher entries.
    viewNames: [...viewNames].sort(),
  };
}

// Diff two option objects — emits [key, value] tuples for each difference.
// The calendar controller uses this when re-applying a bulk patch to know
// which subscribers need re-firing.
export function diff(current, prev) {
  const out = [];
  for (const key of keys(current)) {
    if (current[key] !== prev[key]) out.push([key, current[key]]);
  }
  return out;
}

// --- internals -------------------------------------------------------------

function buildDefaults(plugins) {
  const defaults = baseDefaults();
  for (const plugin of plugins) plugin.createOptions?.(defaults);
  return defaults;
}

function buildParsers(plugins) {
  // Default parsers mirror upstream storage/options.js — they're applied
  // unconditionally so even a plugin-less calendar gets a normalised
  // duration / date / events array. Plugin parsers (e.g. TimeGrid adds
  // slotDuration: createDuration) layer on top.
  const parsers = {
    date: (input) => setMidnight(createDate(input)),
    dateIncrement: undefinedOr(createDuration),
    duration: createDuration,
    events: createEvents,
    eventSources: createEventSources,
    hiddenDays: (input) => [...new Set(input)],
    highlightedDates: (input) => input.map((item) => setMidnight(createDate(item))),
    resources: (input) => (isArray(input) ? createResources(input) : input),
    validRange: createDateRange,
  };
  for (const plugin of plugins) plugin.createParsers?.(parsers);
  return parsers;
}

function parseOptions(opts, parsers) {
  const result = { ...opts };
  for (const key of keys(parsers)) {
    if (key in result) result[key] = parsers[key](result[key]);
  }
  if (opts.views) {
    result.views = {};
    for (const view of keys(opts.views)) {
      result.views[view] = parseOptions(opts.views[view], parsers);
    }
  }
  return result;
}

function extractOption(options, name) {
  const extracted = options[name];
  delete options[name];
  return extracted;
}

function mergeOpts(...args) {
  let result = {};
  for (const opts of args) {
    const override = {};
    for (const key of FUNCTION_MERGEABLE) {
      if (isFunction(opts[key])) override[key] = opts[key](result[key]);
    }
    result = { ...result, ...opts, ...override };
  }
  return result;
}

// Base defaults that exist regardless of plugins. Keeps the structure of
// upstream storage/options.js — when Phase 3+ ships the calendar controller,
// every option below is the canonical default.
function baseDefaults() {
  return {
    broadcast: undefined,
    broadcastChannel: undefined,
    broadcastFilter: undefined,
    buttonText: { today: 'today' },
    // Opt-in macOS-Calendar-style continuous vertical scroll for the
    // dayGridMonth view (see components/month_scroller.js).
    continuousMonthScroll: false,
    // Phase E2 — opt-in built-in "↩ Back to today" pill rendered by
    // the controller into the calendar root when the view is
    // off-period. Hosts that own their own UI keep this false and
    // listen for calendar:offPeriodChange instead.
    backToTodayPill: false,
    offPeriodChange: undefined,
    customButtons: {},
    customScrollbars: false,
    date: new Date(),
    dateIncrement: undefined,
    datesSet: undefined,
    dayCellContent: undefined,
    dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
    dayHeaderAriaLabelFormat: { dateStyle: 'full' },
    displayEventEnd: true,
    duration: { weeks: 1 },
    events: [],
    eventAllUpdated: undefined,
    eventBackgroundColor: undefined,
    eventClassNames: undefined,
    eventClick: undefined,
    eventColor: undefined,
    eventContent: undefined,
    eventDidMount: undefined,
    eventDoubleClick: undefined,
    eventDragStart: undefined,
    eventDragStop: undefined,
    eventDrop: undefined,
    eventPopoverEdit: undefined,
    eventPopoverDelete: undefined,
    eventPopoverOpen: undefined,
    eventPopoverClose: undefined,
    eventFilter: undefined,
    eventMouseEnter: undefined,
    eventMouseLeave: undefined,
    eventOrder: undefined,
    eventResize: undefined,
    eventResizeStart: undefined,
    eventResizeStop: undefined,
    eventSourceFailure: undefined,
    eventSourceSuccess: undefined,
    eventSources: [],
    eventTextColor: undefined,
    eventTimeFormat: { hour: 'numeric', minute: '2-digit' },
    // Map of appointment-type → visual descriptor, applied when
    // event.extendedProps.type matches a key. See lib/event_meta.js
    // for the resolver. Shape:
    //   { job: { color: '#f59e0b', classNames: ['ec-event-job'],
    //            label: 'Job', icon: 'wrench' }, … }
    // `color` falls in as a tile background when the event itself
    // doesn't declare `backgroundColor`. `classNames` are appended
    // alongside Phase C5/C6 auto-classes. `label` and `icon` are
    // exposed to host eventContent renderers but not auto-injected
    // (no template imposition).
    eventTypes: undefined,
    filterEventsWithResources: false,
    firstDay: 0,
    headerToolbar: { start: 'title', center: '', end: 'today prev,next' },
    height: undefined,
    hiddenDays: [],
    highlightedDates: [],
    icons: {},
    lazyFetching: true,
    loading: undefined,
    locale: undefined,
    refetchResourcesOnNavigate: false,
    resources: [],
    resourceSourceFailure: undefined,
    resourceSourceSuccess: undefined,
    select: undefined,
    selectable: false,
    suppressEventPopover: false,
    dateClick: undefined,
    theme: defaultTheme(),
    unselect: undefined,
    viewClassNames: undefined,
    viewDidMount: undefined,
    viewWillUnmount: undefined,
    timeZone: 'local',
    titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
    validRange: undefined,
    view: undefined,
    views: {},
  };
}

function defaultTheme() {
  return {
    active: 'ec-active',
    allDay: 'ec-all-day',
    bgEvent: 'ec-bg-event',
    bgEvents: 'ec-bg-events',
    body: 'ec-body',
    button: 'ec-button',
    buttonGroup: 'ec-button-group',
    calendar: 'ec',
    colHead: 'ec-col-head',
    customScrollbars: 'ec-custom-scrollbars',
    day: 'ec-day',
    dayHead: 'ec-day-head',
    daySide: 'ec-day-side',
    disabled: 'ec-disabled',
    event: 'ec-event',
    eventBody: 'ec-event-body',
    eventTag: 'ec-event-tag',
    eventTime: 'ec-event-time',
    eventTitle: 'ec-event-title',
    events: 'ec-events',
    expander: 'ec-expander',
    grid: 'ec-grid',
    header: 'ec-header',
    hidden: 'ec-hidden',
    highlight: 'ec-highlight',
    icon: 'ec-icon',
    main: 'ec-main',
    noBeb: 'ec-no-beb',
    noEvents: 'ec-no-events',
    noIeb: 'ec-no-ieb',
    nowIndicator: 'ec-now-indicator',
    otherMonth: 'ec-other-month',
    popup: 'ec-popup',
    rowHead: 'ec-row-head',
    sidebar: 'ec-sidebar',
    slot: 'ec-slot',
    slots: 'ec-slots',
    today: 'ec-today',
    title: 'ec-title',
    toolbar: 'ec-toolbar',
    view: '',
    weekdays: ['ec-sun', 'ec-mon', 'ec-tue', 'ec-wed', 'ec-thu', 'ec-fri', 'ec-sat'],
    weekNumber: 'ec-week-number',
  };
}
