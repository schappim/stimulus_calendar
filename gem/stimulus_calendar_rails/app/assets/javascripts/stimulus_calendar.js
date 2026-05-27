var xn = Object.defineProperty;
var _n = (n, t, e) => t in n ? xn(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var Et = (n, t, e) => _n(n, typeof t != "symbol" ? t + "" : t, e);
import { Controller as En, Application as tn } from "@hotwired/stimulus";
function Pe(...n) {
  return Object.assign(...n);
}
function Ne(n) {
  return Object.keys(n);
}
function Lt(n, t) {
  return Object.hasOwn(n, t);
}
function Ln(n) {
  return Math.floor(n);
}
function kt(...n) {
  return Math.min(...n);
}
function ct(...n) {
  return Math.max(...n);
}
function kn() {
  return Symbol("ec");
}
function Qe(n = /* @__PURE__ */ new Date()) {
  return -n.getTimezoneOffset();
}
function st(n) {
  return Array.isArray(n);
}
function _e(n) {
  return typeof n == "function";
}
function nn(n) {
  if (typeof n != "object" || n === null) return !1;
  const t = Object.getPrototypeOf(n);
  return t === null || t === Object.prototype;
}
function on(n) {
  return n instanceof Date;
}
const yt = 86400;
function ue(n = /* @__PURE__ */ new Date(), t = void 0) {
  return on(n) ? In(n, t) : On(n, t);
}
function $(n) {
  const t = new Date(n.getTime());
  return We(t, je(n)), t;
}
function Te(n, t, e = 1) {
  n.setUTCFullYear(n.getUTCFullYear() + e * t.years);
  let o = n.getUTCMonth() + e * t.months;
  for (n.setUTCMonth(o), o %= 12, o < 0 && (o += 12); n.getUTCMonth() !== o; ) rn(n);
  return n.setUTCDate(n.getUTCDate() + e * t.days), n.setUTCSeconds(n.getUTCSeconds() + e * t.seconds), n;
}
function sn(n, t, e = 1) {
  return Te(n, t, -e);
}
function ae(n, t = 1) {
  return n.setUTCDate(n.getUTCDate() + t), n;
}
function rn(n, t = 1) {
  return ae(n, -t);
}
function ne(n) {
  return n.setUTCHours(0, 0, 0, 0), n;
}
function Me(n) {
  return new Date(
    n.getUTCFullYear(),
    n.getUTCMonth(),
    n.getUTCDate(),
    n.getUTCHours(),
    n.getUTCMinutes(),
    n.getUTCSeconds()
  );
}
function Ie(n, t = 19) {
  return n.toISOString().substring(0, t);
}
function Ce(n, ...t) {
  return t.every((e) => n.getTime() === e.getTime());
}
function it(n, t) {
  const e = t - n.getUTCDay();
  return n.setUTCDate(n.getUTCDate() + (e <= 0 ? e : e - 7)), n;
}
function At(n) {
  return typeof n == "string" && n.length <= 10;
}
function ve(n) {
  return n.seconds;
}
function An(n, t) {
  n = $(n), t === 0 ? n.setUTCDate(n.getUTCDate() + 6 - n.getUTCDay()) : n.setUTCDate(n.getUTCDate() + 4 - (n.getUTCDay() || 7));
  const e = new Date(Date.UTC(n.getUTCFullYear(), 0, 1));
  return Math.ceil(((n - e) / 1e3 / yt + 1) / 7);
}
function Pn(n, t, e) {
  return t ? _e(t) ? t({ date: Me(e), week: n }) : t : "W" + String(n).padStart(2, "0");
}
function an(n, t = {}) {
  const e = n.match(/([+-])(\d{2}):(\d{2})$/);
  if (e)
    return Pe(t, e), +(e[1] + "1") * (+e[2] * 60 + +e[3]);
}
function St(n, t) {
  return t && n.setUTCMinutes(n.getUTCMinutes() + t), n;
}
const cn = Symbol("ec");
function We(n, t) {
  return n[cn] = t, n;
}
function je(n) {
  return n[cn];
}
function In(n, t = void 0) {
  const e = new Date(Date.UTC(
    n.getFullYear(),
    n.getMonth(),
    n.getDate(),
    n.getHours(),
    n.getMinutes(),
    n.getSeconds()
  ));
  return St(e, t ? t - Qe(e) : 0), We(e, t ?? Qe(e)), e;
}
function On(n, t = void 0) {
  const e = {}, o = an(n, e);
  o !== void 0 && (n = n.substring(0, e.index));
  const s = n.match(/\d+/g), r = new Date(Date.UTC(
    +s[0],
    +s[1] - 1,
    +s[2],
    +s[3] || 0,
    +s[4] || 0,
    +s[5] || 0
  ));
  return t !== void 0 && o !== void 0 && St(r, t - o), We(r, t ?? o), r;
}
function ce(n) {
  if (typeof n == "number")
    n = { seconds: n };
  else if (typeof n == "string") {
    let e = 0, o = 2;
    for (const s of n.split(":", 3))
      e += parseInt(s, 10) * Math.pow(60, o--);
    n = { seconds: e };
  } else on(n) && (n = {
    hours: n.getUTCHours(),
    minutes: n.getUTCMinutes(),
    seconds: n.getUTCSeconds()
  });
  const t = n.weeks || n.week || 0;
  return {
    years: n.years || n.year || 0,
    months: n.months || n.month || 0,
    days: t * 7 + (n.days || n.day || 0),
    seconds: (n.hours || n.hour || 0) * 60 * 60 + (n.minutes || n.minute || 0) * 60 + (n.seconds || n.second || 0),
    inWeeks: !!t
  };
}
function Rn(n) {
  let t, e;
  return n && ({ start: t, end: e } = n, t && (t = ne(ue(t))), e && (e = ne(ue(e)))), { start: t, end: e };
}
const ln = kn();
function Hn(n, t) {
  n[ln] = t;
}
function Re(n) {
  return n[ln];
}
function h(n, t, e, o = []) {
  const s = document.createElement(n);
  s.className = t, typeof e == "string" ? s.innerText = e : e?.domNodes ? s.replaceChildren(...e.domNodes) : e?.html && (s.innerHTML = e.html);
  for (const r of o)
    s.setAttribute(...r);
  return s;
}
let Fn = 1;
function Ae(n, t = void 0) {
  return n.map((e) => {
    const o = {
      id: "id" in e ? String(e.id) : `{generated-${Fn++}}`,
      resourceIds: lt(e, "resourceId").map(String),
      allDay: e.allDay ?? (At(e.start) && At(e.end)),
      start: ue(e.start, t),
      end: ue(e.end, t),
      title: e.title ?? "",
      editable: e.editable,
      startEditable: e.startEditable,
      durationEditable: e.durationEditable,
      display: e.display ?? "auto",
      extendedProps: e.extendedProps ?? {},
      backgroundColor: e.backgroundColor ?? e.color,
      textColor: e.textColor,
      classNames: lt(e, "className"),
      styles: lt(e, "style")
    };
    if (o.allDay) {
      ne(o.start);
      const s = $(o.end);
      ne(o.end), (!Ce(o.end, s) || Ce(o.end, o.start)) && ae(o.end);
    }
    return Nn(o), o;
  });
}
function Nn(n) {
  return Object.defineProperties(n, {
    startLocal: {
      get() {
        return this.start ? Me(this.start) : null;
      },
      enumerable: !1,
      configurable: !0
    },
    endLocal: {
      get() {
        return this.end ? Me(this.end) : null;
      },
      enumerable: !1,
      configurable: !0
    }
  }), n;
}
function lt(n, t) {
  const e = n[t + "s"] ?? n[t] ?? [];
  return st(e) ? e : [e];
}
function $n(n) {
  return n.map((t) => ({
    events: t.events,
    url: t.url && t.url.replace(/&$/, "") || "",
    method: t.method && t.method.toUpperCase() || "GET",
    extraParams: t.extraParams || {}
  }));
}
function Ge(n) {
  return Bn(n, Me);
}
function Bn(n, t) {
  return n = Pe({}, n), n.start = t(n.start), n.end = t(n.end), n;
}
function dn(n) {
  const t = [...n].sort((s, r) => {
    const i = s.start.getTime(), a = r.start.getTime();
    return i !== a ? i - a : r.end.getTime() - s.end.getTime();
  }), e = [], o = /* @__PURE__ */ new Map();
  for (const s of t) {
    const r = s.start.getTime();
    let i = e.findIndex((a) => a <= r);
    i === -1 ? (i = e.length, e.push(s.end.getTime())) : e[i] = s.end.getTime(), o.set(s, i);
  }
  return o;
}
function Un(n) {
  return n === "background";
}
function Wn(n) {
  const t = [];
  return un(n, 0, !1, t), t;
}
function un(n, t, e, o) {
  const s = [];
  for (const r of n) {
    const i = zn(r);
    s.push(i), o.push(i);
    const a = { level: t, children: [], hidden: e };
    Hn(i, a), r.children && (a.children = un(
      r.children,
      t + 1,
      e || !i.expanded,
      o
    ));
  }
  return s;
}
function zn(n) {
  return {
    id: String(n.id),
    title: n.title || "",
    eventBackgroundColor: Yn(n),
    eventTextColor: Gn(n),
    expanded: n.expanded ?? !0,
    // S8 — visibility toggle. Default true so existing consumers see
    // no behaviour change. Setting `visible: false` removes the
    // resource (and, by extension, any nested children below the
    // hidden parent) from the rendered roster without forcing a
    // refetch.
    visible: n.visible ?? !0,
    workingHours: n.workingHours ?? null,
    extendedProps: n.extendedProps ?? {}
  };
}
function Yn(n) {
  return n?.eventBackgroundColor;
}
function Gn(n) {
  return n?.eventTextColor;
}
function Le(n) {
  return (t) => t === void 0 ? void 0 : n(t);
}
const fn = ["buttonText", "customButtons", "icons", "theme"];
function qn(n, t = {}) {
  const e = Xn(n), o = Vn(n);
  let s = wt(e, o);
  const r = wt(t, o), i = dt(s, "views") ?? {}, a = dt(r, "views") ?? {}, u = { ...s };
  t.view && (u.view = t.view);
  const w = {}, v = {}, g = {}, M = /* @__PURE__ */ new Set([...Ne(i), ...Ne(a)]);
  for (const y of M) {
    const d = a[y] ?? {}, b = Pt(
      s,
      i[y] ?? i[d.type] ?? {}
    ), T = Pt(b, r, d), x = dt(T, "component");
    delete T.view;
    for (const C of Ne(T))
      Lt(u, C) ? (w[C] || (w[C] = []), w[C].push(
        fn.includes(C) ? (_) => T[C] = _e(_) ? _(b[C]) : _ : (_) => T[C] = _
      )) : delete T[C];
    v[y] = T, g[y] = x;
  }
  v[u.view] ? Pe(u, v[u.view]) : Pe(u, r);
  function c(y, d, b = !0) {
    Lt(u, y) && (b || (y in o ? d = o[y](d) : nn(d) ? d = { ...d } : st(d) && (d = [...d])), w[y]?.forEach((T) => T(d)), u[y] = d);
  }
  function f(y) {
    if (v[y])
      return Pe(u, v[y]), g[y];
  }
  return {
    options: u,
    setOption: c,
    setViewOptions: f,
    viewComponents: g,
    // Sorted list of every view name registered by defaults + plugins +
    // the user. The controller exposes this on state so the toolbar can
    // tokenise view-switcher entries.
    viewNames: [...M].sort()
  };
}
function Xn(n) {
  const t = Zn();
  for (const e of n) e.createOptions?.(t);
  return t;
}
function Vn(n) {
  const t = {
    date: (e) => ne(ue(e)),
    dateIncrement: Le(ce),
    duration: ce,
    events: Ae,
    eventSources: $n,
    hiddenDays: (e) => [...new Set(e)],
    highlightedDates: (e) => e.map((o) => ne(ue(o))),
    resources: (e) => st(e) ? Wn(e) : e,
    validRange: Rn
  };
  for (const e of n) e.createParsers?.(t);
  return t;
}
function wt(n, t) {
  const e = { ...n };
  for (const o of Ne(t))
    o in e && (e[o] = t[o](e[o]));
  if (n.views) {
    e.views = {};
    for (const o of Ne(n.views))
      e.views[o] = wt(n.views[o], t);
  }
  return e;
}
function dt(n, t) {
  const e = n[t];
  return delete n[t], e;
}
function Pt(...n) {
  let t = {};
  for (const e of n) {
    const o = {};
    for (const s of fn)
      _e(e[s]) && (o[s] = e[s](t[s]));
    t = { ...t, ...e, ...o };
  }
  return t;
}
function Zn() {
  return {
    broadcast: void 0,
    broadcastChannel: void 0,
    broadcastFilter: void 0,
    buttonText: { today: "today" },
    // Opt-in macOS-Calendar-style continuous vertical scroll for the
    // dayGridMonth view (see components/month_scroller.js).
    continuousMonthScroll: !1,
    // Phase E2 — opt-in built-in "↩ Back to today" pill rendered by
    // the controller into the calendar root when the view is
    // off-period. Hosts that own their own UI keep this false and
    // listen for calendar:offPeriodChange instead.
    backToTodayPill: !1,
    offPeriodChange: void 0,
    customButtons: {},
    customScrollbars: !1,
    date: /* @__PURE__ */ new Date(),
    dateIncrement: void 0,
    datesSet: void 0,
    dayCellContent: void 0,
    dayHeaderFormat: { weekday: "short", month: "numeric", day: "numeric" },
    dayHeaderAriaLabelFormat: { dateStyle: "full" },
    displayEventEnd: !0,
    duration: { weeks: 1 },
    events: [],
    eventAllUpdated: void 0,
    eventBackgroundColor: void 0,
    eventClassNames: void 0,
    eventClick: void 0,
    eventColor: void 0,
    eventContent: void 0,
    eventDidMount: void 0,
    eventDoubleClick: void 0,
    eventDragStart: void 0,
    eventDragStop: void 0,
    eventDrop: void 0,
    eventPopoverEdit: void 0,
    eventPopoverDelete: void 0,
    eventPopoverOpen: void 0,
    eventPopoverClose: void 0,
    eventFilter: void 0,
    eventMouseEnter: void 0,
    eventMouseLeave: void 0,
    eventOrder: void 0,
    eventResize: void 0,
    eventResizeStart: void 0,
    eventResizeStop: void 0,
    eventSourceFailure: void 0,
    eventSourceSuccess: void 0,
    eventSources: [],
    eventTextColor: void 0,
    eventTimeFormat: { hour: "numeric", minute: "2-digit" },
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
    eventTypes: void 0,
    // S1 — recurrence-aware change confirmation. When set, the
    // Interaction plugin calls this hook after the default
    // `eventDrop` / `eventResize` listener has had its say (and not
    // reverted) but BEFORE the change commits, when the event is a
    // member of a series (extendedProps.rrule or
    // extendedProps.series?.id). The hook receives:
    //
    //   { kind: 'drop' | 'resize',
    //     event, oldEvent,
    //     delta?, startDelta?, endDelta?,
    //     isOccurrence: true, seriesId }
    //
    // and returns (or resolves to) either:
    //
    //   { proceed: true, scope: 'occurrence' | 'future' | 'series' }
    //   { proceed: false }
    //
    // `proceed: true` commits the change and fires
    // `calendar:eventChangeConfirmed` with the chosen scope so the
    // host can route the server-side write (EXDATE, child override,
    // master update). `proceed: false` discards the change without
    // calling `updateEvent` — the chip stays where it was.
    //
    // Non-series events skip the hook entirely.
    confirmEventChange: void 0,
    // S7 — Hotwire Native bridge action channel. When enabled, a
    // click on any element with a \`data-bridge-action\` attribute
    // inside the calendar (typically rendered by the host via
    // \`eventContent\`) fires a \`calendar:bridgeAction\` DOM event
    // with detail { kind, payload, fallbackHref, el, jsEvent }
    // instead of letting the WebView follow the link natively.
    //
    // Host listeners route the action through the native bridge
    // (CallKit for tel: / Maps for navigate / native nav for
    // open-resource) and call \`event.preventDefault()\` to confirm
    // they handled it; the library swallows the underlying click.
    //
    // Off by default (web behaviour unchanged). When on, hosts that
    // don't attach a listener AND don't preventDefault see the link's
    // natural href fire — so the same template works in a desktop
    // browser and inside Hotwire Native without forking.
    bridgeActions: !1,
    // S12 — first-render visual cue for newly-added events. When set
    // to a non-empty string, every event whose id has not been
    // rendered before picks up an `ec-event-appear-{name}` class on
    // the first render after add. Subsequent renders (re-layouts,
    // drag commits) don't re-apply the class. Host CSS owns the
    // animation — the library only stamps the marker.
    //
    // Per-event override: \`event.extendedProps.appearAnimation\`
    // wins over the calendar-level default. Set the per-event flag
    // when only AI-created events should announce themselves while
    // the human-added ones land silently.
    //
    // Off by default (no class emitted).
    eventAppearAnimation: void 0,
    // S13 — custom renderer for the conflict modal. Receives:
    //   { hostEl, eventId, serverValue, clientValue, onResolve }
    // and is expected to return a controller object \`{ close }\` (so
    // the library can dismiss the modal when a subsequent broadcast
    // resolves the conflict server-side). \`onResolve({ resolution,
    // eventId, … })\` MUST be called by the host's UI to fire
    // \`calendar:conflictResolved\` and apply the chosen value.
    //
    // Unset → default \`renderConflictModal\` from
    // src/components/conflict_modal.js is used.
    conflictRenderer: void 0,
    filterEventsWithResources: !1,
    firstDay: 0,
    headerToolbar: { start: "title", center: "", end: "today prev,next" },
    height: void 0,
    hiddenDays: [],
    highlightedDates: [],
    icons: {},
    lazyFetching: !0,
    loading: void 0,
    locale: void 0,
    refetchResourcesOnNavigate: !1,
    resources: [],
    resourceSourceFailure: void 0,
    resourceSourceSuccess: void 0,
    select: void 0,
    selectable: !1,
    suppressEventPopover: !1,
    dateClick: void 0,
    theme: Kn(),
    unselect: void 0,
    viewClassNames: void 0,
    viewDidMount: void 0,
    viewWillUnmount: void 0,
    timeZone: "local",
    titleFormat: { year: "numeric", month: "short", day: "numeric" },
    validRange: void 0,
    view: void 0,
    views: {}
  };
}
function Kn() {
  return {
    active: "ec-active",
    allDay: "ec-all-day",
    bgEvent: "ec-bg-event",
    bgEvents: "ec-bg-events",
    body: "ec-body",
    button: "ec-button",
    buttonGroup: "ec-button-group",
    calendar: "ec",
    colHead: "ec-col-head",
    customScrollbars: "ec-custom-scrollbars",
    day: "ec-day",
    dayHead: "ec-day-head",
    daySide: "ec-day-side",
    disabled: "ec-disabled",
    event: "ec-event",
    eventBody: "ec-event-body",
    eventTag: "ec-event-tag",
    eventTime: "ec-event-time",
    eventTitle: "ec-event-title",
    events: "ec-events",
    expander: "ec-expander",
    grid: "ec-grid",
    header: "ec-header",
    hidden: "ec-hidden",
    highlight: "ec-highlight",
    icon: "ec-icon",
    main: "ec-main",
    noBeb: "ec-no-beb",
    noEvents: "ec-no-events",
    noIeb: "ec-no-ieb",
    nowIndicator: "ec-now-indicator",
    otherMonth: "ec-other-month",
    popup: "ec-popup",
    rowHead: "ec-row-head",
    sidebar: "ec-sidebar",
    slot: "ec-slot",
    slots: "ec-slots",
    today: "ec-today",
    title: "ec-title",
    toolbar: "ec-toolbar",
    view: "",
    weekdays: ["ec-sun", "ec-mon", "ec-tue", "ec-wed", "ec-thu", "ec-fri", "ec-sat"],
    weekNumber: "ec-week-number"
  };
}
class Jn {
  constructor(t = {}) {
    this._data = { ...t }, this._listeners = /* @__PURE__ */ new Map(), this._anyListeners = /* @__PURE__ */ new Set();
  }
  // Read a value.
  get(t) {
    return this._data[t];
  }
  // Read every key as an object snapshot (cheap shallow copy).
  snapshot() {
    return { ...this._data };
  }
  // Write a value and notify subscribers. Skips notifications when the
  // value didn't change (===) so derived chains don't loop.
  set(t, e) {
    if (this._data[t] === e) return;
    const o = this._data[t];
    this._data[t] = e;
    const s = { key: t, value: e, prev: o };
    this._fire(`change:${t}`, s), this._anyListeners.forEach((r) => r(s));
  }
  // Bulk apply { key: value, ... }. Each change is dispatched individually
  // before the next is applied.
  assign(t) {
    for (const [e, o] of Object.entries(t)) this.set(e, o);
  }
  // Subscribe to `change:<name>`. Returns an unsubscribe thunk.
  on(t, e) {
    return this._listeners.has(t) || this._listeners.set(t, /* @__PURE__ */ new Set()), this._listeners.get(t).add(e), () => this._listeners.get(t)?.delete(e);
  }
  // Subscribe to every change. Receives the same { key, value, prev }
  // payload as targeted listeners. Useful for the derived pipeline that
  // recomputes anything that depends on any option.
  onAny(t) {
    return this._anyListeners.add(t), () => this._anyListeners.delete(t);
  }
  // Remove every subscriber. Used on controller teardown.
  destroy() {
    this._listeners.clear(), this._anyListeners.clear(), this._data = {};
  }
  _fire(t, e) {
    const o = this._listeners.get(t);
    if (o) for (const s of o) s(e);
  }
}
function Qn(n, t = {}) {
  const { options: e, setOption: o, setViewOptions: s, viewComponents: r, viewNames: i } = qn(n, t), a = new Jn({
    options: e,
    auxComponents: [],
    // populated by plugins (e.g. Interaction)
    features: [],
    // populated by per-view init (list, dayNumber, …)
    extensions: {},
    // per-view overrides for activeRange, viewResources
    viewNames: i
    // sorted list of registered view names
  });
  for (const u of n)
    u.initState?.(a);
  return { state: a, options: e, setOption: o, setViewOptions: s, viewComponents: r, viewNames: i };
}
function jn(n) {
  return !!n && (typeof n.createOptions == "function" || typeof n.createParsers == "function" || typeof n.initState == "function");
}
function eo(n) {
  if (!Array.isArray(n))
    throw new TypeError("plugins must be an array");
  for (const [t, e] of n.entries())
    if (!jn(e))
      throw new TypeError(
        `plugins[${t}] is not a plugin (expected at least one of createOptions / createParsers / initState)`
      );
  return n;
}
function to(n, t, e, o) {
  return {
    type: n,
    title: t,
    currentStart: e.start,
    currentEnd: e.end,
    activeStart: o.start,
    activeEnd: o.end,
    calendar: void 0
  };
}
function rt(n) {
  return n = Pe({}, n), n.currentStart = Me(n.currentStart), n.currentEnd = Me(n.currentEnd), n.activeStart = Me(n.activeStart), n.activeEnd = Me(n.activeEnd), n;
}
function no(n, t) {
  const e = /* @__PURE__ */ new Map(), o = [], s = (r) => {
    const i = e.get(r);
    typeof i == "function" && i();
    const a = r.run(n);
    typeof a == "function" ? e.set(r, a) : e.delete(r);
  };
  for (const r of t) {
    s(r);
    for (const i of r.deps ?? [])
      o.push(n.on(`change:${i}`, () => s(r)));
  }
  return () => {
    for (const r of o) r();
    for (const r of e.values()) typeof r == "function" && r();
    e.clear();
  };
}
function oo(n) {
  return {
    deps: ["options"],
    run(t) {
      const e = t.get("options"), o = n(e.view);
      t.set("extensions", {}), t.set("features", []), typeof o == "function" && t.set("viewComponent", o(t));
    }
  };
}
function Mt(n, t, e) {
  const o = n.get("fire");
  if (typeof o == "function") {
    o(t, e);
    return;
  }
  const s = n.get("options")?.[t];
  typeof s == "function" && s(e);
}
function so() {
  return {
    deps: ["activeRange"],
    run(n) {
      const t = n.get("activeRange"), e = n.get("view");
      !t || !e || Mt(n, "datesSet", {
        start: Me(t.start),
        end: Me(t.end),
        startStr: Ie(t.start),
        endStr: Ie(t.end),
        view: rt(e)
      });
    }
  };
}
function io() {
  return {
    deps: ["view"],
    run(n) {
      const t = n.get("view");
      t && queueMicrotask(() => Mt(n, "viewDidMount", { view: rt(t) }));
    }
  };
}
function ro(n) {
  let t = null;
  return {
    deps: ["activeRange"],
    run(e) {
      const o = e.get("activeRange");
      if (!o?.start || !o?.end) return;
      const s = `${o.start.getTime()}|${o.end.getTime()}`;
      if (s === t) return;
      t = s;
      const r = e.get("options"), i = Array.isArray(r.eventSources) && r.eventSources.length > 0, a = typeof r.events == "function";
      !i && !a || n();
    }
  };
}
function ao() {
  let n = null;
  return {
    deps: ["filteredEvents"],
    run(t) {
      const e = t.get("view");
      e && (n || (n = setTimeout(() => {
        n = null, Mt(t, "eventAllUpdated", { view: rt(e) });
      }, 0)));
    }
  };
}
function co() {
  return {
    deps: ["offset"],
    run(n) {
      const t = n.get("offset"), e = () => {
        const s = ue(void 0, t), r = ne($(s));
        n.set("now", s);
        const i = n.get("today");
        (!i || !Ce(i, r)) && n.set("today", r);
      };
      e();
      const o = setInterval(e, 1e3);
      return () => clearInterval(o);
    }
  };
}
function lo(n) {
  return {
    deps: ["offset"],
    run(t) {
      const e = t.get("offset"), o = t.get("options"), s = t.get("events") ?? o?.events ?? [];
      for (const i of s)
        if (!i.allDay)
          for (const a of ["start", "end"]) {
            const u = je(i[a]);
            u !== void 0 && St(i[a], e - u), We(i[a], e);
          }
      const r = je(o.date);
      if (r !== void 0) {
        const i = ue(void 0, e).getUTCDay() - ue(void 0, r).getUTCDay(), a = ae($(o.date), i);
        n("date", a);
      }
      We(o.date, e);
    }
  };
}
const ut = /* @__PURE__ */ new Map();
function uo(n) {
  if (ut.has(n)) return ut.get(n);
  let t = null;
  try {
    t = new Intl.DateTimeFormat("en-US", {
      timeZone: n,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    t = null;
  }
  return ut.set(n, t), t;
}
function fo(n, t = /* @__PURE__ */ new Date()) {
  const e = uo(n);
  if (!e) return;
  let o, s, r, i, a, u;
  for (const v of e.formatToParts(t))
    switch (v.type) {
      case "year":
        o = Number(v.value);
        break;
      case "month":
        s = Number(v.value);
        break;
      case "day":
        r = Number(v.value);
        break;
      case "hour":
        i = Number(v.value);
        break;
      case "minute":
        a = Number(v.value);
        break;
      case "second":
        u = Number(v.value);
        break;
    }
  i === 24 && (i = 0);
  const w = Date.UTC(o, s - 1, r, i, a, u);
  return Math.round((w - t.getTime()) / 6e4);
}
function pn(n, t) {
  let e;
  if (_e(t))
    e = t;
  else {
    const o = new Intl.DateTimeFormat(n, { timeZone: "UTC", ...t });
    e = (s, r) => {
      if (s <= r) return o.formatRange(s, r);
      const i = o.formatRangeToParts(r, s);
      let a = "";
      const u = ["startRange", "endRange"], w = [!1, !1];
      for (const v of i) {
        const g = u.indexOf(v.source);
        g >= 0 ? w[g] || (a += po(u[1 - g], i), w[g] = !0) : a += v.value;
      }
      return a;
    };
  }
  return { formatRange: e };
}
function po(n, t) {
  let e = "";
  for (const o of t) o.source === n && (e += o.value);
  return e;
}
function hn(n, t, e) {
  const o = $(n);
  t.years ? (o.setUTCMonth(0), o.setUTCDate(1)) : t.months ? o.setUTCDate(1) : t.inWeeks && it(o, e);
  const s = Te($(o), t);
  return { start: o, end: s };
}
function gn(n, t) {
  const e = $(n.start), o = $(n.end);
  return t ? t(e, o) : { start: e, end: o };
}
function ke(n, t) {
  const e = [], o = ne($(n.start)), s = ne($(n.end));
  for (; o < s; )
    t.includes(o.getUTCDay()) || e.push($(o)), ae(o);
  return e;
}
function mn(n, t) {
  return n.formatRange(t.start, rn($(t.end)));
}
function vn(n, t, e) {
  const { eventFilter: o, eventOrder: s, filterEventsWithResources: r, resources: i } = e;
  let a = [...n];
  if (_e(o)) {
    const u = n.map(Ge), w = rt(t);
    a = a.filter((v, g) => o({
      event: Ge(v),
      index: g,
      events: u,
      view: w
    }));
  }
  return r && (a = a.filter((u) => i.some((w) => u.resourceIds.includes(w.id)))), _e(s) ? a.sort((u, w) => s(Ge(u), Ge(w))) : a.sort((u, w) => u.start - w.start || w.allDay - u.allDay), a;
}
function ho(n, t = void 0) {
  if (n === "local") return Qe(t);
  if (n === "UTC") return 0;
  const e = an(n);
  if (e !== void 0) return e;
  const o = fo(n, t);
  return o !== void 0 ? o : Qe(t);
}
function yn(n, t, e, o) {
  return to(n, t, e, o);
}
function ft(n, t, e = {}) {
  const o = t.get("options"), s = o.theme, r = o.headerToolbar ?? {};
  n.replaceChildren();
  for (const i of ["start", "center", "end"]) {
    const a = (r[i] ?? "").trim(), u = h("div", "", "", [["data-toolbar-slot", i]]);
    a && go(u, a, t, e, s), n.append(u);
  }
}
function go(n, t, e, o, s) {
  for (const r of t.split(/\s+/)) {
    const i = h("div", s.buttonGroup);
    for (const a of r.split(",").filter(Boolean)) {
      const u = mo(a, e, o, s);
      u && i.append(u);
    }
    i.children.length === 1 ? n.append(i.firstChild) : i.children.length > 1 && n.append(i);
  }
}
function mo(n, t, e, o) {
  const s = bo[n];
  if (s) return s(t, e, o);
  const r = t.get("options");
  return (t.get("viewNames") ?? []).includes(n) ? vo(n, t, e, o) : r.customButtons && Object.hasOwn(r.customButtons, n) ? yo(n, t, e, o) : null;
}
function vo(n, t, e, o) {
  const s = t.get("options"), r = s.buttonText?.[n] ?? n, i = h("button", `${o.button} ec-${wo(n)}`, r, [
    ["type", "button"],
    ["data-toolbar-action", "view"],
    ["data-toolbar-view", n]
  ]);
  return s.view === n && i.classList.add(o.active), i.addEventListener("click", () => e?.gotoView?.(n)), i;
}
function yo(n, t, e, o) {
  const s = t.get("options").customButtons?.[n] ?? {}, r = h("button", `${o.button} ec-custom`, s.text ?? n, [
    ["type", "button"],
    ["data-toolbar-action", "customButton"],
    ["data-toolbar-button", n]
  ]);
  return r.addEventListener("click", () => e?.fireCustomButton?.(n)), r;
}
function wo(n) {
  return n.replace(/[A-Z]/g, (t) => "-" + t.toLowerCase()).replace(/^-/, "");
}
function It(n, t) {
  const e = n.get("options")?.validRange, o = n.get("currentRange");
  return !e || !o ? !1 : !!(t === "start" && e.start && o.start <= e.start || t === "end" && e.end && o.end >= e.end);
}
const bo = {
  title(n, t, e) {
    return h("h2", e.title, n.get("viewTitle") ?? "");
  },
  prev(n, t, e) {
    const o = h("button", `${e.button} ec-prev`, "", [
      ["type", "button"],
      ["aria-label", "Previous"],
      ["data-toolbar-action", "prev"]
    ]);
    return o.innerHTML = '<i class="ec-icon ec-prev"></i>', It(n, "start") ? (o.disabled = !0, o.classList.add(e.disabled)) : o.addEventListener("click", () => t?.prev?.()), o;
  },
  next(n, t, e) {
    const o = h("button", `${e.button} ec-next`, "", [
      ["type", "button"],
      ["aria-label", "Next"],
      ["data-toolbar-action", "next"]
    ]);
    return o.innerHTML = '<i class="ec-icon ec-next"></i>', It(n, "end") ? (o.disabled = !0, o.classList.add(e.disabled)) : o.addEventListener("click", () => t?.next?.()), o;
  },
  today(n, t, e) {
    const s = n.get("options").buttonText?.today ?? "today", r = h("button", `${e.button} ec-today`, s, [
      ["type", "button"],
      ["data-toolbar-action", "today"]
    ]);
    return r.addEventListener("click", () => t?.today?.()), r;
  }
};
let Dt = null, pe = null, $e = null, Be = null;
const To = { hour: "numeric", minute: "2-digit" }, Co = { day: "numeric", month: "short", year: "numeric" };
function Ot({ event: n, anchorEl: t, state: e }) {
  if (xe(), !n || !t) return null;
  const o = e.get("options"), s = o?.locale, r = e.get("fire");
  pe = h("div", "ec-event-popover", "", [
    ["role", "dialog"],
    ["aria-modal", "false"],
    ["data-popover", "event"],
    ["data-event-id", n.id]
  ]);
  const i = h("div", "ec-event-popover-card ec-event-popover-card-title"), a = h("div", "ec-event-popover-title-row");
  a.append(h("div", "ec-event-popover-title", n.title || "(untitled)"));
  const u = h("span", "ec-event-popover-swatch"), w = n.backgroundColor || o?.eventBackgroundColor || o?.eventColor;
  w && (u.style.background = w), a.append(u), i.append(a);
  const v = n.extendedProps?.location;
  v && i.append(h("div", "ec-event-popover-location", String(v)));
  const g = h("button", "ec-event-popover-close", "×", [
    ["type", "button"],
    ["aria-label", "Close"]
  ]);
  g.addEventListener("click", xe), i.append(g), pe.append(i);
  const M = h("div", "ec-event-popover-card");
  M.append(h("div", "ec-event-popover-when", xo(n, s))), n.extendedProps?.category && M.append(h(
    "div",
    "ec-event-popover-when-meta",
    `Category: ${n.extendedProps.category}`
  )), pe.append(M);
  const c = n.extendedProps?.attendees;
  if (c) {
    const C = h("div", "ec-event-popover-card");
    C.append(h("div", "ec-event-popover-card-label", "Invitees")), C.append(h("div", "ec-event-popover-card-value", String(c))), pe.append(C);
  }
  const f = n.extendedProps?.description;
  if (f) {
    const C = h("div", "ec-event-popover-card");
    C.append(h("div", "ec-event-popover-card-label", "Notes")), C.append(h("p", "ec-event-popover-desc", String(f))), pe.append(C);
  }
  const y = Object.entries(n.extendedProps ?? {}).filter(([C]) => !["description", "category", "location", "attendees", "links"].includes(C)).filter(([, C]) => C != null && C !== "");
  if (y.length) {
    const C = h("div", "ec-event-popover-card"), _ = h("dl", "ec-event-popover-props");
    for (const [A, P] of y)
      _.append(h("dt", "", _o(A))), _.append(h("dd", "", String(P)));
    C.append(_), pe.append(C);
  }
  const d = Array.isArray(n.extendedProps?.links) ? n.extendedProps.links.filter((C) => C && C.href) : [];
  if (d.length) {
    const C = h("div", "ec-event-popover-card ec-event-popover-card-links");
    for (const _ of d) {
      const A = h("a", "ec-event-popover-link", "", [
        ["href", _.href],
        ["data-popover-link", ""]
      ]);
      _.target && A.setAttribute("target", _.target), _.rel && A.setAttribute("rel", _.rel), A.append(h(
        "span",
        "ec-event-popover-link-label",
        String(_.label ?? _.href)
      ));
      const P = h("span", "ec-event-popover-link-chevron", "", [
        ["aria-hidden", "true"]
      ]);
      P.innerHTML = '<svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 2 L8.5 6 L4.5 10" stroke-linecap="round" stroke-linejoin="round"/></svg>', A.append(P), A.addEventListener("click", () => {
        r?.("eventPopoverLinkOpen", { event: n, link: _ }), xe();
      }), C.append(A);
    }
    pe.append(C);
  }
  const b = h("div", "ec-event-popover-footer"), T = h("button", "ec-event-popover-action", "Edit", [
    ["type", "button"],
    ["data-popover-action", "edit"]
  ]), x = h("button", "ec-event-popover-action ec-event-popover-danger", "Delete", [
    ["type", "button"],
    ["data-popover-action", "delete"]
  ]);
  return T.addEventListener("click", () => {
    r?.("eventPopoverEdit", { event: n }), xe();
  }), x.addEventListener("click", () => {
    r?.("eventPopoverDelete", { event: n }), xe();
  }), b.append(T, x), pe.append(b), document.body.appendChild(pe), Do(pe, t), setTimeout(() => {
    $e = (C) => {
      pe && !pe.contains(C.target) && !t.contains(C.target) && xe();
    }, Be = (C) => {
      C.key === "Escape" && xe();
    }, document.addEventListener("mousedown", $e, !0), document.addEventListener("keydown", Be, !0);
  }, 0), Dt = n.id, r?.("eventPopoverOpen", { event: n, el: pe }), pe;
}
function xe() {
  pe && (pe.remove(), pe = null, Dt = null, $e && (document.removeEventListener("mousedown", $e, !0), $e = null), Be && (document.removeEventListener("keydown", Be, !0), Be = null));
}
function So() {
  return pe !== null;
}
function Mo() {
  return Dt;
}
function Do(n, t) {
  const e = t.getBoundingClientRect(), o = n.getBoundingClientRect(), s = 8;
  let r = e.right + s, i = e.top, a = "right";
  r + o.width + s > window.innerWidth && (r = Math.max(s, e.left - o.width - s), a = "left"), i + o.height + s > window.innerHeight && (i = Math.max(s, window.innerHeight - o.height - s));
  const u = Math.max(s, r), w = Math.max(s, i);
  n.style.position = "fixed", n.style.left = `${u}px`, n.style.top = `${w}px`, n.setAttribute("data-popover-side", a);
  const g = e.top + e.height / 2 - w, M = 14, c = o.height - 14, f = Math.max(M, Math.min(c, g));
  n.style.setProperty("--popover-arrow-top", `${f}px`);
}
function xo(n, t) {
  const e = new Intl.DateTimeFormat(t, { timeZone: "UTC", ...Co }), o = new Intl.DateTimeFormat(t, { timeZone: "UTC", ...To });
  if (n.allDay) {
    const u = e.format(n.start);
    if (!n.end) return u;
    const w = new Date(n.end.getTime() - 1), v = e.format(w);
    return u === v ? `${u} · all day` : `${u} — ${v}`;
  }
  const s = e.format(n.start), r = o.format(n.start), i = e.format(n.end), a = o.format(n.end);
  return s === i ? `${s}  ${r} – ${a}` : `${s} ${r} → ${i} ${a}`;
}
function _o(n) {
  return n.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " ").replace(/^./, (t) => t.toUpperCase()).trim();
}
const Eo = 0.22, Lo = 140, qe = 260, Rt = "cubic-bezier(0.22, 1, 0.36, 1)", ko = 6, Ao = 180, Po = 0.35, Io = 200, pt = 230, Ht = "cubic-bezier(0.4, 0, 1, 1)";
function Oo(n, t, e, { onNavigate: o }) {
  const s = He("div", "ec-pager", { tabindex: "0" }), r = He("div", "ec-pager-track"), i = [
    He("div", "ec-pager-page"),
    He("div", "ec-pager-page"),
    He("div", "ec-pager-page")
  ];
  r.append(...i), s.append(r), n.replaceChildren(s);
  let a = 1;
  const u = [null, null, null];
  M();
  let w = e(i[a], t);
  y(0, !1);
  let v = !1;
  const g = t.on("change:currentRange", () => {
    v || f();
  });
  function M() {
    const l = Ee(a - 1), S = Ee(a + 1);
    for (let D = 0; D < 3; ++D) {
      const E = i[D];
      E.classList.remove("ec-pager-page-prev", "ec-pager-page-current", "ec-pager-page-next"), E.removeAttribute("aria-hidden"), D === a ? E.classList.add("ec-pager-page-current") : D === l ? (E.classList.add("ec-pager-page-prev"), E.setAttribute("aria-hidden", "true")) : D === S && (E.classList.add("ec-pager-page-next"), E.setAttribute("aria-hidden", "true"));
    }
  }
  function c() {
    const l = t.get("options"), S = l.dateIncrement ?? l.duration;
    if (!S) return;
    const D = Ee(a - 1), E = Ee(a + 1), U = i[a].querySelector?.('[data-row="body"]')?.scrollTop ?? 0;
    if (!u[D]) {
      const q = sn($(l.date), S), Z = Ft(t, q);
      i[D].replaceChildren(), u[D] = e(i[D], Z);
      const J = i[D].querySelector?.('[data-row="body"]');
      J && (J.scrollTop = U);
    }
    if (!u[E]) {
      const q = Te($(l.date), S), Z = Ft(t, q);
      i[E].replaceChildren(), u[E] = e(i[E], Z);
      const J = i[E].querySelector?.('[data-row="body"]');
      J && (J.scrollTop = U);
    }
  }
  function f() {
    for (let l = 0; l < 3; ++l)
      l !== a && (u[l] && (u[l](), u[l] = null), i[l].replaceChildren());
  }
  function y(l, S) {
    s.style.setProperty("--ec-pager-px", `${l}px`), s.style.setProperty(
      "--ec-pager-transition",
      S ? `transform ${qe}ms ${Rt}` : "none"
    ), r.style.transition = S ? `transform ${qe}ms ${Rt}` : "none", r.style.transform = `translate3d(${l}px, 0, 0)`;
  }
  function d(l) {
    const S = Ee(a + l), E = i[S].querySelector?.('[data-row="body"]')?.scrollTop ?? null;
    w && (w(), w = null), i[a].replaceChildren();
    const G = Ee(a - l);
    if (u[G] && (u[G](), u[G] = null), i[G].replaceChildren(), a = S, M(), y(0, !1), v = !0, o?.({ direction: l }), u[a] && (u[a](), u[a] = null), w = e(i[a], t), E != null) {
      const U = i[a].querySelector?.('[data-row="body"]');
      U && (U.scrollTop = E);
    }
    v = !1;
  }
  let b = null, T = !1;
  function x(l) {
    b || I || l.button !== void 0 && l.button !== 0 || l.pointerType !== "mouse" && (k(l.target, { allowEventChips: l.pointerType === "touch" }) || (A(l.clientX, l.clientY, { pointerId: l.pointerId }), document.addEventListener("pointermove", P, { passive: !1 }), document.addEventListener("pointerup", z), document.addEventListener("pointercancel", z)));
  }
  function C(l) {
    if (I || l.touches?.length !== 1) return;
    const S = l.touches[0];
    if (b) {
      b.touchId ?? (b.touchId = S.identifier), _();
      return;
    }
    k(l.target, { allowEventChips: !0 }) || (A(S.clientX, S.clientY, { touchId: S.identifier }), _());
  }
  function _() {
    T || (T = !0, document.addEventListener("touchmove", R, { passive: !1 }), document.addEventListener("touchend", N, { passive: !1 }), document.addEventListener("touchcancel", N, { passive: !1 }));
  }
  function A(l, S, { pointerId: D, touchId: E } = {}) {
    b = {
      startX: l,
      startY: S,
      lastX: l,
      lastY: S,
      pointerId: D,
      touchId: E,
      decided: !1,
      abandoned: !1
    };
  }
  function P(l) {
    !b || b.abandoned || V(l.clientX, l.clientY, l);
  }
  function R(l) {
    if (!b || b.abandoned) return;
    const S = H(l);
    S && V(S.clientX, S.clientY, l);
  }
  function V(l, S, D) {
    if (document.body.classList.contains("ec-dragging") || document.body.classList.contains("ec-resizing-active")) {
      b.abandoned = !0, K();
      return;
    }
    b.lastX = l, b.lastY = S;
    const E = l - b.startX, G = S - b.startY;
    if (!b.decided) {
      if (Math.abs(G) > Math.abs(E) + ko) {
        b.abandoned = !0;
        return;
      }
      if (Math.abs(E) < 6) return;
      b.decided = !0, c(), s.classList.add("ec-pager-dragging");
      try {
        s.setPointerCapture?.(b.pointerId);
      } catch {
      }
    }
    D.cancelable && D.preventDefault(), y(E, !1);
  }
  function z(l) {
    K();
  }
  function N(l) {
    const S = H(l);
    S && b && (b.lastX = S.clientX, b.lastY = S.clientY), K();
  }
  function K() {
    if (!b) return;
    const l = b;
    if (b = null, document.removeEventListener("pointermove", P), document.removeEventListener("pointerup", z), document.removeEventListener("pointercancel", z), F(), !l.decided || l.abandoned) {
      s.classList.remove("ec-pager-dragging"), y(0, !1);
      return;
    }
    const S = l.lastX - l.startX, D = s.offsetWidth || n.offsetWidth || 1, E = Math.min(D * Eo, Lo);
    S <= -E ? Q(-D, 1) : S >= E ? Q(+D, -1) : (y(0, !0), setTimeout(() => s.classList.remove("ec-pager-dragging"), qe));
  }
  function H(l) {
    const S = [l.touches, l.changedTouches];
    for (const D of S)
      if (D) {
        for (const E of Array.from(D))
          if (E.identifier === b?.touchId) return E;
      }
    return l.touches?.[0] ?? l.changedTouches?.[0] ?? null;
  }
  function F() {
    T && (T = !1, document.removeEventListener("touchmove", R), document.removeEventListener("touchend", N), document.removeEventListener("touchcancel", N));
  }
  function k(l, { allowEventChips: S = !1 } = {}) {
    return l.closest?.(".ec-resizer, .ec-event.ec-event-editing") || !S && l.closest?.("[data-event-id]") ? !0 : !!l.closest?.("[data-more-link], [data-popover-action], .ec-pager-no-swipe, .ec-button, button, input, select, textarea, a");
  }
  let I = null, X = null;
  function L(l) {
    if (b || Math.abs(l.deltaX) <= Math.abs(l.deltaY)) return;
    l.preventDefault(), I || (I = { acc: 0, endTimer: null }, c(), s.classList.add("ec-pager-dragging")), I.acc -= l.deltaX;
    const S = s.offsetWidth || n.offsetWidth || 1, D = Math.max(-S, Math.min(S, I.acc));
    y(D, !1);
    const E = Math.min(S * Po, Io);
    clearTimeout(I.endTimer), I.acc <= -E ? (I = null, s.classList.remove("ec-pager-dragging"), Q(-S, 1)) : I.acc >= E ? (I = null, s.classList.remove("ec-pager-dragging"), Q(+S, -1)) : I.endTimer = setTimeout(() => {
      I && (I = null, s.classList.remove("ec-pager-dragging"), y(0, !0));
    }, Ao), clearTimeout(X), X = setTimeout(f, 1500);
  }
  function Y(l) {
    l.target !== s && !s.contains(l.target) || l.metaKey || l.ctrlKey || l.altKey || l.target.matches?.('input, textarea, select, [contenteditable="true"]') || (l.key === "ArrowLeft" ? (l.preventDefault(), c(), s.classList.add("ec-pager-dragging"), Q(window.innerWidth || s.offsetWidth, -1)) : l.key === "ArrowRight" && (l.preventDefault(), c(), s.classList.add("ec-pager-dragging"), Q(-(window.innerWidth || s.offsetWidth), 1)));
  }
  function Q(l, S) {
    y(l, !0), setTimeout(() => {
      d(S), s.classList.remove("ec-pager-dragging");
    }, qe);
  }
  let m = null;
  function O(l) {
    return new Promise((S) => {
      const D = s.offsetWidth || n.offsetWidth || 0;
      if (!D || l !== 1 && l !== -1) {
        S();
        return;
      }
      c();
      const G = i[a].querySelector?.('[data-row="body"]')?.scrollTop ?? 0, U = Ee(a + l), q = i[U].querySelector?.('[data-row="body"]');
      q && (q.scrollTop = G), s.classList.add("ec-pager-dragging");
      const Z = -l * D;
      r.style.transition = `transform ${pt}ms ${Ht}`, s.style.setProperty(
        "--ec-pager-transition",
        `transform ${pt}ms ${Ht}`
      ), s.style.setProperty("--ec-pager-px", `${Z}px`), r.style.transform = `translate3d(${Z}px, 0, 0)`;
      const J = { resolve: S, aborted: !1 };
      J.timer = setTimeout(() => {
        if (J.aborted) return;
        m === J && (m = null), d(l), s.classList.remove("ec-pager-dragging");
        const B = i[a].querySelector?.('[data-row="body"]');
        B && (B.scrollTop = G), S();
      }, pt), m = J;
    });
  }
  function p() {
    if (!m) return !1;
    const l = m;
    return m = null, l.aborted = !0, clearTimeout(l.timer), r.style.transition = "none", s.style.setProperty("--ec-pager-transition", "none"), s.style.setProperty("--ec-pager-px", "0px"), r.style.transform = "translate3d(0px, 0, 0)", s.classList.remove("ec-pager-dragging"), l.resolve(), !0;
  }
  return s.addEventListener("pointerdown", x, { capture: !0 }), s.addEventListener("touchstart", C, { capture: !0, passive: !0 }), s.addEventListener("wheel", L, { passive: !1 }), s.addEventListener("keydown", Y), {
    destroy() {
      g?.();
      try {
        w && w();
      } catch {
      }
      f(), clearTimeout(X), s.removeEventListener("pointerdown", x, { capture: !0 }), s.removeEventListener("touchstart", C, { capture: !0 }), s.removeEventListener("wheel", L), s.removeEventListener("keydown", Y), document.removeEventListener("pointermove", P), document.removeEventListener("pointerup", z), document.removeEventListener("pointercancel", z), F(), n.replaceChildren();
    },
    // The pager root element — exposed so the Interaction plugin can
    // measure the edge zones for cross-day drag against the live
    // viewport (rather than the calendar root, which on mobile shells
    // also covers the toolbar / bottom-bar gutters).
    element: s,
    stepDuringDrag: O,
    abortStepDuringDrag: p,
    // Test helper — surfaces the inner DOM nodes without coupling tests
    // to the class names directly.
    _nodes() {
      return {
        pager: s,
        track: r,
        prevPage: i.find((l) => l.classList.contains("ec-pager-page-prev")),
        currentPage: i.find((l) => l.classList.contains("ec-pager-page-current")),
        nextPage: i.find((l) => l.classList.contains("ec-pager-page-next"))
      };
    }
  };
}
function Ft(n, t) {
  const o = { ...n.get("options"), date: t }, s = hn(o.date, o.duration, o.firstDay), r = gn(s, n.get("extensions")?.activeRange), i = ke(r, o.hiddenDays ?? []), a = pn(o.locale, o.titleFormat), u = mn(a, s), w = yn(o.view, u, s, r), v = n.get("events") ?? o.events ?? [], g = Array.isArray(v) ? v : [], M = n.get("resources") ?? o.resources ?? [], c = Array.isArray(M) ? M : [], f = vn(g, w, {
    eventFilter: o.eventFilter,
    eventOrder: o.eventOrder,
    filterEventsWithResources: o.filterEventsWithResources,
    resources: c
  }), y = {
    options: o,
    currentRange: s,
    activeRange: r,
    viewDates: i,
    intlTitle: a,
    viewTitle: u,
    view: w,
    filteredEvents: f,
    fire: () => {
    }
    // snapshots are non-interactive
  }, d = () => {
  };
  return {
    get(b) {
      return b in y ? y[b] : n.get(b);
    },
    set() {
    },
    on() {
      return d;
    },
    onAny() {
      return d;
    },
    snapshot() {
      return { ...n.snapshot(), ...y };
    },
    destroy() {
    }
  };
}
function He(n, t, e = {}) {
  const o = document.createElement(n);
  o.className = t;
  for (const [s, r] of Object.entries(e)) o.setAttribute(s, r);
  return o;
}
function Ee(n) {
  return (n % 3 + 3) % 3;
}
const Nt = 600, Ro = 140, $t = 3, Ho = 12, Fo = 0;
function No(n, t, { onDateChange: e }) {
  const o = h("div", "ec-month-scroller"), s = h("div", "ec-month-scroller-head"), r = h("div", "ec-month-scroller-body");
  o.append(s, r), n.replaceChildren(o), $o(s, t);
  let i = [];
  const a = Ve($(t.get("options").date)), u = t.get("options").validRange?.start, w = u ? ne($(u)) : (() => {
    const H = Ve($(a));
    return H.setUTCMonth(H.getUTCMonth() - Fo), H;
  })(), v = Ve($(a));
  v.setUTCMonth(v.getUTCMonth() + Ho), ht(r, w, v, i, t), requestAnimationFrame(() => {
    const H = i.find(
      (F) => F.monthAnchor && F.monthAnchor.getUTCFullYear() === a.getUTCFullYear() && F.monthAnchor.getUTCMonth() === a.getUTCMonth()
    );
    if (H) {
      const F = H.rowEl.offsetTop - 12, k = r.style.scrollBehavior;
      r.style.scrollBehavior = "auto", d = !0, r.scrollTop = Math.max(0, F), r.offsetTop, r.style.scrollBehavior = k || "", requestAnimationFrame(() => {
        d = !1;
      });
    }
    r.addEventListener("scroll", C, { passive: !0 });
  }), r.addEventListener("click", (H) => {
    if (H.target.closest("[data-event-id], [data-more-link]")) return;
    const F = H.target.closest(".ec-month-scroller-cell");
    if (!F) return;
    H.stopPropagation();
    const k = F.getAttribute("data-date");
    if (!k) return;
    r.querySelectorAll(".ec-month-scroller-cell.ec-selected").forEach((Y) => Y.classList.remove("ec-selected")), F.classList.add("ec-selected");
    const [I, X, L] = k.split("-").map(Number);
    b = !0, f(new Date(I, X - 1, L));
  }), r.addEventListener("dblclick", (H) => {
    if (H.target.closest("[data-event-id], [data-more-link]")) return;
    const F = H.target.closest(".ec-month-scroller-cell");
    if (!F) return;
    H.stopPropagation();
    const k = F.getAttribute("data-date");
    k && t.get("fire")?.("dateClick", {
      date: /* @__PURE__ */ new Date(k + "T00:00:00Z"),
      dateStr: k,
      allDay: !0,
      jsEvent: H,
      view: t.get("view")
    });
  });
  let g = null;
  const M = t.onAny(({ key: H }) => {
    if (["filteredEvents", "currentRange", "activeRange", "options"].includes(H)) {
      if (g) return;
      g = setTimeout(() => {
        g = null, Xe(i, t, f);
      }, 0);
    }
  });
  Xe(i, t, f);
  const c = t.on("change:currentRange", () => {
    if (d) return;
    const H = t.get("options").date;
    if (!H) return;
    const F = Ve($(H)), k = () => i.find(
      (L) => L.monthAnchor && L.monthAnchor.getUTCFullYear() === F.getUTCFullYear() && L.monthAnchor.getUTCMonth() === F.getUTCMonth()
    );
    let I = k();
    if (!I) {
      const L = i[i.length - 1]?.weekStart && i[i.length - 1].weekStart < F, Y = i[0]?.weekStart && i[0].weekStart > F;
      if (L)
        for (; i[i.length - 1].weekStart < F; ) N();
      else if (Y)
        for (; i[0].weekStart > F; ) {
          const Q = i[0].weekStart;
          if (K(), i[0].weekStart >= Q) break;
        }
      I = k();
    }
    if (!I) return;
    d = !0;
    const X = r.style.scrollBehavior;
    r.style.scrollBehavior = "auto", r.scrollTop = Math.max(0, I.rowEl.offsetTop - 12), r.style.scrollBehavior = X || "", requestAnimationFrame(() => {
      d = !1;
    });
  });
  function f(H, F = !0) {
    d = !0, F && (b = !0), e?.(H), requestAnimationFrame(() => {
      d = !1;
    });
  }
  let y = null, d = !1, b = !0, T = null;
  function x() {
    o.classList.add("ec-scrolling"), clearTimeout(T), T = setTimeout(
      () => o.classList.remove("ec-scrolling"),
      400
    );
  }
  function C() {
    d || (b = !1), x(), d || (r.scrollHeight - (r.scrollTop + r.clientHeight) < Nt && N(), r.scrollTop < Nt && K()), clearTimeout(y), y = setTimeout(V, Ro);
  }
  function _() {
    const H = r.scrollTop + r.clientHeight / 4;
    let F = null;
    for (const I of i) {
      if (I.rowEl.offsetTop > H) break;
      F = I;
    }
    if (F = F ?? i[0], !F) return null;
    const k = $(F.weekStart);
    return ae(k, 3), new Date(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate());
  }
  const A = 220;
  let P = 0, R = null;
  function V() {
    if (d) return;
    clearTimeout(R);
    const H = r.scrollTop;
    R = setTimeout(function F() {
      const k = r.scrollTop;
      if (k !== P) {
        P = k, R = setTimeout(F, A);
        return;
      }
      const I = _();
      if (!I) return;
      const X = t.get("options").date;
      Math.abs(I.getTime() - X.getTime()) >= 864e5 / 2 && f(I, !1);
    }, A), P = H;
  }
  function z() {
    if (d || b) return;
    const H = _();
    if (!H) return;
    const F = t.get("options").date;
    Math.abs(H.getTime() - F.getTime()) >= 864e5 / 2 && e?.(H);
  }
  function N() {
    const H = i[i.length - 1];
    if (!H) return;
    const F = Te($(H.weekStart), ce({ weeks: 1 })), k = $(F);
    k.setUTCMonth(k.getUTCMonth() + $t), ht(r, F, k, i, t, {}), Xe(i, t, f);
  }
  function K() {
    const H = i[0];
    if (!H) return;
    const F = t.get("options").validRange?.start;
    if (F) {
      const Q = ne($(F));
      if (H.weekStart <= Q) return;
    }
    const k = $(H.weekStart), I = $(k);
    if (I.setUTCMonth(I.getUTCMonth() - $t), F) {
      const Q = ne($(F));
      I < Q && I.setTime(Q.getTime());
    }
    const X = t.get("options").firstDay ?? 0;
    it(I, X);
    const L = r.scrollHeight;
    ht(r, I, k, i, t, { prepend: !0 }), Xe(i, t, f);
    const Y = r.scrollHeight;
    d = !0, r.scrollTop += Y - L, requestAnimationFrame(() => {
      d = !1;
    });
  }
  return {
    destroy() {
      z(), M(), c?.(), clearTimeout(g), clearTimeout(y), clearTimeout(T), r.removeEventListener("scroll", C), n.replaceChildren();
    },
    // Test/debug helper.
    _state() {
      return { weekRows: i, body: r };
    }
  };
}
function $o(n, t) {
  const e = t.get("options"), o = e.theme, s = e.firstDay ?? 0, r = new Intl.DateTimeFormat(e.locale, { timeZone: "UTC", weekday: "short" });
  n.replaceChildren();
  for (let i = 0; i < 7; ++i) {
    const a = (s + i) % 7, u = new Date(Date.UTC(1970, 0, 4 + a)), w = h("div", `${o.dayHead ?? "ec-day-head"} ec-month-scroller-day-head`, r.format(u), [
      ["data-day", String(a)]
    ]);
    n.append(w);
  }
}
function ht(n, t, e, o, s, r = {}) {
  const i = s.get("options"), a = i.theme, u = i.firstDay ?? 0, w = ne($(t));
  it(w, u);
  const v = ne($(e)), g = [];
  for (; w < v; ) {
    const M = Uo(w);
    if (!o.find((f) => Ce(f.weekStart, w))) {
      const f = h("div", "ec-month-scroller-row", "", [
        ["data-week-start", bt(w)]
      ]), y = h("div", "ec-month-scroller-cells"), d = ne(/* @__PURE__ */ new Date());
      for (const b of M) {
        const T = Ce(ne($(b)), d), x = h(
          "div",
          `${a.day ?? "ec-day"} ec-month-scroller-cell${T ? " ec-today" : ""}`,
          "",
          [
            ["data-date", bt(b)]
          ]
        ), C = h("div", "ec-day-number", String(b.getUTCDate()));
        x.append(C), y.append(x);
      }
      f.append(y), g.push({ rowEl: f, weekStart: $(w), monthAnchor: null });
    }
    ae(w, 7);
  }
  if (r.prepend) {
    for (let M = g.length - 1; M >= 0; --M)
      n.insertBefore(g[M].rowEl, n.firstChild);
    o.unshift(...g);
  } else {
    for (const M of g) n.append(M.rowEl);
    o.push(...g);
  }
  Bo(o, i);
}
function Bo(n, t) {
  const e = new Intl.DateTimeFormat(t.locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric"
  });
  let o = null;
  for (const s of n) {
    const r = s.weekStart, i = `${r.getUTCFullYear()}-${r.getUTCMonth()}`, a = i !== o, u = s.rowEl.querySelector(".ec-month-scroller-month-banner");
    if (a && !u) {
      const w = h("div", "ec-month-scroller-month-banner", ""), v = e.formatToParts(r), g = h(
        "span",
        "ec-month-scroller-month-name",
        v.filter((c) => c.type === "month").map((c) => c.value).join("")
      ), M = h(
        "span",
        "ec-month-scroller-month-year",
        v.filter((c) => c.type === "year").map((c) => c.value).join("")
      );
      w.append(g, h("span", "", " "), M), s.rowEl.insertBefore(w, s.rowEl.firstChild), s.monthAnchor = $(r);
    } else !a && u && (u.remove(), s.monthAnchor = null);
    o = i;
  }
}
function Uo(n) {
  const t = [], e = $(n);
  for (let o = 0; o < 7; ++o)
    t.push($(e)), ae(e);
  return t;
}
function Xe(n, t, e) {
  const o = t.get("options"), s = o.theme, r = t.get("filteredEvents") ?? [], i = t.get("fire");
  for (const a of n) {
    const u = a.rowEl.querySelector(".ec-month-scroller-cells");
    if (u) {
      for (const w of u.children) {
        const v = w.querySelector(".ec-day-number");
        w.replaceChildren(v);
      }
      for (const w of u.children) {
        const v = ue(w.getAttribute("data-date")), g = $(v);
        ae(g);
        const M = r.filter((b) => b.start < g && b.end > v);
        if (!M.length) continue;
        const c = h("div", s.events ?? "ec-events"), f = typeof o.dayMaxEvents == "number" ? o.dayMaxEvents : 3, y = M.slice(0, f), d = M.slice(f);
        for (const b of y) {
          const T = h("div", s.event ?? "ec-event", "", [
            ["data-event-id", b.id]
          ]);
          if (b.backgroundColor && (T.style.backgroundColor = b.backgroundColor), T.append(h("span", "ec-event-dot")), !b.allDay) {
            const x = new Intl.DateTimeFormat(o.locale, {
              timeZone: "UTC",
              ...o.eventTimeFormat
            }).format(b.start);
            T.append(h("time", s.eventTime ?? "ec-event-time", x + " "));
          }
          T.append(h("span", s.eventTitle ?? "ec-event-title", b.title || "")), t.get("selectedEventId") === b.id && T.classList.add("ec-event-selected"), T.addEventListener("click", (x) => {
            document.querySelectorAll(".ec-event.ec-event-selected").forEach((_) => _.classList.remove("ec-event-selected")), T.classList.add("ec-event-selected"), t.set("selectedEventId", b.id);
            const C = new Date(
              b.start.getUTCFullYear(),
              b.start.getUTCMonth(),
              b.start.getUTCDate()
            );
            e?.(C), i?.("eventClick", { event: b, jsEvent: x, view: t.get("view") }), x.stopPropagation();
          }), T.addEventListener("dblclick", (x) => i?.("eventDoubleClick", { event: b, jsEvent: x, view: t.get("view"), el: T })), T.addEventListener("mouseenter", (x) => i?.("eventMouseEnter", { event: b, jsEvent: x, view: t.get("view") })), T.addEventListener("mouseleave", (x) => i?.("eventMouseLeave", { event: b, jsEvent: x, view: t.get("view") })), c.append(T);
        }
        if (d.length) {
          const b = h("button", "ec-more-link", `+${d.length} more`, [
            ["type", "button"],
            ["data-more-link", "true"],
            ["data-date", bt(v)]
          ]);
          c.append(b);
        }
        w.append(c);
      }
    }
  }
}
function Ve(n) {
  return n.setUTCDate(1), ne(n), n;
}
function bt(n) {
  return n.toISOString().substring(0, 10);
}
const Ze = 7, Bt = 4, Ut = 600, Wo = 180;
function zo(n, t, e, { onDateChange: o }) {
  const s = document.createElement("div");
  s.className = "ec-continuous-time-grid", s.style.setProperty("--ec-col-w", "140px"), n.replaceChildren(s);
  const r = t.get("options").firstDay ?? 0;
  let i = Wt(t.get("options").date, r);
  ae(i, -Math.floor(Ze / 2) * 7);
  let a = $(i);
  ae(a, Ze * 7);
  let u = null, w = !1, v = null, g = 140;
  function M() {
    u?.(), s.style.setProperty("--ec-col-w", `${g}px`);
    const _ = Yo(t, i, a, g);
    u = e(s, _);
  }
  M(), requestAnimationFrame(() => {
    const _ = ne(ue(t.get("options").date));
    c(_);
  });
  function c(_) {
    const A = f(_);
    if (A < 0) return;
    const P = y(), R = Math.max(
      0,
      A * g + P - (s.clientWidth - g) / 2
    );
    w = !0, s.scrollLeft = R, requestAnimationFrame(() => {
      w = !1;
    });
  }
  function f(_) {
    const A = ne($(_));
    let P = 0;
    const R = $(i);
    for (; R < a; ) {
      if (Ce(R, A)) return P;
      ae(R), ++P;
    }
    return -1;
  }
  function y() {
    return s.querySelector(".ec-time-grid .ec-sidebar")?.getBoundingClientRect().width || 64;
  }
  const d = () => {
    w || (b(), clearTimeout(v), v = setTimeout(T, Wo));
  };
  s.addEventListener("scroll", d, { passive: !0 });
  function b() {
    const _ = s.scrollLeft, A = s.clientWidth, P = s.scrollWidth;
    if (P - (_ + A) < Ut) {
      $(a), ae(a, Bt * 7), w = !0, M(), requestAnimationFrame(() => {
        w = !1;
      });
      return;
    }
    if (_ < Ut) {
      ae(i, -Bt * 7);
      const R = _, V = P;
      w = !0, M(), requestAnimationFrame(() => {
        const z = s.scrollWidth - V;
        s.scrollLeft = R + z, w = !1;
      });
    }
  }
  function T() {
    if (w) return;
    const _ = y(), A = s.scrollLeft + s.clientWidth / 2, P = Math.floor((A - _) / g);
    if (P < 0) return;
    const R = $(i);
    ae(R, P);
    const V = t.get("options").date, z = ne(ue(V));
    if (Ce(R, z)) return;
    w = !0;
    const N = new Date(R.getUTCFullYear(), R.getUTCMonth(), R.getUTCDate());
    o?.(N), requestAnimationFrame(() => {
      w = !1;
    });
  }
  const x = t.on("change:currentRange", () => {
    if (w) return;
    const _ = ne(ue(t.get("options").date));
    _ < i || _ >= a ? (i = Wt(_, r), ae(i, -Math.floor(Ze / 2) * 7), a = $(i), ae(a, Ze * 7), M(), requestAnimationFrame(() => c(_))) : c(_);
  }), C = t.onAny(({ key: _ }) => {
    if (_ === "filteredEvents") {
      const A = s.scrollLeft, P = s.scrollTop;
      w = !0, M(), requestAnimationFrame(() => {
        s.scrollLeft = A, s.scrollTop = P, w = !1;
      });
    }
  });
  return {
    destroy() {
      C?.(), x?.(), clearTimeout(v), u?.(), n.replaceChildren();
    }
  };
}
function Wt(n, t) {
  const e = ne(ue(n)), s = (e.getUTCDay() - t + 7) % 7;
  return ae(e, -s), e;
}
function Yo(n, t, e, o) {
  const s = $(t), r = $(e), i = [], a = $(s);
  for (; a < r; )
    i.push($(a)), ae(a);
  const u = /* @__PURE__ */ new Map();
  u.set("activeRange", { start: s, end: r }), u.set("currentRange", { start: s, end: r }), u.set("viewDates", i);
  const v = { ...n.get("options"), columnWidth: o };
  u.set("options", v);
  const g = /* @__PURE__ */ new Map();
  return {
    get(c) {
      return u.has(c) ? u.get(c) : n.get(c);
    },
    set(c, f) {
      u.set(c, f);
      const y = g.get(`change:${c}`);
      if (y) for (const d of y) d({ key: c, value: f });
    },
    on(c, f) {
      let y = g.get(c);
      y || (y = /* @__PURE__ */ new Set(), g.set(c, y)), y.add(f);
      const d = n.on?.(c, (b) => {
        ["activeRange", "currentRange", "viewDates", "options"].includes(b.key) || f(b);
      });
      return () => {
        y.delete(f), d?.();
      };
    },
    onAny(c) {
      return n.onAny?.((f) => {
        ["activeRange", "currentRange", "viewDates", "options"].includes(f.key) || c(f);
      });
    }
  };
}
function wn(n) {
  const t = [], e = n?.extendedProps?.confirmationState;
  return e === "tentative" && t.push("ec-event-tentative"), e === "confirmed" && t.push("ec-event-confirmed"), e === "cancelled" && t.push("ec-event-cancelled"), n?.extendedProps?.conflict === !0 && t.push("ec-event-conflict"), n?.extendedProps?.rrule && t.push("ec-event-recurring"), t;
}
function De(n) {
  const t = n?.extendedProps?.dataAttrs;
  if (!t || typeof t != "object") return [];
  const e = [];
  for (const [o, s] of Object.entries(t)) {
    if (s == null || typeof s == "object") continue;
    const r = Go(o);
    r && e.push([r, String(s)]);
  }
  return e;
}
function ze(n, t) {
  const e = n?.extendedProps?.type;
  if (!e) return null;
  const o = t?.eventTypes;
  if (!o || typeof o != "object") return null;
  const s = o[e];
  if (!s || typeof s != "object") return null;
  const r = Array.isArray(s.classNames) ? s.classNames.filter((w) => typeof w == "string" && w.length > 0) : typeof s.classNames == "string" && s.classNames.length > 0 ? [s.classNames] : [], i = String(e).toLowerCase().replace(/[^a-z0-9-]+/g, "-"), a = i ? `ec-event-type-${i}` : null, u = a ? [a, ...r.filter((w) => w !== a)] : r;
  return {
    type: e,
    color: typeof s.color == "string" ? s.color : null,
    classNames: u,
    label: typeof s.label == "string" ? s.label : null,
    icon: typeof s.icon == "string" ? s.icon : null
  };
}
function Go(n) {
  if (typeof n != "string" || n === "") return null;
  let t = n;
  return t.includes("-") || (t = t.replace(/([A-Z])/g, "-$1").toLowerCase()), t.startsWith("-") && (t = t.slice(1)), t.startsWith("data-") || (t = `data-${t}`), /^data-[a-z0-9-]+$/i.test(t) ? t : null;
}
function bn(n, t, e) {
  if (!n || !e) return null;
  const o = n.id;
  if (o == null || o === "" || !e.has(o)) return null;
  const s = n.extendedProps?.appearAnimation ?? t?.eventAppearAnimation;
  return typeof s != "string" || s.length === 0 || !/^[a-z0-9-]+$/i.test(s) ? null : `ec-event-appear-${s}`;
}
function at(n) {
  const t = n?.extendedProps, e = !!(t && t.rrule), o = t?.series?.id, s = !!(e || o), r = o ?? (e ? n?.id ?? null : null);
  return { isSeriesMember: s, seriesId: r ?? null };
}
function Tt() {
  const n = document.createElement("span");
  return n.className = "ec-event-recurring", n.setAttribute("aria-hidden", "true"), n.textContent = "🔁", n;
}
function qo(n, t) {
  const e = $(t);
  return ae(e), n.filter((o) => o.start < e && o.end > t);
}
function zt(n, t) {
  return n.allDay ? "" : new Intl.DateTimeFormat(t.locale, { timeZone: "UTC", ...t.eventTimeFormat }).format(n.start);
}
function gt(n, t) {
  const e = () => {
    const s = t.get("options"), r = s.theme, i = Xo(t), a = ke(i, s.hiddenDays ?? []), u = 7 - (s.hiddenDays?.length ?? 0), w = h("div", `${r.grid} ec-day-grid`, "", [
      ["data-grid", "day-grid"]
    ]);
    w.style.setProperty("--ec-cols", String(u));
    const v = h("div", r.colHead, "", [
      ["data-row", "header"]
    ]);
    s.weekNumbers && v.append(h("div", r.weekNumber, ""));
    const g = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayHeaderFormat }), M = s.dayHeaderDensity, c = M ? t.get("filteredEvents") ?? [] : [], f = (x) => {
      const C = $(x);
      return ae(C), c.filter((_) => _.start < C && _.end > x).length;
    };
    for (const x of a.slice(0, u)) {
      const C = h("div", r.dayHead, g.format(x), [
        ["data-day", String(x.getUTCDay())]
      ]);
      if (M) {
        const _ = f(x);
        if (_ > 0)
          if (typeof M == "function") {
            const A = M({ date: x, count: _, max: 3 }), P = h("span", "ec-day-head-density");
            typeof A == "string" ? P.textContent = A : A?.html ? P.innerHTML = A.html : A?.domNodes && A.domNodes.forEach((R) => P.append(R)), C.append(P);
          } else {
            const A = h("span", "ec-day-head-density");
            for (let P = 0; P < Math.min(3, _); ++P)
              A.append(h("span", "ec-day-head-dot"));
            C.append(A);
          }
      }
      v.append(C);
    }
    w.append(v), w.style.setProperty(
      "--ec-cols-with-week",
      String(u + (s.weekNumbers ? 1 : 0))
    );
    let y = h("div", "", "", [["data-row", "days"]]);
    const d = Vo(), b = t.get("currentRange"), T = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayCellFormat ?? { day: "numeric" } });
    for (let x = 0; x < a.length; ++x) {
      x > 0 && x % u === 0 && (w.append(y), y = h("div", "", "", [["data-row", "days"]]));
      const C = a[x];
      if (s.weekNumbers && x % u === 0) {
        const N = An(C, s.firstDay ?? 0), K = Pn(N, s.weekNumberContent, C), H = h("div", r.weekNumber, "", [
          ["data-week", String(N)]
        ]);
        typeof K == "string" ? H.textContent = K : K?.html ? H.innerHTML = K.html : K?.domNodes && H.replaceChildren(...K.domNodes), y.append(H);
      }
      const _ = [r.day];
      !b || C >= b.start && C < b.end || _.push(r.otherMonth), Ce(C, d) && _.push(r.today);
      const P = h("div", _.filter(Boolean).join(" "), "", [
        ["data-date", C.toISOString().substring(0, 10)]
      ]), R = h("div", "ec-day-number", T.format(C));
      if (P.append(R), s.dayCellContent) {
        const N = typeof s.dayCellContent == "function" ? s.dayCellContent({ date: C, view: t.get("view") }) : s.dayCellContent;
        typeof N == "string" ? R.innerText = N : N?.html ? R.innerHTML = N.html : N?.domNodes && R.replaceChildren(...N.domNodes);
      }
      const V = t.get("filteredEvents") ?? [], z = qo(V, C);
      if (z.length) {
        const N = h("div", r.events), K = typeof s.dayMaxEvents == "number" ? s.dayMaxEvents : 1 / 0, H = z.slice(0, K), F = z.slice(K);
        for (const k of H) {
          if (k.display === "background") {
            const S = h("div", r.bgEvent, "", [
              ["data-event-id", k.id],
              ...De(k)
            ]), D = k.backgroundColor ?? s.eventBackgroundColor ?? s.eventColor;
            D && (S.style.backgroundColor = D), P.append(S);
            continue;
          }
          const I = [r.event], X = s.eventClassNames;
          if (typeof X == "function") {
            const S = X({ event: k });
            S && I.push(...Array.isArray(S) ? S : [S]);
          } else X && I.push(...Array.isArray(X) ? X : [X]);
          I.push(...k.classNames), I.push(...wn(k));
          const L = ze(k, s);
          L && I.push(...L.classNames);
          const Y = bn(k, s, t.get("_pendingAppearIds"));
          Y && I.push(Y);
          const Q = s.dayCellEventStyle === "stripe";
          Q && I.push("ec-event-stripe");
          const m = h("div", I.filter(Boolean).join(" "), "", [
            ["data-event-id", k.id],
            ...De(k)
          ]), O = k.backgroundColor ?? L?.color ?? s.eventBackgroundColor ?? s.eventColor, p = k.textColor ?? s.eventTextColor;
          if (O && m.style.setProperty("--ec-event-color", O), p && (m.style.color = p), s.eventContent) {
            const S = s.eventContent, D = typeof S == "function" ? S({ event: k, timeText: zt(k, s), view: t.get("view") }) : S;
            typeof D == "string" ? m.innerText = D : D?.html ? m.innerHTML = D.html : D?.domNodes && m.replaceChildren(...D.domNodes);
          } else if (Q)
            k.extendedProps?.rrule && m.append(Tt()), m.append(h("span", r.eventTitle, k.title || ""));
          else {
            const S = h("span", "ec-event-dot"), D = zt(k, s);
            D && s.displayEventEnd !== !1 ? m.append(S, h("time", r.eventTime, D + " ")) : m.append(S), k.extendedProps?.rrule && m.append(Tt()), m.append(h("span", r.eventTitle, k.title || ""));
          }
          const l = t.get("fire");
          t.get("selectedEventId") === k.id && m.classList.add("ec-event-selected"), m.addEventListener("click", (S) => {
            document.querySelectorAll(".ec-event.ec-event-selected").forEach((D) => D.classList.remove("ec-event-selected")), m.classList.add("ec-event-selected"), t.set("selectedEventId", k.id), l?.("eventClick", { event: k, jsEvent: S, view: t.get("view") });
          }), m.addEventListener("dblclick", (S) => l?.("eventDoubleClick", { event: k, jsEvent: S, view: t.get("view"), el: m })), m.addEventListener("mouseenter", (S) => l?.("eventMouseEnter", { event: k, jsEvent: S, view: t.get("view") })), m.addEventListener("mouseleave", (S) => l?.("eventMouseLeave", { event: k, jsEvent: S, view: t.get("view") })), queueMicrotask(() => l?.("eventDidMount", { event: k, el: m, view: t.get("view") })), N.append(m);
        }
        if (F.length) {
          const k = typeof s.moreLinkContent == "function" ? s.moreLinkContent({ num: F.length, date: C }) : s.moreLinkContent ?? `+${F.length} more`, I = h(
            "button",
            "ec-more-link",
            typeof k == "object" && k?.html ? "" : k,
            [
              ["type", "button"],
              ["data-more-link", "true"],
              ["data-date", C.toISOString().substring(0, 10)]
            ]
          );
          typeof k == "object" && k?.html && (I.innerHTML = k.html), I.addEventListener("click", () => Zo(t, C, z)), N.append(I);
        }
        P.append(N);
      }
      y.append(P);
    }
    w.append(y), n.replaceChildren(w);
  };
  e();
  const o = t.onAny(({ key: s }) => {
    ["options", "currentRange", "activeRange", "viewDates", "filteredEvents"].includes(s) && e();
  });
  return () => {
    o(), n.replaceChildren();
  };
}
function Xo(n) {
  const t = n.get("activeRange");
  if (!t) return null;
  const e = n.get("options");
  if (e.view !== "dayGridMonth") return t;
  const o = e.firstDay ?? 0, s = it(ne($(t.start)), o), r = $(t.end);
  for (ne(r); r.getUTCDay() !== o; ) ae(r);
  return { start: s, end: r };
}
function Vo() {
  return ne(/* @__PURE__ */ new Date());
}
function Zo(n, t, e) {
  const o = n.get("options"), s = o.theme, r = new Intl.DateTimeFormat(o.locale, { timeZone: "UTC", ...o.dayPopoverFormat }), i = h("div", `${s.popup} ec-day-popover`, "", [
    ["data-popover", "day"],
    ["data-date", t.toISOString().substring(0, 10)]
  ]), a = h("div", "ec-popup-header");
  a.append(h("div", "ec-popup-title", r.format(t)));
  const u = o.buttonText?.close ?? "Close", w = h("button", "ec-popup-close", u, [
    ["type", "button"],
    ["aria-label", "Close"]
  ]);
  a.append(w), i.append(a);
  const v = h("div", s.events);
  for (const M of e) {
    const c = h("div", s.event, "", [
      ["data-event-id", M.id],
      ...De(M)
    ]);
    M.backgroundColor && c.style.setProperty("--ec-event-color", M.backgroundColor), c.append(h("span", "ec-event-dot"));
    const f = M.allDay ? "" : new Intl.DateTimeFormat(o.locale, { timeZone: "UTC", ...o.eventTimeFormat }).format(M.start);
    f && c.append(h("time", s.eventTime, f + " ")), c.append(h("span", s.eventTitle, M.title || "")), v.append(c);
  }
  i.append(v), document.body.append(i);
  const g = () => i.remove();
  w.addEventListener("click", g), setTimeout(() => {
    document.addEventListener("click", function M(c) {
      i.contains(c.target) || (g(), document.removeEventListener("click", M, !0));
    }, !0);
  }, 0);
}
const Ko = {
  createOptions(n) {
    Object.assign(n, {
      dayMaxEvents: !1,
      dayCellFormat: { day: "numeric" },
      dayPopoverFormat: { month: "long", day: "numeric", year: "numeric" },
      moreLinkContent: void 0,
      weekNumbers: !1,
      weekNumberContent: void 0,
      view: "dayGridMonth",
      // Phase C2 — density dots in dayHead. false (default) skips the
      // count entirely; true paints up to 3 dots; a function takes
      // ({ date, count, max }) and returns html/text/domNodes.
      dayHeaderDensity: !1,
      // Phase C3 — Month-cell event style. 'chip' (default) renders
      // dot + time + title; 'stripe' renders a full-width colour bar
      // with just the title (matches the mockup's Month view).
      dayCellEventStyle: "chip"
    }), Object.assign(n.buttonText, {
      dayGridDay: "day",
      dayGridMonth: "month",
      dayGridWeek: "week",
      close: "Close"
    }), Object.assign(n.theme, {
      uniform: "ec-uniform",
      dayFoot: "ec-day-foot",
      otherMonth: "ec-other-month",
      popup: "ec-popup"
    }), Object.assign(n.views, {
      dayGridDay: {
        component: () => gt,
        dayHeaderFormat: { weekday: "long" },
        displayEventEnd: !1,
        duration: { days: 1 }
      },
      dayGridWeek: {
        component: () => gt,
        displayEventEnd: !1
      },
      dayGridMonth: {
        component: () => gt,
        dayHeaderFormat: { weekday: "short" },
        dayHeaderAriaLabelFormat: { weekday: "long" },
        displayEventEnd: !1,
        duration: { months: 1 },
        titleFormat: { year: "numeric", month: "long" }
      }
    });
  }
};
function Tn(n, t, e, o, s) {
  const r = [];
  n = $(n);
  const i = $(n);
  for (Te(n, o.min), Te(i, o.max); n < i; )
    r.push([Ie(n), s.format(n)]), Te(n, t, e);
  const a = Ln((n - i) / 1e3 / ve(t));
  return a && a !== e && (r.at(-1)[2] = e - a), r;
}
function Cn(n, t, e, o, s) {
  const r = ce(n), i = ce(t);
  if (e) {
    const a = ce(
      kt(ve(r), ct(0, ve(i) - yt))
    ), u = ce(
      ct(ve(i), ve(a) + yt)
    ), w = _e(e?.eventFilter) ? e.eventFilter : (v) => !Un(v.display);
    e: for (const v of o) {
      const g = Te($(v), r), M = Te($(v), i), c = Te($(v), a), f = Te($(v), u);
      for (const y of s)
        if (!y.allDay && w(y) && y.start < f && y.end > c) {
          if (y.start < g) {
            const d = ct((y.start - v) / 1e3, ve(a));
            d < ve(r) && (r.seconds = d);
          }
          if (y.end > M) {
            const d = kt((y.end - v) / 1e3, ve(u));
            d > ve(i) && (i.seconds = d);
          }
          if (ve(r) === ve(a) && ve(i) === ve(u))
            break e;
        }
    }
  }
  return { min: r, max: i };
}
function Yt(n, t) {
  let e = null, o = null;
  const s = () => {
    o && (o(), o = null);
    const i = t.get("options"), a = i.theme, u = t.get("activeRange");
    if (!u) return;
    const w = n.querySelector('[data-row="body"]');
    w && (e = w.scrollTop);
    const v = ke(u, i.hiddenDays ?? []), g = h("div", `${a.grid} ec-time-grid`, "", [
      ["data-grid", "time-grid"]
    ]);
    g.style.setProperty("--ec-cols", String(v.length));
    const M = h("div", `${a.colHead}`, "", [
      ["data-row", "header"]
    ]);
    M.append(h("div", `${a.sidebar} ec-corner`));
    const c = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayHeaderFormat }), f = i.dayHeaderDensity, y = f ? t.get("filteredEvents") ?? [] : [], d = (H) => {
      const F = $(H);
      return ae(F), y.filter((k) => k.start < F && k.end > H).length;
    };
    for (const H of v) {
      const F = h("div", a.dayHead, c.format(H), [
        ["data-day", String(H.getUTCDay())]
      ]);
      if (f) {
        const k = d(H);
        if (k > 0)
          if (typeof f == "function") {
            const I = f({ date: H, count: k, max: 3 }), X = h("span", "ec-day-head-density");
            typeof I == "string" ? X.textContent = I : I?.html ? X.innerHTML = I.html : I?.domNodes && I.domNodes.forEach((L) => X.append(L)), F.append(X);
          } else {
            const I = h("span", "ec-day-head-density");
            for (let X = 0; X < Math.min(3, k); ++X)
              I.append(h("span", "ec-day-head-dot"));
            F.append(I);
          }
      }
      M.append(F);
    }
    g.append(M);
    const b = t.get("filteredEvents") ?? [];
    if (i.allDaySlot) {
      const H = h("div", a.allDay, "", [
        ["data-row", "all-day"]
      ]), F = h("div", a.sidebar + " ec-all-day-label"), k = i.allDayContent;
      if (typeof k == "function") {
        const Y = k({ view: t.get("view") });
        typeof Y == "string" ? F.textContent = Y : Y?.html && (F.innerHTML = Y.html);
      } else typeof k == "string" ? F.textContent = k : k?.html ? F.innerHTML = k.html : F.textContent = "all-day";
      H.append(F);
      const I = h("div", "ec-all-day-cols");
      I.style.setProperty("--ec-cols", String(v.length));
      const X = [];
      for (const Y of v) {
        const Q = h("div", `${a.day} ec-all-day-cell`, "", [
          ["data-date", Y.toISOString().substring(0, 10)]
        ]);
        I.append(Q), X.push(Q);
      }
      const L = b.filter((Y) => Y.allDay);
      for (const Y of L) {
        let Q = -1, m = -1;
        for (let D = 0; D < v.length; ++D) {
          const E = v[D], G = $(E);
          ae(G), Y.start < G && Y.end > E && (Q === -1 && (Q = D), m = D);
        }
        if (Q === -1) continue;
        const O = m - Q + 1, p = h("div", a.event, "", [
          ["data-event-id", Y.id],
          ...De(Y)
        ]), l = Y.backgroundColor;
        l && p.style.setProperty("--ec-event-color", l), Y.textColor && (p.style.color = Y.textColor), p.style.position = "absolute", p.style.left = "1px", p.style.right = "auto", p.style.top = "2px", p.style.width = `calc(${O * 100}% + ${O - 1}px - 2px)`, p.style.overflow = "hidden", p.append(h("div", a.eventTitle, Y.title || ""));
        const S = t.get("fire");
        t.get("selectedEventId") === Y.id && p.classList.add("ec-event-selected"), p.addEventListener("click", (D) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((E) => E.classList.remove("ec-event-selected")), p.classList.add("ec-event-selected"), t.set("selectedEventId", Y.id), S?.("eventClick", { event: Y, jsEvent: D, view: t.get("view") });
        }), p.addEventListener("dblclick", (D) => S?.("eventDoubleClick", { event: Y, jsEvent: D, view: t.get("view"), el: p })), X[Q].append(p);
      }
      H.append(I), g.append(H);
    }
    const T = h("div", "ec-time-body", "", [
      ["data-row", "body"]
    ]), x = Cn(
      i.slotMinTime,
      i.slotMaxTime,
      i.flexibleSlotTimeLimits,
      v,
      b
    ), C = {
      format: (H) => new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.slotLabelFormat }).format(H)
    }, _ = Qo(i.slotLabelInterval, i.slotDuration), A = Tn(
      u.start,
      i.slotDuration,
      _,
      x,
      C
    ), P = h("div", a.sidebar);
    for (const [H, F] of A) {
      const k = h("div", a.slot, "");
      if (k.style.height = `${i.slotHeight}px`, F) {
        const I = /* @__PURE__ */ new Date(H + "Z"), X = I.getUTCHours();
        if (I.getUTCMinutes() === 0) if (X === 12)
          k.append(h("span", "ec-slot-hour", "Noon"));
        else {
          const Y = X % 12 || 12, Q = X >= 12 ? "pm" : "am";
          k.append(h("span", "ec-slot-hour", String(Y))), k.append(h("span", "ec-slot-period", Q));
        }
      }
      P.append(k);
    }
    T.append(P);
    const R = h("div", a.grid + " ec-days");
    R.style.setProperty("--ec-cols", String(v.length)), i.columnWidth && R.style.setProperty("--ec-col-w", `${i.columnWidth}px`);
    for (const H of v) {
      const F = h("div", `${a.day} ec-time-col`, "", [
        ["data-date", H.toISOString().substring(0, 10)]
      ]);
      for (let E = 0; E < A.length; ++E) {
        const G = h("div", a.slot);
        G.style.height = `${i.slotHeight}px`, F.append(G);
      }
      const k = h("div", "ec-event-overlay"), I = Jo(b, H).filter((E) => !E.allDay), X = ne($(H)), L = $(X);
      ae(L);
      const Y = /* @__PURE__ */ new Map();
      for (const E of I) {
        const G = E.start < X, U = E.end > L;
        Y.set(E, {
          visStart: G ? X : E.start,
          visEnd: U ? L : E.end,
          startsBefore: G,
          endsAfter: U
        });
      }
      const Q = I.filter((E) => E.display !== "background").map((E) => ({
        start: Y.get(E).visStart,
        end: Y.get(E).visEnd,
        event: E
      })), m = dn(Q), O = /* @__PURE__ */ new Map();
      for (const E of Q) O.set(E.event, m.get(E));
      const p = 16, l = Se(i.slotDuration) / 60, S = Se(x.min) / 60, D = i.slotHeight / l;
      for (const E of I) {
        const G = Y.get(E), { visStart: U, visEnd: q, startsBefore: Z, endsAfter: J } = G, B = (U.getTime() - X.getTime()) / 6e4 - S, j = (q.getTime() - X.getTime()) / 6e4 - S;
        if (E.display === "background") {
          const ie = ["ec-bg-event"], he = i.eventClassNames;
          if (typeof he == "function") {
            const me = he({ event: E });
            me && ie.push(...Array.isArray(me) ? me : [me]);
          } else he && ie.push(...Array.isArray(he) ? he : [he]);
          E.classNames && ie.push(...Array.isArray(E.classNames) ? E.classNames : [E.classNames]);
          const be = h("div", ie.filter(Boolean).join(" "), "", [
            ["data-event-id", E.id],
            ...De(E)
          ]);
          be.style.position = "absolute", be.style.top = `${B * D}px`, be.style.height = `${Math.max((j - B) * D, 12)}px`, be.style.left = "0", be.style.right = "0", be.style.zIndex = "0", E.backgroundColor && (be.style.background = E.backgroundColor);
          const Ye = i.eventContent;
          if (typeof Ye == "function") {
            const me = Ye({ event: E });
            typeof me == "string" ? be.textContent = me : me?.html ? be.innerHTML = me.html : me?.domNodes && me.domNodes.forEach((_t) => be.append(_t));
          }
          k.append(be);
          continue;
        }
        const W = [a.event];
        Z && W.push("ec-event-continues-from"), J && W.push("ec-event-continues-to");
        const te = i.eventClassNames;
        if (typeof te == "function") {
          const ie = te({ event: E });
          ie && W.push(...Array.isArray(ie) ? ie : [ie]);
        } else te && W.push(...Array.isArray(te) ? te : [te]);
        E.classNames && W.push(...Array.isArray(E.classNames) ? E.classNames : [E.classNames]), W.push(...wn(E));
        const se = ze(E, i);
        se && W.push(...se.classNames);
        const de = bn(E, i, t.get("_pendingAppearIds"));
        de && W.push(de);
        const ee = h("div", W.filter(Boolean).join(" "), "", [
          ["data-event-id", E.id],
          ["data-event-start", E.start.toISOString()],
          ["data-event-end", E.end.toISOString()],
          ...De(E)
        ]), fe = O.get(E) ?? 0;
        ee.style.position = "absolute", ee.style.top = `${B * D}px`;
        const re = Math.max((j - B) * D, 12);
        ee.style.height = `${re}px`, re < 36 && ee.classList.add("ec-event-compact"), ee.style.left = fe === 0 ? "0" : `${fe * p}px`, ee.style.right = "0", fe > 0 && (ee.style.zIndex = String(fe + 1));
        const oe = E.backgroundColor ?? se?.color;
        oe && ee.style.setProperty("--ec-event-color", oe);
        const ye = h("div", a.eventTitle);
        E.extendedProps?.rrule && ye.append(Tt()), ye.append(document.createTextNode(E.title || "")), ee.append(ye);
        const le = h("div", a.eventTime ?? "ec-event-time");
        if (le.innerHTML = jo, le.append(document.createTextNode(Sn(U, q, i))), ee.append(le), i.editable && i.eventDurationEditable !== !1) {
          if (!J) {
            const ie = h("div", `${a.resizer ?? "ec-resizer"} ec-resizer-end`, "", [
              ["data-resizer", "end"]
            ]);
            ee.append(ie);
          }
          if (i.eventResizableFromStart && !Z) {
            const ie = h("div", `${a.resizer ?? "ec-resizer"} ec-resizer-start`, "", [
              ["data-resizer", "start"]
            ]);
            ee.append(ie);
          }
        }
        const we = t.get("fire");
        t.get("selectedEventId") === E.id && ee.classList.add("ec-event-selected"), ee.addEventListener("click", (ie) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((he) => he.classList.remove("ec-event-selected")), ee.classList.add("ec-event-selected"), t.set("selectedEventId", E.id), we?.("eventClick", { event: E, jsEvent: ie, view: t.get("view") });
        }), ee.addEventListener("dblclick", (ie) => we?.("eventDoubleClick", { event: E, jsEvent: ie, view: t.get("view"), el: ee })), ee.addEventListener("mouseenter", (ie) => we?.("eventMouseEnter", { event: E, jsEvent: ie, view: t.get("view") })), ee.addEventListener("mouseleave", (ie) => we?.("eventMouseLeave", { event: E, jsEvent: ie, view: t.get("view") })), queueMicrotask(() => we?.("eventDidMount", { event: E, el: ee, view: t.get("view") })), k.append(ee);
      }
      if (F.style.position = "relative", F.append(k), i.nowIndicator) {
        const E = ne(ue(/* @__PURE__ */ new Date()));
        if (Ce(E, ne($(H)))) {
          const U = h("div", a.nowIndicator, "", [
            ["data-now-indicator", ""]
          ]), q = Se(x.min) / 60, Z = Se(i.slotDuration) / 60, J = i.slotHeight / Z;
          U.style.position = "absolute", U.style.left = "0", U.style.right = "0", U.style.height = "2px", U.style.background = "#dc2626", U.style.zIndex = "5";
          const B = (j) => {
            const W = j instanceof Date ? j : ue(/* @__PURE__ */ new Date()), te = W.getUTCHours() * 60 + W.getUTCMinutes() - q;
            U.style.top = `${te * J}px`;
          };
          B(t.get("now")), F.append(U), o = t.on("change:now", ({ value: j }) => B(j));
        }
      }
      R.append(F);
    }
    T.append(R), g.append(T), n.replaceChildren(g);
    const V = Se(x.min) / 60, z = Se(x.max) / 60, N = Se(i.slotDuration) / 60, K = i.slotHeight / N;
    if (e != null)
      T.scrollTop = e;
    else {
      const H = /* @__PURE__ */ new Date(), F = ne(/* @__PURE__ */ new Date()), k = v.some((X) => Ce(F, ne($(X)))), I = H.getHours() * 60 + H.getMinutes();
      if (k && I >= V && I <= z) {
        const X = (I - V) * K, L = T.clientHeight || 0;
        T.scrollTop = Math.max(0, X - L / 2), e = T.scrollTop;
      } else if (i.scrollTime) {
        const L = (Se(i.scrollTime) / 60 - V) * K;
        T.scrollTop = Math.max(0, L), e = T.scrollTop;
      }
    }
  };
  s();
  const r = t.onAny(({ key: i }) => {
    ["options", "currentRange", "activeRange", "viewDates", "filteredEvents", "today"].includes(i) && s();
  });
  return () => {
    r(), o && (o(), o = null), n.replaceChildren();
  };
}
function Jo(n, t) {
  const e = $(t);
  return ae(e), n.filter((o) => o.start < e && o.end > t);
}
function Se(n) {
  return n.days * 86400 + n.seconds;
}
function Qo(n, t) {
  return n ? Math.max(1, Math.round(
    Se(n) / Se(t)
  )) : 1;
}
function Sn(n, t, e) {
  const o = e?.eventTimeFormat || { hour: "numeric", minute: "2-digit" }, s = new Intl.DateTimeFormat(e?.locale, { timeZone: "UTC", ...o });
  if (!t || n.getTime() === t.getTime()) return s.format(n);
  const r = s.formatToParts(n), i = s.formatToParts(t), a = r.find((y) => y.type === "dayPeriod")?.value, u = i.find((y) => y.type === "dayPeriod")?.value, w = n.getMinutes() === 0, v = t.getMinutes() === 0, g = (y, d, b) => y.filter((T) => !(d && T.type === "dayPeriod")).filter((T) => !(d && T.type === "literal" && T.value.trim() === "" && T === y[y.length - 1])).filter((T, x, C) => b ? !(T.type === "minute" || T.type === "literal" && T.value === ":") : !0).map((T) => T.value).join(""), c = g(r, a && u && a === u, w), f = g(i, !1, v);
  return `${c.trim()} – ${f.trim()}`;
}
const jo = '<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>', es = {
  createOptions(n) {
    Object.assign(n, {
      allDayContent: void 0,
      allDaySlot: !0,
      slotEventOverlap: !0,
      columnWidth: void 0,
      flexibleSlotTimeLimits: !1,
      nowIndicator: !1,
      scrollTime: "06:00:00",
      slotDuration: "00:30:00",
      slotHeight: 24,
      slotLabelInterval: void 0,
      slotLabelFormat: { hour: "numeric", minute: "2-digit" },
      slotMaxTime: "24:00:00",
      slotMinTime: "00:00:00",
      snapDuration: void 0,
      view: "timeGridWeek",
      // Phase C2 — same density-dots semantics as DayGrid.
      dayHeaderDensity: !1,
      // Phase C1 — TimeGridWeek can opt into the continuous horizontal
      // week scroller. Controller swaps the pager for the WeekScroller
      // when this is on.
      continuousWeekScroll: !1
    }), Object.assign(n.buttonText, {
      timeGridDay: "day",
      timeGridWeek: "week"
    }), Object.assign(n.theme, {
      nowIndicator: "ec-now-indicator",
      sidebar: "ec-sidebar",
      slot: "ec-slot",
      allDay: "ec-all-day"
    }), Object.assign(n.views, {
      timeGridDay: {
        component: () => Yt,
        dayHeaderFormat: { weekday: "long" },
        duration: { days: 1 },
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      },
      timeGridWeek: {
        component: () => Yt,
        duration: { weeks: 1 }
      }
    });
  },
  createParsers(n) {
    Object.assign(n, {
      scrollTime: ce,
      slotDuration: ce,
      slotLabelInterval: Le(ce),
      slotMaxTime: ce,
      slotMinTime: ce,
      snapDuration: Le(ce)
    });
  }
};
function Ke(n, t) {
  const e = () => {
    const s = t.get("options"), r = s.theme, i = t.get("activeRange");
    if (!i) return;
    const a = ke(i, s.hiddenDays ?? []), u = t.get("filteredEvents") ?? [], w = h("div", `${r.grid} ec-list`, "", [
      ["data-grid", "list"]
    ]), v = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.listDayFormat }), g = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.listDaySideFormat }), M = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.eventTimeFormat });
    let c = 0;
    for (const f of a) {
      const y = $(f);
      ae(y);
      const d = u.filter((T) => T.start < y && T.end > f);
      if (!d.length) continue;
      c += d.length;
      const b = h("div", r.dayHead, "", [
        ["data-row", "day-header"],
        ["data-date", f.toISOString().substring(0, 10)]
      ]);
      b.append(h("span", "", v.format(f))), b.append(h("span", r.daySide, g.format(f))), w.append(b);
      for (const T of d) {
        const x = [r.event], C = s.eventClassNames;
        if (typeof C == "function") {
          const z = C({ event: T });
          z && x.push(...Array.isArray(z) ? z : [z]);
        } else C && x.push(...Array.isArray(C) ? C : [C]);
        T.classNames && x.push(...Array.isArray(T.classNames) ? T.classNames : [T.classNames]);
        const _ = ze(T, s);
        _ && x.push(..._.classNames);
        const A = h("div", x.filter(Boolean).join(" "), "", [
          ["data-event-id", T.id],
          ...De(T)
        ]), P = T.backgroundColor ?? _?.color;
        P && A.style.setProperty("--ec-event-color", P), A.append(h("span", r.eventTag));
        const R = T.allDay ? "all-day" : M.format(T.start);
        A.append(h("time", r.eventTime, R)), A.append(h("span", r.eventTitle, T.title || ""));
        const V = t.get("fire");
        t.get("selectedEventId") === T.id && A.classList.add("ec-event-selected"), A.addEventListener("click", (z) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((N) => N.classList.remove("ec-event-selected")), A.classList.add("ec-event-selected"), t.set("selectedEventId", T.id), V?.("eventClick", { event: T, jsEvent: z, view: t.get("view") });
        }), A.addEventListener("dblclick", (z) => V?.("eventDoubleClick", { event: T, jsEvent: z, view: t.get("view"), el: A })), A.addEventListener("mouseenter", (z) => V?.("eventMouseEnter", { event: T, jsEvent: z, view: t.get("view") })), A.addEventListener("mouseleave", (z) => V?.("eventMouseLeave", { event: T, jsEvent: z, view: t.get("view") })), queueMicrotask(() => V?.("eventDidMount", { event: T, el: A, view: t.get("view") })), w.append(A);
      }
    }
    if (c === 0) {
      const f = h("div", r.noEvents), y = s.noEventsContent;
      if (typeof y == "function") {
        const d = y();
        typeof d == "string" ? f.textContent = d : d?.html && (f.innerHTML = d.html);
      } else typeof y == "string" ? f.textContent = y : y?.html && (f.innerHTML = y.html);
      typeof s.noEventsClick == "function" && (f.style.cursor = "pointer", f.addEventListener("click", (d) => s.noEventsClick({ jsEvent: d }))), w.append(f);
    }
    n.replaceChildren(w);
  };
  e();
  const o = t.onAny(({ key: s }) => {
    ["options", "currentRange", "activeRange", "viewDates", "filteredEvents"].includes(s) && e();
  });
  return () => {
    o(), n.replaceChildren();
  };
}
const ts = {
  createOptions(n) {
    Object.assign(n, {
      listDayFormat: { weekday: "long" },
      listDaySideFormat: { year: "numeric", month: "long", day: "numeric" },
      noEventsClick: void 0,
      noEventsContent: "No events",
      view: "listWeek"
    }), Object.assign(n.buttonText, {
      listDay: "day",
      listWeek: "week",
      listMonth: "month",
      listYear: "year"
    }), Object.assign(n.theme, {
      daySide: "ec-day-side",
      eventTag: "ec-event-tag",
      noEvents: "ec-no-events"
    }), Object.assign(n.views, {
      listDay: {
        component: () => Ke,
        duration: { days: 1 },
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      },
      listWeek: {
        component: () => Ke,
        duration: { weeks: 1 }
      },
      listMonth: {
        component: () => Ke,
        duration: { months: 1 },
        titleFormat: { year: "numeric", month: "long" }
      },
      listYear: {
        component: () => Ke,
        duration: { years: 1 },
        titleFormat: { year: "numeric" }
      }
    });
  }
}, mt = 1440;
function Je(n) {
  if (typeof n != "string") return null;
  const t = /^(\d{1,2}):(\d{2})$/.exec(n.trim());
  if (!t) return null;
  const e = Number(t[1]), o = Number(t[2]);
  return e < 0 || e > 24 || o < 0 || o > 59 ? null : e * 60 + o;
}
function ns(n) {
  const t = n.getFullYear ? n.getFullYear() : NaN;
  if (Number.isNaN(t)) return null;
  const e = String(n.getMonth() + 1).padStart(2, "0"), o = String(n.getDate()).padStart(2, "0");
  return `${t}-${e}-${o}`;
}
function os(n, t) {
  if (!n || typeof n != "object" || !t) return null;
  const e = n.overrides;
  if (e && typeof e == "object") {
    const a = ns(t);
    if (a && Object.prototype.hasOwnProperty.call(e, a)) {
      const u = e[a];
      if (u === null) return { startMin: 0, endMin: 0 };
      if (u && typeof u == "object") {
        const w = Je(u.start), v = Je(u.end);
        return w != null && v != null && v > w ? { startMin: w, endMin: v } : { startMin: 0, endMin: 0 };
      }
    }
  }
  const o = t.getDay ? t.getDay() : null, s = n.daysOfWeek;
  if (Array.isArray(s) && o != null && !s.includes(o))
    return { startMin: 0, endMin: 0 };
  const r = Je(n.start), i = Je(n.end);
  return r == null || i == null || i <= r ? { startMin: 0, endMin: 0 } : { startMin: r, endMin: i };
}
function Mn(n, t) {
  const e = os(n, t);
  if (e == null) return [];
  const { startMin: o, endMin: s } = e;
  if (o === s) return [{ startMin: 0, endMin: mt }];
  const r = [];
  return o > 0 && r.push({ startMin: 0, endMin: o }), s < mt && r.push({ startMin: s, endMin: mt }), r;
}
function Gt(n, t) {
  const e = () => {
    const s = t.get("options"), r = s.theme, i = t.get("activeRange"), a = t.get("resources") ?? s.resources ?? [];
    if (!i || !a.length) {
      n.replaceChildren(h(
        "div",
        r.noEvents,
        "No resources configured"
      ));
      return;
    }
    const u = ke(i, s.hiddenDays ?? []), w = t.get("filteredEvents") ?? [];
    let v = a.filter((C) => C.visible !== !1);
    s.filterResourcesWithEvents && (v = a.filter((C) => w.some((_) => _.resourceIds.includes(C.id))));
    const g = h("div", `${r.grid} ec-resource ec-time-grid`, "", [
      ["data-grid", "resource-time-grid"]
    ]);
    g.style.setProperty("--ec-cols", String(u.length * v.length));
    const M = h("div", r.colHead, "", [["data-row", "header"]]);
    M.append(h("div", `${r.sidebar} ec-corner`));
    const c = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayHeaderFormat });
    for (const C of u)
      for (const _ of v) {
        const A = h("div", r.dayHead, "", [
          ["data-day", String(C.getUTCDay())],
          ["data-resource-id", _.id]
        ]), P = h("div", "", c.format(C)), R = h("div", r.resourceLabel, "", [
          ["data-resource-label", ""]
        ]), V = s.resourceLabelContent;
        let z = _.title;
        if (typeof V == "function") {
          const N = V({ resource: _ });
          typeof N == "string" ? z = N : N?.html && (R.innerHTML = N.html, z = null);
        }
        z !== null && (R.textContent = z), typeof s.resourceLabelDidMount == "function" && queueMicrotask(() => s.resourceLabelDidMount({ resource: _, el: R })), u.length > 1 ? s.datesAboveResources ? A.append(P, R) : A.append(R, P) : A.append(R), M.append(A);
      }
    g.append(M);
    const f = h("div", "ec-time-body", "", [["data-row", "body"]]), y = Cn(
      s.slotMinTime,
      s.slotMaxTime,
      s.flexibleSlotTimeLimits,
      u,
      w
    ), d = {
      format: (C) => new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.slotLabelFormat }).format(C)
    }, b = Tn(
      i.start,
      s.slotDuration,
      1,
      y,
      d
    ), T = h("div", r.sidebar);
    for (const [C, _] of b) {
      const A = h("div", r.slot, _);
      A.style.height = `${s.slotHeight}px`, T.append(A);
    }
    f.append(T);
    const x = h("div", `${r.grid} ec-days`);
    x.style.setProperty("--ec-cols", String(u.length * v.length));
    for (const C of u)
      for (const _ of v) {
        const A = h("div", `${r.day} ec-time-col`, "", [
          ["data-date", C.toISOString().substring(0, 10)],
          ["data-resource-id", _.id]
        ]);
        for (let L = 0; L < b.length; ++L) {
          const Y = h("div", r.slot);
          Y.style.height = `${s.slotHeight}px`, A.append(Y);
        }
        const P = vt(s.slotDuration) / 60, R = vt(y.min) / 60, V = vt(y.max) / 60, z = s.slotHeight / P, N = Mn(_.workingHours, C);
        for (const L of N) {
          const Y = Math.max(L.startMin, R), Q = Math.min(L.endMin, V);
          if (Q <= Y) continue;
          const m = h("div", "ec-resource-offhours");
          m.style.position = "absolute", m.style.left = "0", m.style.right = "0", m.style.top = `${(Y - R) * z}px`, m.style.height = `${(Q - Y) * z}px`, m.style.pointerEvents = "none", m.style.zIndex = "0", A.append(m);
        }
        const K = h("div", "ec-event-overlay"), H = $(C);
        ae(H);
        const F = w.filter(
          (L) => !L.allDay && L.start < H && L.end > C && (L.resourceIds.length === 0 || L.resourceIds.includes(_.id))
        ), k = F.filter((L) => L.display !== "background"), I = dn(k), X = 16;
        for (const L of F) {
          const Y = qt(L.start) - R, Q = qt(L.end) - R;
          if (L.display === "background") {
            const q = ["ec-bg-event"], Z = s.eventClassNames;
            if (typeof Z == "function") {
              const j = Z({ event: L });
              j && q.push(...Array.isArray(j) ? j : [j]);
            } else Z && q.push(...Array.isArray(Z) ? Z : [Z]);
            L.classNames && q.push(...Array.isArray(L.classNames) ? L.classNames : [L.classNames]);
            const J = h("div", q.filter(Boolean).join(" "), "", [
              ["data-event-id", L.id],
              ...De(L)
            ]);
            J.style.position = "absolute", J.style.top = `${Y * z}px`, J.style.height = `${Math.max((Q - Y) * z, 12)}px`, J.style.left = "0", J.style.right = "0", J.style.zIndex = "0", L.backgroundColor && (J.style.background = L.backgroundColor);
            const B = s.eventContent;
            if (typeof B == "function") {
              const j = B({ event: L });
              typeof j == "string" ? J.textContent = j : j?.html ? J.innerHTML = j.html : j?.domNodes && j.domNodes.forEach((W) => J.append(W));
            }
            K.append(J);
            continue;
          }
          const m = [r.event], O = s.eventClassNames;
          if (typeof O == "function") {
            const q = O({ event: L });
            q && m.push(...Array.isArray(q) ? q : [q]);
          } else O && m.push(...Array.isArray(O) ? O : [O]);
          L.classNames && m.push(...Array.isArray(L.classNames) ? L.classNames : [L.classNames]);
          const p = ze(L, s);
          p && m.push(...p.classNames);
          const l = h("div", m.filter(Boolean).join(" "), "", [
            ["data-event-id", L.id],
            ...De(L)
          ]), S = I.get(L) ?? 0;
          l.style.position = "absolute", l.style.top = `${Y * z}px`;
          const D = Math.max((Q - Y) * z, 12);
          l.style.height = `${D}px`, D < 36 && l.classList.add("ec-event-compact"), l.style.left = S === 0 ? "0" : `${S * X}px`, l.style.right = "0", S > 0 && (l.style.zIndex = String(S + 1));
          const E = L.backgroundColor ?? p?.color ?? _.eventBackgroundColor;
          E && l.style.setProperty("--ec-event-color", E), l.append(h("div", r.eventTitle, L.title || ""));
          const G = h("div", r.eventTime ?? "ec-event-time");
          G.innerHTML = '<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>', G.append(document.createTextNode(Sn(L.start, L.end, s))), l.append(G);
          const U = t.get("fire");
          l.addEventListener("click", (q) => U?.("eventClick", { event: L, jsEvent: q, view: t.get("view"), resource: _ })), l.addEventListener("dblclick", (q) => U?.("eventDoubleClick", { event: L, jsEvent: q, view: t.get("view"), resource: _, el: l })), l.addEventListener("mouseenter", (q) => U?.("eventMouseEnter", { event: L, jsEvent: q, view: t.get("view"), resource: _ })), l.addEventListener("mouseleave", (q) => U?.("eventMouseLeave", { event: L, jsEvent: q, view: t.get("view"), resource: _ })), queueMicrotask(() => U?.("eventDidMount", { event: L, el: l, view: t.get("view"), resource: _ })), K.append(l);
        }
        A.style.position = "relative", A.append(K), x.append(A);
      }
    f.append(x), g.append(f), n.replaceChildren(g);
  };
  e();
  const o = t.onAny(({ key: s }) => {
    [
      "options",
      "currentRange",
      "activeRange",
      "viewDates",
      "filteredEvents",
      "resources"
    ].includes(s) && e();
  });
  return () => {
    o(), n.replaceChildren();
  };
}
function qt(n) {
  return n.getUTCHours() * 60 + n.getUTCMinutes();
}
function vt(n) {
  return n.days * 86400 + n.seconds;
}
const Xt = {
  createOptions(n) {
    "scrollTime" in n || Object.assign(n, {
      allDayContent: void 0,
      allDaySlot: !0,
      slotEventOverlap: !0,
      columnWidth: void 0,
      flexibleSlotTimeLimits: !1,
      nowIndicator: !1,
      scrollTime: "06:00:00",
      slotDuration: "00:30:00",
      slotHeight: 24,
      slotLabelInterval: void 0,
      slotLabelFormat: { hour: "numeric", minute: "2-digit" },
      slotMaxTime: "24:00:00",
      slotMinTime: "00:00:00",
      snapDuration: void 0
    }), Object.assign(n, {
      datesAboveResources: !1,
      filterResourcesWithEvents: !1,
      filterEventsWithResources: !1,
      resourceLabelContent: void 0,
      resourceLabelDidMount: void 0,
      view: "resourceTimeGridWeek"
    }), Object.assign(n.buttonText, {
      resourceTimeGridDay: "day",
      resourceTimeGridWeek: "week"
    }), Object.assign(n.theme, {
      colGroup: "ec-col-group",
      resource: "ec-resource",
      resourceLabel: "ec-resource-label"
    }), Object.assign(n.views, {
      resourceTimeGridDay: {
        component: () => Gt,
        dayHeaderFormat: { weekday: "long" },
        // Default title carries the weekday so it stays informative
        // when the per-lane day label is suppressed (see the
        // days.length > 1 guard in the view's header renderer):
        // "Wednesday, 27 May 2026" instead of the previous
        // "27 May 2026", which on a single-day resource view dropped
        // a useful piece of context the user had to look at the row
        // headers to recover.
        titleFormat: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
        duration: { days: 1 }
      },
      resourceTimeGridWeek: {
        component: () => Gt,
        duration: { weeks: 1 }
      }
    });
  },
  createParsers(n) {
    "scrollTime" in n || Object.assign(n, {
      scrollTime: ce,
      slotDuration: ce,
      slotLabelInterval: Le(ce),
      slotMaxTime: ce,
      slotMinTime: ce,
      snapDuration: Le(ce)
    });
  }
};
function ss({
  resources: n,
  resourceGroups: t,
  resourceGroupField: e,
  groupState: o,
  ungroupedTitle: s = "Other"
}) {
  const r = /* @__PURE__ */ new Map(), i = [];
  if (Array.isArray(t))
    for (const g of t) {
      const M = String(g.id), c = o.get(M);
      r.set(M, {
        id: M,
        title: g.title ?? "",
        color: g.color,
        resourceIds: Array.isArray(g.resourceIds) ? g.resourceIds.map(String) : [],
        action: g.action,
        expanded: c ?? g.expanded ?? !0
      }), i.push(M);
    }
  if (e)
    for (const g of n) {
      const M = g[e] ?? g.extendedProps?.[e];
      if (M == null || M === "") continue;
      const c = String(M);
      if (!r.has(c)) {
        const y = o.get(c);
        r.set(c, {
          id: c,
          title: g[`${e}Title`] ?? g.extendedProps?.[`${e}Title`] ?? c,
          color: g[`${e}Color`] ?? g.extendedProps?.[`${e}Color`],
          resourceIds: [],
          expanded: y ?? !0
        }), i.push(c);
      }
      const f = r.get(c);
      f.resourceIds.includes(g.id) || f.resourceIds.push(g.id);
    }
  const a = /* @__PURE__ */ new Set();
  for (const g of r.values()) for (const M of g.resourceIds) a.add(M);
  const u = [];
  for (const g of i) {
    const M = r.get(g);
    if (M && (u.push({ kind: "group", group: M }), !!M.expanded))
      for (const c of M.resourceIds) {
        const f = n.find((y) => y.id === c);
        f && u.push({ kind: "resource", resource: f, group: M });
      }
  }
  const w = n.filter((g) => !a.has(g.id));
  if (w.length === 0) return { layout: u, groupsById: r };
  if (i.length > 0 && s) {
    const g = "__ungrouped", M = o.get(g), c = {
      id: g,
      title: s,
      color: void 0,
      resourceIds: w.map((f) => f.id),
      expanded: M ?? !0,
      synthetic: !0
    };
    if (r.set(g, c), u.push({ kind: "group", group: c }), c.expanded)
      for (const f of w) u.push({ kind: "resource", resource: f, group: c });
  } else
    for (const g of w) u.push({ kind: "resource", resource: g, group: null });
  return { layout: u, groupsById: r };
}
function Fe(n, t) {
  const e = t.get("resourceGroupState") ?? /* @__PURE__ */ new Map();
  t.set("resourceGroupState", e);
  let o = null;
  const s = () => {
    o && (o(), o = null);
    const i = t.get("options"), a = i.theme, u = t.get("activeRange"), w = t.get("resources") ?? i.resources ?? [];
    if (!u) return;
    const v = ke(u, i.hiddenDays ?? []), g = t.get("filteredEvents") ?? [], M = i.slotMode === "hours" ? "hours" : "days", c = Vt(i.slotMinTime) / 3600, f = Vt(i.slotMaxTime) / 3600, y = M === "hours" ? Math.max(1, Math.round(f - c)) : 1, d = M === "hours" ? i.slotWidth ?? 48 : i.slotWidth ?? 140, b = v.length * y, T = b * d, x = (p) => {
      const l = v.findIndex((q) => {
        const Z = $(q);
        return ae(Z), p < Z && p >= q;
      });
      if (M === "days")
        return l === -1 ? p < v[0] ? 0 : T : l * d;
      let S = l;
      if (S === -1)
        return p < v[0] ? 0 : T;
      const D = ne($(v[S])), E = (p.getTime() - D.getTime()) / 6e4, U = Math.max(c * 60, Math.min(f * 60, E)) / 60 - c;
      return S * y * d + U * d;
    }, C = h("div", `${a.grid} ec-timeline ec-resource ec-timeline-mode-${M}`, "", [
      ["data-grid", "resource-timeline"],
      ["data-slot-mode", M]
    ]);
    i.dayHeaderTodayStyle === "circle" && C.classList.add("ec-day-head-today-circle");
    const _ = t.get("rowHeight");
    _ && C.style.setProperty("--ec-timeline-row-h", `${_}px`);
    const A = h("div", a.colHead, "", [["data-row", "header"]]), P = h("div", `${a.rowHead} ec-corner`);
    A.append(P);
    const R = h("div", a.slots);
    R.style.width = `${T}px`;
    const V = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayHeaderFormat }), z = ne(ue(/* @__PURE__ */ new Date()));
    for (const p of v) {
      const l = Ce(z, ne($(p))), S = h("div", `${a.dayHead}${l ? " ec-day-head-today" : ""}`, "", [
        ["data-day", String(p.getUTCDay())],
        ["data-date", p.toISOString().substring(0, 10)]
      ]);
      if (i.dayHeaderTodayStyle === "circle" && l) {
        const D = V.format(p), E = p.getUTCDate(), G = D.indexOf(String(E));
        if (G >= 0) {
          const U = D.slice(0, G), q = D.slice(G + String(E).length);
          U && S.append(document.createTextNode(U));
          const Z = h("span", "ec-day-head-today-disc", String(E));
          S.append(Z), q && S.append(document.createTextNode(q));
        } else
          S.textContent = D;
      } else
        S.textContent = V.format(p);
      S.style.width = `${d * y}px`, R.append(S);
    }
    if (A.append(R), M === "hours") {
      const p = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", hour: "numeric" }), l = h("div", `${a.colHead} ec-timeline-hour-head`, "", [
        ["data-row", "hour-header"]
      ]);
      l.append(h("div", a.rowHead));
      const S = h("div", `${a.slots} ec-timeline-hour-strip`);
      S.style.width = `${T}px`;
      for (let D = 0; D < v.length; ++D)
        for (let E = 0; E < y; ++E) {
          const G = $(v[D]);
          G.setUTCHours(c + E, 0, 0, 0);
          const U = h("div", `${a.dayHead} ec-hour-head`, p.format(G), [
            ["data-hour", String(c + E)]
          ]);
          U.style.width = `${d}px`, S.append(U);
        }
      l.append(S), C.append(A, l);
    } else
      C.append(A);
    const N = w.filter((p) => (Re(p)?.level ?? 0) === 0);
    if (i.resourceExpand !== void 0) {
      const p = (l, S) => {
        const D = Re(l);
        if (D) {
          (i.resourceExpand === "all" || i.resourceExpand === !0 || typeof i.resourceExpand == "number" && S < i.resourceExpand) && (l.expanded = !0);
          for (const E of D.children) p(E, S + 1);
        }
      };
      for (const l of N) p(l, 0);
    }
    const { layout: K, groupsById: H } = ss({
      resources: N,
      resourceGroups: i.resourceGroups,
      resourceGroupField: i.resourceGroupField,
      ungroupedTitle: i.ungroupedGroupTitle,
      groupState: e
    });
    t.set("resourceGroupsById", H);
    const F = /* @__PURE__ */ new Map();
    for (const p of H.values())
      for (const l of p.resourceIds) F.set(l, p);
    const k = (p) => F.get(p.id) ?? null, I = h("div", "ec-timeline-body", "", [["data-row", "body"]]);
    I.style.position = "relative";
    let X = -1;
    for (let p = 0; p < v.length; p++)
      if (Ce(z, ne($(v[p])))) {
        X = p;
        break;
      }
    if (X >= 0) {
      const p = X * y * d, l = d * y, S = h("div", "ec-timeline-today-band", "", [
        ["data-today-band", ""]
      ]);
      if (S.style.position = "absolute", S.style.top = "0", S.style.bottom = "0", S.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${p}px)`, S.style.width = `${l}px`, S.style.pointerEvents = "none", S.style.zIndex = "0", I.append(S), i.nowIndicator) {
        const D = h("div", "ec-timeline-now-line", "", [
          ["data-now-indicator", ""]
        ]);
        D.style.position = "absolute", D.style.top = "0", D.style.bottom = "0", D.style.width = "2px", D.style.background = "var(--ec-now-indicator-color, #dc2626)", D.style.pointerEvents = "none", D.style.zIndex = "1";
        const E = v[X], G = (U) => {
          const Z = ((U instanceof Date ? U : ue(/* @__PURE__ */ new Date())).getTime() - E.getTime()) / 6e4;
          let J;
          M === "hours" ? J = (Math.max(c * 60, Math.min(f * 60, Z)) - c * 60) / 60 * d : J = Math.max(0, Math.min(1440, Z)) / 1440 * d, D.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${p + J}px)`;
        };
        G(t.get("now")), I.append(D), o = t.on("change:now", ({ value: U }) => G(U));
      }
    }
    const L = t.get("suggestedSlot");
    if (L?.start && L?.end) {
      const p = x(L.start), l = x(L.end);
      if (!(l <= 0 || p >= T)) {
        const S = h("div", "ec-suggested-slot", "", [
          ["data-suggested-slot", ""],
          ["data-resource-id", L.resourceId ?? ""]
        ]);
        S.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${Math.max(0, p)}px)`, S.style.width = `${Math.max(8, Math.min(T, l) - Math.max(0, p))}px`, S.style.top = "4px", S.style.bottom = "4px", S.style.pointerEvents = "auto", S.addEventListener("click", (D) => {
          t.get("fire")?.("suggestedSlotClick", {
            start: L.start,
            end: L.end,
            resourceId: L.resourceId,
            jsEvent: D,
            view: t.get("view")
          });
        }), I.append(S);
      }
    }
    const Y = t.get("mode"), Q = Y && typeof i.cellAffordanceWhen == "function" && i.cellAffordanceWhen(Y), m = (p) => {
      const l = h("div", `ec-timeline-row ${a.groupHeader}`, "", [
        ["data-row", "group-header"],
        ["data-group-id", p.id],
        ["data-expanded", p.expanded ? "true" : "false"]
      ]), S = h("div", `${a.rowHead} ec-group-head`), D = h("button", a.groupHeaderToggle, "", [
        ["type", "button"],
        ["aria-label", p.expanded ? "Collapse" : "Expand"],
        ["aria-expanded", String(p.expanded)]
      ]);
      D.innerHTML = p.expanded ? i.icons.collapse?.html ?? "−" : i.icons.expand?.html ?? "+", D.addEventListener("click", () => {
        const J = !p.expanded;
        e.set(p.id, J), p.expanded = J, t.get("fire")?.(J ? "groupExpand" : "groupCollapse", {
          groupId: p.id,
          view: t.get("view")
        }), s();
      }), S.append(D);
      const E = h("span", a.groupHeaderSwatch);
      p.color && (E.style.background = p.color), S.append(E), S.append(h("span", a.groupHeaderName, p.title)), S.append(h("span", a.groupHeaderCount, `${p.resourceIds.length}`));
      const G = h("span", a.groupHeaderAction, "", [
        ["data-group-header-action", ""]
      ]), U = i.groupHeaderContent;
      if (typeof U == "function") {
        const J = U({ group: p, view: t.get("view") });
        typeof J == "string" ? G.textContent = J : J?.html ? G.innerHTML = J.html : J?.domNodes && J.domNodes.forEach((B) => G.append(B));
      }
      S.append(G), l.append(S);
      const q = h("div", "ec-group-header-strip");
      q.style.width = `${T}px`, l.append(q), I.append(l);
      const Z = i.groupHeaderDidMount;
      typeof Z == "function" && queueMicrotask(() => Z({ group: p, el: l, view: t.get("view") }));
    }, O = (p, l) => {
      const S = Re(p);
      if (S?.hidden || p.visible === !1) return;
      const D = h("div", "ec-timeline-row", "", [
        ["data-resource-id", p.id],
        ["data-depth", String(l)]
      ]), E = h("div", a.rowHead, "", [["data-resource-label", ""]]);
      E.style.setProperty("--ec-row-head-indent", `${l * 16}px`);
      const G = S?.children?.length > 0;
      if (G) {
        const B = h("button", a.expander, "", [
          ["type", "button"],
          ["data-toolbar-action", "expand"]
        ]);
        B.innerHTML = p.expanded ? i.icons.collapse?.html ?? "−" : i.icons.expand?.html ?? "+", B.addEventListener("click", () => {
          p.expanded = !p.expanded;
          const j = (W, te) => {
            const se = Re(W);
            if (se)
              for (const de of se.children) {
                const ee = Re(de);
                ee && (ee.hidden = te), j(de, te || !de.expanded);
              }
          };
          j(p, !p.expanded), s();
        }), E.append(B);
      }
      E.append(h("span", "", p.title)), D.append(E);
      const U = h("div", "ec-timeline-ribbon");
      if (U.style.position = "relative", U.style.minHeight = "30px", U.style.width = `${T}px`, p.workingHours)
        for (let B = 0; B < v.length; ++B) {
          const j = v[B], W = Mn(p.workingHours, j);
          if (W.length !== 0) {
            if (M === "days") {
              if (W.length === 1 && W[0].startMin === 0 && W[0].endMin === 1440) {
                const se = h("div", "ec-resource-offhours");
                se.style.position = "absolute", se.style.top = "0", se.style.bottom = "0", se.style.left = `${B * d}px`, se.style.width = `${d}px`, se.style.pointerEvents = "none", U.append(se);
              }
              continue;
            }
            for (const te of W) {
              const se = Math.max(te.startMin / 60, c), de = Math.min(te.endMin / 60, f);
              if (de <= se) continue;
              const ee = (B * y + (se - c)) * d, fe = (de - se) * d;
              if (fe <= 0) continue;
              const re = h("div", "ec-resource-offhours");
              re.style.position = "absolute", re.style.top = "0", re.style.bottom = "0", re.style.left = `${ee}px`, re.style.width = `${fe}px`, re.style.pointerEvents = "none", U.append(re);
            }
          }
        }
      if (M === "hours" && i.lunchHour != null) {
        const B = Number(i.lunchHour);
        if (Number.isFinite(B) && B >= c && B < f)
          for (let j = 0; j < v.length; ++j) {
            const W = h("div", "ec-timeline-lunch-band"), te = (j * y + (B - c)) * d;
            W.style.position = "absolute", W.style.top = "0", W.style.bottom = "0", W.style.left = `${te}px`, W.style.width = `${d}px`, W.style.pointerEvents = "none", U.append(W);
          }
      }
      const q = h("div", "ec-timeline-cells");
      q.style.position = "absolute", q.style.inset = "0", q.style.display = "grid", q.style.gridTemplateColumns = `repeat(${b}, ${d}px)`, q.style.pointerEvents = "none";
      const Z = t.get("fire");
      for (let B = 0; B < v.length; ++B) {
        const j = v[B];
        for (let W = 0; W < y; ++W) {
          const te = $(j);
          M === "hours" && te.setUTCHours(c + W, 0, 0, 0);
          const se = W === 0, de = M === "days" && B > 0 && B % 7 === 0 && W === 0, ee = h(
            "div",
            `ec-timeline-cell${se ? " ec-timeline-cell-day-edge" : ""}${de ? " ec-timeline-cell-week-edge" : ""}${Q ? " ec-timeline-cell-affordance" : ""}`,
            "",
            [
              ["data-date", j.toISOString().substring(0, 10)],
              ["data-day", String(j.getUTCDay())],
              ...M === "hours" ? [["data-hour", String(c + W)]] : []
            ]
          );
          ee.style.pointerEvents = "auto";
          const fe = i.emptyCellAddButton || Q;
          if (fe) {
            const re = h("span", "ec-timeline-cell-add", "+");
            if (typeof fe == "function") {
              const oe = fe({ date: te, resource: p, group: k(p) });
              typeof oe == "string" ? re.textContent = oe : oe?.html ? re.innerHTML = oe.html : oe?.domNodes && (re.textContent = "", oe.domNodes.forEach((ye) => re.append(ye)));
            }
            ee.append(re);
          }
          ee.addEventListener("click", (re) => {
            Z?.("cellClick", {
              date: te,
              resource: p,
              group: k(p),
              jsEvent: re,
              view: t.get("view")
            });
          }), q.append(ee);
        }
      }
      U.append(q);
      const J = g.filter((B) => B.resourceIds.length === 0 || B.resourceIds.includes(p.id));
      for (const B of J) {
        const j = x(B.start), W = x(B.end);
        if (W <= 0 || j >= T) continue;
        const te = Math.max(0, j), se = Math.min(T, W), de = Math.max(d / 4, se - te), ee = [a.event], fe = i.eventClassNames;
        if (typeof fe == "function") {
          const le = fe({ event: B });
          le && ee.push(...Array.isArray(le) ? le : [le]);
        } else fe && ee.push(...Array.isArray(fe) ? fe : [fe]);
        B.classNames && ee.push(...Array.isArray(B.classNames) ? B.classNames : [B.classNames]);
        const re = ze(B, i);
        re && ee.push(...re.classNames);
        const oe = h("div", ee.filter(Boolean).join(" "), B.title || "", [
          ["data-event-id", B.id],
          ...De(B)
        ]);
        oe.style.position = "absolute", oe.style.left = `${te}px`, oe.style.width = `${de}px`;
        const ye = B.backgroundColor ?? re?.color;
        if (ye && oe.style.setProperty("--ec-event-color", ye), de < Number(i.eventNarrowThreshold ?? 60) && oe.classList.add("ec-event-narrow"), typeof ResizeObserver < "u" && new ResizeObserver(() => {
          const we = oe.getBoundingClientRect().width;
          oe.classList.toggle("ec-event-narrow", we < Number(i.eventNarrowThreshold ?? 60));
        }).observe(oe), i.editable && i.eventDurationEditable !== !1) {
          const le = h(
            "div",
            `${i.theme.resizer ?? "ec-resizer"} ec-resizer-x ec-resizer-x-end`,
            "",
            [
              ["data-resizer", "end"],
              ["data-resize-axis", "x"]
            ]
          );
          if (oe.append(le), i.eventResizableFromStart) {
            const we = h(
              "div",
              `${i.theme.resizer ?? "ec-resizer"} ec-resizer-x ec-resizer-x-start`,
              "",
              [
                ["data-resizer", "start"],
                ["data-resize-axis", "x"]
              ]
            );
            oe.append(we);
          }
        }
        oe.addEventListener("click", (le) => Z?.("eventClick", { event: B, jsEvent: le, view: t.get("view"), resource: p })), oe.addEventListener("dblclick", (le) => Z?.("eventDoubleClick", { event: B, jsEvent: le, view: t.get("view"), resource: p, el: oe })), oe.addEventListener("mouseenter", (le) => Z?.("eventMouseEnter", { event: B, jsEvent: le, view: t.get("view"), resource: p })), oe.addEventListener("mouseleave", (le) => Z?.("eventMouseLeave", { event: B, jsEvent: le, view: t.get("view"), resource: p })), queueMicrotask(() => Z?.("eventDidMount", { event: B, el: oe, view: t.get("view"), resource: p })), U.append(oe);
      }
      if (D.append(U), I.append(D), p.expanded && G)
        for (const B of S.children) O(B, l + 1);
    };
    for (const p of K)
      p.kind === "group" ? m(p.group) : O(p.resource, 0);
    C.append(I), i.allowPinchZoom && is(I, t, i), n.replaceChildren(C);
  };
  s();
  const r = t.onAny(({ key: i }) => {
    [
      "options",
      "currentRange",
      "activeRange",
      "viewDates",
      "filteredEvents",
      "resources",
      "rowHeight",
      "mode",
      "suggestedSlot"
    ].includes(i) && s();
  });
  return () => {
    r(), o && (o(), o = null), n.replaceChildren();
  };
}
function Vt(n) {
  return n ? (n.days ?? 0) * 86400 + (n.seconds ?? 0) : 0;
}
function is(n, t, e) {
  let o = null;
  const s = (a) => {
    a.touches.length === 2 && (o = {
      startDist: Zt(a.touches[0], a.touches[1]),
      startHeight: t.get("rowHeight") ?? e.compactRowHeight ?? 52
    });
  }, r = (a) => {
    if (!o || a.touches.length !== 2) return;
    const u = Zt(a.touches[0], a.touches[1]);
    if (Math.abs(u - o.startDist) < 14) return;
    const w = u > o.startDist ? Number(e.comfyRowHeight ?? 88) : Number(e.compactRowHeight ?? 52);
    w !== t.get("rowHeight") && (t.set("rowHeight", w), t.get("fire")?.("rowHeightChange", { height: w })), a.preventDefault();
  }, i = () => {
    o = null;
  };
  n.addEventListener("touchstart", s, { passive: !1 }), n.addEventListener("touchmove", r, { passive: !1 }), n.addEventListener("touchend", i, { passive: !0 }), n.addEventListener("touchcancel", i, { passive: !0 });
}
function Zt(n, t) {
  const e = n.clientX - t.clientX, o = n.clientY - t.clientY;
  return Math.sqrt(e * e + o * o);
}
const rs = {
  createOptions(n) {
    "scrollTime" in n || Object.assign(n, {
      flexibleSlotTimeLimits: !1,
      nowIndicator: !1,
      scrollTime: "06:00:00",
      slotDuration: "00:30:00",
      slotHeight: 24,
      slotLabelInterval: void 0,
      slotLabelFormat: { hour: "numeric", minute: "2-digit" },
      slotMaxTime: "24:00:00",
      slotMinTime: "00:00:00",
      snapDuration: void 0
    }), "resourceLabelContent" in n || (n.filterResourcesWithEvents = !1, n.resourceLabelContent = void 0, n.resourceLabelDidMount = void 0), Object.assign(n, {
      monthHeaderFormat: { month: "long" },
      resourceExpand: void 0,
      slotWidth: 32,
      view: "resourceTimelineWeek",
      // Phase A1 — Roster grouping. Two ways to feed groups:
      //   (a) explicit list:  resourceGroups: [{ id, title, color,
      //       resourceIds, expanded }]
      //   (b) derive from a field on each resource:
      //       resourceGroupField: 'crewId'
      // When both are supplied the explicit list wins. Resources with no
      // matching group render as flat siblings — no "Unaffiliated" header.
      resourceGroups: void 0,
      resourceGroupField: void 0,
      // When at least one explicit group is defined and there are
      // resources that don't match any group, the renderer wraps the
      // leftovers in a synthetic "Other" group so they're visually
      // separated from the named crews. Set to null / '' to opt out
      // and keep the flat tail (the pre-Phase A1 behaviour).
      ungroupedGroupTitle: "Other",
      groupHeaderContent: void 0,
      groupHeaderDidMount: void 0,
      // Phase A3 — per-cell quick-add affordance + cellClick.
      //   emptyCellAddButton: false | true | (ctx) => htmlOrText
      //   cellClick: ({ date, resource, group, jsEvent, view }) => …
      // cellClick is distinct from dateClick (which the Interaction
      // plugin fires from the underlying calendar background); cellClick
      // always carries { date, resource, group } so the host can open
      // its "new appointment for crew Y on day Z" sheet pre-filled.
      emptyCellAddButton: void 0,
      cellClick: void 0,
      // Phase D2 — when truthy AND a mode is active, every empty cell
      // shows the dashed-orange affordance always (not just on hover).
      cellAffordanceWhen: void 0,
      suggestedSlotClick: void 0,
      // Phase A7 — bars narrower than this (px) get .ec-event-narrow so
      // per-bar CSS can hide secondary text (time meta, subtitle).
      eventNarrowThreshold: 60,
      // Phase B1/B3 — slot mode. Default 'days' keeps Phase 9 behaviour
      // (one column per day). 'hours' switches the resource timeline
      // into a per-day, per-hour column grid (uses slotMinTime /
      // slotMaxTime to bound the hour range). The view's day count is
      // derived from options.duration as usual; in hours mode every day
      // gets HOURS = (slotMaxTime - slotMinTime) / 1h columns.
      slotMode: "days",
      // Phase B5 — pinch-to-zoom row height. compactRowHeight (px) and
      // comfyRowHeight (px) are the two slots the gesture toggles
      // between; the active height lives on state.rowHeight and is
      // surfaced as inline --ec-timeline-row-h on the root.
      allowPinchZoom: !1,
      compactRowHeight: 52,
      comfyRowHeight: 88,
      // Phase B6 — TODAY day-number style. 'cell-tint' (default) keeps
      // the existing behaviour; 'circle' wraps the day number in an
      // accent-filled circle (iOS Calendar pattern).
      dayHeaderTodayStyle: "cell-tint",
      // Optional shaded lunch hour band inside hours-mode (CSS-only).
      lunchHour: void 0
    }), Object.assign(n.buttonText, {
      expand: "Expand",
      collapse: "Collapse",
      resourceTimelineDay: "day",
      resourceTimelineWeek: "week",
      resourceTimelineMonth: "month",
      resourceTimelineYear: "year"
    }), Object.assign(n.icons, {
      collapse: { html: "&minus;" },
      expand: { html: "&plus;" }
    }), Object.assign(n.theme, {
      expander: "ec-expander",
      rowHead: "ec-row-head",
      slots: "ec-slots",
      timeline: "ec-timeline",
      // Phase A1 — group header row above each crew's resource rows.
      groupHeader: "ec-group-header",
      groupHeaderSwatch: "ec-group-header-swatch",
      groupHeaderToggle: "ec-group-header-toggle",
      groupHeaderName: "ec-group-header-name",
      groupHeaderCount: "ec-group-header-count",
      groupHeaderAction: "ec-group-header-action"
    }), Object.assign(n.views, {
      resourceTimelineDay: {
        component: () => Fe,
        dayHeaderFormat: { weekday: "long" },
        duration: { days: 1 },
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      },
      resourceTimelineWeek: {
        component: () => Fe,
        duration: { weeks: 1 }
      },
      resourceTimelineMonth: {
        component: () => Fe,
        dayHeaderFormat: { weekday: "short", day: "numeric" },
        duration: { months: 1 },
        slotDuration: { days: 1 },
        titleFormat: { year: "numeric", month: "long" }
      },
      // Phase B2 — 28-day compressed Gantt. Renders 4 weeks of daily
      // columns; the renderer's narrow auto-class kicks in for most
      // bars at this density. Today-circle is the recommended dayHead
      // style here (matches iOS Calendar at month zoom).
      resourceTimelineMonth4w: {
        component: () => Fe,
        dayHeaderFormat: { day: "numeric" },
        duration: { weeks: 4 },
        slotDuration: { days: 1 },
        slotWidth: 36,
        dayHeaderTodayStyle: "circle",
        titleFormat: { year: "numeric", month: "long" }
      },
      resourceTimelineYear: {
        component: () => Fe,
        dayHeaderFormat: { weekday: "short", day: "numeric" },
        duration: { years: 1 },
        slotDuration: { days: 1 },
        titleFormat: { year: "numeric" }
      }
    });
  },
  createParsers(n) {
    "scrollTime" in n || Object.assign(n, {
      scrollTime: ce,
      slotDuration: ce,
      slotLabelInterval: Le(ce),
      slotMaxTime: ce,
      slotMinTime: ce,
      snapDuration: Le(ce)
    });
  }
}, et = "_suppressNextChipClick", Ue = "_suppressNextChipClickTimer";
function tt(n, t = 400) {
  if (!n) return;
  n.set(et, !0);
  const e = n.get(Ue);
  e && clearTimeout(e), n.set(Ue, setTimeout(() => {
    n.set(et, !1), n.set(Ue, null);
  }, t));
}
function as(n) {
  if (!n) return !1;
  const t = n.get(et) === !0;
  if (t) {
    const e = n.get(Ue);
    e && clearTimeout(e), n.set(et, !1), n.set(Ue, null);
  }
  return t;
}
function xt({ state: n, options: t, event: e, kind: o, detailExtras: s, updateAttrs: r }) {
  const i = at(e), a = t.confirmEventChange;
  if (typeof a == "function" && i.isSeriesMember) {
    Promise.resolve(a({
      kind: o,
      event: e,
      oldEvent: s?.oldEvent,
      delta: s?.delta,
      startDelta: s?.startDelta,
      endDelta: s?.endDelta,
      isOccurrence: !0,
      seriesId: i.seriesId
    })).then((u) => {
      !u || u.proceed === !1 || (n.get("hostEl")?.calendarApi?.updateEvent(r), n.get("fire")?.("eventChangeConfirmed", {
        event: e,
        kind: o,
        scope: u.scope ?? null,
        seriesId: i.seriesId
      }));
    });
    return;
  }
  n.get("hostEl")?.calendarApi?.updateEvent(r);
}
const cs = {
  createOptions(n) {
    Object.assign(n, {
      dateClick: void 0,
      dragConstraint: void 0,
      dragScroll: !0,
      editable: !1,
      eventDragMinDistance: 5,
      eventDragStart: void 0,
      eventDragStop: void 0,
      eventDrop: void 0,
      eventDurationEditable: !0,
      eventLongPressDelay: void 0,
      eventResizableFromStart: !1,
      eventResizeStart: void 0,
      eventResizeStop: void 0,
      eventResize: void 0,
      eventStartEditable: !0,
      longPressDelay: 1e3,
      pointer: !1,
      resizeConstraint: void 0,
      select: void 0,
      selectBackgroundColor: void 0,
      selectConstraint: void 0,
      selectLongPressDelay: void 0,
      selectMinDistance: 5,
      snapDuration: void 0,
      unselect: void 0,
      unselectAuto: !0,
      unselectCancel: ""
    }), Object.assign(n.theme, {
      draggable: "ec-draggable",
      ghost: "ec-ghost",
      preview: "ec-preview",
      pointer: "ec-pointer",
      resizer: "ec-resizer",
      start: "ec-start",
      dragging: "ec-dragging",
      resizingY: "ec-resizing-y",
      resizingX: "ec-resizing-x",
      selecting: "ec-selecting"
    });
  },
  initState(n) {
    n.get("auxComponents").push({
      name: "interaction",
      mount(t, e) {
        const o = bs(t, e), s = vs(t, e), r = ys(t, e), i = ws(t, e), a = Ts(t, e), u = Cs(t, e);
        return () => {
          o(), s(), r(), i(), a(), u();
        };
      }
    });
  }
}, ls = 240, Kt = 8, ds = 0.18, us = 72, fs = 120, ps = 850, hs = 375, gs = 8, ms = 5;
function vs(n, t) {
  let e = null, o = null;
  const s = /* @__PURE__ */ new WeakMap(), r = (m) => m.closest?.("[data-event-id]"), i = (m, O) => {
    const p = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(m, O) : [];
    for (const l of p) {
      const S = l.closest?.("[data-date]");
      if (S && n.contains(S)) return S;
    }
    return null;
  }, a = (m, O) => {
    const p = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(m, O) : [];
    for (const l of p) {
      const S = l.closest?.(".ec-time-col");
      if (S && n.contains(S)) return S;
    }
    return null;
  }, u = (m) => {
    const O = t.get("options");
    if (!O.editable && !O.eventStartEditable || m.button !== void 0 && m.button !== 0 || m.target.closest?.(".ec-resizer")) return;
    const p = r(m.target);
    if (!p) return;
    const l = m.pointerType === "touch", S = p.getAttribute("data-event-id"), D = (t.get("filteredEvents") ?? []).find((ee) => ee.id === S);
    if (!D) return;
    const E = p.closest("[data-date]"), G = p.closest(".ec-time-col"), U = G?.getBoundingClientRect(), q = p.getBoundingClientRect(), Z = ge(O.slotDuration) / 60 || 30, B = (O.slotHeight ?? 22) / Z, j = ge(O.snapDuration) / 60 || Z, W = ge(O.slotMinTime) / 60 || 0, te = U ? (m.clientY - U.top) / B : null, se = D.start.getUTCHours() * 60 + D.start.getUTCMinutes(), de = D.end.getUTCHours() * 60 + D.end.getUTCMinutes() + (D.end.getTime() < D.start.getTime() ? 1440 : 0);
    if (e = {
      event: D,
      sourceChip: p,
      sourceDateStr: E?.getAttribute("data-date"),
      sourceTimeCol: G,
      // In resourceTimeGridDay each column is one staff lane and the
      // cell carries data-resource-id. Capture the source lane at
      // pointerdown so finishDrag can compare against the drop target
      // and emit oldResource/newResource on cross-lane drops — same
      // shape resource_timeline already emits.
      sourceResourceId: G?.getAttribute("data-resource-id") ?? null,
      sourceColRect: U,
      startTimeOfDayMin: te,
      grabOffsetX: m.clientX - q.left,
      grabOffsetY: m.clientY - q.top,
      chipWidth: q.width,
      chipHeight: q.height,
      startX: m.clientX,
      startY: m.clientY,
      lastX: m.clientX,
      lastY: m.clientY,
      pointerId: m.pointerId,
      touch: l,
      captured: !1,
      ghost: null,
      moved: !1,
      // Vertical snap baseline. snapMins is captured once at pointerdown
      // (rather than re-read every frame) so changing options mid-drag
      // doesn't move the goalposts. lastSnappedStartMin starts at null
      // and is set on the first move; the haptic fires whenever it
      // changes between move frames.
      pxPerMin: B,
      snapMins: j,
      slotMinMin: W,
      originalStartMin: se,
      originalEndMin: de,
      lastSnappedStartMin: null,
      timeTextHidden: !1,
      // Edge-hold cross-day drag bookkeeping.
      edgeHoldTimer: null,
      edgeHoldDirection: 0,
      edgeHoldFirstFired: !1,
      swapping: !1,
      daySteps: 0,
      dayOffsetBadge: null,
      pointerCancelWatchdog: null
    }, !l && p.setPointerCapture && m.pointerId !== void 0) {
      try {
        p.setPointerCapture(m.pointerId);
      } catch {
      }
      e.captured = !0;
    }
    l && (b(), x(m, p), p.classList.contains("ec-event-editing") && document.body.classList.add("ec-dragging"));
  }, w = (m) => {
    e && (e.touch && _(m.clientX, m.clientY), M(m, m.clientX, m.clientY));
  }, v = (m) => {
    if (!e?.touch) return;
    const O = V(m);
    O && M(m, O.clientX, O.clientY);
  }, g = (m) => {
    r(m.target)?.classList.contains("ec-event-editing") && (m.cancelable && m.preventDefault(), m.stopPropagation?.(), m.stopImmediatePropagation?.());
  };
  function M(m, O, p) {
    if (!e) return;
    const l = e.touch && e.sourceChip.classList.contains("ec-event-editing");
    if (l && (m.cancelable && m.preventDefault(), m.stopPropagation?.(), m.stopImmediatePropagation?.(), document.body.classList.add("ec-dragging")), e.touch && !l) return;
    e.lastX = O, e.lastY = p;
    const S = O - e.startX, D = p - e.startY, E = t.get("options"), G = E.eventDragMinDistance ?? 5;
    if (!e.moved && S * S + D * D < G * G) return;
    if (!e.moved) {
      if (C(), e.moved = !0, !e.touch && e.sourceChip.setPointerCapture && e.pointerId !== void 0)
        try {
          e.sourceChip.setPointerCapture(e.pointerId), e.captured = !0;
        } catch {
        }
      t.get("fire")?.("eventDragStart", {
        event: e.event,
        jsEvent: m,
        view: t.get("view")
      });
      const W = e.sourceChip.cloneNode(!0), te = getComputedStyle(e.sourceChip);
      for (let se = 0; se < te.length; se++) {
        const de = te[se];
        W.style.setProperty(de, te.getPropertyValue(de), te.getPropertyPriority(de));
      }
      W.classList.add(E.theme.ghost ?? "ec-ghost"), W.style.position = "fixed", W.style.pointerEvents = "none", W.style.opacity = "0.85", W.style.zIndex = "1000", W.style.margin = "0", W.style.right = "auto", W.style.bottom = "auto", W.style.width = `${e.chipWidth}px`, W.style.height = `${e.chipHeight}px`, W.style.left = `${O - e.grabOffsetX}px`, W.style.top = `${p - e.grabOffsetY}px`, e.ghost = W, document.body.appendChild(W), e.sourceChip.style.opacity = "0.4", document.body.classList.add("ec-dragging"), N(e);
    }
    const U = (p - e.startY) / e.pxPerMin, q = e.originalStartMin + U, Z = Math.round(q / e.snapMins) * e.snapMins, B = (Z - e.originalStartMin) * e.pxPerMin;
    Dn(e, p, () => {
      M({
        cancelable: !1,
        preventDefault() {
        },
        stopPropagation() {
        },
        stopImmediatePropagation() {
        }
      }, e.lastX, e.lastY);
    }), e.ghost && (e.ghost.style.left = `${O - e.grabOffsetX}px`, e.ghost.style.top = `${e.startY - e.grabOffsetY + B}px`);
    let j = !1;
    if (l) {
      const W = e.daySteps;
      k(O, p), j = e.daySteps !== W;
    }
    if (H(e, Z), Z !== e.lastSnappedStartMin) {
      if (e.lastSnappedStartMin !== null && !j && typeof navigator < "u" && navigator.vibrate)
        try {
          navigator.vibrate(ms);
        } catch {
        }
      e.lastSnappedStartMin = Z;
    }
    m.cancelable && m.preventDefault();
  }
  const c = (m) => {
    if (e?.touch && m.type === "pointercancel") {
      if (e.sourceChip && typeof document < "u" && !document.contains(e.sourceChip) && !e.pointerCancelWatchdog) {
        const p = e;
        p.pointerCancelWatchdog = setTimeout(() => {
          e === p && (p.pointerCancelWatchdog = null, y(m, p.lastX, p.lastY));
        }, 150);
      }
      return;
    }
    y(m, m.clientX, m.clientY);
  }, f = (m) => {
    if (!e?.touch) return;
    e.pointerCancelWatchdog && (clearTimeout(e.pointerCancelWatchdog), e.pointerCancelWatchdog = null);
    const O = z(m);
    y(m, O?.clientX ?? e.lastX, O?.clientY ?? e.lastY);
  };
  function y(m, O, p) {
    if (!e) return;
    const l = e;
    e = null, C(), I(l), l.pointerCancelWatchdog && (clearTimeout(l.pointerCancelWatchdog), l.pointerCancelWatchdog = null);
    const S = t.get("pagerApi");
    if (S?.abortStepDuringDrag)
      try {
        S.abortStepDuringDrag();
      } catch {
      }
    if (T(), nt(l), document.body.classList.remove("ec-dragging"), l.dayOffsetBadge && l.dayOffsetBadge.remove(), K(l), F(l), l.ghost && l.ghost.remove(), l.sourceChip && (l.sourceChip.style.opacity = ""), !l.moved) return;
    const E = i(O, p)?.getAttribute("data-date"), G = a(O, p);
    if (t.get("fire")?.("eventDragStop", {
      event: l.event,
      jsEvent: m,
      view: t.get("view")
    }), tt(t), !E) return;
    const U = t.get("options"), q = ge(U.slotDuration) / 60 || 30, Z = ge(U.snapDuration) / 60 || q, B = (U.slotHeight ?? 22) / q;
    let j, W, te;
    if (l.sourceTimeCol && G) {
      const ie = (p - l.startY) / B, he = l.originalStartMin + ie, Ye = Math.round(he / Z) * Z - l.originalStartMin, me = (/* @__PURE__ */ new Date(l.sourceDateStr + "T00:00:00Z")).getTime();
      te = (/* @__PURE__ */ new Date(E + "T00:00:00Z")).getTime() - me + Ye * 6e4;
    } else {
      if (E === l.sourceDateStr) return;
      const ie = (/* @__PURE__ */ new Date(l.sourceDateStr + "T00:00:00Z")).getTime();
      te = (/* @__PURE__ */ new Date(E + "T00:00:00Z")).getTime() - ie;
    }
    if (te === 0) return;
    j = new Date(l.event.start.getTime() + te), W = new Date(l.event.end.getTime() + te);
    const se = 864e5;
    let de = !1;
    const ee = { ...l.event, start: l.event.start, end: l.event.end }, fe = at(l.event), re = G?.getAttribute("data-resource-id") ?? null;
    let oe = l.event.resourceIds, ye = !1;
    if (l.sourceResourceId && re && re !== l.sourceResourceId) {
      const ie = (l.event.resourceIds ?? []).slice(), he = ie.indexOf(l.sourceResourceId);
      he >= 0 ? ie[he] = re : ie.push(re), oe = ie, ye = !0;
    }
    const le = {
      event: l.event,
      oldEvent: ee,
      newStart: j,
      newEnd: W,
      delta: { days: Math.round(te / se), milliseconds: te },
      jsEvent: m,
      view: t.get("view"),
      isOccurrence: fe.isSeriesMember,
      seriesId: fe.seriesId,
      revert: () => {
        de = !0;
      }
    };
    if (ye && (le.oldResource = l.sourceResourceId, le.newResource = re, le.newResourceIds = oe), t.get("fire")?.("eventDrop", le), de) return;
    const we = {
      id: l.event.id,
      start: j.toISOString(),
      end: W.toISOString()
    };
    ye && (we.resourceIds = oe), xt({
      state: t,
      options: t.get("options"),
      event: l.event,
      kind: "drop",
      detailExtras: { oldEvent: ee, delta: le.delta },
      updateAttrs: we
    });
  }
  let d = !1;
  function b() {
    d || (d = !0, document.addEventListener("touchmove", v, { passive: !1, capture: !0 }), document.addEventListener("touchend", f, { passive: !1, capture: !0 }), document.addEventListener("touchcancel", f, { passive: !1, capture: !0 }));
  }
  function T() {
    d && (d = !1, document.removeEventListener("touchmove", v, !0), document.removeEventListener("touchend", f, !0), document.removeEventListener("touchcancel", f, !0));
  }
  function x(m, O) {
    C();
    const l = t.get("options").eventLongPressDelay ?? ls;
    o = {
      chip: O,
      startX: m.clientX,
      startY: m.clientY,
      moved: !1,
      timer: setTimeout(() => {
        !o || o.chip !== O || o.moved || !e || e.sourceChip !== O || (o = null, A(O), P(O), document.body.classList.add("ec-dragging"), typeof navigator < "u" && navigator.vibrate && navigator.vibrate(15));
      }, l)
    };
  }
  function C() {
    o && (clearTimeout(o.timer), o = null);
  }
  function _(m, O) {
    if (!o) return;
    const p = m - o.startX, l = O - o.startY;
    p * p + l * l > Kt * Kt && (o.moved = !0, C());
  }
  function A(m) {
    const O = m.getAttribute("data-event-id"), p = O && typeof CSS < "u" && CSS.escape ? CSS.escape(O) : O, l = O ? Array.from(n.querySelectorAll?.(`[data-event-id="${p}"]`) ?? []) : [m], S = new Set(l);
    n.querySelectorAll?.(".ec-event.ec-event-editing").forEach((D) => {
      S.has(D) || D.classList.remove("ec-event-editing");
    }), l.forEach((D) => D.classList.add("ec-event-editing"));
  }
  function P(m) {
    s.set(m, Date.now() + 800);
  }
  function R(m) {
    const O = r(m.target);
    if (!O) return;
    const p = s.get(O) || 0;
    if (p && Date.now() <= p) {
      m.preventDefault(), m.stopImmediatePropagation?.(), m.stopPropagation?.();
      return;
    }
    p && s.delete(O);
  }
  function V(m) {
    const O = m.touches?.[0] ?? null;
    return O && _(O.clientX, O.clientY), m.touches?.[0] ?? null;
  }
  function z(m) {
    return m.changedTouches?.[0] ?? null;
  }
  function N(m) {
    if (m.timeTextHidden) return;
    m.timeTextHidden = !0;
    const O = [];
    m.sourceChip && O.push(...m.sourceChip.querySelectorAll(".ec-event-time")), m.ghost && O.push(...m.ghost.querySelectorAll(".ec-event-time"));
    for (const p of O)
      p.dataset.ecDragPriorVisibility = p.style.visibility || "", p.style.visibility = "hidden";
  }
  function K(m) {
    if (!m.timeTextHidden) return;
    m.timeTextHidden = !1;
    const O = [];
    m.sourceChip && O.push(...m.sourceChip.querySelectorAll(".ec-event-time")), m.ghost && O.push(...m.ghost.querySelectorAll(".ec-event-time"));
    for (const p of O) {
      const l = p.dataset.ecDragPriorVisibility ?? "";
      p.style.visibility = l, delete p.dataset.ecDragPriorVisibility;
    }
  }
  function H(m, O) {
    if (!m.pxPerMin) return;
    const p = n.querySelector?.('.ec-pager-page-current .ec-time-grid [data-row="body"] > .ec-sidebar') ?? n.querySelector?.('.ec-time-grid [data-row="body"] > .ec-sidebar');
    if (!p) return;
    const l = n.querySelectorAll?.("[data-ec-draft-start-label]") ?? [];
    for (const G of l) G !== m.draftStartLabel && G.remove();
    const S = (Math.round(O) % 60 + 60) % 60;
    if (S === 0) {
      m.draftStartLabel?.remove(), m.draftStartLabel = null;
      return;
    }
    let D = m.draftStartLabel;
    (!D || D.parentNode !== p) && (D?.remove(), D = document.createElement("span"), D.dataset.ecDraftStartLabel = "", D.className = "ec-draft-start-label", D.style.position = "absolute", D.style.right = "0.5rem", D.style.fontSize = "0.7rem", D.style.fontWeight = "600", D.style.color = "var(--ec-text-color, #1a1a1a)", D.style.fontVariantNumeric = "tabular-nums", D.style.lineHeight = "1", D.style.pointerEvents = "none", D.style.zIndex = "3", p.appendChild(D), m.draftStartLabel = D);
    const E = (O - m.slotMinMin) * m.pxPerMin - 6;
    D.style.top = `${E}px`, D.textContent = `:${String(S).padStart(2, "0")}`;
  }
  function F(m) {
    m?.draftStartLabel?.remove(), m && (m.draftStartLabel = null);
    const O = n.querySelectorAll?.("[data-ec-draft-start-label]") ?? [];
    for (const p of O) p.remove();
  }
  function k(m, O) {
    if (!e || !e.touch || !e.sourceChip?.classList.contains("ec-event-editing") || e.swapping) return;
    const p = t.get("pagerApi");
    if (!p || typeof p.stepDuringDrag != "function" || (t.get("viewDates") ?? []).length !== 1) return;
    const S = p.element;
    if (!S) return;
    const D = S.getBoundingClientRect(), E = D.width || S.offsetWidth || 0;
    if (!E) return;
    if (O < D.top || O > D.bottom) {
      I(e), e.edgeHoldFirstFired = !1;
      return;
    }
    const G = Math.max(
      us,
      Math.min(fs, E * ds)
    ), U = m <= D.left + G, q = m >= D.right - G, Z = U ? -1 : q ? 1 : 0;
    if (Z === 0) {
      I(e), e.edgeHoldFirstFired = !1;
      return;
    }
    if (e.edgeHoldDirection === Z && e.edgeHoldTimer) return;
    e.edgeHoldDirection !== Z && (e.edgeHoldFirstFired = !1), I(e), e.edgeHoldDirection = Z;
    const J = e.edgeHoldFirstFired ? hs : ps;
    e.edgeHoldTimer = setTimeout(() => X(Z), J);
  }
  function I(m) {
    m && (m.edgeHoldTimer && (clearTimeout(m.edgeHoldTimer), m.edgeHoldTimer = null), m.edgeHoldDirection = 0);
  }
  async function X(m) {
    if (!e || e.swapping) return;
    const O = t.get("pagerApi");
    if (O?.stepDuringDrag) {
      e.swapping = !0, e.edgeHoldTimer = null;
      try {
        await O.stepDuringDrag(m);
      } catch {
      }
      if (e) {
        if (e.daySteps = (e.daySteps ?? 0) + m, e.edgeHoldFirstFired = !0, e.swapping = !1, L(e), typeof navigator < "u" && navigator.vibrate)
          try {
            navigator.vibrate(gs);
          } catch {
          }
        k(e.lastX, e.lastY);
      }
    }
  }
  function L(m) {
    if (!m.ghost) return;
    const O = m.daySteps ?? 0;
    if (O === 0) {
      m.dayOffsetBadge?.remove(), m.dayOffsetBadge = null;
      return;
    }
    let p = m.dayOffsetBadge;
    p || (p = document.createElement("div"), p.className = "ec-day-offset-badge", p.setAttribute("aria-hidden", "true"), p.style.position = "absolute", p.style.top = "6px", p.style.right = "8px", p.style.padding = "2px 6px", p.style.borderRadius = "999px", p.style.background = "rgba(15, 23, 42, 0.78)", p.style.color = "#fff", p.style.fontSize = "11px", p.style.fontWeight = "600", p.style.lineHeight = "1", p.style.letterSpacing = "0.01em", p.style.pointerEvents = "none", p.style.zIndex = "2", m.ghost.appendChild(p), m.dayOffsetBadge = p);
    const l = Math.abs(O), S = l === 1 ? "day" : "days";
    p.textContent = O > 0 ? `+${O} ${S}` : `−${l} ${S}`;
  }
  const Y = (m) => {
    m.target.closest?.("[data-event-id]") && m.preventDefault();
  }, Q = (m) => {
    m.target.closest?.("[data-event-id]") && m.preventDefault();
  };
  return n.addEventListener("pointerdown", u), n.addEventListener("touchstart", g, { passive: !1, capture: !0 }), n.addEventListener("click", R, !0), n.addEventListener("contextmenu", Y, !0), n.addEventListener("dragstart", Q, !0), document.addEventListener("pointermove", w, { passive: !1 }), document.addEventListener("pointerup", c), document.addEventListener("pointercancel", c), () => {
    n.removeEventListener("pointerdown", u), n.removeEventListener("touchstart", g, !0), n.removeEventListener("click", R, !0), n.removeEventListener("contextmenu", Y, !0), n.removeEventListener("dragstart", Q, !0), document.removeEventListener("pointermove", w), document.removeEventListener("pointerup", c), document.removeEventListener("pointercancel", c), T(), C(), e && (I(e), e.dayOffsetBadge?.remove(), K(e), F(e)), e?.ghost && e.ghost.remove(), nt(e);
  };
}
function Dn(n, t, e) {
  const o = n.scrollEl ?? n.sourceChip?.closest?.('[data-row="body"]') ?? n.chip?.closest?.('[data-row="body"]') ?? null;
  if (!o) return;
  n.scrollEl = o;
  const s = o.getBoundingClientRect(), r = 36, i = 14;
  let a = 0;
  if (t < s.top + r) {
    const w = Math.min(1, (s.top + r - t) / r);
    a = -Math.max(2, Math.round(w * i));
  } else if (t > s.bottom - r) {
    const w = Math.min(1, (t - (s.bottom - r)) / r);
    a = Math.max(2, Math.round(w * i));
  }
  if (n.autoScrollSpeed = a, !a || n.autoScrollRaf) return;
  const u = () => {
    if (!n.autoScrollSpeed || !n.scrollEl) {
      n.autoScrollRaf = null;
      return;
    }
    const w = n.scrollEl, v = w.scrollTop, g = Math.max(0, w.scrollHeight - w.clientHeight), M = Math.max(0, Math.min(g, v + n.autoScrollSpeed)), c = M - v;
    c && Math.sign(c) === Math.sign(n.autoScrollSpeed) && (w.scrollTop = M, n.startY -= c, e?.(c)), n.autoScrollRaf = requestAnimationFrame(u);
  };
  n.autoScrollRaf = requestAnimationFrame(u);
}
function nt(n) {
  n && (n.autoScrollRaf && cancelAnimationFrame(n.autoScrollRaf), n.autoScrollRaf = null, n.autoScrollSpeed = 0);
}
function ys(n, t) {
  let e = null;
  const o = (d) => {
    const b = t.get("options");
    if (!b.editable && !b.eventDurationEditable || d.button !== void 0 && d.button !== 0) return;
    const T = d.target.closest?.(".ec-resizer");
    if (!T || !n.contains(T)) return;
    const x = T.closest("[data-event-id]");
    if (!x) return;
    const C = d.pointerType === "touch";
    if (C && !x.classList.contains("ec-event-editing")) return;
    const _ = x.getAttribute("data-event-id"), A = (t.get("filteredEvents") ?? []).find((K) => K.id === _);
    if (!A) return;
    const P = ge(b.slotDuration) / 60 || 30, R = ge(b.snapDuration) / 60 || P, V = (b.slotHeight ?? 22) / P, N = Array.from(n.querySelectorAll(`[data-event-id="${typeof CSS < "u" && CSS.escape ? CSS.escape(_) : _}"]`)).map((K) => {
      const H = K.closest(".ec-time-col");
      return H ? {
        el: K,
        col: H,
        originalTop: parseFloat(K.style.top || "0") || 0,
        originalHeight: parseFloat(K.style.height || "0") || K.getBoundingClientRect().height,
        originalDisplay: K.style.display || ""
      } : null;
    }).filter(Boolean);
    if (e = {
      chip: x,
      handleSide: T.getAttribute("data-resizer") === "start" ? "start" : "end",
      event: A,
      startY: d.clientY,
      originalTopPx: parseFloat(x.style.top || "0") || 0,
      originalHeightPx: parseFloat(x.style.height || "0") || x.getBoundingClientRect().height,
      pxPerMin: V,
      slotMins: P,
      snapMins: R,
      moved: !1,
      sourceCol: x.closest(".ec-time-col"),
      previewChips: [],
      segments: N,
      touch: C,
      pointerId: d.pointerId,
      lastX: d.clientX,
      lastY: d.clientY
    }, x.classList.add("ec-resizing-y"), x.classList.add("ec-resizing"), document.body.classList.add("ec-resizing-active"), T.setPointerCapture && d.pointerId !== void 0)
      try {
        T.setPointerCapture(d.pointerId);
      } catch {
      }
    C && M(), t.get("fire")?.("eventResizeStart", { event: A, jsEvent: d, view: t.get("view") }), d.cancelable && d.preventDefault(), d.stopPropagation();
  }, s = (d) => {
    e && i(d, d.clientX, d.clientY);
  }, r = (d) => {
    if (!e?.touch) return;
    const b = f(d);
    b && (d.cancelable && d.preventDefault(), d.stopPropagation?.(), d.stopImmediatePropagation?.(), i(d, b.clientX, b.clientY));
  };
  function i(d, b, T) {
    if (!e) return;
    e.lastX = b, e.lastY = T;
    const x = T - e.startY, C = Math.round(x / e.pxPerMin / e.snapMins) * e.snapMins;
    C !== 0 && (e.moved = !0);
    let _ = null;
    const A = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(b, T) : [];
    for (const N of A) {
      const K = N.closest?.(".ec-time-col");
      if (K && n.contains(K)) {
        _ = K;
        break;
      }
    }
    for (const N of e.previewChips) N.remove();
    e.previewChips = [];
    for (const N of e.segments)
      N.el.style.display = N.originalDisplay, N.el.style.top = `${N.originalTop}px`, N.el.style.height = `${N.originalHeight}px`;
    const P = e.sourceCol?.parentElement, R = P ? Array.from(P.children).filter((N) => N.classList?.contains("ec-time-col")) : [], V = e.sourceCol ? R.indexOf(e.sourceCol) : -1, z = _ ? R.indexOf(_) : -1;
    if (e.handleSide === "end" && z >= 0 && V >= 0 && z < V)
      for (const N of e.segments) {
        const K = R.indexOf(N.col);
        if (!(K < 0 || K < z))
          if (K > z)
            N.el.style.display = "none";
          else {
            const H = _.getBoundingClientRect(), F = T - H.top, k = Math.round(F / e.pxPerMin / e.snapMins) * e.snapMins * e.pxPerMin, I = N.originalTop + e.snapMins * e.pxPerMin, X = Math.max(I, k);
            N.el.style.height = `${X - N.originalTop}px`;
          }
      }
    else if (e.handleSide === "end" && _ && e.sourceCol && _ !== e.sourceCol) {
      const N = e.sourceCol.getBoundingClientRect().height;
      if (e.chip.style.height = `${Math.max(e.snapMins * e.pxPerMin, N - e.originalTopPx - 2)}px`, V >= 0 && z > V) {
        for (let F = V + 1; F < z; ++F)
          e.previewChips.push(a(R[F], 0, R[F].getBoundingClientRect().height - 2, e));
        const K = _.getBoundingClientRect(), H = Math.max(
          e.snapMins * e.pxPerMin,
          Math.round((T - K.top) / e.pxPerMin / e.snapMins) * e.snapMins * e.pxPerMin
        );
        e.previewChips.push(a(_, 0, H, e));
      }
    } else if (e.handleSide === "end") {
      const N = Math.max(e.snapMins * e.pxPerMin, e.originalHeightPx + C * e.pxPerMin);
      e.chip.style.height = `${N}px`;
    } else {
      const N = Math.max(
        -e.originalTopPx,
        // can't go above col start
        Math.min(e.originalHeightPx - e.snapMins * e.pxPerMin, C * e.pxPerMin)
      );
      e.chip.style.top = `${e.originalTopPx + N}px`, e.chip.style.height = `${e.originalHeightPx - N}px`;
    }
    Dn(e, T, () => {
      i({
        cancelable: !1,
        preventDefault() {
        },
        stopPropagation() {
        },
        stopImmediatePropagation() {
        }
      }, e.lastX, e.lastY);
    }), d.cancelable && d.preventDefault();
  }
  function a(d, b, T, x) {
    const C = x.chip.cloneNode(!0);
    return C.querySelectorAll(".ec-resizer").forEach((A) => A.remove()), C.classList.add("ec-event-preview"), C.style.position = "absolute", C.style.top = `${b}px`, C.style.height = `${T}px`, C.style.left = "0", C.style.right = "0", C.style.opacity = "0.6", C.style.pointerEvents = "none", (d.querySelector(".ec-event-overlay") ?? d).appendChild(C), C;
  }
  const u = (d) => {
    e?.touch && d.type === "pointercancel" || v(d, d.clientX, d.clientY);
  }, w = (d) => {
    if (!e?.touch) return;
    const b = y(d);
    d.cancelable && d.preventDefault(), d.stopPropagation?.(), d.stopImmediatePropagation?.(), v(d, b?.clientX ?? e.lastX, b?.clientY ?? e.lastY);
  };
  function v(d, b, T) {
    if (!e) return;
    const x = e;
    e = null, c(), nt(x), x.chip.classList.remove("ec-resizing-y"), x.chip.classList.remove("ec-resizing"), document.body.classList.remove("ec-resizing-active");
    for (const L of x.previewChips) L.remove();
    if (x.previewChips = [], !x.moved) {
      for (const L of x.segments)
        L.el.style.display = L.originalDisplay, L.el.style.top = `${L.originalTop}px`, L.el.style.height = `${L.originalHeight}px`;
      t.get("fire")?.("eventResizeStop", { event: x.event, jsEvent: d, view: t.get("view") }), tt(t);
      return;
    }
    const C = T - x.startY, A = Math.round(C / x.pxPerMin / x.snapMins) * x.snapMins * 6e4;
    let P = new Date(x.event.start.getTime()), R = new Date(x.event.end.getTime());
    const V = (() => {
      const L = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(b, T) : [];
      for (const Y of L) {
        const Q = Y.closest?.(".ec-time-col");
        if (Q && n.contains(Q)) return Q;
      }
      return null;
    })(), z = x.chip.closest(".ec-time-col"), N = V?.getAttribute("data-date"), K = z?.getAttribute("data-date");
    if (V && z && N !== K) {
      const L = t.get("options"), Y = ge(L.slotMinTime) / 60 || 0, Q = V.getBoundingClientRect(), m = T - Q.top, p = Math.max(0, Math.round(m / x.pxPerMin / x.snapMins) * x.snapMins) + Y;
      x.handleSide === "end" ? (R = /* @__PURE__ */ new Date(N + "T00:00:00Z"), R.setUTCMinutes(R.getUTCMinutes() + p), R <= P && (R = new Date(P.getTime() + x.snapMins * 6e4))) : (P = /* @__PURE__ */ new Date(N + "T00:00:00Z"), P.setUTCMinutes(P.getUTCMinutes() + p), P >= R && (P = new Date(R.getTime() - x.snapMins * 6e4)));
    } else x.handleSide === "end" ? (R = new Date(R.getTime() + A), R <= P && (R = new Date(P.getTime() + x.snapMins * 6e4))) : (P = new Date(P.getTime() + A), P >= R && (P = new Date(R.getTime() - x.snapMins * 6e4)));
    let H = !1;
    t.get("fire")?.("eventResizeStop", { event: x.event, jsEvent: d, view: t.get("view") }), tt(t);
    const F = { ...x.event, start: x.event.start, end: x.event.end }, k = at(x.event), I = x.handleSide === "end" ? { milliseconds: A, days: 0 } : { milliseconds: 0, days: 0 }, X = x.handleSide === "start" ? { milliseconds: A, days: 0 } : { milliseconds: 0, days: 0 };
    if (t.get("fire")?.("eventResize", {
      event: x.event,
      oldEvent: F,
      newStart: P,
      newEnd: R,
      jsEvent: d,
      view: t.get("view"),
      endDelta: I,
      startDelta: X,
      isOccurrence: k.isSeriesMember,
      seriesId: k.seriesId,
      revert: () => {
        H = !0;
      }
    }), H) {
      for (const L of x.segments)
        L.el.style.display = L.originalDisplay, L.el.style.top = `${L.originalTop}px`, L.el.style.height = `${L.originalHeight}px`;
      return;
    }
    xt({
      state: t,
      options: t.get("options"),
      event: x.event,
      kind: "resize",
      detailExtras: { oldEvent: F, startDelta: X, endDelta: I },
      updateAttrs: {
        id: x.event.id,
        start: P.toISOString(),
        end: R.toISOString()
      }
    });
  }
  let g = !1;
  function M() {
    g || (g = !0, document.addEventListener("touchmove", r, { passive: !1, capture: !0 }), document.addEventListener("touchend", w, { passive: !1, capture: !0 }), document.addEventListener("touchcancel", w, { passive: !1, capture: !0 }));
  }
  function c() {
    g && (g = !1, document.removeEventListener("touchmove", r, !0), document.removeEventListener("touchend", w, !0), document.removeEventListener("touchcancel", w, !0));
  }
  function f(d) {
    return d.touches?.[0] ?? null;
  }
  function y(d) {
    return d.changedTouches?.[0] ?? null;
  }
  return n.addEventListener("pointerdown", o), document.addEventListener("pointermove", s, { passive: !1 }), document.addEventListener("pointerup", u), document.addEventListener("pointercancel", u), () => {
    n.removeEventListener("pointerdown", o), document.removeEventListener("pointermove", s), document.removeEventListener("pointerup", u), document.removeEventListener("pointercancel", u), c(), nt(e);
  };
}
function ge(n) {
  return n ? (n.days ?? 0) * 86400 + (n.seconds ?? 0) : 0;
}
function ws(n, t) {
  let e = null;
  function o(c) {
    return c.parentElement;
  }
  function s(c) {
    const f = o(c);
    return f ? Array.from(f.children).filter((y) => y.classList?.contains("ec-time-col")) : [c];
  }
  function r(c, f) {
    const y = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(c, f) : [];
    for (const d of y) {
      const b = d.closest?.(".ec-time-col");
      if (b && n.contains(b)) return b;
    }
    return null;
  }
  function i(c) {
    const f = t.get("options"), y = f.theme, d = document.createElement("div");
    return d.className = `${y.event ?? "ec-event"} ec-event-preview`, d.style.position = "absolute", d.style.left = "0", d.style.right = "0", d.style.opacity = "0.7", d.style.pointerEvents = "none", d.style.background = f.eventBackgroundColor ?? "#2563eb", d.style.color = "#ffffff", d.style.borderRadius = "3px", d.style.padding = "2px 0.375rem", d.style.fontSize = "0.72rem", d.style.overflow = "hidden", (c.querySelector(".ec-event-overlay") ?? c).appendChild(d), d;
  }
  function a(c) {
    const f = t.get("options");
    if (!f.editable || c.button !== void 0 && c.button !== 0 || c.pointerType === "touch" || c.target.closest?.("[data-event-id], .ec-resizer, .ec-button, button, input, select, textarea, a, [data-more-link], [data-popover-action]")) return;
    const y = c.target.closest?.(".ec-time-col");
    if (!y || !n.contains(y)) return;
    const d = y.getAttribute("data-date");
    if (!d) return;
    const b = ge(f.slotDuration) / 60 || 30, T = ge(f.snapDuration) / 60 || b, x = (f.slotHeight ?? 22) / b, C = ge(f.slotMinTime) / 60 || 0, _ = y.getBoundingClientRect(), A = c.clientY - _.top, P = Math.max(0, Math.round(A / x / T) * T);
    e = {
      sourceCol: y,
      sourceDateStr: d,
      sourceMinFromTop: P,
      slotMins: b,
      snapMins: T,
      pxPerMin: x,
      slotMinMin: C,
      previewChips: [],
      moved: !1
    }, c.cancelable && c.preventDefault(), document.addEventListener("pointermove", g, { passive: !1 }), document.addEventListener("pointerup", M), document.addEventListener("pointercancel", M);
  }
  function u(c, f) {
    const y = r(c.clientX, c.clientY) ?? f.sourceCol, d = y.getBoundingClientRect(), b = c.clientY - d.top, T = Math.max(0, Math.round(b / f.pxPerMin / f.snapMins) * f.snapMins);
    return { col: y, mins: T };
  }
  function w(c) {
    for (const f of c.previewChips) f.remove();
    c.previewChips = [];
  }
  function v(c, f) {
    w(c);
    const y = s(c.sourceCol), d = y.indexOf(c.sourceCol), b = y.indexOf(f.col);
    if (d < 0 || b < 0) return;
    const T = b >= d, x = Math.min(d, b), C = Math.max(d, b);
    for (let _ = x; _ <= C; ++_) {
      const A = y[_], P = A.getBoundingClientRect().height;
      let R, V;
      d === b ? (R = Math.min(c.sourceMinFromTop, f.mins), V = Math.max(c.sourceMinFromTop, f.mins), V = Math.max(V, R + c.snapMins)) : T ? _ === d ? (R = c.sourceMinFromTop, V = P / c.pxPerMin) : _ === b ? (R = 0, V = Math.max(c.snapMins, f.mins)) : (R = 0, V = P / c.pxPerMin) : _ === d ? (R = 0, V = Math.max(c.snapMins, c.sourceMinFromTop)) : _ === b ? (R = f.mins, V = P / c.pxPerMin) : (R = 0, V = P / c.pxPerMin);
      const z = Math.max(c.snapMins, V - R), N = i(A);
      if (N.style.top = `${R * c.pxPerMin}px`, N.style.height = `${z * c.pxPerMin}px`, _ === x) {
        const K = T ? c.sourceMinFromTop : f.mins, H = T ? f.mins : c.sourceMinFromTop;
        N.textContent = `${Jt(K + c.slotMinMin)} – ${Jt((H || 1440) + c.slotMinMin)}`;
      }
      c.previewChips.push(N);
    }
  }
  function g(c) {
    if (!e) return;
    c.clientY - (e.previewChips[0], c.clientY);
    const f = Math.abs(c.clientY - (e.sourceCol.getBoundingClientRect().top + e.sourceMinFromTop * e.pxPerMin));
    !e.moved && f < 4 && e.previewChips.length, e.moved = !0;
    const y = u(c, e);
    v(e, y), c.cancelable && c.preventDefault();
  }
  function M(c) {
    if (!e) return;
    const f = e;
    if (e = null, document.removeEventListener("pointermove", g), document.removeEventListener("pointerup", M), document.removeEventListener("pointercancel", M), w(f), !f.moved) return;
    const y = u(c, f), d = y.col === f.sourceCol, b = y.col.getAttribute("data-date"), T = /* @__PURE__ */ new Date(f.sourceDateStr + "T00:00:00Z");
    T.setUTCMinutes(T.getUTCMinutes() + f.sourceMinFromTop + f.slotMinMin);
    const x = /* @__PURE__ */ new Date(b + "T00:00:00Z");
    x.setUTCMinutes(x.getUTCMinutes() + y.mins + f.slotMinMin);
    let C = T, _ = x;
    if (d) {
      const A = Math.min(f.sourceMinFromTop, y.mins), P = Math.max(f.sourceMinFromTop, y.mins);
      C = /* @__PURE__ */ new Date(f.sourceDateStr + "T00:00:00Z"), C.setUTCMinutes(C.getUTCMinutes() + A + f.slotMinMin), _ = /* @__PURE__ */ new Date(f.sourceDateStr + "T00:00:00Z"), _.setUTCMinutes(_.getUTCMinutes() + Math.max(P, A + f.snapMins) + f.slotMinMin);
    } else C > _ && ([C, _] = [_, C]);
    t.get("fire")?.("dateClick", {
      date: C,
      dateStr: C.toISOString().substring(0, 10),
      allDay: !1,
      end: _,
      jsEvent: c,
      view: t.get("view")
    });
  }
  return n.addEventListener("pointerdown", a), () => {
    n.removeEventListener("pointerdown", a), document.removeEventListener("pointermove", g), document.removeEventListener("pointerup", M), document.removeEventListener("pointercancel", M);
  };
}
function Jt(n) {
  const t = Math.floor(n / 60) % 24, e = Math.floor(n) % 60, o = t % 12 || 12, s = t >= 12 ? "pm" : "am";
  return `${o}:${String(e).padStart(2, "0")} ${s}`;
}
function bs(n, t) {
  let e = null;
  const o = (r) => {
    const i = n.querySelector('.ec-time-grid [data-row="body"]');
    e = {
      pointerType: r.pointerType,
      scrollTop: i?.scrollTop ?? null
    };
  }, s = (r) => {
    const i = r.target.closest("[data-date]");
    if (!i || r.target.closest("[data-event-id], .ec-resizer, [data-more-link], [data-popover-action]")) return;
    if (e?.pointerType === "touch") {
      const M = n.querySelector('.ec-time-grid [data-row="body"]');
      if (M && e.scrollTop != null && Math.abs(M.scrollTop - e.scrollTop) > 4 || n.querySelector(".ec-pager.ec-pager-dragging"))
        return;
    }
    const a = i.getAttribute("data-date"), u = t.get("fire"), w = r.target.closest(".ec-time-col");
    let v, g;
    if (w) {
      const M = t.get("options"), c = ge(M.slotDuration) / 60 || 30, f = ge(M.snapDuration) / 60 || c, d = (M.slotHeight ?? 22) / c, b = w.getBoundingClientRect(), T = r.clientY - b.top, x = ge(M.slotMinTime) / 60 || 0, C = Math.max(0, Math.round(T / d / f) * f) + x;
      v = /* @__PURE__ */ new Date(a + "T00:00:00Z"), v.setUTCMinutes(v.getUTCMinutes() + C), g = !1;
    } else
      v = /* @__PURE__ */ new Date(a + "T00:00:00Z"), g = !0;
    u?.("dateClick", {
      date: v,
      dateStr: v.toISOString().substring(0, g ? 10 : 16),
      allDay: g,
      jsEvent: r,
      view: t.get("view")
    });
  };
  return n.addEventListener("pointerdown", o, !0), n.addEventListener("click", s), () => {
    n.removeEventListener("pointerdown", o, !0), n.removeEventListener("click", s);
  };
}
function Ts(n, t) {
  let e = null;
  const o = (v) => {
    const g = v.closest?.("[data-event-id]");
    return !g || !g.closest(".ec-timeline-ribbon") ? null : g;
  }, s = (v, g) => {
    const M = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(v, g) : [];
    for (const c of M) {
      const f = c.closest?.(".ec-timeline-ribbon");
      if (f && n.contains(f)) return f;
    }
    return null;
  }, r = (v) => v?.closest?.(".ec-timeline-row"), i = (v) => r(v)?.getAttribute("data-resource-id") ?? null, a = (v) => {
    const g = t.get("options");
    if (v.button !== void 0 && v.button !== 0) return;
    const M = o(v.target);
    if (!M) return;
    const c = M.closest(".ec-timeline-ribbon"), f = c.getBoundingClientRect(), y = c.querySelectorAll(":scope > .ec-timeline-cells > .ec-timeline-cell"), d = y.length ? f.width / y.length : g.slotWidth ?? 32, b = (t.get("filteredEvents") ?? []).find((C) => C.id === M.getAttribute("data-event-id"));
    if (!b) return;
    const T = v.target.closest?.(".ec-resizer"), x = !!T && T.getAttribute("data-resize-axis") === "x";
    if (!(x && !(g.editable && g.eventDurationEditable !== !1)) && !(!x && !(g.editable || g.eventStartEditable))) {
      if (e = {
        kind: x ? "resize" : "move",
        side: x ? T.getAttribute("data-resizer") === "start" ? "start" : "end" : null,
        chip: M,
        event: b,
        ribbon: c,
        ribbonRect: f,
        dayWidth: d,
        sourceResourceId: i(c),
        lastResourceId: i(c),
        originalLeft: parseFloat(M.style.left || "0") || 0,
        originalWidth: parseFloat(M.style.width || "0") || M.getBoundingClientRect().width,
        startX: v.clientX,
        startY: v.clientY,
        lastX: v.clientX,
        lastY: v.clientY,
        moved: !1,
        lastDayDelta: 0,
        pointerId: v.pointerId
      }, T && T.setPointerCapture && v.pointerId !== void 0)
        try {
          T.setPointerCapture(v.pointerId);
        } catch {
        }
      else if (M.setPointerCapture && v.pointerId !== void 0)
        try {
          M.setPointerCapture(v.pointerId);
        } catch {
        }
      v.cancelable && v.preventDefault(), v.stopPropagation?.();
    }
  }, u = (v) => {
    if (!e) return;
    e.lastX = v.clientX, e.lastY = v.clientY;
    const g = v.clientX - e.startX, M = v.clientY - e.startY, f = t.get("options").eventDragMinDistance ?? 5;
    if (!e.moved && g * g + M * M < f * f) return;
    e.moved || (e.moved = !0, e.chip.classList.add(e.kind === "resize" ? "ec-resizing-x" : "ec-dragging"), e.chip.style.zIndex = "50", t.get("fire")?.(e.kind === "resize" ? "eventResizeStart" : "eventDragStart", {
      event: e.event,
      jsEvent: v,
      view: t.get("view")
    }));
    const y = Math.round(g / e.dayWidth);
    if (e.lastDayDelta = y, e.kind === "move")
      e.chip.style.left = `${e.originalLeft + y * e.dayWidth}px`;
    else if (e.side === "end") {
      const d = e.dayWidth;
      e.chip.style.width = `${Math.max(d, e.originalWidth + y * e.dayWidth)}px`;
    } else {
      const d = Math.max(
        -e.originalLeft,
        Math.min(e.originalWidth - e.dayWidth, y * e.dayWidth)
      );
      e.chip.style.left = `${e.originalLeft + d}px`, e.chip.style.width = `${e.originalWidth - d}px`;
    }
    if (e.kind === "move") {
      const d = s(v.clientX, v.clientY), b = d ? i(d) : null;
      e.lastResourceId = b ?? e.sourceResourceId, n.querySelectorAll('.ec-timeline-row[data-row-drop="true"]').forEach((T) => T.removeAttribute("data-row-drop")), d && b !== e.sourceResourceId && r(d)?.setAttribute("data-row-drop", "true");
    }
    v.cancelable && v.preventDefault();
  }, w = (v) => {
    if (!e) return;
    const g = e;
    if (e = null, n.querySelectorAll('.ec-timeline-row[data-row-drop="true"]').forEach((P) => P.removeAttribute("data-row-drop")), g.chip.classList.remove("ec-resizing-x"), g.chip.classList.remove("ec-dragging"), g.chip.style.zIndex = "", !g.moved) return;
    t.get("fire")?.(g.kind === "resize" ? "eventResizeStop" : "eventDragStop", {
      event: g.event,
      jsEvent: v,
      view: t.get("view")
    }), tt(t);
    const M = 864e5;
    let c = new Date(g.event.start.getTime()), f = new Date(g.event.end.getTime()), y = g.event.resourceIds, d = !1;
    if (g.kind === "move") {
      if (c = new Date(c.getTime() + g.lastDayDelta * M), f = new Date(f.getTime() + g.lastDayDelta * M), g.lastResourceId && g.lastResourceId !== g.sourceResourceId) {
        const P = (g.event.resourceIds ?? []).slice(), R = P.indexOf(g.sourceResourceId);
        R >= 0 ? P[R] = g.lastResourceId : P.push(g.lastResourceId), y = P, d = !0;
      }
    } else g.side === "end" ? (f = new Date(f.getTime() + g.lastDayDelta * M), f.getTime() <= c.getTime() && (f = new Date(c.getTime() + M))) : (c = new Date(c.getTime() + g.lastDayDelta * M), c.getTime() >= f.getTime() && (c = new Date(f.getTime() - M)));
    let b = !1;
    const T = { ...g.event, start: g.event.start, end: g.event.end }, x = g.kind === "resize" ? "eventResize" : "eventDrop", C = at(g.event), _ = {
      event: g.event,
      oldEvent: T,
      newStart: c,
      newEnd: f,
      jsEvent: v,
      view: t.get("view"),
      isOccurrence: C.isSeriesMember,
      seriesId: C.seriesId,
      revert: () => {
        b = !0;
      }
    };
    if (g.kind === "move")
      _.delta = { days: g.lastDayDelta, milliseconds: g.lastDayDelta * M }, d && (_.oldResource = g.sourceResourceId, _.newResource = g.lastResourceId, _.newResourceIds = y);
    else {
      const P = g.lastDayDelta * M;
      _.endDelta = g.side === "end" ? { milliseconds: P, days: g.lastDayDelta } : { milliseconds: 0, days: 0 }, _.startDelta = g.side === "start" ? { milliseconds: P, days: g.lastDayDelta } : { milliseconds: 0, days: 0 };
    }
    if (t.get("fire")?.(x, _), b) return;
    const A = {
      id: g.event.id,
      start: c.toISOString(),
      end: f.toISOString()
    };
    d && (A.resourceIds = y), xt({
      state: t,
      options: t.get("options"),
      event: g.event,
      kind: g.kind === "resize" ? "resize" : "drop",
      detailExtras: {
        oldEvent: T,
        delta: _.delta,
        startDelta: _.startDelta,
        endDelta: _.endDelta
      },
      updateAttrs: A
    });
  };
  return n.addEventListener("pointerdown", a), document.addEventListener("pointermove", u, { passive: !1 }), document.addEventListener("pointerup", w), document.addEventListener("pointercancel", w), () => {
    n.removeEventListener("pointerdown", a), document.removeEventListener("pointermove", u), document.removeEventListener("pointerup", w), document.removeEventListener("pointercancel", w);
  };
}
function Cs(n, t) {
  let e = null, o = null, s = [];
  const r = (c, f) => {
    const y = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(c, f) : [];
    for (const d of y) {
      if (d.closest?.("[data-event-id], .ec-resizer, .ec-button, button, [data-more-link], [data-popover-action]"))
        return null;
      const b = d.closest?.("[data-date]");
      if (b && n.contains(b)) return b;
    }
    return null;
  }, i = () => {
    for (const c of s) c.classList.remove("ec-select-highlight");
    s = [];
  }, a = (c, f) => {
    if (i(), !c || !f) return;
    const y = Array.from(n.querySelectorAll("[data-date]")), d = y.indexOf(c), b = y.indexOf(f);
    if (d < 0 || b < 0) return;
    const T = Math.min(d, b), x = Math.max(d, b);
    for (let C = T; C <= x; ++C)
      y[C].classList.add("ec-select-highlight"), s.push(y[C]);
  }, u = (c) => {
    const y = t.get("options").selectConstraint;
    if (!y) return !0;
    const d = y.start ? new Date(y.start).getTime() : -1 / 0, b = y.end ? new Date(y.end).getTime() : 1 / 0, T = c instanceof Date ? c.getTime() : new Date(c).getTime();
    return T >= d && T < b;
  }, w = (c, f) => {
    e = {
      sourceCell: f,
      sourceDate: f.getAttribute("data-date"),
      startX: c.clientX,
      startY: c.clientY,
      pointerId: c.pointerId,
      moved: !1,
      lastCell: f
    }, a(f, f);
  }, v = (c) => {
    const f = t.get("options");
    if (!f.selectable || c.button !== void 0 && c.button !== 0) return;
    const y = r(c.clientX, c.clientY);
    if (y) {
      if (c.pointerType === "touch") {
        const d = f.selectLongPressDelay ?? f.longPressDelay ?? 1e3;
        o = { cell: y, jsEvent: c, timer: setTimeout(() => {
          o && (w(o.jsEvent, o.cell), o = null);
        }, d) };
        return;
      }
      w(c, y), c.cancelable && c.preventDefault();
    }
  }, g = (c) => {
    if (o && (clearTimeout(o.timer), o = null), !e) return;
    const f = c.clientX - e.startX, y = c.clientY - e.startY, d = t.get("options").selectMinDistance ?? 5;
    if (!e.moved && f * f + y * y < d * d) return;
    e.moved = !0;
    const b = r(c.clientX, c.clientY);
    b && (e.lastCell = b, a(e.sourceCell, b), c.cancelable && c.preventDefault());
  }, M = (c) => {
    if (o && (clearTimeout(o.timer), o = null), !e) return;
    const f = e;
    if (e = null, !f.moved) {
      i();
      return;
    }
    const y = f.lastCell, d = f.sourceDate, b = y.getAttribute("data-date");
    let T = d <= b ? d : b, x = d <= b ? b : d;
    const C = /* @__PURE__ */ new Date(T + "T00:00:00Z"), _ = /* @__PURE__ */ new Date(x + "T00:00:00Z"), A = new Date(_.getTime() + 864e5);
    if (!u(C) || !u(A)) {
      i();
      return;
    }
    const P = f.sourceCell.closest?.("[data-resource-id]")?.getAttribute("data-resource-id"), R = {
      start: C,
      end: A,
      allDay: !0,
      resource: P ?? null,
      jsEvent: c,
      view: t.get("view")
    };
    t.set("selection", { start: C, end: A, resource: P ?? null }), t.get("fire")?.("select", R), t.get("options").unselectAuto;
  };
  return n.addEventListener("pointerdown", v), document.addEventListener("pointermove", g, { passive: !1 }), document.addEventListener("pointerup", M), document.addEventListener("pointercancel", M), () => {
    n.removeEventListener("pointerdown", v), document.removeEventListener("pointermove", g), document.removeEventListener("pointerup", M), document.removeEventListener("pointercancel", M), o && clearTimeout(o.timer), i();
  };
}
const Ss = {
  DayGrid: Ko,
  TimeGrid: es,
  List: ts,
  Resource: Xt,
  ResourceTimeGrid: Xt,
  ResourceTimeline: rs,
  Interaction: cs
};
function Ms(n) {
  const t = [];
  for (const e of n)
    if (typeof e == "string") {
      const o = Ss[e];
      o && t.push(o);
    } else
      t.push(e);
  return t;
}
const Ds = () => globalThis.crypto?.randomUUID?.() ?? `o-${Math.random().toString(36).slice(2)}-${Date.now()}`;
class xs {
  constructor(t, { filter: e } = {}) {
    this.adapter = t, this.filter = typeof e == "function" ? e : null, this.origin = Ds(), this.subscribers = /* @__PURE__ */ new Set(), t && typeof t.onReceive == "function" && t.onReceive((o) => {
      if (o?.origin !== this.origin)
        for (const s of this.subscribers) s(o);
    });
  }
  // op: 'add' | 'update' | 'remove' | 'refetch'
  // event: the normalised event object (or { id } for remove)
  // meta: { user?, channel?, ... } — adapter-specific extras
  publish({ op: t, event: e, meta: o }) {
    if (this.filter && !this.filter({ op: t, event: e, meta: o })) return;
    const s = { op: t, event: e, meta: o, origin: this.origin };
    this.adapter?.send?.(s);
  }
  // Subscribe to incoming messages. Returns an unsubscribe thunk.
  subscribe(t) {
    return this.subscribers.add(t), () => this.subscribers.delete(t);
  }
  close() {
    this.subscribers.clear(), this.adapter?.close?.();
  }
}
function _s(n) {
  if (typeof BroadcastChannel > "u")
    return null;
  const t = new BroadcastChannel(n);
  let e = null;
  return t.onmessage = (o) => e?.(o.data), {
    send(o) {
      t.postMessage(o);
    },
    onReceive(o) {
      e = o;
    },
    close() {
      t.close();
    }
  };
}
function Es(n, { protocols: t } = {}) {
  const e = new WebSocket(n, t);
  let o = null;
  return e.addEventListener("message", (s) => {
    try {
      o?.(JSON.parse(s.data));
    } catch {
    }
  }), {
    send(s) {
      const r = () => e.send(JSON.stringify(s));
      e.readyState === WebSocket.OPEN ? r() : e.addEventListener("open", r, { once: !0 });
    },
    onReceive(s) {
      o = s;
    },
    close() {
      e.close();
    }
  };
}
function Ls(n, t) {
  let e = null;
  const o = n.subscriptions.create(t, {
    received(s) {
      e?.(s);
    }
  });
  return {
    send(s) {
      o.send(s);
    },
    onReceive(s) {
      e = s;
    },
    close() {
      o.unsubscribe();
    }
  };
}
function ks(n) {
  const t = {};
  for (const s of Array.from(n.attributes)) {
    const { name: r, value: i } = s;
    if (r === "action") continue;
    const a = r.replace(/-([a-z])/g, (u, w) => w.toUpperCase());
    t[a] = i;
  }
  const o = n.querySelector("template")?.innerHTML;
  if (o)
    try {
      const s = JSON.parse(o);
      t.op === "add" || t.op === "update" || t.op === "remove" ? t.event = s : s && typeof s == "object" && Object.assign(t, s);
    } catch {
    }
  return t;
}
function As() {
  let n = null;
  function t() {
    if (typeof customElements?.upgrade == "function")
      for (const e of document.querySelectorAll("turbo-stream"))
        customElements.upgrade(e);
    document.addEventListener("turbo:before-stream-render", (e) => {
      const o = e.detail?.newStream;
      if (o?.getAttribute("action") === "calendar-event") {
        e.preventDefault();
        try {
          n?.(ks(o));
        } catch {
        }
      }
    });
  }
  return typeof document < "u" && t(), {
    send(e) {
      typeof document > "u" || document.dispatchEvent(new CustomEvent("stimulus-calendar:broadcast", { detail: e }));
    },
    onReceive(e) {
      n = e;
    },
    close() {
    }
    // nothing to dispose
  };
}
function Ps(n, t, e = {}) {
  if (!n) return null;
  if (typeof n == "object" && typeof n.send == "function")
    return n;
  switch (n) {
    case "broadcast-channel":
      return _s(t || "stimulus-calendar");
    case "websocket":
      return Es(t, e);
    case "action-cable":
      return Ls(e.consumer, t);
    case "turbo-stream":
      return As();
    default:
      return console.warn("[stimulus_calendar] unknown broadcast adapter", n), null;
  }
}
function Is({
  hostEl: n,
  eventId: t,
  serverValue: e,
  clientValue: o,
  locale: s,
  buttonText: r,
  onResolve: i
}) {
  const a = h("div", "ec-conflict-backdrop", "", [
    ["role", "presentation"]
  ]), u = h("div", "ec-conflict-modal", "", [
    ["role", "dialog"],
    ["aria-modal", "true"],
    ["aria-labelledby", "ec-conflict-title"]
  ]), w = h(
    "h2",
    "ec-conflict-title",
    r?.conflictTitle ?? "Edit conflict",
    [["id", "ec-conflict-title"]]
  ), v = h(
    "p",
    "ec-conflict-message",
    r?.conflictMessage ?? "This event was changed by someone else while you were editing it. Pick which version to keep."
  ), g = h("div", "ec-conflict-values");
  g.append(
    Qt("theirs", r?.conflictTheirs ?? "Theirs (server)", e),
    Qt("mine", r?.conflictMine ?? "Yours", o)
  );
  const M = h("div", "ec-conflict-actions"), c = h(
    "button",
    "ec-conflict-action ec-conflict-action-theirs",
    r?.conflictUseTheirs ?? "Use theirs",
    [["type", "button"]]
  ), f = h(
    "button",
    "ec-conflict-action ec-conflict-action-mine",
    r?.conflictKeepMine ?? "Keep mine",
    [["type", "button"]]
  );
  M.append(c, f), u.append(w, v, g, M), a.append(u), n.append(a);
  let y = !1;
  function d(T) {
    y || (y = !0, document.removeEventListener("keydown", b), a.remove(), i?.({ resolution: T, eventId: t, serverValue: e, clientValue: o }));
  }
  c.addEventListener("click", () => d("theirs")), f.addEventListener("click", () => d("mine")), a.addEventListener("click", (T) => {
    T.target === a && d("dismissed");
  });
  const b = (T) => {
    T.key === "Escape" && d("dismissed");
  };
  return document.addEventListener("keydown", b), queueMicrotask(() => c.focus?.()), { close: () => d("dismissed"), root: a };
}
function Qt(n, t, e) {
  const o = h("div", `ec-conflict-value ec-conflict-value-${n}`);
  o.append(h("h3", "ec-conflict-value-label", t));
  const s = h("pre", "ec-conflict-value-body");
  return s.textContent = Os(e), o.append(s), o;
}
function Os(n) {
  if (n == null) return "(none)";
  try {
    return JSON.stringify(n, Rs, 2);
  } catch {
    return String(n);
  }
}
function Rs(n, t) {
  return t instanceof Date ? t.toISOString() : t;
}
const ot = class ot extends En {
  connect() {
    this._teardowns = [];
    const t = this._collectUserOptions(), e = this._loadPlugins(this.pluginsValue), { state: o, setOption: s, setViewOptions: r } = Qn(e, t);
    this._state = o, this._setOption = s, this._setViewOptions = r, this._viewDates = {}, this._state.set("hostEl", this.element), this._state.set("_pendingAppearIds", /* @__PURE__ */ new Set()), this._state.set("fire", (i, a = {}) => {
      const w = this._state.get("options")?.[i];
      typeof w == "function" && w(a), this.dispatch(i, { detail: a });
    }), this._installDerivations(), this._installEffectsPipeline(), this._installBroadcastBus(), this._mountRootDOM(), this._exposeApi(), this._installEventPopoverDefault(), this._installBackgroundDeselect(), this._installPostGestureClickSuppression(), this._installBridgeActionsChannel(), this._installOffPeriodTracking(), this._installBackToTodayPill(), this.hasModeValue && this.modeValue && this.element.calendarApi.setMode(this.modeValue, null), this.dispatch("ready", { detail: { api: this.element.calendarApi } });
  }
  // Phase E1 — re-evaluate isOffPeriod() whenever activeRange or
  // state.now changes; fire calendar:offPeriodChange when it flips.
  _installOffPeriodTracking() {
    let t = this.element.calendarApi.isOffPeriod();
    this._state.set("offPeriod", t);
    const e = () => {
      const o = this.element.calendarApi.isOffPeriod();
      o !== t && (t = o, this._state.set("offPeriod", o), this.dispatch("offPeriodChange", { detail: { offPeriod: o } }));
    };
    this._teardowns.push(this._state.on("change:activeRange", e)), this._teardowns.push(this._state.on("change:now", e));
  }
  // Phase E2 — optional built-in "↩ Back to today" pill rendered into
  // the calendar root when off-period. Anchored bottom-centre with a
  // soft drop shadow. Opt-in via options.backToTodayPill: true. Host
  // apps that own their own UI ignore the option and listen for
  // calendar:offPeriodChange instead.
  _installBackToTodayPill() {
    const t = () => {
      if (!(this._state.get("options") ?? {}).backToTodayPill) {
        this._removeBackToTodayPill();
        return;
      }
      this._state.get("offPeriod") ? this._renderBackToTodayPill() : this._removeBackToTodayPill();
    };
    t(), this._teardowns.push(this._state.on("change:offPeriod", t)), this._teardowns.push(this._state.on("change:options", t));
  }
  _renderBackToTodayPill() {
    if (this._backToTodayPillEl) return;
    const t = document.createElement("button");
    t.type = "button", t.className = "ec-back-to-today-pill", t.dataset.action = "back-to-today", t.textContent = "↩  Back to today", t.addEventListener("click", () => this.element.calendarApi.today()), this._root?.appendChild(t), this._backToTodayPillEl = t;
  }
  _removeBackToTodayPill() {
    this._backToTodayPillEl && (this._backToTodayPillEl.remove(), this._backToTodayPillEl = null);
  }
  modeValueChanged() {
    if (!this.element.calendarApi) return;
    const t = this.modeValue || null;
    t !== (this._state.get("mode") ?? null) && this.element.calendarApi.setMode(t, null);
  }
  disconnect() {
    for (const t of this._teardowns) t();
    this._teardowns = [], delete this.element.calendarApi, this._root && this._root.remove(), this._state?.destroy();
  }
  // -- Internal wiring ------------------------------------------------------
  _collectUserOptions() {
    const t = { ...this.optionsValue };
    for (const [e, o] of Object.entries(this._individualValues()))
      t[e] = o;
    return t;
  }
  // Each option commit may register a `<name>Value` property via
  // `static values`. Subclasses (and this controller as it grows) add to
  // _OPTION_KEYS to surface them here. The set is intentionally explicit:
  // Stimulus's `has<Name>Value` is the truth.
  _individualValues() {
    const t = {};
    for (const e of ot.OPTION_KEYS ?? []) {
      const o = `has${Hs(e)}Value`, s = `${e}Value`;
      this[o] && (t[e] = this[s]);
    }
    return t;
  }
  _loadPlugins(t) {
    if (!st(t) || !t.length) return [];
    const e = Ms(t);
    return eo(e);
  }
  // Install the derived-state pipeline. _recompute() is exposed on `this`
  // so setOption can call it directly after mutating the live options.
  // (state.set('options', {...}) doesn't work for this — the options
  // identity inside options_store is mutated in place; replacing the
  // state ref would desync them.)
  _installDerivations() {
    const t = this._state;
    this._recompute = () => {
      const e = t.get("options"), o = hn(e.date, e.duration, e.firstDay);
      t.set("currentRange", o);
      const s = gn(o, t.get("extensions")?.activeRange);
      t.set("activeRange", s), t.set("viewDates", ke(s, e.hiddenDays ?? [])), t.set("offset", ho(e.timeZone ?? "local", e.date));
      const r = pn(e.locale, e.titleFormat);
      t.set("intlTitle", r), t.set("viewTitle", mn(r, o)), t.set("view", yn(e.view, t.get("viewTitle"), o, s));
      const i = t.get("events") ?? e.events ?? [], a = Array.isArray(i) ? i : [], u = t.get("resources") ?? e.resources ?? [], w = Array.isArray(u) ? u : [];
      t.set("filteredEvents", vn(
        a,
        t.get("view"),
        {
          eventFilter: e.eventFilter,
          eventOrder: e.eventOrder,
          filterEventsWithResources: e.filterEventsWithResources,
          resources: w
        }
      ));
    }, this._recompute();
  }
  // Build the optional BroadcastBus from options.broadcast +
  // options.broadcastChannel. When set, inbound messages drive the local
  // calendar API; outbound messages fire via _publishBroadcast for every
  // local mutation.
  _installBroadcastBus() {
    const t = this._state.get("options"), e = Ps(t.broadcast, t.broadcastChannel);
    e && (this._bus = new xs(e, { filter: t.broadcastFilter }), this._teardowns.push(this._bus.subscribe((o) => this._applyBroadcast(o))), this._teardowns.push(() => this._bus?.close()));
  }
  _publishBroadcast(t, e, o) {
    this._bus && (this._bus.publish({ op: t, event: e, meta: o }), this.dispatch("broadcast:out", { detail: { message: { op: t, event: e, meta: o } } }));
  }
  // Tell the bus to drop any inbound broadcast carrying this
  // optimistic id. Hosts call this BEFORE issuing the PATCH that
  // mutates the row server-side: the server echoes the id back on its
  // broadcast, and we suppress our own echo so the optimistic UI
  // doesn't fight a redundant merge from the wire.
  //
  // Ids expire after `ttl` ms (default 30s) so a never-arriving echo
  // doesn't leak the set forever.
  _expectEcho(t, e = 3e4) {
    if (!t || (this._expectedEchoes || (this._expectedEchoes = /* @__PURE__ */ new Map()), this._expectedEchoes.has(t))) return;
    const o = setTimeout(() => this._expectedEchoes?.delete(t), e);
    this._expectedEchoes.set(t, o);
  }
  _consumeEcho(t) {
    return !t || !this._expectedEchoes?.has(t) ? !1 : (clearTimeout(this._expectedEchoes.get(t)), this._expectedEchoes.delete(t), !0);
  }
  _applyBroadcast(t) {
    if (!t) return;
    if (this._consumeEcho(t.optimisticId)) {
      this.dispatch("broadcast:in", { detail: { message: t, suppressed: !0 } });
      return;
    }
    this.dispatch("broadcast:in", { detail: { message: t } });
    const { op: e, event: o } = t;
    e === "add" && o ? this._applyEventChange("add", o) : e === "update" && o ? this._applyEventChange("update", o) : e === "remove" && o?.id ? this._applyEventChange("remove", o) : e === "refetch" && typeof this.element.calendarApi?.refetchEvents == "function" ? this.element.calendarApi.refetchEvents() : e === "skip-occurrence" && t.seriesId && t.date ? this._applySeriesOccurrenceSkip(t.seriesId, t.date) : e === "override-occurrence" && t.seriesId && t.date ? this._applySeriesOccurrenceOverride(t.seriesId, t.date, t.overrides ?? {}) : e === "conflict" && (t.eventId || t.event?.id) && this._showConflictModal(t);
  }
  _showConflictModal(t) {
    this._activeConflictModal && (this._activeConflictModal.close(), this._activeConflictModal = null);
    const e = this._state.get("options"), o = typeof e.conflictRenderer == "function" ? e.conflictRenderer : Is, s = String(t.eventId ?? t.event?.id), r = {
      hostEl: this.element,
      eventId: s,
      serverValue: t.serverValue ?? t.server_value ?? null,
      clientValue: t.clientValue ?? t.client_value ?? null,
      locale: e.locale,
      buttonText: e.buttonText,
      onResolve: ({ resolution: i, serverValue: a, clientValue: u }) => {
        this._activeConflictModal = null;
        const w = i === "mine" ? u : a;
        w && i !== "dismissed" && this._applyEventChange("update", { id: s, ...w }), this.dispatch("conflictResolved", {
          detail: { resolution: i, eventId: s, serverValue: a, clientValue: u }
        });
      }
    };
    this._activeConflictModal = o(r);
  }
  _applySeriesOccurrenceSkip(t, e) {
    const o = this._state.get("events") ?? this._state.get("options").events ?? [], s = String(t), r = o.filter((i) => String(i.extendedProps?.series?.id ?? "") !== s ? !0 : this._eventStartDateStr(i) !== e);
    r.length !== o.length && (this._state.set("events", r), this._recompute(), this.dispatch("seriesOccurrenceSkipped", { detail: { seriesId: s, date: e } }));
  }
  _applySeriesOccurrenceOverride(t, e, o) {
    const s = this._state.get("events") ?? this._state.get("options").events ?? [], r = String(t);
    let i = !1;
    const a = s.map((u) => {
      if (String(u.extendedProps?.series?.id ?? "") !== r || this._eventStartDateStr(u) !== e) return u;
      i = !0;
      const w = { ...u, ...o, id: u.id, extendedProps: { ...u.extendedProps ?? {}, ...o.extendedProps ?? {} } }, v = Ae([w], this._state.get("offset"))[0];
      return { ...u, ...v };
    });
    i && (this._state.set("events", a), this._recompute(), this.dispatch("seriesOccurrenceOverridden", { detail: { seriesId: r, date: e, overrides: o } }));
  }
  _eventStartDateStr(t) {
    const e = t?.start;
    return e ? typeof e == "string" ? e.substring(0, 10) : e instanceof Date ? e.toISOString().substring(0, 10) : null : null;
  }
  _applyEventChange(t, e) {
    const o = this._state.get("events") ?? this._state.get("options").events ?? [], s = t === "remove" ? e : Ae([e], this._state.get("offset"))[0], r = String(e.id);
    let i, a = !1;
    t === "add" ? (i = [...o.filter((u) => u.id !== r), s], a = !0) : t === "update" ? o.findIndex((w) => w.id === r) === -1 ? (i = [...o, s], a = !0) : i = o.map((w) => w.id === r ? { ...w, ...s } : w) : t === "remove" && (i = o.filter((u) => u.id !== r)), a && this._markEventAppearing(r), t === "remove" && this._unmarkEventAppearing(r), i && (this._state.set("events", i), this._recompute());
  }
  // S12 — flag an id as "appearing right now" so the very next chip
  // render that touches it emits the marker class. A microtask drops
  // the id after the synchronous render cycle has had a chance to
  // paint, so re-renders triggered later (drag commits, broadcasts)
  // see the set without the id and emit nothing.
  _markEventAppearing(t) {
    const e = this._state.get("_pendingAppearIds");
    e && (e.add(t), queueMicrotask(() => e.delete(t)));
  }
  _unmarkEventAppearing(t) {
    this._state.get("_pendingAppearIds")?.delete(t);
  }
  _installEffectsPipeline() {
    const t = no(this._state, [
      oo(this._setViewOptions),
      so(),
      io(),
      ao(),
      // Auto-load URL/function event sources on initial mount and on
      // every genuine range change (prev / next / today / view switch /
      // gotoDate). Dedupes by activeRange content so the post-fetch
      // recompute doesn't trigger another fetch.
      ro(() => this._refetchEvents()),
      lo((e, o) => this.setOption(e, o)),
      co()
    ]);
    this._teardowns.push(t);
  }
  _mountRootDOM() {
    const t = this._state.get("options"), e = document.createElement("div");
    e.className = t.theme.calendar, e.dataset.calendarRoot = "";
    const o = document.createElement("div");
    o.className = t.theme.toolbar, o.dataset.calendarSlot = "toolbar";
    const s = document.createElement("div");
    s.className = t.theme.main, s.dataset.calendarSlot = "view", e.append(o, s), t.height && (e.style.height = typeof t.height == "number" ? `${t.height}px` : t.height, e.dataset.calendarHasHeight = ""), this.element.replaceChildren(e), this._root = e, this._toolbarEl = o, this.element.dataset.calendarMounted = "true", this._state.set("rootEl", e);
    const r = {
      prev: () => this._navigate(-1),
      next: () => this._navigate(1),
      today: () => this.setOption("date", /* @__PURE__ */ new Date()),
      gotoView: (a) => this.setOption("view", a),
      fireCustomButton: (a) => {
        const u = this._state.get("options").customButtons?.[a];
        typeof u?.click == "function" && u.click();
      }
    };
    ft(this._toolbarEl, this._state, r), this._teardowns.push(
      this._state.on("change:viewTitle", () => ft(this._toolbarEl, this._state, r))
    ), this._mainEl = s, this._mountView(), this._teardowns.push(
      this._state.on("change:options", () => this._mountView())
    );
    const i = this._state.get("auxComponents") ?? [];
    for (const a of i) {
      const u = a.mount?.(this._root, this._state);
      typeof u == "function" && this._teardowns.push(u);
    }
  }
  _mountView() {
    this._viewTeardown && this._viewTeardown();
    const t = this._state.get("viewComponent"), e = this._state.get("options"), o = e?.view;
    if (o === "dayGridMonth" && e?.continuousMonthScroll && typeof t == "function") {
      const s = No(this._mainEl, this._state, {
        onDateChange: (r) => this.element.calendarApi?.gotoDate(r)
      });
      this._monthScroller = s, this._pager = null, this._state.set("pagerApi", null), this._viewTeardown = () => {
        s.destroy(), this._monthScroller = null;
      };
      return;
    }
    if (o === "timeGridWeek" && e?.continuousWeekScroll && typeof t == "function") {
      const s = zo(this._mainEl, this._state, t, {
        onDateChange: (r) => this.element.calendarApi?.gotoDate(r)
      });
      this._weekScroller = s, this._pager = null, this._state.set("pagerApi", null), this._viewTeardown = () => {
        s.destroy(), this._weekScroller = null;
      };
      return;
    }
    if (o && o.startsWith("resourceTimeline") && typeof t == "function") {
      const s = t(this._mainEl, this._state);
      this._pager = null, this._monthScroller = null, this._weekScroller = null, this._state.set("pagerApi", null), this._viewTeardown = () => {
        s?.();
      };
      return;
    }
    if (typeof t == "function") {
      const s = Oo(this._mainEl, this._state, t, {
        onNavigate: ({ direction: r, date: i }) => {
          i ? this.element.calendarApi?.gotoDate(i) : r > 0 ? this.element.calendarApi?.next() : r < 0 && this.element.calendarApi?.prev();
        }
      });
      this._pager = s, this._monthScroller = null, this._state.set("pagerApi", s), this._viewTeardown = () => {
        s.destroy(), this._pager = null, this._state.set("pagerApi", null);
      };
    } else
      this._mainEl.replaceChildren(), this._viewTeardown = null, this._pager = null, this._monthScroller = null, this._state.set("pagerApi", null);
  }
  // -- Public API (`element.calendarApi`) ----------------------------------
  _exposeApi() {
    const t = {
      // Events (full impls land in Phase 10/12)
      addEvent: (e) => {
        const [o] = Ae([e], this._state.get("offset")), s = [...this._state.get("events") ?? this._state.get("options").events ?? []];
        return s.push(o), this._markEventAppearing(o.id), this._state.set("events", s), this._recompute(), this._publishBroadcast("add", e), o;
      },
      updateEvent: (e) => {
        let o = null;
        const s = (this._state.get("events") ?? this._state.get("options").events ?? []).map((r) => {
          if (r.id !== String(e.id)) return r;
          const [i] = Ae([{ ...r, ...e }], this._state.get("offset"));
          return o = i, i;
        });
        return this._state.set("events", s), this._recompute(), this._publishBroadcast("update", Fs(o ?? e)), e;
      },
      removeEventById: (e) => {
        const o = String(e);
        this._state.set(
          "events",
          (this._state.get("events") ?? this._state.get("options").events ?? []).filter((s) => s.id !== o)
        ), this._unmarkEventAppearing(o), this._recompute(), this._publishBroadcast("remove", { id: o });
      },
      getEvents: () => this._state.get("filteredEvents") ?? [],
      getEventById: (e) => (this._state.get("filteredEvents") ?? []).find((o) => o.id === e),
      refetchEvents: async () => this._refetchEvents(),
      // Echo suppression — host calls expectEcho(uuid) BEFORE issuing
      // a server PATCH whose return broadcast would otherwise re-apply
      // the optimistic UI. Sender sets the X-Optimistic-Id header, the
      // server echoes it on the broadcast, the inbound bus drops the
      // matching message. Ids self-expire after 30s.
      expectEcho: (e, o) => this._expectEcho(e, o),
      // Resources
      refetchResources: async () => this._refetchResources(),
      getResources: () => this._state.get("resources") ?? [],
      // Resource groups (Phase A1) — ResourceTimeline only. The renderer
      // owns the group expansion map; we just forward the read / write so
      // host code can collapse/expand crews programmatically and a fresh
      // re-render picks up the new state.
      setGroupExpanded: (e, o) => {
        const s = this._state.get("resourceGroupState") ?? /* @__PURE__ */ new Map();
        s.set(String(e), !!o), this._state.set("resourceGroupState", s);
        const i = this._state.get("resourceGroupsById")?.get(String(e));
        i && (i.expanded = !!o), this._recompute();
      },
      getGroupExpanded: (e) => {
        const o = this._state.get("resourceGroupState") ?? /* @__PURE__ */ new Map();
        return o.has(String(e)) ? o.get(String(e)) : this._state.get("resourceGroupsById")?.get(String(e))?.expanded ?? !0;
      },
      getResourceGroups: () => {
        const e = this._state.get("resourceGroupsById");
        return e ? Array.from(e.values()) : [];
      },
      // Phase B5 — pinch row height accessors. Imperative side of the
      // gesture so host code (slider, mode-bar) can drive it too.
      setRowHeight: (e) => {
        const o = Number(e) || 0;
        this._state.set("rowHeight", o), this.dispatch("rowHeightChange", { detail: { height: o } });
      },
      getRowHeight: () => this._state.get("rowHeight") ?? null,
      // Phase D — calendar-wide mode flag (e.g. "scheduling-x"). Adds /
      // removes data-calendar-mode="<name>" on the host element so CSS
      // can key off it; fires calendar:modeChange with { mode, context }
      // so host code stays in sync.
      setMode: (e, o) => {
        const s = e ? String(e) : null;
        s ? this.element.setAttribute("data-calendar-mode", s) : this.element.removeAttribute("data-calendar-mode"), this._state.set("mode", s), this._state.set("modeContext", o ?? null), this.dispatch("modeChange", { detail: { mode: s, context: o ?? null } });
      },
      clearMode: () => this.element.calendarApi.setMode(null, null),
      getMode: () => this._state.get("mode") ?? null,
      getModeContext: () => this._state.get("modeContext") ?? null,
      // Phase D3 — paint a "suggested slot" on the strip / time grid.
      // Renderer-agnostic: lives in state.suggestedSlot, picked up by
      // each view's render loop.
      setSuggestedSlot: ({ start: e, end: o, resourceId: s } = {}) => {
        const r = e && o ? { start: new Date(e), end: new Date(o), resourceId: s ?? null } : null;
        this._state.set("suggestedSlot", r);
      },
      clearSuggestedSlot: () => this._state.set("suggestedSlot", null),
      getSuggestedSlot: () => this._state.get("suggestedSlot") ?? null,
      // Phase E — off-period check. Returns true when state.now is
      // outside the current view's activeRange (the user has navigated
      // away from "today"). Host UI can hook this to show a back-to-
      // today pill / banner.
      isOffPeriod: () => {
        const e = this._state.get("activeRange"), o = this._state.get("now") ?? /* @__PURE__ */ new Date();
        if (!e?.start || !e?.end) return !1;
        const s = o instanceof Date ? o.getTime() : new Date(o).getTime();
        return s < e.start.getTime() || s >= e.end.getTime();
      },
      // Navigation
      next: () => this._navigate(1),
      prev: () => this._navigate(-1),
      today: () => this.setOption("date", /* @__PURE__ */ new Date()),
      gotoDate: (e) => this.setOption("date", e),
      getView: () => this._state.get("view"),
      // Options
      setOption: (e, o) => this.setOption(e, o),
      getOption: (e) => this._state.get("options")[e],
      // Selection — clears any active select range + fires the user
      // callback if registered.
      unselect: (e) => this._unselect(e),
      // Pointer geometry — find the calendar cell whose [data-date]
      // covers (x, y) and return a Date pointing at that day or slot.
      dateFromPoint: (e, o) => this._dateFromPoint(e, o),
      // Event popover — usually opened automatically by double-clicking
      // an event chip. Host apps can also open/close it programmatically.
      openEventPopover: (e, o) => {
        const s = t.getEventById(String(e));
        if (!s) return null;
        const r = o || this._root?.querySelector(`[data-event-id="${CSS.escape(String(e))}"]`);
        return r ? Ot({ event: s, anchorEl: r, state: this._state }) : null;
      },
      closeEventPopover: xe,
      isEventPopoverOpen: So,
      openEventPopoverId: Mo
    };
    this.element.calendarApi = t;
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
    const t = (e) => {
      e.target.closest(".ec-event") || this._state.get("selectedEventId") && (document.querySelectorAll(".ec-event.ec-event-selected").forEach((o) => o.classList.remove("ec-event-selected")), this._state.set("selectedEventId", null));
    };
    this.element.addEventListener("click", t), this._teardowns.push(() => this.element.removeEventListener("click", t));
  }
  // Swallow the post-gesture synthesised click on event chips.
  //
  // After a drag/resize ends (commit OR abort), the Interaction plugin
  // calls armChipClickSuppression(state). The browser then synthesises
  // a `click` on the original pointer target — usually the chip.
  // Single-tap-opens-popover hosts wire that click and fire eventClick,
  // which would open a popover after every commit. Bad.
  //
  // We install a CAPTURE-phase listener at the calendar root so we
  // intercept the click before any chip handler runs. If the flag is
  // armed AND the click landed on a chip, stopImmediatePropagation
  // swallows it (the chip's own click handler never fires, eventClick
  // never reaches the host). Clicks elsewhere on the calendar (toolbar,
  // background, day cell) pass through unaffected.
  _installPostGestureClickSuppression() {
    const t = (e) => {
      e.target?.closest?.("[data-event-id]") && as(this._state) && e.stopImmediatePropagation();
    };
    this.element.addEventListener("click", t, !0), this._teardowns.push(() => this.element.removeEventListener("click", t, !0));
  }
  // Hotwire Native bridge action channel (S7).
  //
  // When `options.bridgeActions` is on, a click on any descendant
  // carrying `data-bridge-action` fires a `calendar:bridgeAction`
  // event before the browser follows the link. Host listeners route
  // the action through native bridges (e.g. CallKit for `tel:`,
  // Maps for `navigate:`, native nav for `open:`) and signal "I
  // handled it" by calling `event.preventDefault()` on the
  // bridgeAction event. Doing so suppresses the underlying link
  // click.
  //
  // Hosts that don't preventDefault — typically in a desktop browser
  // fallback where the native bridge isn't available — get the
  // link's natural href behaviour. The same eventContent template
  // therefore works on both surfaces without conditional rendering.
  _installBridgeActionsChannel() {
    const t = (e) => {
      if (!this._state.get("options").bridgeActions) return;
      const s = e.target?.closest?.("[data-bridge-action]");
      if (!s) return;
      const r = {
        kind: s.getAttribute("data-bridge-action"),
        payload: s.getAttribute("data-payload"),
        fallbackHref: s.getAttribute("href") ?? null,
        el: s,
        jsEvent: e
      }, i = new CustomEvent("calendar:bridgeAction", {
        bubbles: !0,
        cancelable: !0,
        detail: r
      });
      s.dispatchEvent(i) || (e.preventDefault(), e.stopPropagation());
    };
    this.element.addEventListener("click", t, !0), this._teardowns.push(() => this.element.removeEventListener("click", t, !0));
  }
  _installEventPopoverDefault() {
    const t = (e) => {
      const { event: o, el: s } = e.detail ?? {};
      !o || !s || queueMicrotask(() => {
        e.defaultPrevented || this._state.get("options")?.suppressEventPopover || Ot({ event: o, anchorEl: s, state: this._state });
      });
    };
    this.element.addEventListener("calendar:eventDoubleClick", t), this._teardowns.push(() => this.element.removeEventListener("calendar:eventDoubleClick", t)), this._teardowns.push(() => xe());
  }
  _navigate(t) {
    const e = this._state.get("options"), o = $(e.date), s = e.dateIncrement ?? e.duration;
    t > 0 ? Te(o, s) : sn(o, s), this.setOption("date", o);
  }
  // Pull fresh event data from options.eventSources (function or URL) +
  // any legacy options.events function and replace state.events. Called
  // by the public refetchEvents() and on dates-set when lazyFetching is
  // on. URL sources are fetched against the active range as
  // ?start=&end= ISO strings.
  async _refetchEvents() {
    const t = this._state.get("options"), e = [], o = Array.isArray(t.eventSources) && t.eventSources.length > 0;
    t.events !== void 0 && !o && e.push(t.events), o && e.push(...t.eventSources);
    const s = this._state.get("activeRange"), r = s ? {
      start: Ie(s.start, 10),
      end: Ie(s.end, 10)
    } : {}, i = [];
    for (const a of e) {
      const u = await this._resolveSource(a, r);
      Array.isArray(u) && i.push(...u);
    }
    if (i.length || e.length) {
      const a = Ae(i, this._state.get("offset"));
      this._state.set("events", a), this._recompute(), this.dispatch("eventSourceSuccess", { detail: { events: a } });
    }
    return i;
  }
  async _refetchResources() {
    const t = this._state.get("options");
    if (t.resources === void 0) return [];
    const e = await this._resolveSource(t.resources, {});
    return Array.isArray(e) && (this._state.set("resources", e), this._recompute(), this.dispatch("resourceSourceSuccess", { detail: { resources: e } })), e;
  }
  // Resolves a source descriptor (array | function | URL string | object
  // with .url and optional .extraParams) into an array of events/resources.
  async _resolveSource(t, e) {
    if (Array.isArray(t)) return t;
    if (typeof t == "function")
      return await t({ ...e, start: e.start && new Date(e.start), end: e.end && new Date(e.end) });
    if (typeof t == "string") return this._fetchJSON(t, e);
    if (t && typeof t == "object" && t.url) {
      const o = { ...e, ...t.extraParams ?? {} };
      return this._fetchJSON(t.url, o);
    }
    return null;
  }
  async _fetchJSON(t, e) {
    const o = new URL(t, globalThis.location?.href ?? "http://localhost");
    for (const [s, r] of Object.entries(e)) r != null && o.searchParams.set(s, r);
    try {
      const s = await fetch(o.toString(), { headers: { Accept: "application/json" } });
      return s.ok ? await s.json() : (this.dispatch("eventSourceFailure", { detail: { url: o.toString(), status: s.status } }), null);
    } catch (s) {
      return this.dispatch("eventSourceFailure", { detail: { url: o.toString(), error: s.message } }), null;
    }
  }
  // Clear the active selection (set by the Interaction plugin) and call
  // options.unselect when registered.
  _unselect(t) {
    if (this._state.get("selection")) {
      this._state.set("selection", null), this._root?.querySelectorAll(".ec-select-highlight").forEach((s) => s.classList.remove("ec-select-highlight"));
      const o = this._state.get("options");
      typeof o.unselect == "function" && o.unselect({ jsEvent: t, view: this._state.get("view") }), this.dispatch("unselect", { detail: { jsEvent: t } });
    }
  }
  // Lookup a Date from a viewport (x,y) point by walking the elements
  // under the point until we hit one carrying [data-date]. TimeGrid
  // cells additionally have y-offset → minutes via slot height.
  _dateFromPoint(t, e) {
    if (!this._root) return null;
    const o = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(t, e) : [];
    for (const s of o) {
      const r = s.closest?.("[data-date]");
      if (r && this._root.contains(r)) {
        const i = r.getAttribute("data-date"), a = ue(i), u = s.closest?.(".ec-time-col");
        if (u) {
          const w = u.getBoundingClientRect(), v = this._state.get("options"), g = (v.slotDuration?.seconds ?? 1800) / 60 || 30, M = (v.slotHeight ?? 22) / g, c = Math.max(0, Math.round((e - w.top) / M));
          a.setUTCMinutes(a.getUTCMinutes() + c);
        }
        return a;
      }
    }
    return null;
  }
  // Public setOption — used by the API and by attribute-watcher callbacks.
  // Normalises Date strings / duration shapes and re-runs the derivation
  // pipeline so subscribers see the new options effect immediately.
  setOption(t, e) {
    t === "date" && (typeof e == "string" || e instanceof Date) && (e = ne(ue(e))), t === "duration" && (typeof e == "string" || typeof e == "number" || nn(e)) && (e = ce(e)), t === "dateIncrement" && e !== void 0 && !_e(e) && (e = ce(e));
    const o = this._state.get("options").view;
    if (t === "view" && e !== o) {
      if (this._viewTeardown && (this._viewTeardown(), this._viewTeardown = null), o) {
        const a = this._state.get("options").date;
        a instanceof Date && (this._viewDates[o] = ne(ue(a)));
      }
      this._setOption(t, e);
      const s = this._setViewOptions(e);
      typeof s == "function" && this._state.set("viewComponent", s(this._state));
      const r = this._viewDates[e];
      r instanceof Date && this._setOption("date", r), this._recompute(), this._mountView();
      const i = this._toolbarActions();
      ft(this._toolbarEl, this._state, i);
      return;
    }
    if (this._setOption(t, e), t === "date" && e instanceof Date) {
      const s = this._state.get("options").view;
      s && (this._viewDates[s] = ne(ue(e)));
    }
    this._recompute();
  }
  _toolbarActions() {
    return {
      prev: () => this._navigate(-1),
      next: () => this._navigate(1),
      today: () => this.setOption("date", /* @__PURE__ */ new Date()),
      gotoView: (t) => this.setOption("view", t),
      fireCustomButton: (t) => {
        const e = this._state.get("options").customButtons?.[t];
        typeof e?.click == "function" && e.click();
      }
    };
  }
};
Et(ot, "values", {
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
  emptyCellAddButton: { type: Boolean, default: !1 },
  // Phase C1 — TimeGridWeek continuous horizontal scroller
  continuousWeekScroll: { type: Boolean, default: !1 },
  // Phase C2 — density dots beneath the dayHeader weekday label.
  dayHeaderDensity: { type: Boolean, default: !1 },
  // Phase D — declarative mode flag.
  mode: String,
  // Phase E2 — built-in "↩ Back to today" pill rendered into the
  // calendar root when off-period.
  backToTodayPill: { type: Boolean, default: !1 },
  // Broadcast / live-sync options
  broadcast: String,
  broadcastChannel: String
});
let Oe = ot;
Oe.OPTION_KEYS = [
  "view",
  "date",
  "duration",
  "dateIncrement",
  "firstDay",
  "hiddenDays",
  "validRange",
  "height",
  "theme",
  "locale",
  "timeZone",
  "customScrollbars",
  "views",
  "lazyFetching",
  "highlightedDates",
  "titleFormat",
  "dayHeaderFormat",
  "dayHeaderAriaLabelFormat",
  "icons",
  "buttonText",
  "customButtons",
  "headerToolbar",
  "dayMaxEvents",
  "dayCellFormat",
  "dayPopoverFormat",
  "moreLinkContent",
  "weekNumbers",
  "weekNumberContent",
  "resources",
  "refetchResourcesOnNavigate",
  "datesAboveResources",
  "filterResourcesWithEvents",
  "filterEventsWithResources",
  "monthHeaderFormat",
  "slotWidth",
  "resourceExpand",
  "resourceGroups",
  "resourceGroupField",
  "emptyCellAddButton",
  "continuousWeekScroll",
  "dayHeaderDensity",
  "mode",
  "backToTodayPill",
  "broadcast",
  "broadcastChannel"
];
function Hs(n) {
  return n.charAt(0).toUpperCase() + n.slice(1);
}
function Fs(n) {
  if (!n) return n;
  const t = { ...n };
  return t.start instanceof Date && (t.start = jt(t.start)), t.end instanceof Date && (t.end = jt(t.end)), t;
}
function jt(n) {
  const t = Ie(n, 19), e = je(n);
  if (e === void 0) return t;
  const o = e >= 0 ? "+" : "-", s = Math.abs(e), r = String(Math.floor(s / 60)).padStart(2, "0"), i = String(s % 60).padStart(2, "0");
  return `${t}${o}${r}:${i}`;
}
const Ns = "0.0.0", en = /* @__PURE__ */ new WeakSet();
function $s(n) {
  const t = n ?? tn.start();
  return en.has(t) || (en.add(t), t.register("calendar", Oe)), t;
}
const Ct = /* @__PURE__ */ new WeakMap();
function Bs(n, t = {}) {
  if (!n || n.nodeType !== 1)
    throw new TypeError("StimulusCalendar.create: first arg must be a DOM element");
  n.dataset.calendarOptionsValue = JSON.stringify(t), n.setAttribute(
    "data-controller",
    [(n.getAttribute("data-controller") || "").trim(), "calendar"].filter(Boolean).join(" ")
  );
  const e = tn.start();
  return e.register("calendar", Oe), Ct.set(n, e), n;
}
function Us(n) {
  const t = Ct.get(n);
  t && t.stop(), n.removeAttribute("data-controller"), delete n.dataset.calendarOptionsValue, delete n.calendarApi, Ct.delete(n);
}
const Ws = {
  start: $s,
  create: Bs,
  destroy: Us,
  CalendarController: Oe,
  VERSION: Ns
};
typeof window < "u" && !window.__stimulusCalendarStarted && (window.__stimulusCalendarStarted = !0, window.StimulusCalendar = Ws);
export {
  Oe as CalendarController,
  Ns as VERSION,
  Bs as create,
  Ws as default,
  Us as destroy,
  $s as start
};
//# sourceMappingURL=stimulus_calendar.esm.js.map
