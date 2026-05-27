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
import { createDate, addDuration, subtractDuration, cloneDate, setMidnight, toISOString, getOffset } from '../lib/date.js';
import { createEvents } from '../lib/events.js';
import { createDuration } from '../lib/duration.js';
import { isArray, isFunction, isPlainObject } from '../lib/utils.js';
import { renderToolbar } from '../components/toolbar.js';
import {
  openEventPopover, closeEventPopover, isEventPopoverOpen, openEventPopoverId,
} from '../components/event_popover.js';
import { createPager } from '../components/pager.js';
import { createMonthScroller } from '../components/month_scroller.js';
import { createWeekScroller } from '../components/week_scroller.js';
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
    // Phase A1 — Roster grouping
    resourceGroups: Array,
    resourceGroupField: String,
    // Phase A3 — empty-cell affordance
    emptyCellAddButton: { type: Boolean, default: false },
    // Phase C1 — TimeGridWeek continuous horizontal scroller
    continuousWeekScroll: { type: Boolean, default: false },
    // Phase C2 — density dots beneath the dayHeader weekday label.
    dayHeaderDensity: { type: Boolean, default: false },
    // Phase D — declarative mode flag.
    mode: String,
    // Phase E2 — built-in "↩ Back to today" pill rendered into the
    // calendar root when off-period.
    backToTodayPill: { type: Boolean, default: false },
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
    // Per-view date memory. Each entry remembers the date that view was
    // last looking at; on view switch we snapshot the outgoing view and
    // (if the incoming view has a remembered date) restore it before
    // the new view mounts. This way Day → Month → navigate-in-Month →
    // Day puts the user back on the day they were originally on, even
    // though Month's navigation moved options.date forward. The Month
    // view independently remembers the month they last browsed.
    this._viewDates = {};

    // state.fire is used by the effects pipeline and view renderers to
    // both fire the user callback (options.<name>) AND dispatch the
    // matching DOM CustomEvent (calendar:<name>) on the host element.
    // Must be wired BEFORE _installEffectsPipeline so the initial run
    // of each effect sees a working dispatcher.
    this._state.set('hostEl', this.element);
    this._state.set('fire', (name, detail = {}) => {
      const opts = this._state.get('options');
      const cb = opts?.[name];
      if (typeof cb === 'function') cb(detail);
      this.dispatch(name, { detail });
    });

    this._installDerivations();
    this._installEffectsPipeline();
    this._installBroadcastBus();
    this._mountRootDOM();
    this._exposeApi();
    this._installEventPopoverDefault();
    this._installBackgroundDeselect();
    this._installOffPeriodTracking();
    this._installBackToTodayPill();

    if (this.hasModeValue && this.modeValue) {
      this.element.calendarApi.setMode(this.modeValue, null);
    }

    this.dispatch('ready', { detail: { api: this.element.calendarApi } });
  }

  // Phase E1 — re-evaluate isOffPeriod() whenever activeRange or
  // state.now changes; fire calendar:offPeriodChange when it flips.
  _installOffPeriodTracking() {
    let last = this.element.calendarApi.isOffPeriod();
    this._state.set('offPeriod', last);
    const recheck = () => {
      const next = this.element.calendarApi.isOffPeriod();
      if (next !== last) {
        last = next;
        this._state.set('offPeriod', next);
        this.dispatch('offPeriodChange', { detail: { offPeriod: next } });
      }
    };
    this._teardowns.push(this._state.on('change:activeRange', recheck));
    this._teardowns.push(this._state.on('change:now', recheck));
  }

  // Phase E2 — optional built-in "↩ Back to today" pill rendered into
  // the calendar root when off-period. Anchored bottom-centre with a
  // soft drop shadow. Opt-in via options.backToTodayPill: true. Host
  // apps that own their own UI ignore the option and listen for
  // calendar:offPeriodChange instead.
  _installBackToTodayPill() {
    const sync = () => {
      const opts = this._state.get('options') ?? {};
      if (!opts.backToTodayPill) {
        this._removeBackToTodayPill();
        return;
      }
      if (this._state.get('offPeriod')) this._renderBackToTodayPill();
      else this._removeBackToTodayPill();
    };
    sync();
    this._teardowns.push(this._state.on('change:offPeriod', sync));
    this._teardowns.push(this._state.on('change:options', sync));
  }

  _renderBackToTodayPill() {
    if (this._backToTodayPillEl) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ec-back-to-today-pill';
    el.dataset.action = 'back-to-today';
    el.textContent = '↩  Back to today';
    el.addEventListener('click', () => this.element.calendarApi.today());
    this._root?.appendChild(el);
    this._backToTodayPillEl = el;
  }

  _removeBackToTodayPill() {
    if (!this._backToTodayPillEl) return;
    this._backToTodayPillEl.remove();
    this._backToTodayPillEl = null;
  }

  modeValueChanged() {
    if (!this.element.calendarApi) return;
    const next = this.modeValue || null;
    if (next === (this._state.get('mode') ?? null)) return;
    this.element.calendarApi.setMode(next, null);
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
      // Pass options.date so IANA zones resolve to the offset that's
      // actually in effect for the displayed week/month. As the user
      // navigates across a DST transition the offset flips, which then
      // triggers timeZoneChangeEffect to re-anchor the events.
      state.set('offset', offset(options.timeZone ?? 'local', options.date));
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
    // nowAndTodayEffect ticks state.now / state.today once a second and
    // re-anchors when the offset changes. The TimeGrid now-indicator
    // subscribes to state.now to move its top live (otherwise the line
    // is frozen at whichever clock value the last render captured, even
    // as wall-clock minutes advance).
    const uninstall = installEffects(this._state, [
      switchViewEffect(this._setViewOptions),
      datesSetEffect(),
      viewDidMountEffect(),
      eventAllUpdatedEffect(),
      timeZoneChangeEffect((k, v) => this.setOption(k, v)),
      nowAndTodayEffect(),
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

    // Expose the rendered root for renderers that need it; fire/hostEl
    // are wired earlier in connect() so the effects pipeline can use them
    // on its initial run.
    this._state.set('rootEl', root);

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
    const options = this._state.get('options');
    const viewName = options?.view;
    // dayGridMonth + options.continuousMonthScroll = continuous vertical
    // flow (macOS Calendar pattern). The default for dayGridMonth remains
    // the single-month pager-wrapped grid for backwards compatibility;
    // opting in via `continuousMonthScroll: true` swaps in the scroller.
    if (viewName === 'dayGridMonth' && options?.continuousMonthScroll && typeof factory === 'function') {
      const scroller = createMonthScroller(this._mainEl, this._state, {
        onDateChange: (date) => this.element.calendarApi?.gotoDate(date),
      });
      this._monthScroller = scroller;
      this._pager = null;
      this._state.set('pagerApi', null);
      this._viewTeardown = () => { scroller.destroy(); this._monthScroller = null; };
      return;
    }
    if (viewName === 'timeGridWeek' && options?.continuousWeekScroll && typeof factory === 'function') {
      const scroller = createWeekScroller(this._mainEl, this._state, factory, {
        onDateChange: (date) => this.element.calendarApi?.gotoDate(date),
      });
      this._weekScroller = scroller;
      this._pager = null;
      this._state.set('pagerApi', null);
      this._viewTeardown = () => { scroller.destroy(); this._weekScroller = null; };
      return;
    }
    if (typeof factory === 'function') {
      const pager = createPager(this._mainEl, this._state, factory, {
        onNavigate: ({ direction, date }) => {
          if (date) this.element.calendarApi?.gotoDate(date);
          else if (direction > 0) this.element.calendarApi?.next();
          else if (direction < 0) this.element.calendarApi?.prev();
        },
      });
      this._pager = pager;
      this._monthScroller = null;
      // Expose for the Interaction plugin's edge-hold cross-day drag.
      // Cleared in the teardown below + reset on every view re-mount.
      this._state.set('pagerApi', pager);
      this._viewTeardown = () => {
        pager.destroy();
        this._pager = null;
        this._state.set('pagerApi', null);
      };
    } else {
      this._mainEl.replaceChildren();
      this._viewTeardown = null;
      this._pager = null;
      this._monthScroller = null;
      this._state.set('pagerApi', null);
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
        // Capture the merged result so the broadcast payload carries the
        // full post-mutation event. Without this, a partial caller payload
        // (e.g. drag commit `{id,start,end}`) would broadcast missing
        // title/backgroundColor — the receiver's createEvents([...])
        // would fill them with defaults (`title:''`, `backgroundColor:
        // undefined`) and the `{ ...e, ...parsed }` merge over there
        // would clobber the receiver's local title + colour.
        let merged = null;
        const events = (this._state.get('events') ?? this._state.get('options').events ?? [])
          .map((e) => {
            if (e.id !== String(event.id)) return e;
            const [parsed] = createEvents([{ ...e, ...event }], this._state.get('offset'));
            merged = parsed;
            return parsed;
          });
        this._state.set('events', events);
        this._recompute();
        this._publishBroadcast('update', _toBroadcastPayload(merged ?? event));
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

      // Resource groups (Phase A1) — ResourceTimeline only. The renderer
      // owns the group expansion map; we just forward the read / write so
      // host code can collapse/expand crews programmatically and a fresh
      // re-render picks up the new state.
      setGroupExpanded: (groupId, expanded) => {
        const map = this._state.get('resourceGroupState') ?? new Map();
        map.set(String(groupId), !!expanded);
        this._state.set('resourceGroupState', map);
        const groupsById = this._state.get('resourceGroupsById');
        const g = groupsById?.get(String(groupId));
        if (g) g.expanded = !!expanded;
        // Re-fire the derivation pipeline so the renderer wakes up; no
        // option mutation needed because group state is its own slot.
        this._recompute();
      },
      getGroupExpanded: (groupId) => {
        const map = this._state.get('resourceGroupState') ?? new Map();
        if (map.has(String(groupId))) return map.get(String(groupId));
        const g = this._state.get('resourceGroupsById')?.get(String(groupId));
        return g?.expanded ?? true;
      },
      getResourceGroups: () => {
        const m = this._state.get('resourceGroupsById');
        return m ? Array.from(m.values()) : [];
      },

      // Phase B5 — pinch row height accessors. Imperative side of the
      // gesture so host code (slider, mode-bar) can drive it too.
      setRowHeight: (px) => {
        const n = Number(px) || 0;
        this._state.set('rowHeight', n);
        this.dispatch('rowHeightChange', { detail: { height: n } });
      },
      getRowHeight: () => this._state.get('rowHeight') ?? null,

      // Phase D — calendar-wide mode flag (e.g. "scheduling-x"). Adds /
      // removes data-calendar-mode="<name>" on the host element so CSS
      // can key off it; fires calendar:modeChange with { mode, context }
      // so host code stays in sync.
      setMode: (name, context) => {
        const next = name ? String(name) : null;
        if (next) this.element.setAttribute('data-calendar-mode', next);
        else this.element.removeAttribute('data-calendar-mode');
        this._state.set('mode', next);
        this._state.set('modeContext', context ?? null);
        this.dispatch('modeChange', { detail: { mode: next, context: context ?? null } });
      },
      clearMode: () => this.element.calendarApi.setMode(null, null),
      getMode: () => this._state.get('mode') ?? null,
      getModeContext: () => this._state.get('modeContext') ?? null,

      // Phase D3 — paint a "suggested slot" on the strip / time grid.
      // Renderer-agnostic: lives in state.suggestedSlot, picked up by
      // each view's render loop.
      setSuggestedSlot: ({ start, end, resourceId } = {}) => {
        const slot = start && end
          ? { start: new Date(start), end: new Date(end), resourceId: resourceId ?? null }
          : null;
        this._state.set('suggestedSlot', slot);
      },
      clearSuggestedSlot: () => this._state.set('suggestedSlot', null),
      getSuggestedSlot: () => this._state.get('suggestedSlot') ?? null,

      // Phase E — off-period check. Returns true when state.now is
      // outside the current view's activeRange (the user has navigated
      // away from "today"). Host UI can hook this to show a back-to-
      // today pill / banner.
      isOffPeriod: () => {
        const ar = this._state.get('activeRange');
        const now = this._state.get('now') ?? new Date();
        if (!ar?.start || !ar?.end) return false;
        const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
        return nowMs < ar.start.getTime() || nowMs >= ar.end.getTime();
      },

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

      // Event popover — usually opened automatically by double-clicking
      // an event chip. Host apps can also open/close it programmatically.
      openEventPopover: (eventId, anchorEl) => {
        const event = api.getEventById(String(eventId));
        if (!event) return null;
        const el = anchorEl
          || this._root?.querySelector(`[data-event-id="${CSS.escape(String(eventId))}"]`);
        if (!el) return null;
        return openEventPopover({ event, anchorEl: el, state: this._state });
      },
      closeEventPopover,
      isEventPopoverOpen,
      openEventPopoverId,
    };
    this.element.calendarApi = api;
  }

  // Default behaviour: when a chip is double-clicked, open the built-in
  // event popover. Host apps suppress this by either (a) calling
  // event.preventDefault() inside an options.eventDoubleClick callback,
  // (b) listening for 'calendar:eventDoubleClick' on the host and calling
  // event.preventDefault(), or (c) setting options.suppressEventPopover.
  // Clear the persisted selection when the user clicks anywhere inside
  // the calendar that isn't an event chip — grid background, day cell,
  // sidebar, header, toolbar, etc. The chip click handlers in each
  // view (time_grid, day_grid, list, …) don't stopPropagation, so a
  // click that lands inside a chip still bubbles up here; we detect
  // that with closest('.ec-event') and bail out so the chip's own
  // handler is the source of truth for that case.
  _installBackgroundDeselect() {
    const handler = (e) => {
      if (e.target.closest('.ec-event')) return;
      if (!this._state.get('selectedEventId')) return;
      document.querySelectorAll('.ec-event.ec-event-selected')
        .forEach((c) => c.classList.remove('ec-event-selected'));
      this._state.set('selectedEventId', null);
    };
    this.element.addEventListener('click', handler);
    this._teardowns.push(() => this.element.removeEventListener('click', handler));
  }

  _installEventPopoverDefault() {
    // Defer to a microtask so user listeners attached *after* the controller
    // (e.g. in their own connect() running later in the same turn) still
    // get the chance to call event.preventDefault() before the popover opens.
    const handler = (ev) => {
      const { event, el } = ev.detail ?? {};
      if (!event || !el) return;
      queueMicrotask(() => {
        if (ev.defaultPrevented) return;
        const opts = this._state.get('options');
        if (opts?.suppressEventPopover) return;
        openEventPopover({ event, anchorEl: el, state: this._state });
      });
    };
    this.element.addEventListener('calendar:eventDoubleClick', handler);
    this._teardowns.push(() => this.element.removeEventListener('calendar:eventDoubleClick', handler));
    this._teardowns.push(() => closeEventPopover());
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
    // Normalise dates to the calendar's UTC-encoded local-midnight form,
    // matching the date parser used during initial option parsing.
    // Without this, `today: () => setOption('date', new Date())` would
    // land options.date on a non-midnight time-of-day; activeRange.start
    // would then be at e.g. 14:23, every slot's minute would be 23/53,
    // and the TimeGrid time-axis would render blank because no slot
    // satisfies the hour-only label filter (mins === 0).
    if (key === 'date') {
      if (typeof value === 'string') value = setMidnight(createDate(value));
      else if (value instanceof Date) value = setMidnight(createDate(value));
    }
    if (key === 'duration' && (typeof value === 'string' || typeof value === 'number' || isPlainObject(value))) {
      value = createDuration(value);
    }
    if (key === 'dateIncrement' && value !== undefined && !isFunction(value)) {
      value = createDuration(value);
    }
    const prevView = this._state.get('options').view;
    // View name change → tear down the old view BEFORE applying the new
    // view's option bag, so a view component like MonthScroller can
    // flush its in-flight scroll position into options.date (via its
    // destroy hook) before assign(options, viewOptions[newView])
    // overwrites date with whatever value the new view's bag was
    // holding. Without the early teardown, switching from month → week
    // mid-scroll lands the week view on the old date instead of the
    // user's last scroll position.
    if (key === 'view' && value !== prevView) {
      // Snapshot the outgoing view's date so a future return to it
      // restores the same position — including whatever scroll-driven
      // updates a component like MonthScroller pushed in via its
      // destroy hook. We read AFTER the teardown so those late
      // updates are captured.
      if (this._viewTeardown) { this._viewTeardown(); this._viewTeardown = null; }
      if (prevView) {
        const outgoingDate = this._state.get('options').date;
        if (outgoingDate instanceof Date) {
          this._viewDates[prevView] = setMidnight(createDate(outgoingDate));
        }
      }
      this._setOption(key, value);
      const initComponent = this._setViewOptions(value);
      if (typeof initComponent === 'function') {
        this._state.set('viewComponent', initComponent(this._state));
      }
      // Restore the destination view's remembered date if any. The
      // per-view setters in createOptionsStore have kept every view's
      // bag synced to whatever the LIVE options.date was, so the bag
      // alone can't tell us what THIS view was last looking at — we
      // need our own map. _setOption here doesn't re-enter setOption,
      // so it skips the date-normalisation above; we normalise once at
      // capture time instead.
      const remembered = this._viewDates[value];
      if (remembered instanceof Date) {
        this._setOption('date', remembered);
      }
      this._recompute();
      this._mountView();
      const actions = this._toolbarActions();
      renderToolbar(this._toolbarEl, this._state, actions);
      return;
    }
    this._setOption(key, value);
    // Track per-view date as the user navigates: prev/next, gotoDate,
    // today, MonthScroller scroll-settle — all land here. Updating only
    // the CURRENT view's memory means Day → Month → navigate-in-Month →
    // Day restores Day's original position; Month independently
    // remembers the month it last browsed.
    if (key === 'date' && value instanceof Date) {
      const currentView = this._state.get('options').view;
      if (currentView) this._viewDates[currentView] = setMidnight(createDate(value));
    }
    this._recompute();
  }

  _toolbarActions() {
    return {
      prev: () => this._navigate(-1),
      next: () => this._navigate(+1),
      today: () => this.setOption('date', new Date()),
      gotoView: (name) => this.setOption('view', name),
      fireCustomButton: (name) => {
        const button = this._state.get('options').customButtons?.[name];
        if (typeof button?.click === 'function') button.click();
      },
    };
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
  'resourceGroups', 'resourceGroupField', 'emptyCellAddButton',
  'continuousWeekScroll', 'dayHeaderDensity',
  'mode', 'backToTodayPill',
  'broadcast', 'broadcastChannel',
];

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Convert a (possibly already-parsed) event into a structured-clone-safe
// wire shape for the broadcast bus.
//
// Each Date is serialized as 'YYYY-MM-DDTHH:MM:SS±HH:MM' using the offset
// attached to it via setOffset() — NOT Date#toISOString(), which would
// emit a 'Z' suffix. The Z is intra-calendar-convention'd as 'no offset /
// floating' (parseOffset ignores it), so a Z-suffixed payload would land
// at the SENDER's wall-clock in the receiver instead of shifting to the
// receiver's local wall-clock for the same UTC instant.
//
// With the explicit ±HH:MM suffix, the receiver's createEvents([...]) →
// _fromISOString applies (receiverOffset - inputOffset) → the resulting
// internal Date carries the correct wall-clock for the receiver while
// preserving the actual UTC instant. Floating dates (no offset attached)
// are serialized with no suffix so they remain floating on the receiver.
function _toBroadcastPayload(event) {
  if (!event) return event;
  const out = { ...event };
  if (out.start instanceof Date) out.start = _serializeDate(out.start);
  if (out.end   instanceof Date) out.end   = _serializeDate(out.end);
  return out;
}

function _serializeDate(date) {
  const iso = toISOString(date, 19); // 'YYYY-MM-DDTHH:MM:SS' — wall-clock, no Z.
  const off = getOffset(date);
  if (off === undefined) return iso;
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${iso}${sign}${hh}:${mm}`;
}
