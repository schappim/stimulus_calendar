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
function B(n) {
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
function re(n, t = 1) {
  return n.setUTCDate(n.getUTCDate() + t), n;
}
function rn(n, t = 1) {
  return re(n, -t);
}
function te(n) {
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
  n = B(n), t === 0 ? n.setUTCDate(n.getUTCDate() + 6 - n.getUTCDay()) : n.setUTCDate(n.getUTCDate() + 4 - (n.getUTCDay() || 7));
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
  return n && ({ start: t, end: e } = n, t && (t = te(ue(t))), e && (e = te(ue(e)))), { start: t, end: e };
}
const ln = kn();
function Hn(n, t) {
  n[ln] = t;
}
function Re(n) {
  return n[ln];
}
function p(n, t, e, o = []) {
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
      te(o.start);
      const s = B(o.end);
      te(o.end), (!Ce(o.end, s) || Ce(o.end, o.start)) && re(o.end);
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
  const r = wt(t, o), i = dt(s, "views") ?? {}, a = dt(r, "views") ?? {}, d = { ...s };
  t.view && (d.view = t.view);
  const y = {}, v = {}, h = {}, S = /* @__PURE__ */ new Set([...Ne(i), ...Ne(a)]);
  for (const M of S) {
    const c = a[M] ?? {}, u = Pt(
      s,
      i[M] ?? i[c.type] ?? {}
    ), w = Pt(u, r, c), T = dt(w, "component");
    delete w.view;
    for (const b of Ne(w))
      Lt(d, b) ? (y[b] || (y[b] = []), y[b].push(
        fn.includes(b) ? (E) => w[b] = _e(E) ? E(u[b]) : E : (E) => w[b] = E
      )) : delete w[b];
    v[M] = w, h[M] = T;
  }
  v[d.view] ? Pe(d, v[d.view]) : Pe(d, r);
  function g(M, c, u = !0) {
    Lt(d, M) && (u || (M in o ? c = o[M](c) : nn(c) ? c = { ...c } : st(c) && (c = [...c])), y[M]?.forEach((w) => w(c)), d[M] = c);
  }
  function D(M) {
    if (v[M])
      return Pe(d, v[M]), h[M];
  }
  return {
    options: d,
    setOption: g,
    setViewOptions: D,
    viewComponents: h,
    // Sorted list of every view name registered by defaults + plugins +
    // the user. The controller exposes this on state so the toolbar can
    // tokenise view-switcher entries.
    viewNames: [...S].sort()
  };
}
function Xn(n) {
  const t = Zn();
  for (const e of n) e.createOptions?.(t);
  return t;
}
function Vn(n) {
  const t = {
    date: (e) => te(ue(e)),
    dateIncrement: Le(ce),
    duration: ce,
    events: Ae,
    eventSources: $n,
    hiddenDays: (e) => [...new Set(e)],
    highlightedDates: (e) => e.map((o) => te(ue(o))),
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
  for (const d of n)
    d.initState?.(a);
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
function ro(n, t) {
  let e = null;
  return {
    deps: ["activeRange"],
    run(o) {
      const s = o.get("activeRange");
      if (!s?.start || !s?.end) return;
      const r = `${s.start.getTime()}|${s.end.getTime()}`;
      if (r === e) return;
      e = r;
      const i = o.get("options"), a = Array.isArray(i.eventSources) && i.eventSources.length > 0, d = typeof i.events == "function";
      if (!a && !d) return;
      const y = t?.();
      y && s.start.getTime() >= y.start && s.end.getTime() <= y.end || n();
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
        const s = ue(void 0, t), r = te(B(s));
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
            const d = je(i[a]);
            d !== void 0 && St(i[a], e - d), We(i[a], e);
          }
      const r = je(o.date);
      if (r !== void 0) {
        const i = ue(void 0, e).getUTCDay() - ue(void 0, r).getUTCDay(), a = re(B(o.date), i);
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
  let o, s, r, i, a, d;
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
        d = Number(v.value);
        break;
    }
  i === 24 && (i = 0);
  const y = Date.UTC(o, s - 1, r, i, a, d);
  return Math.round((y - t.getTime()) / 6e4);
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
      const d = ["startRange", "endRange"], y = [!1, !1];
      for (const v of i) {
        const h = d.indexOf(v.source);
        h >= 0 ? y[h] || (a += po(d[1 - h], i), y[h] = !0) : a += v.value;
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
  const o = B(n);
  t.years ? (o.setUTCMonth(0), o.setUTCDate(1)) : t.months ? o.setUTCDate(1) : t.inWeeks && it(o, e);
  const s = Te(B(o), t);
  return { start: o, end: s };
}
function gn(n, t) {
  const e = B(n.start), o = B(n.end);
  return t ? t(e, o) : { start: e, end: o };
}
function ke(n, t) {
  const e = [], o = te(B(n.start)), s = te(B(n.end));
  for (; o < s; )
    t.includes(o.getUTCDay()) || e.push(B(o)), re(o);
  return e;
}
function mn(n, t) {
  return n.formatRange(t.start, rn(B(t.end)));
}
function vn(n, t, e) {
  const { eventFilter: o, eventOrder: s, filterEventsWithResources: r, resources: i } = e;
  let a = [...n];
  if (_e(o)) {
    const d = n.map(Ge), y = rt(t);
    a = a.filter((v, h) => o({
      event: Ge(v),
      index: h,
      events: d,
      view: y
    }));
  }
  return r && (a = a.filter((d) => i.some((y) => d.resourceIds.includes(y.id)))), _e(s) ? a.sort((d, y) => s(Ge(d), Ge(y))) : a.sort((d, y) => d.start - y.start || y.allDay - d.allDay), a;
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
    const a = (r[i] ?? "").trim(), d = p("div", "", "", [["data-toolbar-slot", i]]);
    a && go(d, a, t, e, s), n.append(d);
  }
}
function go(n, t, e, o, s) {
  for (const r of t.split(/\s+/)) {
    const i = p("div", s.buttonGroup);
    for (const a of r.split(",").filter(Boolean)) {
      const d = mo(a, e, o, s);
      d && i.append(d);
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
  const s = t.get("options"), r = s.buttonText?.[n] ?? n, i = p("button", `${o.button} ec-${wo(n)}`, r, [
    ["type", "button"],
    ["data-toolbar-action", "view"],
    ["data-toolbar-view", n]
  ]);
  return s.view === n && i.classList.add(o.active), i.addEventListener("click", () => e?.gotoView?.(n)), i;
}
function yo(n, t, e, o) {
  const s = t.get("options").customButtons?.[n] ?? {}, r = p("button", `${o.button} ec-custom`, s.text ?? n, [
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
    return p("h2", e.title, n.get("viewTitle") ?? "");
  },
  prev(n, t, e) {
    const o = p("button", `${e.button} ec-prev`, "", [
      ["type", "button"],
      ["aria-label", "Previous"],
      ["data-toolbar-action", "prev"]
    ]);
    return o.innerHTML = '<i class="ec-icon ec-prev"></i>', It(n, "start") ? (o.disabled = !0, o.classList.add(e.disabled)) : o.addEventListener("click", () => t?.prev?.()), o;
  },
  next(n, t, e) {
    const o = p("button", `${e.button} ec-next`, "", [
      ["type", "button"],
      ["aria-label", "Next"],
      ["data-toolbar-action", "next"]
    ]);
    return o.innerHTML = '<i class="ec-icon ec-next"></i>', It(n, "end") ? (o.disabled = !0, o.classList.add(e.disabled)) : o.addEventListener("click", () => t?.next?.()), o;
  },
  today(n, t, e) {
    const s = n.get("options").buttonText?.today ?? "today", r = p("button", `${e.button} ec-today`, s, [
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
  pe = p("div", "ec-event-popover", "", [
    ["role", "dialog"],
    ["aria-modal", "false"],
    ["data-popover", "event"],
    ["data-event-id", n.id]
  ]);
  const i = p("div", "ec-event-popover-card ec-event-popover-card-title"), a = p("div", "ec-event-popover-title-row");
  a.append(p("div", "ec-event-popover-title", n.title || "(untitled)"));
  const d = p("span", "ec-event-popover-swatch"), y = n.backgroundColor || o?.eventBackgroundColor || o?.eventColor;
  y && (d.style.background = y), a.append(d), i.append(a);
  const v = n.extendedProps?.location;
  v && i.append(p("div", "ec-event-popover-location", String(v)));
  const h = p("button", "ec-event-popover-close", "×", [
    ["type", "button"],
    ["aria-label", "Close"]
  ]);
  h.addEventListener("click", xe), i.append(h), pe.append(i);
  const S = p("div", "ec-event-popover-card");
  S.append(p("div", "ec-event-popover-when", xo(n, s))), n.extendedProps?.category && S.append(p(
    "div",
    "ec-event-popover-when-meta",
    `Category: ${n.extendedProps.category}`
  )), pe.append(S);
  const g = n.extendedProps?.attendees;
  if (g) {
    const b = p("div", "ec-event-popover-card");
    b.append(p("div", "ec-event-popover-card-label", "Invitees")), b.append(p("div", "ec-event-popover-card-value", String(g))), pe.append(b);
  }
  const D = n.extendedProps?.description;
  if (D) {
    const b = p("div", "ec-event-popover-card");
    b.append(p("div", "ec-event-popover-card-label", "Notes")), b.append(p("p", "ec-event-popover-desc", String(D))), pe.append(b);
  }
  const M = Object.entries(n.extendedProps ?? {}).filter(([b]) => !["description", "category", "location", "attendees", "links"].includes(b)).filter(([, b]) => b != null && b !== "");
  if (M.length) {
    const b = p("div", "ec-event-popover-card"), E = p("dl", "ec-event-popover-props");
    for (const [A, P] of M)
      E.append(p("dt", "", _o(A))), E.append(p("dd", "", String(P)));
    b.append(E), pe.append(b);
  }
  const c = Array.isArray(n.extendedProps?.links) ? n.extendedProps.links.filter((b) => b && b.href) : [];
  if (c.length) {
    const b = p("div", "ec-event-popover-card ec-event-popover-card-links");
    for (const E of c) {
      const A = p("a", "ec-event-popover-link", "", [
        ["href", E.href],
        ["data-popover-link", ""]
      ]);
      E.target && A.setAttribute("target", E.target), E.rel && A.setAttribute("rel", E.rel), A.append(p(
        "span",
        "ec-event-popover-link-label",
        String(E.label ?? E.href)
      ));
      const P = p("span", "ec-event-popover-link-chevron", "", [
        ["aria-hidden", "true"]
      ]);
      P.innerHTML = '<svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 2 L8.5 6 L4.5 10" stroke-linecap="round" stroke-linejoin="round"/></svg>', A.append(P), A.addEventListener("click", () => {
        r?.("eventPopoverLinkOpen", { event: n, link: E }), xe();
      }), b.append(A);
    }
    pe.append(b);
  }
  const u = p("div", "ec-event-popover-footer"), w = p("button", "ec-event-popover-action", "Edit", [
    ["type", "button"],
    ["data-popover-action", "edit"]
  ]), T = p("button", "ec-event-popover-action ec-event-popover-danger", "Delete", [
    ["type", "button"],
    ["data-popover-action", "delete"]
  ]);
  return w.addEventListener("click", () => {
    r?.("eventPopoverEdit", { event: n }), xe();
  }), T.addEventListener("click", () => {
    r?.("eventPopoverDelete", { event: n }), xe();
  }), u.append(w, T), pe.append(u), document.body.appendChild(pe), Do(pe, t), setTimeout(() => {
    $e = (b) => {
      pe && !pe.contains(b.target) && !t.contains(b.target) && xe();
    }, Be = (b) => {
      b.key === "Escape" && xe();
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
  const d = Math.max(s, r), y = Math.max(s, i);
  n.style.position = "fixed", n.style.left = `${d}px`, n.style.top = `${y}px`, n.setAttribute("data-popover-side", a);
  const h = e.top + e.height / 2 - y, S = 14, g = o.height - 14, D = Math.max(S, Math.min(g, h));
  n.style.setProperty("--popover-arrow-top", `${D}px`);
}
function xo(n, t) {
  const e = new Intl.DateTimeFormat(t, { timeZone: "UTC", ...Co }), o = new Intl.DateTimeFormat(t, { timeZone: "UTC", ...To });
  if (n.allDay) {
    const d = e.format(n.start);
    if (!n.end) return d;
    const y = new Date(n.end.getTime() - 1), v = e.format(y);
    return d === v ? `${d} · all day` : `${d} — ${v}`;
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
  const d = [null, null, null];
  S();
  let y = e(i[a], t);
  M(0, !1);
  let v = !1;
  const h = t.on("change:currentRange", () => {
    v || D();
  });
  function S() {
    const l = Ee(a - 1), C = Ee(a + 1);
    for (let x = 0; x < 3; ++x) {
      const _ = i[x];
      _.classList.remove("ec-pager-page-prev", "ec-pager-page-current", "ec-pager-page-next"), _.removeAttribute("aria-hidden"), x === a ? _.classList.add("ec-pager-page-current") : x === l ? (_.classList.add("ec-pager-page-prev"), _.setAttribute("aria-hidden", "true")) : x === C && (_.classList.add("ec-pager-page-next"), _.setAttribute("aria-hidden", "true"));
    }
  }
  function g() {
    const l = t.get("options"), C = l.dateIncrement ?? l.duration;
    if (!C) return;
    const x = Ee(a - 1), _ = Ee(a + 1), W = i[a].querySelector?.('[data-row="body"]')?.scrollTop ?? 0;
    if (!d[x]) {
      const X = sn(B(l.date), C), Z = Ft(t, X);
      i[x].replaceChildren(), d[x] = e(i[x], Z);
      const J = i[x].querySelector?.('[data-row="body"]');
      J && (J.scrollTop = W);
    }
    if (!d[_]) {
      const X = Te(B(l.date), C), Z = Ft(t, X);
      i[_].replaceChildren(), d[_] = e(i[_], Z);
      const J = i[_].querySelector?.('[data-row="body"]');
      J && (J.scrollTop = W);
    }
  }
  function D() {
    for (let l = 0; l < 3; ++l)
      l !== a && (d[l] && (d[l](), d[l] = null), i[l].replaceChildren());
  }
  function M(l, C) {
    s.style.setProperty("--ec-pager-px", `${l}px`), s.style.setProperty(
      "--ec-pager-transition",
      C ? `transform ${qe}ms ${Rt}` : "none"
    ), r.style.transition = C ? `transform ${qe}ms ${Rt}` : "none", r.style.transform = `translate3d(${l}px, 0, 0)`;
  }
  function c(l) {
    const C = Ee(a + l), _ = i[C].querySelector?.('[data-row="body"]')?.scrollTop ?? null;
    y && (y(), y = null), i[a].replaceChildren();
    const G = Ee(a - l);
    if (d[G] && (d[G](), d[G] = null), i[G].replaceChildren(), a = C, S(), M(0, !1), v = !0, o?.({ direction: l }), d[a] && (d[a](), d[a] = null), y = e(i[a], t), _ != null) {
      const W = i[a].querySelector?.('[data-row="body"]');
      W && (W.scrollTop = _);
    }
    v = !1;
  }
  let u = null, w = !1;
  function T(l) {
    u || O || l.button !== void 0 && l.button !== 0 || l.pointerType !== "mouse" && (k(l.target, { allowEventChips: l.pointerType === "touch" }) || (A(l.clientX, l.clientY, { pointerId: l.pointerId }), document.addEventListener("pointermove", P, { passive: !1 }), document.addEventListener("pointerup", $), document.addEventListener("pointercancel", $)));
  }
  function b(l) {
    if (O || l.touches?.length !== 1) return;
    const C = l.touches[0];
    if (u) {
      u.touchId ?? (u.touchId = C.identifier), E();
      return;
    }
    k(l.target, { allowEventChips: !0 }) || (A(C.clientX, C.clientY, { touchId: C.identifier }), E());
  }
  function E() {
    w || (w = !0, document.addEventListener("touchmove", I, { passive: !1 }), document.addEventListener("touchend", N, { passive: !1 }), document.addEventListener("touchcancel", N, { passive: !1 }));
  }
  function A(l, C, { pointerId: x, touchId: _ } = {}) {
    u = {
      startX: l,
      startY: C,
      lastX: l,
      lastY: C,
      pointerId: x,
      touchId: _,
      decided: !1,
      abandoned: !1
    };
  }
  function P(l) {
    !u || u.abandoned || K(l.clientX, l.clientY, l);
  }
  function I(l) {
    if (!u || u.abandoned) return;
    const C = F(l);
    C && K(C.clientX, C.clientY, l);
  }
  function K(l, C, x) {
    if (document.body.classList.contains("ec-dragging") || document.body.classList.contains("ec-resizing-active")) {
      u.abandoned = !0, q();
      return;
    }
    u.lastX = l, u.lastY = C;
    const _ = l - u.startX, G = C - u.startY;
    if (!u.decided) {
      if (Math.abs(G) > Math.abs(_) + ko) {
        u.abandoned = !0;
        return;
      }
      if (Math.abs(_) < 6) return;
      u.decided = !0, g(), s.classList.add("ec-pager-dragging");
      try {
        s.setPointerCapture?.(u.pointerId);
      } catch {
      }
    }
    x.cancelable && x.preventDefault(), M(_, !1);
  }
  function $(l) {
    q();
  }
  function N(l) {
    const C = F(l);
    C && u && (u.lastX = C.clientX, u.lastY = C.clientY), q();
  }
  function q() {
    if (!u) return;
    const l = u;
    if (u = null, document.removeEventListener("pointermove", P), document.removeEventListener("pointerup", $), document.removeEventListener("pointercancel", $), H(), !l.decided || l.abandoned) {
      s.classList.remove("ec-pager-dragging"), M(0, !1);
      return;
    }
    const C = l.lastX - l.startX, x = s.offsetWidth || n.offsetWidth || 1, _ = Math.min(x * Eo, Lo);
    C <= -_ ? Q(-x, 1) : C >= _ ? Q(+x, -1) : (M(0, !0), setTimeout(() => s.classList.remove("ec-pager-dragging"), qe));
  }
  function F(l) {
    const C = [l.touches, l.changedTouches];
    for (const x of C)
      if (x) {
        for (const _ of Array.from(x))
          if (_.identifier === u?.touchId) return _;
      }
    return l.touches?.[0] ?? l.changedTouches?.[0] ?? null;
  }
  function H() {
    w && (w = !1, document.removeEventListener("touchmove", I), document.removeEventListener("touchend", N), document.removeEventListener("touchcancel", N));
  }
  function k(l, { allowEventChips: C = !1 } = {}) {
    return l.closest?.(".ec-resizer, .ec-event.ec-event-editing") || !C && l.closest?.("[data-event-id]") ? !0 : !!l.closest?.("[data-more-link], [data-popover-action], .ec-pager-no-swipe, .ec-button, button, input, select, textarea, a");
  }
  let O = null, V = null;
  function L(l) {
    if (u || Math.abs(l.deltaX) <= Math.abs(l.deltaY)) return;
    l.preventDefault(), O || (O = { acc: 0, endTimer: null }, g(), s.classList.add("ec-pager-dragging")), O.acc -= l.deltaX;
    const C = s.offsetWidth || n.offsetWidth || 1, x = Math.max(-C, Math.min(C, O.acc));
    M(x, !1);
    const _ = Math.min(C * Po, Io);
    clearTimeout(O.endTimer), O.acc <= -_ ? (O = null, s.classList.remove("ec-pager-dragging"), Q(-C, 1)) : O.acc >= _ ? (O = null, s.classList.remove("ec-pager-dragging"), Q(+C, -1)) : O.endTimer = setTimeout(() => {
      O && (O = null, s.classList.remove("ec-pager-dragging"), M(0, !0));
    }, Ao), clearTimeout(V), V = setTimeout(D, 1500);
  }
  function Y(l) {
    l.target !== s && !s.contains(l.target) || l.metaKey || l.ctrlKey || l.altKey || l.target.matches?.('input, textarea, select, [contenteditable="true"]') || (l.key === "ArrowLeft" ? (l.preventDefault(), g(), s.classList.add("ec-pager-dragging"), Q(window.innerWidth || s.offsetWidth, -1)) : l.key === "ArrowRight" && (l.preventDefault(), g(), s.classList.add("ec-pager-dragging"), Q(-(window.innerWidth || s.offsetWidth), 1)));
  }
  function Q(l, C) {
    M(l, !0), setTimeout(() => {
      c(C), s.classList.remove("ec-pager-dragging");
    }, qe);
  }
  let m = null;
  function R(l) {
    return new Promise((C) => {
      const x = s.offsetWidth || n.offsetWidth || 0;
      if (!x || l !== 1 && l !== -1) {
        C();
        return;
      }
      g();
      const G = i[a].querySelector?.('[data-row="body"]')?.scrollTop ?? 0, W = Ee(a + l), X = i[W].querySelector?.('[data-row="body"]');
      X && (X.scrollTop = G), s.classList.add("ec-pager-dragging");
      const Z = -l * x;
      r.style.transition = `transform ${pt}ms ${Ht}`, s.style.setProperty(
        "--ec-pager-transition",
        `transform ${pt}ms ${Ht}`
      ), s.style.setProperty("--ec-pager-px", `${Z}px`), r.style.transform = `translate3d(${Z}px, 0, 0)`;
      const J = { resolve: C, aborted: !1 };
      J.timer = setTimeout(() => {
        if (J.aborted) return;
        m === J && (m = null), c(l), s.classList.remove("ec-pager-dragging");
        const U = i[a].querySelector?.('[data-row="body"]');
        U && (U.scrollTop = G), C();
      }, pt), m = J;
    });
  }
  function f() {
    if (!m) return !1;
    const l = m;
    return m = null, l.aborted = !0, clearTimeout(l.timer), r.style.transition = "none", s.style.setProperty("--ec-pager-transition", "none"), s.style.setProperty("--ec-pager-px", "0px"), r.style.transform = "translate3d(0px, 0, 0)", s.classList.remove("ec-pager-dragging"), l.resolve(), !0;
  }
  return s.addEventListener("pointerdown", T, { capture: !0 }), s.addEventListener("touchstart", b, { capture: !0, passive: !0 }), s.addEventListener("wheel", L, { passive: !1 }), s.addEventListener("keydown", Y), {
    destroy() {
      h?.();
      try {
        y && y();
      } catch {
      }
      D(), clearTimeout(V), s.removeEventListener("pointerdown", T, { capture: !0 }), s.removeEventListener("touchstart", b, { capture: !0 }), s.removeEventListener("wheel", L), s.removeEventListener("keydown", Y), document.removeEventListener("pointermove", P), document.removeEventListener("pointerup", $), document.removeEventListener("pointercancel", $), H(), n.replaceChildren();
    },
    // The pager root element — exposed so the Interaction plugin can
    // measure the edge zones for cross-day drag against the live
    // viewport (rather than the calendar root, which on mobile shells
    // also covers the toolbar / bottom-bar gutters).
    element: s,
    stepDuringDrag: R,
    abortStepDuringDrag: f,
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
  const o = { ...n.get("options"), date: t }, s = hn(o.date, o.duration, o.firstDay), r = gn(s, n.get("extensions")?.activeRange), i = ke(r, o.hiddenDays ?? []), a = pn(o.locale, o.titleFormat), d = mn(a, s), y = yn(o.view, d, s, r), v = n.get("events") ?? o.events ?? [], h = Array.isArray(v) ? v : [], S = n.get("resources") ?? o.resources ?? [], g = Array.isArray(S) ? S : [], D = vn(h, y, {
    eventFilter: o.eventFilter,
    eventOrder: o.eventOrder,
    filterEventsWithResources: o.filterEventsWithResources,
    resources: g
  }), M = {
    options: o,
    currentRange: s,
    activeRange: r,
    viewDates: i,
    intlTitle: a,
    viewTitle: d,
    view: y,
    filteredEvents: D,
    fire: () => {
    }
    // snapshots are non-interactive
  }, c = () => {
  };
  return {
    get(u) {
      return u in M ? M[u] : n.get(u);
    },
    set() {
    },
    on() {
      return c;
    },
    onAny() {
      return c;
    },
    snapshot() {
      return { ...n.snapshot(), ...M };
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
  const o = p("div", "ec-month-scroller"), s = p("div", "ec-month-scroller-head"), r = p("div", "ec-month-scroller-body");
  o.append(s, r), n.replaceChildren(o), $o(s, t);
  let i = [];
  const a = Ve(B(t.get("options").date)), d = t.get("options").validRange?.start, y = d ? te(B(d)) : (() => {
    const F = Ve(B(a));
    return F.setUTCMonth(F.getUTCMonth() - Fo), F;
  })(), v = Ve(B(a));
  v.setUTCMonth(v.getUTCMonth() + Ho), ht(r, y, v, i, t), requestAnimationFrame(() => {
    const F = i.find(
      (H) => H.monthAnchor && H.monthAnchor.getUTCFullYear() === a.getUTCFullYear() && H.monthAnchor.getUTCMonth() === a.getUTCMonth()
    );
    if (F) {
      const H = F.rowEl.offsetTop - 12, k = r.style.scrollBehavior;
      r.style.scrollBehavior = "auto", c = !0, r.scrollTop = Math.max(0, H), r.offsetTop, r.style.scrollBehavior = k || "", requestAnimationFrame(() => {
        c = !1;
      });
    }
    r.addEventListener("scroll", b, { passive: !0 });
  }), r.addEventListener("click", (F) => {
    if (F.target.closest("[data-event-id], [data-more-link]")) return;
    const H = F.target.closest(".ec-month-scroller-cell");
    if (!H) return;
    F.stopPropagation();
    const k = H.getAttribute("data-date");
    if (!k) return;
    r.querySelectorAll(".ec-month-scroller-cell.ec-selected").forEach((Y) => Y.classList.remove("ec-selected")), H.classList.add("ec-selected");
    const [O, V, L] = k.split("-").map(Number);
    u = !0, D(new Date(O, V - 1, L));
  }), r.addEventListener("dblclick", (F) => {
    if (F.target.closest("[data-event-id], [data-more-link]")) return;
    const H = F.target.closest(".ec-month-scroller-cell");
    if (!H) return;
    F.stopPropagation();
    const k = H.getAttribute("data-date");
    k && t.get("fire")?.("dateClick", {
      date: /* @__PURE__ */ new Date(k + "T00:00:00Z"),
      dateStr: k,
      allDay: !0,
      jsEvent: F,
      view: t.get("view")
    });
  });
  let h = null;
  const S = t.onAny(({ key: F }) => {
    if (["filteredEvents", "currentRange", "activeRange", "options"].includes(F)) {
      if (h) return;
      h = setTimeout(() => {
        h = null, Xe(i, t, D);
      }, 0);
    }
  });
  Xe(i, t, D);
  const g = t.on("change:currentRange", () => {
    if (c) return;
    const F = t.get("options").date;
    if (!F) return;
    const H = Ve(B(F)), k = () => i.find(
      (L) => L.monthAnchor && L.monthAnchor.getUTCFullYear() === H.getUTCFullYear() && L.monthAnchor.getUTCMonth() === H.getUTCMonth()
    );
    let O = k();
    if (!O) {
      const L = i[i.length - 1]?.weekStart && i[i.length - 1].weekStart < H, Y = i[0]?.weekStart && i[0].weekStart > H;
      if (L)
        for (; i[i.length - 1].weekStart < H; ) N();
      else if (Y)
        for (; i[0].weekStart > H; ) {
          const Q = i[0].weekStart;
          if (q(), i[0].weekStart >= Q) break;
        }
      O = k();
    }
    if (!O) return;
    c = !0;
    const V = r.style.scrollBehavior;
    r.style.scrollBehavior = "auto", r.scrollTop = Math.max(0, O.rowEl.offsetTop - 12), r.style.scrollBehavior = V || "", requestAnimationFrame(() => {
      c = !1;
    });
  });
  function D(F, H = !0) {
    c = !0, H && (u = !0), e?.(F), requestAnimationFrame(() => {
      c = !1;
    });
  }
  let M = null, c = !1, u = !0, w = null;
  function T() {
    o.classList.add("ec-scrolling"), clearTimeout(w), w = setTimeout(
      () => o.classList.remove("ec-scrolling"),
      400
    );
  }
  function b() {
    c || (u = !1), T(), c || (r.scrollHeight - (r.scrollTop + r.clientHeight) < Nt && N(), r.scrollTop < Nt && q()), clearTimeout(M), M = setTimeout(K, Ro);
  }
  function E() {
    const F = r.scrollTop + r.clientHeight / 4;
    let H = null;
    for (const O of i) {
      if (O.rowEl.offsetTop > F) break;
      H = O;
    }
    if (H = H ?? i[0], !H) return null;
    const k = B(H.weekStart);
    return re(k, 3), new Date(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate());
  }
  const A = 220;
  let P = 0, I = null;
  function K() {
    if (c) return;
    clearTimeout(I);
    const F = r.scrollTop;
    I = setTimeout(function H() {
      const k = r.scrollTop;
      if (k !== P) {
        P = k, I = setTimeout(H, A);
        return;
      }
      const O = E();
      if (!O) return;
      const V = t.get("options").date;
      Math.abs(O.getTime() - V.getTime()) >= 864e5 / 2 && D(O, !1);
    }, A), P = F;
  }
  function $() {
    if (c || u) return;
    const F = E();
    if (!F) return;
    const H = t.get("options").date;
    Math.abs(F.getTime() - H.getTime()) >= 864e5 / 2 && e?.(F);
  }
  function N() {
    const F = i[i.length - 1];
    if (!F) return;
    const H = Te(B(F.weekStart), ce({ weeks: 1 })), k = B(H);
    k.setUTCMonth(k.getUTCMonth() + $t), ht(r, H, k, i, t, {}), Xe(i, t, D);
  }
  function q() {
    const F = i[0];
    if (!F) return;
    const H = t.get("options").validRange?.start;
    if (H) {
      const Q = te(B(H));
      if (F.weekStart <= Q) return;
    }
    const k = B(F.weekStart), O = B(k);
    if (O.setUTCMonth(O.getUTCMonth() - $t), H) {
      const Q = te(B(H));
      O < Q && O.setTime(Q.getTime());
    }
    const V = t.get("options").firstDay ?? 0;
    it(O, V);
    const L = r.scrollHeight;
    ht(r, O, k, i, t, { prepend: !0 }), Xe(i, t, D);
    const Y = r.scrollHeight;
    c = !0, r.scrollTop += Y - L, requestAnimationFrame(() => {
      c = !1;
    });
  }
  return {
    destroy() {
      $(), S(), g?.(), clearTimeout(h), clearTimeout(M), clearTimeout(w), r.removeEventListener("scroll", b), n.replaceChildren();
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
    const a = (s + i) % 7, d = new Date(Date.UTC(1970, 0, 4 + a)), y = p("div", `${o.dayHead ?? "ec-day-head"} ec-month-scroller-day-head`, r.format(d), [
      ["data-day", String(a)]
    ]);
    n.append(y);
  }
}
function ht(n, t, e, o, s, r = {}) {
  const i = s.get("options"), a = i.theme, d = i.firstDay ?? 0, y = te(B(t));
  it(y, d);
  const v = te(B(e)), h = [];
  for (; y < v; ) {
    const S = Uo(y);
    if (!o.find((D) => Ce(D.weekStart, y))) {
      const D = p("div", "ec-month-scroller-row", "", [
        ["data-week-start", bt(y)]
      ]), M = p("div", "ec-month-scroller-cells"), c = te(/* @__PURE__ */ new Date());
      for (const u of S) {
        const w = Ce(te(B(u)), c), T = p(
          "div",
          `${a.day ?? "ec-day"} ec-month-scroller-cell${w ? " ec-today" : ""}`,
          "",
          [
            ["data-date", bt(u)]
          ]
        ), b = p("div", "ec-day-number", String(u.getUTCDate()));
        T.append(b), M.append(T);
      }
      D.append(M), h.push({ rowEl: D, weekStart: B(y), monthAnchor: null });
    }
    re(y, 7);
  }
  if (r.prepend) {
    for (let S = h.length - 1; S >= 0; --S)
      n.insertBefore(h[S].rowEl, n.firstChild);
    o.unshift(...h);
  } else {
    for (const S of h) n.append(S.rowEl);
    o.push(...h);
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
    const r = s.weekStart, i = `${r.getUTCFullYear()}-${r.getUTCMonth()}`, a = i !== o, d = s.rowEl.querySelector(".ec-month-scroller-month-banner");
    if (a && !d) {
      const y = p("div", "ec-month-scroller-month-banner", ""), v = e.formatToParts(r), h = p(
        "span",
        "ec-month-scroller-month-name",
        v.filter((g) => g.type === "month").map((g) => g.value).join("")
      ), S = p(
        "span",
        "ec-month-scroller-month-year",
        v.filter((g) => g.type === "year").map((g) => g.value).join("")
      );
      y.append(h, p("span", "", " "), S), s.rowEl.insertBefore(y, s.rowEl.firstChild), s.monthAnchor = B(r);
    } else !a && d && (d.remove(), s.monthAnchor = null);
    o = i;
  }
}
function Uo(n) {
  const t = [], e = B(n);
  for (let o = 0; o < 7; ++o)
    t.push(B(e)), re(e);
  return t;
}
function Xe(n, t, e) {
  const o = t.get("options"), s = o.theme, r = t.get("filteredEvents") ?? [], i = t.get("fire");
  for (const a of n) {
    const d = a.rowEl.querySelector(".ec-month-scroller-cells");
    if (d) {
      for (const y of d.children) {
        const v = y.querySelector(".ec-day-number");
        y.replaceChildren(v);
      }
      for (const y of d.children) {
        const v = ue(y.getAttribute("data-date")), h = B(v);
        re(h);
        const S = r.filter((u) => u.start < h && u.end > v);
        if (!S.length) continue;
        const g = p("div", s.events ?? "ec-events"), D = typeof o.dayMaxEvents == "number" ? o.dayMaxEvents : 3, M = S.slice(0, D), c = S.slice(D);
        for (const u of M) {
          const w = p("div", s.event ?? "ec-event", "", [
            ["data-event-id", u.id]
          ]);
          if (u.backgroundColor && (w.style.backgroundColor = u.backgroundColor), w.append(p("span", "ec-event-dot")), !u.allDay) {
            const T = new Intl.DateTimeFormat(o.locale, {
              timeZone: "UTC",
              ...o.eventTimeFormat
            }).format(u.start);
            w.append(p("time", s.eventTime ?? "ec-event-time", T + " "));
          }
          w.append(p("span", s.eventTitle ?? "ec-event-title", u.title || "")), t.get("selectedEventId") === u.id && w.classList.add("ec-event-selected"), w.addEventListener("click", (T) => {
            document.querySelectorAll(".ec-event.ec-event-selected").forEach((E) => E.classList.remove("ec-event-selected")), w.classList.add("ec-event-selected"), t.set("selectedEventId", u.id);
            const b = new Date(
              u.start.getUTCFullYear(),
              u.start.getUTCMonth(),
              u.start.getUTCDate()
            );
            e?.(b), i?.("eventClick", { event: u, jsEvent: T, view: t.get("view") }), T.stopPropagation();
          }), w.addEventListener("dblclick", (T) => i?.("eventDoubleClick", { event: u, jsEvent: T, view: t.get("view"), el: w })), w.addEventListener("mouseenter", (T) => i?.("eventMouseEnter", { event: u, jsEvent: T, view: t.get("view") })), w.addEventListener("mouseleave", (T) => i?.("eventMouseLeave", { event: u, jsEvent: T, view: t.get("view") })), g.append(w);
        }
        if (c.length) {
          const u = p("button", "ec-more-link", `+${c.length} more`, [
            ["type", "button"],
            ["data-more-link", "true"],
            ["data-date", bt(v)]
          ]);
          g.append(u);
        }
        y.append(g);
      }
    }
  }
}
function Ve(n) {
  return n.setUTCDate(1), te(n), n;
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
  re(i, -Math.floor(Ze / 2) * 7);
  let a = B(i);
  re(a, Ze * 7);
  let d = null, y = !1, v = null, h = 140;
  function S() {
    d?.(), s.style.setProperty("--ec-col-w", `${h}px`);
    const E = Yo(t, i, a, h);
    d = e(s, E);
  }
  S(), requestAnimationFrame(() => {
    const E = te(ue(t.get("options").date));
    g(E);
  });
  function g(E) {
    const A = D(E);
    if (A < 0) return;
    const P = M(), I = Math.max(
      0,
      A * h + P - (s.clientWidth - h) / 2
    );
    y = !0, s.scrollLeft = I, requestAnimationFrame(() => {
      y = !1;
    });
  }
  function D(E) {
    const A = te(B(E));
    let P = 0;
    const I = B(i);
    for (; I < a; ) {
      if (Ce(I, A)) return P;
      re(I), ++P;
    }
    return -1;
  }
  function M() {
    return s.querySelector(".ec-time-grid .ec-sidebar")?.getBoundingClientRect().width || 64;
  }
  const c = () => {
    y || (u(), clearTimeout(v), v = setTimeout(w, Wo));
  };
  s.addEventListener("scroll", c, { passive: !0 });
  function u() {
    const E = s.scrollLeft, A = s.clientWidth, P = s.scrollWidth;
    if (P - (E + A) < Ut) {
      B(a), re(a, Bt * 7), y = !0, S(), requestAnimationFrame(() => {
        y = !1;
      });
      return;
    }
    if (E < Ut) {
      re(i, -Bt * 7);
      const I = E, K = P;
      y = !0, S(), requestAnimationFrame(() => {
        const $ = s.scrollWidth - K;
        s.scrollLeft = I + $, y = !1;
      });
    }
  }
  function w() {
    if (y) return;
    const E = M(), A = s.scrollLeft + s.clientWidth / 2, P = Math.floor((A - E) / h);
    if (P < 0) return;
    const I = B(i);
    re(I, P);
    const K = t.get("options").date, $ = te(ue(K));
    if (Ce(I, $)) return;
    y = !0;
    const N = new Date(I.getUTCFullYear(), I.getUTCMonth(), I.getUTCDate());
    o?.(N), requestAnimationFrame(() => {
      y = !1;
    });
  }
  const T = t.on("change:currentRange", () => {
    if (y) return;
    const E = te(ue(t.get("options").date));
    E < i || E >= a ? (i = Wt(E, r), re(i, -Math.floor(Ze / 2) * 7), a = B(i), re(a, Ze * 7), S(), requestAnimationFrame(() => g(E))) : g(E);
  }), b = t.onAny(({ key: E }) => {
    if (E === "filteredEvents") {
      const A = s.scrollLeft, P = s.scrollTop;
      y = !0, S(), requestAnimationFrame(() => {
        s.scrollLeft = A, s.scrollTop = P, y = !1;
      });
    }
  });
  return {
    destroy() {
      b?.(), T?.(), clearTimeout(v), d?.(), n.replaceChildren();
    }
  };
}
function Wt(n, t) {
  const e = te(ue(n)), s = (e.getUTCDay() - t + 7) % 7;
  return re(e, -s), e;
}
function Yo(n, t, e, o) {
  const s = B(t), r = B(e), i = [], a = B(s);
  for (; a < r; )
    i.push(B(a)), re(a);
  const d = /* @__PURE__ */ new Map();
  d.set("activeRange", { start: s, end: r }), d.set("currentRange", { start: s, end: r }), d.set("viewDates", i);
  const v = { ...n.get("options"), columnWidth: o };
  d.set("options", v);
  const h = /* @__PURE__ */ new Map();
  return {
    get(g) {
      return d.has(g) ? d.get(g) : n.get(g);
    },
    set(g, D) {
      d.set(g, D);
      const M = h.get(`change:${g}`);
      if (M) for (const c of M) c({ key: g, value: D });
    },
    on(g, D) {
      let M = h.get(g);
      M || (M = /* @__PURE__ */ new Set(), h.set(g, M)), M.add(D);
      const c = n.on?.(g, (u) => {
        ["activeRange", "currentRange", "viewDates", "options"].includes(u.key) || D(u);
      });
      return () => {
        M.delete(D), c?.();
      };
    },
    onAny(g) {
      return n.onAny?.((D) => {
        ["activeRange", "currentRange", "viewDates", "options"].includes(D.key) || g(D);
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
  const r = Array.isArray(s.classNames) ? s.classNames.filter((y) => typeof y == "string" && y.length > 0) : typeof s.classNames == "string" && s.classNames.length > 0 ? [s.classNames] : [], i = String(e).toLowerCase().replace(/[^a-z0-9-]+/g, "-"), a = i ? `ec-event-type-${i}` : null, d = a ? [a, ...r.filter((y) => y !== a)] : r;
  return {
    type: e,
    color: typeof s.color == "string" ? s.color : null,
    classNames: d,
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
  const e = B(t);
  return re(e), n.filter((o) => o.start < e && o.end > t);
}
function zt(n, t) {
  return n.allDay ? "" : new Intl.DateTimeFormat(t.locale, { timeZone: "UTC", ...t.eventTimeFormat }).format(n.start);
}
function gt(n, t) {
  const e = () => {
    const s = t.get("options"), r = s.theme, i = Xo(t), a = ke(i, s.hiddenDays ?? []), d = 7 - (s.hiddenDays?.length ?? 0), y = p("div", `${r.grid} ec-day-grid`, "", [
      ["data-grid", "day-grid"]
    ]);
    y.style.setProperty("--ec-cols", String(d));
    const v = p("div", r.colHead, "", [
      ["data-row", "header"]
    ]);
    s.weekNumbers && v.append(p("div", r.weekNumber, ""));
    const h = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayHeaderFormat }), S = s.dayHeaderDensity, g = S ? t.get("filteredEvents") ?? [] : [], D = (T) => {
      const b = B(T);
      return re(b), g.filter((E) => E.start < b && E.end > T).length;
    };
    for (const T of a.slice(0, d)) {
      const b = p("div", r.dayHead, h.format(T), [
        ["data-day", String(T.getUTCDay())]
      ]);
      if (S) {
        const E = D(T);
        if (E > 0)
          if (typeof S == "function") {
            const A = S({ date: T, count: E, max: 3 }), P = p("span", "ec-day-head-density");
            typeof A == "string" ? P.textContent = A : A?.html ? P.innerHTML = A.html : A?.domNodes && A.domNodes.forEach((I) => P.append(I)), b.append(P);
          } else {
            const A = p("span", "ec-day-head-density");
            for (let P = 0; P < Math.min(3, E); ++P)
              A.append(p("span", "ec-day-head-dot"));
            b.append(A);
          }
      }
      v.append(b);
    }
    y.append(v), y.style.setProperty(
      "--ec-cols-with-week",
      String(d + (s.weekNumbers ? 1 : 0))
    );
    let M = p("div", "", "", [["data-row", "days"]]);
    const c = Vo(), u = t.get("currentRange"), w = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayCellFormat ?? { day: "numeric" } });
    for (let T = 0; T < a.length; ++T) {
      T > 0 && T % d === 0 && (y.append(M), M = p("div", "", "", [["data-row", "days"]]));
      const b = a[T];
      if (s.weekNumbers && T % d === 0) {
        const N = An(b, s.firstDay ?? 0), q = Pn(N, s.weekNumberContent, b), F = p("div", r.weekNumber, "", [
          ["data-week", String(N)]
        ]);
        typeof q == "string" ? F.textContent = q : q?.html ? F.innerHTML = q.html : q?.domNodes && F.replaceChildren(...q.domNodes), M.append(F);
      }
      const E = [r.day];
      !u || b >= u.start && b < u.end || E.push(r.otherMonth), Ce(b, c) && E.push(r.today);
      const P = p("div", E.filter(Boolean).join(" "), "", [
        ["data-date", b.toISOString().substring(0, 10)]
      ]), I = p("div", "ec-day-number", w.format(b));
      if (P.append(I), s.dayCellContent) {
        const N = typeof s.dayCellContent == "function" ? s.dayCellContent({ date: b, view: t.get("view") }) : s.dayCellContent;
        typeof N == "string" ? I.innerText = N : N?.html ? I.innerHTML = N.html : N?.domNodes && I.replaceChildren(...N.domNodes);
      }
      const K = t.get("filteredEvents") ?? [], $ = qo(K, b);
      if ($.length) {
        const N = p("div", r.events), q = typeof s.dayMaxEvents == "number" ? s.dayMaxEvents : 1 / 0, F = $.slice(0, q), H = $.slice(q);
        for (const k of F) {
          if (k.display === "background") {
            const C = p("div", r.bgEvent, "", [
              ["data-event-id", k.id],
              ...De(k)
            ]), x = k.backgroundColor ?? s.eventBackgroundColor ?? s.eventColor;
            x && (C.style.backgroundColor = x), P.append(C);
            continue;
          }
          const O = [r.event], V = s.eventClassNames;
          if (typeof V == "function") {
            const C = V({ event: k });
            C && O.push(...Array.isArray(C) ? C : [C]);
          } else V && O.push(...Array.isArray(V) ? V : [V]);
          O.push(...k.classNames), O.push(...wn(k));
          const L = ze(k, s);
          L && O.push(...L.classNames);
          const Y = bn(k, s, t.get("_pendingAppearIds"));
          Y && O.push(Y);
          const Q = s.dayCellEventStyle === "stripe";
          Q && O.push("ec-event-stripe");
          const m = p("div", O.filter(Boolean).join(" "), "", [
            ["data-event-id", k.id],
            ...De(k)
          ]), R = k.backgroundColor ?? L?.color ?? s.eventBackgroundColor ?? s.eventColor, f = k.textColor ?? s.eventTextColor;
          if (R && m.style.setProperty("--ec-event-color", R), f && (m.style.color = f), s.eventContent) {
            const C = s.eventContent, x = typeof C == "function" ? C({ event: k, timeText: zt(k, s), view: t.get("view") }) : C;
            typeof x == "string" ? m.innerText = x : x?.html ? m.innerHTML = x.html : x?.domNodes && m.replaceChildren(...x.domNodes);
          } else if (Q)
            k.extendedProps?.rrule && m.append(Tt()), m.append(p("span", r.eventTitle, k.title || ""));
          else {
            const C = p("span", "ec-event-dot"), x = zt(k, s);
            x && s.displayEventEnd !== !1 ? m.append(C, p("time", r.eventTime, x + " ")) : m.append(C), k.extendedProps?.rrule && m.append(Tt()), m.append(p("span", r.eventTitle, k.title || ""));
          }
          const l = t.get("fire");
          t.get("selectedEventId") === k.id && m.classList.add("ec-event-selected"), m.addEventListener("click", (C) => {
            document.querySelectorAll(".ec-event.ec-event-selected").forEach((x) => x.classList.remove("ec-event-selected")), m.classList.add("ec-event-selected"), t.set("selectedEventId", k.id), l?.("eventClick", { event: k, jsEvent: C, view: t.get("view") });
          }), m.addEventListener("dblclick", (C) => l?.("eventDoubleClick", { event: k, jsEvent: C, view: t.get("view"), el: m })), m.addEventListener("mouseenter", (C) => l?.("eventMouseEnter", { event: k, jsEvent: C, view: t.get("view") })), m.addEventListener("mouseleave", (C) => l?.("eventMouseLeave", { event: k, jsEvent: C, view: t.get("view") })), queueMicrotask(() => l?.("eventDidMount", { event: k, el: m, view: t.get("view") })), N.append(m);
        }
        if (H.length) {
          const k = typeof s.moreLinkContent == "function" ? s.moreLinkContent({ num: H.length, date: b }) : s.moreLinkContent ?? `+${H.length} more`, O = p(
            "button",
            "ec-more-link",
            typeof k == "object" && k?.html ? "" : k,
            [
              ["type", "button"],
              ["data-more-link", "true"],
              ["data-date", b.toISOString().substring(0, 10)]
            ]
          );
          typeof k == "object" && k?.html && (O.innerHTML = k.html), O.addEventListener("click", () => Zo(t, b, $)), N.append(O);
        }
        P.append(N);
      }
      M.append(P);
    }
    y.append(M), n.replaceChildren(y);
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
  const o = e.firstDay ?? 0, s = it(te(B(t.start)), o), r = B(t.end);
  for (te(r); r.getUTCDay() !== o; ) re(r);
  return { start: s, end: r };
}
function Vo() {
  return te(/* @__PURE__ */ new Date());
}
function Zo(n, t, e) {
  const o = n.get("options"), s = o.theme, r = new Intl.DateTimeFormat(o.locale, { timeZone: "UTC", ...o.dayPopoverFormat }), i = p("div", `${s.popup} ec-day-popover`, "", [
    ["data-popover", "day"],
    ["data-date", t.toISOString().substring(0, 10)]
  ]), a = p("div", "ec-popup-header");
  a.append(p("div", "ec-popup-title", r.format(t)));
  const d = o.buttonText?.close ?? "Close", y = p("button", "ec-popup-close", d, [
    ["type", "button"],
    ["aria-label", "Close"]
  ]);
  a.append(y), i.append(a);
  const v = p("div", s.events);
  for (const S of e) {
    const g = p("div", s.event, "", [
      ["data-event-id", S.id],
      ...De(S)
    ]);
    S.backgroundColor && g.style.setProperty("--ec-event-color", S.backgroundColor), g.append(p("span", "ec-event-dot"));
    const D = S.allDay ? "" : new Intl.DateTimeFormat(o.locale, { timeZone: "UTC", ...o.eventTimeFormat }).format(S.start);
    D && g.append(p("time", s.eventTime, D + " ")), g.append(p("span", s.eventTitle, S.title || "")), v.append(g);
  }
  i.append(v), document.body.append(i);
  const h = () => i.remove();
  y.addEventListener("click", h), setTimeout(() => {
    document.addEventListener("click", function S(g) {
      i.contains(g.target) || (h(), document.removeEventListener("click", S, !0));
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
  n = B(n);
  const i = B(n);
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
    ), d = ce(
      ct(ve(i), ve(a) + yt)
    ), y = _e(e?.eventFilter) ? e.eventFilter : (v) => !Un(v.display);
    e: for (const v of o) {
      const h = Te(B(v), r), S = Te(B(v), i), g = Te(B(v), a), D = Te(B(v), d);
      for (const M of s)
        if (!M.allDay && y(M) && M.start < D && M.end > g) {
          if (M.start < h) {
            const c = ct((M.start - v) / 1e3, ve(a));
            c < ve(r) && (r.seconds = c);
          }
          if (M.end > S) {
            const c = kt((M.end - v) / 1e3, ve(d));
            c > ve(i) && (i.seconds = c);
          }
          if (ve(r) === ve(a) && ve(i) === ve(d))
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
    const i = t.get("options"), a = i.theme, d = t.get("activeRange");
    if (!d) return;
    const y = n.querySelector('[data-row="body"]');
    y && (e = y.scrollTop);
    const v = ke(d, i.hiddenDays ?? []), h = p("div", `${a.grid} ec-time-grid`, "", [
      ["data-grid", "time-grid"]
    ]);
    h.style.setProperty("--ec-cols", String(v.length));
    const S = p("div", `${a.colHead}`, "", [
      ["data-row", "header"]
    ]);
    S.append(p("div", `${a.sidebar} ec-corner`));
    const g = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayHeaderFormat }), D = i.dayHeaderDensity, M = D ? t.get("filteredEvents") ?? [] : [], c = (F) => {
      const H = B(F);
      return re(H), M.filter((k) => k.start < H && k.end > F).length;
    };
    for (const F of v) {
      const H = p("div", a.dayHead, g.format(F), [
        ["data-day", String(F.getUTCDay())]
      ]);
      if (D) {
        const k = c(F);
        if (k > 0)
          if (typeof D == "function") {
            const O = D({ date: F, count: k, max: 3 }), V = p("span", "ec-day-head-density");
            typeof O == "string" ? V.textContent = O : O?.html ? V.innerHTML = O.html : O?.domNodes && O.domNodes.forEach((L) => V.append(L)), H.append(V);
          } else {
            const O = p("span", "ec-day-head-density");
            for (let V = 0; V < Math.min(3, k); ++V)
              O.append(p("span", "ec-day-head-dot"));
            H.append(O);
          }
      }
      S.append(H);
    }
    h.append(S);
    const u = t.get("filteredEvents") ?? [];
    if (i.allDaySlot) {
      const F = p("div", a.allDay, "", [
        ["data-row", "all-day"]
      ]), H = p("div", a.sidebar + " ec-all-day-label"), k = i.allDayContent;
      if (typeof k == "function") {
        const Y = k({ view: t.get("view") });
        typeof Y == "string" ? H.textContent = Y : Y?.html && (H.innerHTML = Y.html);
      } else typeof k == "string" ? H.textContent = k : k?.html ? H.innerHTML = k.html : H.textContent = "all-day";
      F.append(H);
      const O = p("div", "ec-all-day-cols");
      O.style.setProperty("--ec-cols", String(v.length));
      const V = [];
      for (const Y of v) {
        const Q = p("div", `${a.day} ec-all-day-cell`, "", [
          ["data-date", Y.toISOString().substring(0, 10)]
        ]);
        O.append(Q), V.push(Q);
      }
      const L = u.filter((Y) => Y.allDay);
      for (const Y of L) {
        let Q = -1, m = -1;
        for (let x = 0; x < v.length; ++x) {
          const _ = v[x], G = B(_);
          re(G), Y.start < G && Y.end > _ && (Q === -1 && (Q = x), m = x);
        }
        if (Q === -1) continue;
        const R = m - Q + 1, f = p("div", a.event, "", [
          ["data-event-id", Y.id],
          ...De(Y)
        ]), l = Y.backgroundColor;
        l && f.style.setProperty("--ec-event-color", l), Y.textColor && (f.style.color = Y.textColor), f.style.position = "absolute", f.style.left = "1px", f.style.right = "auto", f.style.top = "2px", f.style.width = `calc(${R * 100}% + ${R - 1}px - 2px)`, f.style.overflow = "hidden", f.append(p("div", a.eventTitle, Y.title || ""));
        const C = t.get("fire");
        t.get("selectedEventId") === Y.id && f.classList.add("ec-event-selected"), f.addEventListener("click", (x) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((_) => _.classList.remove("ec-event-selected")), f.classList.add("ec-event-selected"), t.set("selectedEventId", Y.id), C?.("eventClick", { event: Y, jsEvent: x, view: t.get("view") });
        }), f.addEventListener("dblclick", (x) => C?.("eventDoubleClick", { event: Y, jsEvent: x, view: t.get("view"), el: f })), V[Q].append(f);
      }
      F.append(O), h.append(F);
    }
    const w = p("div", "ec-time-body", "", [
      ["data-row", "body"]
    ]), T = Cn(
      i.slotMinTime,
      i.slotMaxTime,
      i.flexibleSlotTimeLimits,
      v,
      u
    ), b = {
      format: (F) => new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.slotLabelFormat }).format(F)
    }, E = Qo(i.slotLabelInterval, i.slotDuration), A = Tn(
      d.start,
      i.slotDuration,
      E,
      T,
      b
    ), P = p("div", a.sidebar);
    for (const [F, H] of A) {
      const k = p("div", a.slot, "");
      if (k.style.height = `${i.slotHeight}px`, H) {
        const O = /* @__PURE__ */ new Date(F + "Z"), V = O.getUTCHours();
        if (O.getUTCMinutes() === 0) if (V === 12)
          k.append(p("span", "ec-slot-hour", "Noon"));
        else {
          const Y = V % 12 || 12, Q = V >= 12 ? "pm" : "am";
          k.append(p("span", "ec-slot-hour", String(Y))), k.append(p("span", "ec-slot-period", Q));
        }
      }
      P.append(k);
    }
    w.append(P);
    const I = p("div", a.grid + " ec-days");
    I.style.setProperty("--ec-cols", String(v.length)), i.columnWidth && I.style.setProperty("--ec-col-w", `${i.columnWidth}px`);
    for (const F of v) {
      const H = p("div", `${a.day} ec-time-col`, "", [
        ["data-date", F.toISOString().substring(0, 10)]
      ]);
      for (let _ = 0; _ < A.length; ++_) {
        const G = p("div", a.slot);
        G.style.height = `${i.slotHeight}px`, H.append(G);
      }
      const k = p("div", "ec-event-overlay"), O = Jo(u, F).filter((_) => !_.allDay), V = te(B(F)), L = B(V);
      re(L);
      const Y = /* @__PURE__ */ new Map();
      for (const _ of O) {
        const G = _.start < V, W = _.end > L;
        Y.set(_, {
          visStart: G ? V : _.start,
          visEnd: W ? L : _.end,
          startsBefore: G,
          endsAfter: W
        });
      }
      const Q = O.filter((_) => _.display !== "background").map((_) => ({
        start: Y.get(_).visStart,
        end: Y.get(_).visEnd,
        event: _
      })), m = dn(Q), R = /* @__PURE__ */ new Map();
      for (const _ of Q) R.set(_.event, m.get(_));
      const f = 16, l = Se(i.slotDuration) / 60, C = Se(T.min) / 60, x = i.slotHeight / l;
      for (const _ of O) {
        const G = Y.get(_), { visStart: W, visEnd: X, startsBefore: Z, endsAfter: J } = G, U = (W.getTime() - V.getTime()) / 6e4 - C, j = (X.getTime() - V.getTime()) / 6e4 - C;
        if (_.display === "background") {
          const ie = ["ec-bg-event"], he = i.eventClassNames;
          if (typeof he == "function") {
            const me = he({ event: _ });
            me && ie.push(...Array.isArray(me) ? me : [me]);
          } else he && ie.push(...Array.isArray(he) ? he : [he]);
          _.classNames && ie.push(...Array.isArray(_.classNames) ? _.classNames : [_.classNames]);
          const be = p("div", ie.filter(Boolean).join(" "), "", [
            ["data-event-id", _.id],
            ...De(_)
          ]);
          be.style.position = "absolute", be.style.top = `${U * x}px`, be.style.height = `${Math.max((j - U) * x, 12)}px`, be.style.left = "0", be.style.right = "0", be.style.zIndex = "0", _.backgroundColor && (be.style.background = _.backgroundColor);
          const Ye = i.eventContent;
          if (typeof Ye == "function") {
            const me = Ye({ event: _ });
            typeof me == "string" ? be.textContent = me : me?.html ? be.innerHTML = me.html : me?.domNodes && me.domNodes.forEach((_t) => be.append(_t));
          }
          k.append(be);
          continue;
        }
        const z = [a.event];
        Z && z.push("ec-event-continues-from"), J && z.push("ec-event-continues-to");
        const ne = i.eventClassNames;
        if (typeof ne == "function") {
          const ie = ne({ event: _ });
          ie && z.push(...Array.isArray(ie) ? ie : [ie]);
        } else ne && z.push(...Array.isArray(ne) ? ne : [ne]);
        _.classNames && z.push(...Array.isArray(_.classNames) ? _.classNames : [_.classNames]), z.push(...wn(_));
        const se = ze(_, i);
        se && z.push(...se.classNames);
        const de = bn(_, i, t.get("_pendingAppearIds"));
        de && z.push(de);
        const ee = p("div", z.filter(Boolean).join(" "), "", [
          ["data-event-id", _.id],
          ["data-event-start", _.start.toISOString()],
          ["data-event-end", _.end.toISOString()],
          ...De(_)
        ]), fe = R.get(_) ?? 0;
        ee.style.position = "absolute", ee.style.top = `${U * x}px`;
        const ae = Math.max((j - U) * x, 12);
        ee.style.height = `${ae}px`, ae < 36 && ee.classList.add("ec-event-compact"), ee.style.left = fe === 0 ? "0" : `${fe * f}px`, ee.style.right = "0", fe > 0 && (ee.style.zIndex = String(fe + 1));
        const oe = _.backgroundColor ?? se?.color;
        oe && ee.style.setProperty("--ec-event-color", oe);
        const ye = p("div", a.eventTitle);
        _.extendedProps?.rrule && ye.append(Tt()), ye.append(document.createTextNode(_.title || "")), ee.append(ye);
        const le = p("div", a.eventTime ?? "ec-event-time");
        if (le.innerHTML = jo, le.append(document.createTextNode(Sn(W, X, i))), ee.append(le), i.editable && i.eventDurationEditable !== !1) {
          if (!J) {
            const ie = p("div", `${a.resizer ?? "ec-resizer"} ec-resizer-end`, "", [
              ["data-resizer", "end"]
            ]);
            ee.append(ie);
          }
          if (i.eventResizableFromStart && !Z) {
            const ie = p("div", `${a.resizer ?? "ec-resizer"} ec-resizer-start`, "", [
              ["data-resizer", "start"]
            ]);
            ee.append(ie);
          }
        }
        const we = t.get("fire");
        t.get("selectedEventId") === _.id && ee.classList.add("ec-event-selected"), ee.addEventListener("click", (ie) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((he) => he.classList.remove("ec-event-selected")), ee.classList.add("ec-event-selected"), t.set("selectedEventId", _.id), we?.("eventClick", { event: _, jsEvent: ie, view: t.get("view") });
        }), ee.addEventListener("dblclick", (ie) => we?.("eventDoubleClick", { event: _, jsEvent: ie, view: t.get("view"), el: ee })), ee.addEventListener("mouseenter", (ie) => we?.("eventMouseEnter", { event: _, jsEvent: ie, view: t.get("view") })), ee.addEventListener("mouseleave", (ie) => we?.("eventMouseLeave", { event: _, jsEvent: ie, view: t.get("view") })), queueMicrotask(() => we?.("eventDidMount", { event: _, el: ee, view: t.get("view") })), k.append(ee);
      }
      if (H.style.position = "relative", H.append(k), i.nowIndicator) {
        const _ = te(ue(/* @__PURE__ */ new Date()));
        if (Ce(_, te(B(F)))) {
          const W = p("div", a.nowIndicator, "", [
            ["data-now-indicator", ""]
          ]), X = Se(T.min) / 60, Z = Se(i.slotDuration) / 60, J = i.slotHeight / Z;
          W.style.position = "absolute", W.style.left = "0", W.style.right = "0", W.style.height = "2px", W.style.background = "#dc2626", W.style.zIndex = "5";
          const U = (j) => {
            const z = j instanceof Date ? j : ue(/* @__PURE__ */ new Date()), ne = z.getUTCHours() * 60 + z.getUTCMinutes() - X;
            W.style.top = `${ne * J}px`;
          };
          U(t.get("now")), H.append(W), o = t.on("change:now", ({ value: j }) => U(j));
        }
      }
      I.append(H);
    }
    w.append(I), h.append(w), n.replaceChildren(h);
    const K = Se(T.min) / 60, $ = Se(T.max) / 60, N = Se(i.slotDuration) / 60, q = i.slotHeight / N;
    if (e != null)
      w.scrollTop = e;
    else {
      const F = /* @__PURE__ */ new Date(), H = te(/* @__PURE__ */ new Date()), k = v.some((V) => Ce(H, te(B(V)))), O = F.getHours() * 60 + F.getMinutes();
      if (k && O >= K && O <= $) {
        const V = (O - K) * q, L = w.clientHeight || 0;
        w.scrollTop = Math.max(0, V - L / 2), e = w.scrollTop;
      } else if (i.scrollTime) {
        const L = (Se(i.scrollTime) / 60 - K) * q;
        w.scrollTop = Math.max(0, L), e = w.scrollTop;
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
  const e = B(t);
  return re(e), n.filter((o) => o.start < e && o.end > t);
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
  const r = s.formatToParts(n), i = s.formatToParts(t), a = r.find((M) => M.type === "dayPeriod")?.value, d = i.find((M) => M.type === "dayPeriod")?.value, y = n.getMinutes() === 0, v = t.getMinutes() === 0, h = (M, c, u) => M.filter((w) => !(c && w.type === "dayPeriod")).filter((w) => !(c && w.type === "literal" && w.value.trim() === "" && w === M[M.length - 1])).filter((w, T, b) => u ? !(w.type === "minute" || w.type === "literal" && w.value === ":") : !0).map((w) => w.value).join(""), g = h(r, a && d && a === d, y), D = h(i, !1, v);
  return `${g.trim()} – ${D.trim()}`;
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
    const a = ke(i, s.hiddenDays ?? []), d = t.get("filteredEvents") ?? [], y = p("div", `${r.grid} ec-list`, "", [
      ["data-grid", "list"]
    ]), v = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.listDayFormat }), h = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.listDaySideFormat }), S = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.eventTimeFormat });
    let g = 0;
    for (const D of a) {
      const M = B(D);
      re(M);
      const c = d.filter((w) => w.start < M && w.end > D);
      if (!c.length) continue;
      g += c.length;
      const u = p("div", r.dayHead, "", [
        ["data-row", "day-header"],
        ["data-date", D.toISOString().substring(0, 10)]
      ]);
      u.append(p("span", "", v.format(D))), u.append(p("span", r.daySide, h.format(D))), y.append(u);
      for (const w of c) {
        const T = [r.event], b = s.eventClassNames;
        if (typeof b == "function") {
          const $ = b({ event: w });
          $ && T.push(...Array.isArray($) ? $ : [$]);
        } else b && T.push(...Array.isArray(b) ? b : [b]);
        w.classNames && T.push(...Array.isArray(w.classNames) ? w.classNames : [w.classNames]);
        const E = ze(w, s);
        E && T.push(...E.classNames);
        const A = p("div", T.filter(Boolean).join(" "), "", [
          ["data-event-id", w.id],
          ...De(w)
        ]), P = w.backgroundColor ?? E?.color;
        P && A.style.setProperty("--ec-event-color", P), A.append(p("span", r.eventTag));
        const I = w.allDay ? "all-day" : S.format(w.start);
        A.append(p("time", r.eventTime, I)), A.append(p("span", r.eventTitle, w.title || ""));
        const K = t.get("fire");
        t.get("selectedEventId") === w.id && A.classList.add("ec-event-selected"), A.addEventListener("click", ($) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((N) => N.classList.remove("ec-event-selected")), A.classList.add("ec-event-selected"), t.set("selectedEventId", w.id), K?.("eventClick", { event: w, jsEvent: $, view: t.get("view") });
        }), A.addEventListener("dblclick", ($) => K?.("eventDoubleClick", { event: w, jsEvent: $, view: t.get("view"), el: A })), A.addEventListener("mouseenter", ($) => K?.("eventMouseEnter", { event: w, jsEvent: $, view: t.get("view") })), A.addEventListener("mouseleave", ($) => K?.("eventMouseLeave", { event: w, jsEvent: $, view: t.get("view") })), queueMicrotask(() => K?.("eventDidMount", { event: w, el: A, view: t.get("view") })), y.append(A);
      }
    }
    if (g === 0) {
      const D = p("div", r.noEvents), M = s.noEventsContent;
      if (typeof M == "function") {
        const c = M();
        typeof c == "string" ? D.textContent = c : c?.html && (D.innerHTML = c.html);
      } else typeof M == "string" ? D.textContent = M : M?.html && (D.innerHTML = M.html);
      typeof s.noEventsClick == "function" && (D.style.cursor = "pointer", D.addEventListener("click", (c) => s.noEventsClick({ jsEvent: c }))), y.append(D);
    }
    n.replaceChildren(y);
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
      const d = e[a];
      if (d === null) return { startMin: 0, endMin: 0 };
      if (d && typeof d == "object") {
        const y = Je(d.start), v = Je(d.end);
        return y != null && v != null && v > y ? { startMin: y, endMin: v } : { startMin: 0, endMin: 0 };
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
      n.replaceChildren(p(
        "div",
        r.noEvents,
        "No resources configured"
      ));
      return;
    }
    const d = ke(i, s.hiddenDays ?? []), y = t.get("filteredEvents") ?? [];
    let v = a.filter((b) => b.visible !== !1);
    s.filterResourcesWithEvents && (v = a.filter((b) => y.some((E) => E.resourceIds.includes(b.id))));
    const h = p("div", `${r.grid} ec-resource ec-time-grid`, "", [
      ["data-grid", "resource-time-grid"]
    ]);
    h.style.setProperty("--ec-cols", String(d.length * v.length));
    const S = p("div", r.colHead, "", [["data-row", "header"]]);
    S.append(p("div", `${r.sidebar} ec-corner`));
    const g = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayHeaderFormat });
    for (const b of d)
      for (const E of v) {
        const A = p("div", r.dayHead, "", [
          ["data-day", String(b.getUTCDay())],
          ["data-resource-id", E.id]
        ]), P = p("div", "", g.format(b)), I = p("div", r.resourceLabel, "", [
          ["data-resource-label", ""]
        ]), K = s.resourceLabelContent;
        let $ = E.title;
        if (typeof K == "function") {
          const N = K({ resource: E });
          typeof N == "string" ? $ = N : N?.html && (I.innerHTML = N.html, $ = null);
        }
        $ !== null && (I.textContent = $), typeof s.resourceLabelDidMount == "function" && queueMicrotask(() => s.resourceLabelDidMount({ resource: E, el: I })), d.length > 1 ? s.datesAboveResources ? A.append(P, I) : A.append(I, P) : A.append(I), S.append(A);
      }
    h.append(S);
    const D = p("div", "ec-time-body", "", [["data-row", "body"]]), M = Cn(
      s.slotMinTime,
      s.slotMaxTime,
      s.flexibleSlotTimeLimits,
      d,
      y
    ), c = {
      format: (b) => new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.slotLabelFormat }).format(b)
    }, u = Tn(
      i.start,
      s.slotDuration,
      1,
      M,
      c
    ), w = p("div", r.sidebar);
    for (const [b, E] of u) {
      const A = p("div", r.slot, E);
      A.style.height = `${s.slotHeight}px`, w.append(A);
    }
    D.append(w);
    const T = p("div", `${r.grid} ec-days`);
    T.style.setProperty("--ec-cols", String(d.length * v.length));
    for (const b of d)
      for (const E of v) {
        const A = p("div", `${r.day} ec-time-col`, "", [
          ["data-date", b.toISOString().substring(0, 10)],
          ["data-resource-id", E.id]
        ]);
        for (let L = 0; L < u.length; ++L) {
          const Y = p("div", r.slot);
          Y.style.height = `${s.slotHeight}px`, A.append(Y);
        }
        const P = vt(s.slotDuration) / 60, I = vt(M.min) / 60, K = vt(M.max) / 60, $ = s.slotHeight / P, N = Mn(E.workingHours, b);
        for (const L of N) {
          const Y = Math.max(L.startMin, I), Q = Math.min(L.endMin, K);
          if (Q <= Y) continue;
          const m = p("div", "ec-resource-offhours");
          m.style.position = "absolute", m.style.left = "0", m.style.right = "0", m.style.top = `${(Y - I) * $}px`, m.style.height = `${(Q - Y) * $}px`, m.style.pointerEvents = "none", m.style.zIndex = "0", A.append(m);
        }
        const q = p("div", "ec-event-overlay"), F = B(b);
        re(F);
        const H = y.filter(
          (L) => !L.allDay && L.start < F && L.end > b && (L.resourceIds.length === 0 || L.resourceIds.includes(E.id))
        ), k = H.filter((L) => L.display !== "background"), O = dn(k), V = 16;
        for (const L of H) {
          const Y = qt(L.start) - I, Q = qt(L.end) - I;
          if (L.display === "background") {
            const X = ["ec-bg-event"], Z = s.eventClassNames;
            if (typeof Z == "function") {
              const j = Z({ event: L });
              j && X.push(...Array.isArray(j) ? j : [j]);
            } else Z && X.push(...Array.isArray(Z) ? Z : [Z]);
            L.classNames && X.push(...Array.isArray(L.classNames) ? L.classNames : [L.classNames]);
            const J = p("div", X.filter(Boolean).join(" "), "", [
              ["data-event-id", L.id],
              ...De(L)
            ]);
            J.style.position = "absolute", J.style.top = `${Y * $}px`, J.style.height = `${Math.max((Q - Y) * $, 12)}px`, J.style.left = "0", J.style.right = "0", J.style.zIndex = "0", L.backgroundColor && (J.style.background = L.backgroundColor);
            const U = s.eventContent;
            if (typeof U == "function") {
              const j = U({ event: L });
              typeof j == "string" ? J.textContent = j : j?.html ? J.innerHTML = j.html : j?.domNodes && j.domNodes.forEach((z) => J.append(z));
            }
            q.append(J);
            continue;
          }
          const m = [r.event], R = s.eventClassNames;
          if (typeof R == "function") {
            const X = R({ event: L });
            X && m.push(...Array.isArray(X) ? X : [X]);
          } else R && m.push(...Array.isArray(R) ? R : [R]);
          L.classNames && m.push(...Array.isArray(L.classNames) ? L.classNames : [L.classNames]);
          const f = ze(L, s);
          f && m.push(...f.classNames);
          const l = p("div", m.filter(Boolean).join(" "), "", [
            ["data-event-id", L.id],
            ...De(L)
          ]), C = O.get(L) ?? 0;
          l.style.position = "absolute", l.style.top = `${Y * $}px`;
          const x = Math.max((Q - Y) * $, 12);
          l.style.height = `${x}px`, x < 36 && l.classList.add("ec-event-compact"), l.style.left = C === 0 ? "0" : `${C * V}px`, l.style.right = "0", C > 0 && (l.style.zIndex = String(C + 1));
          const _ = L.backgroundColor ?? f?.color ?? E.eventBackgroundColor;
          _ && l.style.setProperty("--ec-event-color", _), l.append(p("div", r.eventTitle, L.title || ""));
          const G = p("div", r.eventTime ?? "ec-event-time");
          G.innerHTML = '<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>', G.append(document.createTextNode(Sn(L.start, L.end, s))), l.append(G);
          const W = t.get("fire");
          l.addEventListener("click", (X) => W?.("eventClick", { event: L, jsEvent: X, view: t.get("view"), resource: E })), l.addEventListener("dblclick", (X) => W?.("eventDoubleClick", { event: L, jsEvent: X, view: t.get("view"), resource: E, el: l })), l.addEventListener("mouseenter", (X) => W?.("eventMouseEnter", { event: L, jsEvent: X, view: t.get("view"), resource: E })), l.addEventListener("mouseleave", (X) => W?.("eventMouseLeave", { event: L, jsEvent: X, view: t.get("view"), resource: E })), queueMicrotask(() => W?.("eventDidMount", { event: L, el: l, view: t.get("view"), resource: E })), q.append(l);
        }
        A.style.position = "relative", A.append(q), T.append(A);
      }
    D.append(T), h.append(D), n.replaceChildren(h);
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
    for (const h of t) {
      const S = String(h.id), g = o.get(S);
      r.set(S, {
        id: S,
        title: h.title ?? "",
        color: h.color,
        resourceIds: Array.isArray(h.resourceIds) ? h.resourceIds.map(String) : [],
        action: h.action,
        expanded: g ?? h.expanded ?? !0
      }), i.push(S);
    }
  if (e)
    for (const h of n) {
      const S = h[e] ?? h.extendedProps?.[e];
      if (S == null || S === "") continue;
      const g = String(S);
      if (!r.has(g)) {
        const M = o.get(g);
        r.set(g, {
          id: g,
          title: h[`${e}Title`] ?? h.extendedProps?.[`${e}Title`] ?? g,
          color: h[`${e}Color`] ?? h.extendedProps?.[`${e}Color`],
          resourceIds: [],
          expanded: M ?? !0
        }), i.push(g);
      }
      const D = r.get(g);
      D.resourceIds.includes(h.id) || D.resourceIds.push(h.id);
    }
  const a = /* @__PURE__ */ new Set();
  for (const h of r.values()) for (const S of h.resourceIds) a.add(S);
  const d = [];
  for (const h of i) {
    const S = r.get(h);
    if (S && (d.push({ kind: "group", group: S }), !!S.expanded))
      for (const g of S.resourceIds) {
        const D = n.find((M) => M.id === g);
        D && d.push({ kind: "resource", resource: D, group: S });
      }
  }
  const y = n.filter((h) => !a.has(h.id));
  if (y.length === 0) return { layout: d, groupsById: r };
  if (i.length > 0 && s) {
    const h = "__ungrouped", S = o.get(h), g = {
      id: h,
      title: s,
      color: void 0,
      resourceIds: y.map((D) => D.id),
      expanded: S ?? !0,
      synthetic: !0
    };
    if (r.set(h, g), d.push({ kind: "group", group: g }), g.expanded)
      for (const D of y) d.push({ kind: "resource", resource: D, group: g });
  } else
    for (const h of y) d.push({ kind: "resource", resource: h, group: null });
  return { layout: d, groupsById: r };
}
function Fe(n, t) {
  const e = t.get("resourceGroupState") ?? /* @__PURE__ */ new Map();
  t.set("resourceGroupState", e);
  let o = null;
  const s = () => {
    o && (o(), o = null);
    const i = t.get("options"), a = i.theme, d = t.get("activeRange"), y = t.get("resources") ?? i.resources ?? [];
    if (!d) return;
    const v = ke(d, i.hiddenDays ?? []), h = t.get("filteredEvents") ?? [], S = i.slotMode === "hours" ? "hours" : "days", g = Vt(i.slotMinTime) / 3600, D = Vt(i.slotMaxTime) / 3600, M = S === "hours" ? Math.max(1, Math.round(D - g)) : 1, c = S === "hours" ? i.slotWidth ?? 48 : i.slotWidth ?? 140, u = v.length * M, w = u * c, T = (f) => {
      const l = v.findIndex((X) => {
        const Z = B(X);
        return re(Z), f < Z && f >= X;
      });
      if (S === "days")
        return l === -1 ? f < v[0] ? 0 : w : l * c;
      let C = l;
      if (C === -1)
        return f < v[0] ? 0 : w;
      const x = te(B(v[C])), _ = (f.getTime() - x.getTime()) / 6e4, W = Math.max(g * 60, Math.min(D * 60, _)) / 60 - g;
      return C * M * c + W * c;
    }, b = p("div", `${a.grid} ec-timeline ec-resource ec-timeline-mode-${S}`, "", [
      ["data-grid", "resource-timeline"],
      ["data-slot-mode", S]
    ]);
    i.dayHeaderTodayStyle === "circle" && b.classList.add("ec-day-head-today-circle");
    const E = t.get("rowHeight") ?? i.rowHeight;
    E && b.style.setProperty("--ec-timeline-row-h", `${E}px`);
    const A = p("div", a.colHead, "", [["data-row", "header"]]), P = p("div", `${a.rowHead} ec-corner`);
    A.append(P);
    const I = p("div", a.slots);
    I.style.width = `${w}px`;
    const K = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayHeaderFormat }), $ = te(ue(/* @__PURE__ */ new Date()));
    for (const f of v) {
      const l = Ce($, te(B(f))), C = p("div", `${a.dayHead}${l ? " ec-day-head-today" : ""}`, "", [
        ["data-day", String(f.getUTCDay())],
        ["data-date", f.toISOString().substring(0, 10)]
      ]);
      if (i.dayHeaderTodayStyle === "circle" && l) {
        const x = K.format(f), _ = f.getUTCDate(), G = x.indexOf(String(_));
        if (G >= 0) {
          const W = x.slice(0, G), X = x.slice(G + String(_).length);
          W && C.append(document.createTextNode(W));
          const Z = p("span", "ec-day-head-today-disc", String(_));
          C.append(Z), X && C.append(document.createTextNode(X));
        } else
          C.textContent = x;
      } else
        C.textContent = K.format(f);
      C.style.width = `${c * M}px`, I.append(C);
    }
    if (A.append(I), S === "hours") {
      const f = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", hour: "numeric" }), l = p("div", `${a.colHead} ec-timeline-hour-head`, "", [
        ["data-row", "hour-header"]
      ]);
      l.append(p("div", a.rowHead));
      const C = p("div", `${a.slots} ec-timeline-hour-strip`);
      C.style.width = `${w}px`;
      for (let x = 0; x < v.length; ++x)
        for (let _ = 0; _ < M; ++_) {
          const G = B(v[x]);
          G.setUTCHours(g + _, 0, 0, 0);
          const W = p("div", `${a.dayHead} ec-hour-head`, f.format(G), [
            ["data-hour", String(g + _)]
          ]);
          W.style.width = `${c}px`, C.append(W);
        }
      l.append(C), b.append(A, l);
    } else
      b.append(A);
    const N = y.filter((f) => (Re(f)?.level ?? 0) === 0);
    if (i.resourceExpand !== void 0) {
      const f = (l, C) => {
        const x = Re(l);
        if (x) {
          (i.resourceExpand === "all" || i.resourceExpand === !0 || typeof i.resourceExpand == "number" && C < i.resourceExpand) && (l.expanded = !0);
          for (const _ of x.children) f(_, C + 1);
        }
      };
      for (const l of N) f(l, 0);
    }
    const { layout: q, groupsById: F } = ss({
      resources: N,
      resourceGroups: i.resourceGroups,
      resourceGroupField: i.resourceGroupField,
      ungroupedTitle: i.ungroupedGroupTitle,
      groupState: e
    });
    t.set("resourceGroupsById", F);
    const H = /* @__PURE__ */ new Map();
    for (const f of F.values())
      for (const l of f.resourceIds) H.set(l, f);
    const k = (f) => H.get(f.id) ?? null, O = p("div", "ec-timeline-body", "", [["data-row", "body"]]);
    O.style.position = "relative";
    let V = -1;
    for (let f = 0; f < v.length; f++)
      if (Ce($, te(B(v[f])))) {
        V = f;
        break;
      }
    if (V >= 0) {
      const f = V * M * c, l = c * M, C = p("div", "ec-timeline-today-band", "", [
        ["data-today-band", ""]
      ]);
      if (C.style.position = "absolute", C.style.top = "0", C.style.bottom = "0", C.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${f}px)`, C.style.width = `${l}px`, C.style.pointerEvents = "none", C.style.zIndex = "0", O.append(C), i.nowIndicator) {
        const x = p("div", "ec-timeline-now-line", "", [
          ["data-now-indicator", ""]
        ]);
        x.style.position = "absolute", x.style.top = "0", x.style.bottom = "0", x.style.width = "2px", x.style.background = "var(--ec-now-indicator-color, #dc2626)", x.style.pointerEvents = "none", x.style.zIndex = "1";
        const _ = v[V], G = (W) => {
          const Z = ((W instanceof Date ? W : ue(/* @__PURE__ */ new Date())).getTime() - _.getTime()) / 6e4;
          let J;
          S === "hours" ? J = (Math.max(g * 60, Math.min(D * 60, Z)) - g * 60) / 60 * c : J = Math.max(0, Math.min(1440, Z)) / 1440 * c, x.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${f + J}px)`;
        };
        G(t.get("now")), O.append(x), o = t.on("change:now", ({ value: W }) => G(W));
      }
    }
    const L = t.get("suggestedSlot");
    if (L?.start && L?.end) {
      const f = T(L.start), l = T(L.end);
      if (!(l <= 0 || f >= w)) {
        const C = p("div", "ec-suggested-slot", "", [
          ["data-suggested-slot", ""],
          ["data-resource-id", L.resourceId ?? ""]
        ]);
        C.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${Math.max(0, f)}px)`, C.style.width = `${Math.max(8, Math.min(w, l) - Math.max(0, f))}px`, C.style.top = "4px", C.style.bottom = "4px", C.style.pointerEvents = "auto", C.addEventListener("click", (x) => {
          t.get("fire")?.("suggestedSlotClick", {
            start: L.start,
            end: L.end,
            resourceId: L.resourceId,
            jsEvent: x,
            view: t.get("view")
          });
        }), O.append(C);
      }
    }
    const Y = t.get("mode"), Q = Y && typeof i.cellAffordanceWhen == "function" && i.cellAffordanceWhen(Y), m = (f) => {
      const l = p("div", `ec-timeline-row ${a.groupHeader}`, "", [
        ["data-row", "group-header"],
        ["data-group-id", f.id],
        ["data-expanded", f.expanded ? "true" : "false"]
      ]), C = p("div", `${a.rowHead} ec-group-head`), x = p("button", a.groupHeaderToggle, "", [
        ["type", "button"],
        ["aria-label", f.expanded ? "Collapse" : "Expand"],
        ["aria-expanded", String(f.expanded)]
      ]);
      x.innerHTML = f.expanded ? i.icons.collapse?.html ?? "−" : i.icons.expand?.html ?? "+", x.addEventListener("click", () => {
        const J = !f.expanded;
        e.set(f.id, J), f.expanded = J, t.get("fire")?.(J ? "groupExpand" : "groupCollapse", {
          groupId: f.id,
          view: t.get("view")
        }), s();
      }), C.append(x);
      const _ = p("span", a.groupHeaderSwatch);
      f.color && (_.style.background = f.color), C.append(_), C.append(p("span", a.groupHeaderName, f.title)), C.append(p("span", a.groupHeaderCount, `${f.resourceIds.length}`));
      const G = p("span", a.groupHeaderAction, "", [
        ["data-group-header-action", ""]
      ]), W = i.groupHeaderContent;
      if (typeof W == "function") {
        const J = W({ group: f, view: t.get("view") });
        typeof J == "string" ? G.textContent = J : J?.html ? G.innerHTML = J.html : J?.domNodes && J.domNodes.forEach((U) => G.append(U));
      }
      C.append(G), l.append(C);
      const X = p("div", "ec-group-header-strip");
      X.style.width = `${w}px`, l.append(X), O.append(l);
      const Z = i.groupHeaderDidMount;
      typeof Z == "function" && queueMicrotask(() => Z({ group: f, el: l, view: t.get("view") }));
    }, R = (f, l) => {
      const C = Re(f);
      if (C?.hidden || f.visible === !1) return;
      const x = p("div", "ec-timeline-row", "", [
        ["data-resource-id", f.id],
        ["data-depth", String(l)]
      ]), _ = p("div", a.rowHead, "", [["data-resource-label", ""]]);
      _.style.setProperty("--ec-row-head-indent", `${l * 16}px`);
      const G = C?.children?.length > 0;
      if (G) {
        const U = p("button", a.expander, "", [
          ["type", "button"],
          ["data-toolbar-action", "expand"]
        ]);
        U.innerHTML = f.expanded ? i.icons.collapse?.html ?? "−" : i.icons.expand?.html ?? "+", U.addEventListener("click", () => {
          f.expanded = !f.expanded;
          const j = (z, ne) => {
            const se = Re(z);
            if (se)
              for (const de of se.children) {
                const ee = Re(de);
                ee && (ee.hidden = ne), j(de, ne || !de.expanded);
              }
          };
          j(f, !f.expanded), s();
        }), _.append(U);
      }
      _.append(p("span", "", f.title)), x.append(_);
      const W = p("div", "ec-timeline-ribbon");
      if (W.style.position = "relative", W.style.minHeight = "30px", W.style.width = `${w}px`, f.workingHours)
        for (let U = 0; U < v.length; ++U) {
          const j = v[U], z = Mn(f.workingHours, j);
          if (z.length !== 0) {
            if (S === "days") {
              if (z.length === 1 && z[0].startMin === 0 && z[0].endMin === 1440) {
                const se = p("div", "ec-resource-offhours");
                se.style.position = "absolute", se.style.top = "0", se.style.bottom = "0", se.style.left = `${U * c}px`, se.style.width = `${c}px`, se.style.pointerEvents = "none", W.append(se);
              }
              continue;
            }
            for (const ne of z) {
              const se = Math.max(ne.startMin / 60, g), de = Math.min(ne.endMin / 60, D);
              if (de <= se) continue;
              const ee = (U * M + (se - g)) * c, fe = (de - se) * c;
              if (fe <= 0) continue;
              const ae = p("div", "ec-resource-offhours");
              ae.style.position = "absolute", ae.style.top = "0", ae.style.bottom = "0", ae.style.left = `${ee}px`, ae.style.width = `${fe}px`, ae.style.pointerEvents = "none", W.append(ae);
            }
          }
        }
      if (S === "hours" && i.lunchHour != null) {
        const U = Number(i.lunchHour);
        if (Number.isFinite(U) && U >= g && U < D)
          for (let j = 0; j < v.length; ++j) {
            const z = p("div", "ec-timeline-lunch-band"), ne = (j * M + (U - g)) * c;
            z.style.position = "absolute", z.style.top = "0", z.style.bottom = "0", z.style.left = `${ne}px`, z.style.width = `${c}px`, z.style.pointerEvents = "none", W.append(z);
          }
      }
      const X = p("div", "ec-timeline-cells");
      X.style.position = "absolute", X.style.inset = "0", X.style.display = "grid", X.style.gridTemplateColumns = `repeat(${u}, ${c}px)`, X.style.pointerEvents = "none";
      const Z = t.get("fire");
      for (let U = 0; U < v.length; ++U) {
        const j = v[U];
        for (let z = 0; z < M; ++z) {
          const ne = B(j);
          S === "hours" && ne.setUTCHours(g + z, 0, 0, 0);
          const se = z === 0, de = S === "days" && U > 0 && U % 7 === 0 && z === 0, ee = p(
            "div",
            `ec-timeline-cell${se ? " ec-timeline-cell-day-edge" : ""}${de ? " ec-timeline-cell-week-edge" : ""}${Q ? " ec-timeline-cell-affordance" : ""}`,
            "",
            [
              ["data-date", j.toISOString().substring(0, 10)],
              ["data-day", String(j.getUTCDay())],
              ...S === "hours" ? [["data-hour", String(g + z)]] : []
            ]
          );
          ee.style.pointerEvents = "auto";
          const fe = i.emptyCellAddButton || Q;
          if (fe) {
            const ae = p("span", "ec-timeline-cell-add", "+");
            if (typeof fe == "function") {
              const oe = fe({ date: ne, resource: f, group: k(f) });
              typeof oe == "string" ? ae.textContent = oe : oe?.html ? ae.innerHTML = oe.html : oe?.domNodes && (ae.textContent = "", oe.domNodes.forEach((ye) => ae.append(ye)));
            }
            ee.append(ae);
          }
          ee.addEventListener("click", (ae) => {
            Z?.("cellClick", {
              date: ne,
              resource: f,
              group: k(f),
              jsEvent: ae,
              view: t.get("view")
            });
          }), X.append(ee);
        }
      }
      W.append(X);
      const J = h.filter((U) => U.resourceIds.length === 0 || U.resourceIds.includes(f.id));
      for (const U of J) {
        const j = T(U.start), z = T(U.end);
        if (z <= 0 || j >= w) continue;
        const ne = Math.max(0, j), se = Math.min(w, z), de = Math.max(c / 4, se - ne), ee = [a.event], fe = i.eventClassNames;
        if (typeof fe == "function") {
          const le = fe({ event: U });
          le && ee.push(...Array.isArray(le) ? le : [le]);
        } else fe && ee.push(...Array.isArray(fe) ? fe : [fe]);
        U.classNames && ee.push(...Array.isArray(U.classNames) ? U.classNames : [U.classNames]);
        const ae = ze(U, i);
        ae && ee.push(...ae.classNames);
        const oe = p("div", ee.filter(Boolean).join(" "), U.title || "", [
          ["data-event-id", U.id],
          ...De(U)
        ]);
        oe.style.position = "absolute", oe.style.left = `${ne}px`, oe.style.width = `${de}px`;
        const ye = U.backgroundColor ?? ae?.color;
        if (ye && oe.style.setProperty("--ec-event-color", ye), de < Number(i.eventNarrowThreshold ?? 60) && oe.classList.add("ec-event-narrow"), typeof ResizeObserver < "u" && new ResizeObserver(() => {
          const we = oe.getBoundingClientRect().width;
          oe.classList.toggle("ec-event-narrow", we < Number(i.eventNarrowThreshold ?? 60));
        }).observe(oe), i.editable && i.eventDurationEditable !== !1) {
          const le = p(
            "div",
            `${i.theme.resizer ?? "ec-resizer"} ec-resizer-x ec-resizer-x-end`,
            "",
            [
              ["data-resizer", "end"],
              ["data-resize-axis", "x"]
            ]
          );
          if (oe.append(le), i.eventResizableFromStart) {
            const we = p(
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
        oe.addEventListener("click", (le) => Z?.("eventClick", { event: U, jsEvent: le, view: t.get("view"), resource: f })), oe.addEventListener("dblclick", (le) => Z?.("eventDoubleClick", { event: U, jsEvent: le, view: t.get("view"), resource: f, el: oe })), oe.addEventListener("mouseenter", (le) => Z?.("eventMouseEnter", { event: U, jsEvent: le, view: t.get("view"), resource: f })), oe.addEventListener("mouseleave", (le) => Z?.("eventMouseLeave", { event: U, jsEvent: le, view: t.get("view"), resource: f })), queueMicrotask(() => Z?.("eventDidMount", { event: U, el: oe, view: t.get("view"), resource: f })), W.append(oe);
      }
      if (x.append(W), O.append(x), f.expanded && G)
        for (const U of C.children) R(U, l + 1);
    };
    for (const f of q)
      f.kind === "group" ? m(f.group) : R(f.resource, 0);
    b.append(O), i.allowPinchZoom && is(O, t, i), n.replaceChildren(b);
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
    const d = Zt(a.touches[0], a.touches[1]);
    if (Math.abs(d - o.startDist) < 14) return;
    const y = d > o.startDist ? Number(e.comfyRowHeight ?? 88) : Number(e.compactRowHeight ?? 52);
    y !== t.get("rowHeight") && (t.set("rowHeight", y), t.get("fire")?.("rowHeightChange", { height: y })), a.preventDefault();
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
    })).then((d) => {
      !d || d.proceed === !1 || (n.get("hostEl")?.calendarApi?.updateEvent(r), n.get("fire")?.("eventChangeConfirmed", {
        event: e,
        kind: o,
        scope: d.scope ?? null,
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
        const o = bs(t, e), s = vs(t, e), r = ys(t, e), i = ws(t, e), a = Ts(t, e), d = Cs(t, e);
        return () => {
          o(), s(), r(), i(), a(), d();
        };
      }
    });
  }
}, ls = 240, Kt = 8, ds = 0.18, us = 72, fs = 120, ps = 850, hs = 375, gs = 8, ms = 5;
function vs(n, t) {
  let e = null, o = null;
  const s = /* @__PURE__ */ new WeakMap(), r = (m) => m.closest?.("[data-event-id]"), i = (m, R) => {
    const f = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(m, R) : [];
    for (const l of f) {
      const C = l.closest?.("[data-date]");
      if (C && n.contains(C)) return C;
    }
    return null;
  }, a = (m, R) => {
    const f = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(m, R) : [];
    for (const l of f) {
      const C = l.closest?.(".ec-time-col");
      if (C && n.contains(C)) return C;
    }
    return null;
  }, d = (m) => {
    const R = t.get("options");
    if (!R.editable && !R.eventStartEditable || m.button !== void 0 && m.button !== 0 || m.target.closest?.(".ec-resizer")) return;
    const f = r(m.target);
    if (!f) return;
    const l = m.pointerType === "touch", C = f.getAttribute("data-event-id"), x = (t.get("filteredEvents") ?? []).find((ee) => ee.id === C);
    if (!x) return;
    const _ = f.closest("[data-date]"), G = f.closest(".ec-time-col"), W = G?.getBoundingClientRect(), X = f.getBoundingClientRect(), Z = ge(R.slotDuration) / 60 || 30, U = (R.slotHeight ?? 22) / Z, j = ge(R.snapDuration) / 60 || Z, z = ge(R.slotMinTime) / 60 || 0, ne = W ? (m.clientY - W.top) / U : null, se = x.start.getUTCHours() * 60 + x.start.getUTCMinutes(), de = x.end.getUTCHours() * 60 + x.end.getUTCMinutes() + (x.end.getTime() < x.start.getTime() ? 1440 : 0);
    if (e = {
      event: x,
      sourceChip: f,
      sourceDateStr: _?.getAttribute("data-date"),
      sourceTimeCol: G,
      // In resourceTimeGridDay each column is one staff lane and the
      // cell carries data-resource-id. Capture the source lane at
      // pointerdown so finishDrag can compare against the drop target
      // and emit oldResource/newResource on cross-lane drops — same
      // shape resource_timeline already emits.
      sourceResourceId: G?.getAttribute("data-resource-id") ?? null,
      sourceColRect: W,
      startTimeOfDayMin: ne,
      grabOffsetX: m.clientX - X.left,
      grabOffsetY: m.clientY - X.top,
      chipWidth: X.width,
      chipHeight: X.height,
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
      pxPerMin: U,
      snapMins: j,
      slotMinMin: z,
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
    }, !l && f.setPointerCapture && m.pointerId !== void 0) {
      try {
        f.setPointerCapture(m.pointerId);
      } catch {
      }
      e.captured = !0;
    }
    l && (u(), T(m, f), f.classList.contains("ec-event-editing") && document.body.classList.add("ec-dragging"));
  }, y = (m) => {
    e && (e.touch && E(m.clientX, m.clientY), S(m, m.clientX, m.clientY));
  }, v = (m) => {
    if (!e?.touch) return;
    const R = K(m);
    R && S(m, R.clientX, R.clientY);
  }, h = (m) => {
    r(m.target)?.classList.contains("ec-event-editing") && (m.cancelable && m.preventDefault(), m.stopPropagation?.(), m.stopImmediatePropagation?.());
  };
  function S(m, R, f) {
    if (!e) return;
    const l = e.touch && e.sourceChip.classList.contains("ec-event-editing");
    if (l && (m.cancelable && m.preventDefault(), m.stopPropagation?.(), m.stopImmediatePropagation?.(), document.body.classList.add("ec-dragging")), e.touch && !l) return;
    e.lastX = R, e.lastY = f;
    const C = R - e.startX, x = f - e.startY, _ = t.get("options"), G = _.eventDragMinDistance ?? 5;
    if (!e.moved && C * C + x * x < G * G) return;
    if (!e.moved) {
      if (b(), e.moved = !0, !e.touch && e.sourceChip.setPointerCapture && e.pointerId !== void 0)
        try {
          e.sourceChip.setPointerCapture(e.pointerId), e.captured = !0;
        } catch {
        }
      t.get("fire")?.("eventDragStart", {
        event: e.event,
        jsEvent: m,
        view: t.get("view")
      });
      const z = e.sourceChip.cloneNode(!0), ne = getComputedStyle(e.sourceChip);
      for (let se = 0; se < ne.length; se++) {
        const de = ne[se];
        z.style.setProperty(de, ne.getPropertyValue(de), ne.getPropertyPriority(de));
      }
      z.classList.add(_.theme.ghost ?? "ec-ghost"), z.style.position = "fixed", z.style.pointerEvents = "none", z.style.opacity = "0.85", z.style.zIndex = "1000", z.style.margin = "0", z.style.right = "auto", z.style.bottom = "auto", z.style.width = `${e.chipWidth}px`, z.style.height = `${e.chipHeight}px`, z.style.left = `${R - e.grabOffsetX}px`, z.style.top = `${f - e.grabOffsetY}px`, e.ghost = z, document.body.appendChild(z), e.sourceChip.style.opacity = "0.4", document.body.classList.add("ec-dragging"), N(e);
    }
    const W = (f - e.startY) / e.pxPerMin, X = e.originalStartMin + W, Z = Math.round(X / e.snapMins) * e.snapMins, U = (Z - e.originalStartMin) * e.pxPerMin;
    Dn(e, f, () => {
      S({
        cancelable: !1,
        preventDefault() {
        },
        stopPropagation() {
        },
        stopImmediatePropagation() {
        }
      }, e.lastX, e.lastY);
    }), e.ghost && (e.ghost.style.left = `${R - e.grabOffsetX}px`, e.ghost.style.top = `${e.startY - e.grabOffsetY + U}px`);
    let j = !1;
    if (l) {
      const z = e.daySteps;
      k(R, f), j = e.daySteps !== z;
    }
    if (F(e, Z), Z !== e.lastSnappedStartMin) {
      if (e.lastSnappedStartMin !== null && !j && typeof navigator < "u" && navigator.vibrate)
        try {
          navigator.vibrate(ms);
        } catch {
        }
      e.lastSnappedStartMin = Z;
    }
    m.cancelable && m.preventDefault();
  }
  const g = (m) => {
    if (e?.touch && m.type === "pointercancel") {
      if (e.sourceChip && typeof document < "u" && !document.contains(e.sourceChip) && !e.pointerCancelWatchdog) {
        const f = e;
        f.pointerCancelWatchdog = setTimeout(() => {
          e === f && (f.pointerCancelWatchdog = null, M(m, f.lastX, f.lastY));
        }, 150);
      }
      return;
    }
    M(m, m.clientX, m.clientY);
  }, D = (m) => {
    if (!e?.touch) return;
    e.pointerCancelWatchdog && (clearTimeout(e.pointerCancelWatchdog), e.pointerCancelWatchdog = null);
    const R = $(m);
    M(m, R?.clientX ?? e.lastX, R?.clientY ?? e.lastY);
  };
  function M(m, R, f) {
    if (!e) return;
    const l = e;
    e = null, b(), O(l), l.pointerCancelWatchdog && (clearTimeout(l.pointerCancelWatchdog), l.pointerCancelWatchdog = null);
    const C = t.get("pagerApi");
    if (C?.abortStepDuringDrag)
      try {
        C.abortStepDuringDrag();
      } catch {
      }
    if (w(), nt(l), document.body.classList.remove("ec-dragging"), l.dayOffsetBadge && l.dayOffsetBadge.remove(), q(l), H(l), l.ghost && l.ghost.remove(), l.sourceChip && (l.sourceChip.style.opacity = ""), !l.moved) return;
    const _ = i(R, f)?.getAttribute("data-date"), G = a(R, f);
    if (t.get("fire")?.("eventDragStop", {
      event: l.event,
      jsEvent: m,
      view: t.get("view")
    }), tt(t), !_) return;
    const W = t.get("options"), X = ge(W.slotDuration) / 60 || 30, Z = ge(W.snapDuration) / 60 || X, U = (W.slotHeight ?? 22) / X;
    let j, z, ne;
    if (l.sourceTimeCol && G) {
      const ie = (f - l.startY) / U, he = l.originalStartMin + ie, Ye = Math.round(he / Z) * Z - l.originalStartMin, me = (/* @__PURE__ */ new Date(l.sourceDateStr + "T00:00:00Z")).getTime();
      ne = (/* @__PURE__ */ new Date(_ + "T00:00:00Z")).getTime() - me + Ye * 6e4;
    } else {
      if (_ === l.sourceDateStr) return;
      const ie = (/* @__PURE__ */ new Date(l.sourceDateStr + "T00:00:00Z")).getTime();
      ne = (/* @__PURE__ */ new Date(_ + "T00:00:00Z")).getTime() - ie;
    }
    if (ne === 0) return;
    j = new Date(l.event.start.getTime() + ne), z = new Date(l.event.end.getTime() + ne);
    const se = 864e5;
    let de = !1;
    const ee = { ...l.event, start: l.event.start, end: l.event.end }, fe = at(l.event), ae = G?.getAttribute("data-resource-id") ?? null;
    let oe = l.event.resourceIds, ye = !1;
    if (l.sourceResourceId && ae && ae !== l.sourceResourceId) {
      const ie = (l.event.resourceIds ?? []).slice(), he = ie.indexOf(l.sourceResourceId);
      he >= 0 ? ie[he] = ae : ie.push(ae), oe = ie, ye = !0;
    }
    const le = {
      event: l.event,
      oldEvent: ee,
      newStart: j,
      newEnd: z,
      delta: { days: Math.round(ne / se), milliseconds: ne },
      jsEvent: m,
      view: t.get("view"),
      isOccurrence: fe.isSeriesMember,
      seriesId: fe.seriesId,
      revert: () => {
        de = !0;
      }
    };
    if (ye && (le.oldResource = l.sourceResourceId, le.newResource = ae, le.newResourceIds = oe), t.get("fire")?.("eventDrop", le), de) return;
    const we = {
      id: l.event.id,
      start: j.toISOString(),
      end: z.toISOString()
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
  let c = !1;
  function u() {
    c || (c = !0, document.addEventListener("touchmove", v, { passive: !1, capture: !0 }), document.addEventListener("touchend", D, { passive: !1, capture: !0 }), document.addEventListener("touchcancel", D, { passive: !1, capture: !0 }));
  }
  function w() {
    c && (c = !1, document.removeEventListener("touchmove", v, !0), document.removeEventListener("touchend", D, !0), document.removeEventListener("touchcancel", D, !0));
  }
  function T(m, R) {
    b();
    const l = t.get("options").eventLongPressDelay ?? ls;
    o = {
      chip: R,
      startX: m.clientX,
      startY: m.clientY,
      moved: !1,
      timer: setTimeout(() => {
        !o || o.chip !== R || o.moved || !e || e.sourceChip !== R || (o = null, A(R), P(R), document.body.classList.add("ec-dragging"), typeof navigator < "u" && navigator.vibrate && navigator.vibrate(15));
      }, l)
    };
  }
  function b() {
    o && (clearTimeout(o.timer), o = null);
  }
  function E(m, R) {
    if (!o) return;
    const f = m - o.startX, l = R - o.startY;
    f * f + l * l > Kt * Kt && (o.moved = !0, b());
  }
  function A(m) {
    const R = m.getAttribute("data-event-id"), f = R && typeof CSS < "u" && CSS.escape ? CSS.escape(R) : R, l = R ? Array.from(n.querySelectorAll?.(`[data-event-id="${f}"]`) ?? []) : [m], C = new Set(l);
    n.querySelectorAll?.(".ec-event.ec-event-editing").forEach((x) => {
      C.has(x) || x.classList.remove("ec-event-editing");
    }), l.forEach((x) => x.classList.add("ec-event-editing"));
  }
  function P(m) {
    s.set(m, Date.now() + 800);
  }
  function I(m) {
    const R = r(m.target);
    if (!R) return;
    const f = s.get(R) || 0;
    if (f && Date.now() <= f) {
      m.preventDefault(), m.stopImmediatePropagation?.(), m.stopPropagation?.();
      return;
    }
    f && s.delete(R);
  }
  function K(m) {
    const R = m.touches?.[0] ?? null;
    return R && E(R.clientX, R.clientY), m.touches?.[0] ?? null;
  }
  function $(m) {
    return m.changedTouches?.[0] ?? null;
  }
  function N(m) {
    if (m.timeTextHidden) return;
    m.timeTextHidden = !0;
    const R = [];
    m.sourceChip && R.push(...m.sourceChip.querySelectorAll(".ec-event-time")), m.ghost && R.push(...m.ghost.querySelectorAll(".ec-event-time"));
    for (const f of R)
      f.dataset.ecDragPriorVisibility = f.style.visibility || "", f.style.visibility = "hidden";
  }
  function q(m) {
    if (!m.timeTextHidden) return;
    m.timeTextHidden = !1;
    const R = [];
    m.sourceChip && R.push(...m.sourceChip.querySelectorAll(".ec-event-time")), m.ghost && R.push(...m.ghost.querySelectorAll(".ec-event-time"));
    for (const f of R) {
      const l = f.dataset.ecDragPriorVisibility ?? "";
      f.style.visibility = l, delete f.dataset.ecDragPriorVisibility;
    }
  }
  function F(m, R) {
    if (!m.pxPerMin) return;
    const f = n.querySelector?.('.ec-pager-page-current .ec-time-grid [data-row="body"] > .ec-sidebar') ?? n.querySelector?.('.ec-time-grid [data-row="body"] > .ec-sidebar');
    if (!f) return;
    const l = n.querySelectorAll?.("[data-ec-draft-start-label]") ?? [];
    for (const G of l) G !== m.draftStartLabel && G.remove();
    const C = (Math.round(R) % 60 + 60) % 60;
    if (C === 0) {
      m.draftStartLabel?.remove(), m.draftStartLabel = null;
      return;
    }
    let x = m.draftStartLabel;
    (!x || x.parentNode !== f) && (x?.remove(), x = document.createElement("span"), x.dataset.ecDraftStartLabel = "", x.className = "ec-draft-start-label", x.style.position = "absolute", x.style.right = "0.5rem", x.style.fontSize = "0.7rem", x.style.fontWeight = "600", x.style.color = "var(--ec-text-color, #1a1a1a)", x.style.fontVariantNumeric = "tabular-nums", x.style.lineHeight = "1", x.style.pointerEvents = "none", x.style.zIndex = "3", f.appendChild(x), m.draftStartLabel = x);
    const _ = (R - m.slotMinMin) * m.pxPerMin - 6;
    x.style.top = `${_}px`, x.textContent = `:${String(C).padStart(2, "0")}`;
  }
  function H(m) {
    m?.draftStartLabel?.remove(), m && (m.draftStartLabel = null);
    const R = n.querySelectorAll?.("[data-ec-draft-start-label]") ?? [];
    for (const f of R) f.remove();
  }
  function k(m, R) {
    if (!e || !e.touch || !e.sourceChip?.classList.contains("ec-event-editing") || e.swapping) return;
    const f = t.get("pagerApi");
    if (!f || typeof f.stepDuringDrag != "function" || (t.get("viewDates") ?? []).length !== 1) return;
    const C = f.element;
    if (!C) return;
    const x = C.getBoundingClientRect(), _ = x.width || C.offsetWidth || 0;
    if (!_) return;
    if (R < x.top || R > x.bottom) {
      O(e), e.edgeHoldFirstFired = !1;
      return;
    }
    const G = Math.max(
      us,
      Math.min(fs, _ * ds)
    ), W = m <= x.left + G, X = m >= x.right - G, Z = W ? -1 : X ? 1 : 0;
    if (Z === 0) {
      O(e), e.edgeHoldFirstFired = !1;
      return;
    }
    if (e.edgeHoldDirection === Z && e.edgeHoldTimer) return;
    e.edgeHoldDirection !== Z && (e.edgeHoldFirstFired = !1), O(e), e.edgeHoldDirection = Z;
    const J = e.edgeHoldFirstFired ? hs : ps;
    e.edgeHoldTimer = setTimeout(() => V(Z), J);
  }
  function O(m) {
    m && (m.edgeHoldTimer && (clearTimeout(m.edgeHoldTimer), m.edgeHoldTimer = null), m.edgeHoldDirection = 0);
  }
  async function V(m) {
    if (!e || e.swapping) return;
    const R = t.get("pagerApi");
    if (R?.stepDuringDrag) {
      e.swapping = !0, e.edgeHoldTimer = null;
      try {
        await R.stepDuringDrag(m);
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
    const R = m.daySteps ?? 0;
    if (R === 0) {
      m.dayOffsetBadge?.remove(), m.dayOffsetBadge = null;
      return;
    }
    let f = m.dayOffsetBadge;
    f || (f = document.createElement("div"), f.className = "ec-day-offset-badge", f.setAttribute("aria-hidden", "true"), f.style.position = "absolute", f.style.top = "6px", f.style.right = "8px", f.style.padding = "2px 6px", f.style.borderRadius = "999px", f.style.background = "rgba(15, 23, 42, 0.78)", f.style.color = "#fff", f.style.fontSize = "11px", f.style.fontWeight = "600", f.style.lineHeight = "1", f.style.letterSpacing = "0.01em", f.style.pointerEvents = "none", f.style.zIndex = "2", m.ghost.appendChild(f), m.dayOffsetBadge = f);
    const l = Math.abs(R), C = l === 1 ? "day" : "days";
    f.textContent = R > 0 ? `+${R} ${C}` : `−${l} ${C}`;
  }
  const Y = (m) => {
    m.target.closest?.("[data-event-id]") && m.preventDefault();
  }, Q = (m) => {
    m.target.closest?.("[data-event-id]") && m.preventDefault();
  };
  return n.addEventListener("pointerdown", d), n.addEventListener("touchstart", h, { passive: !1, capture: !0 }), n.addEventListener("click", I, !0), n.addEventListener("contextmenu", Y, !0), n.addEventListener("dragstart", Q, !0), document.addEventListener("pointermove", y, { passive: !1 }), document.addEventListener("pointerup", g), document.addEventListener("pointercancel", g), () => {
    n.removeEventListener("pointerdown", d), n.removeEventListener("touchstart", h, !0), n.removeEventListener("click", I, !0), n.removeEventListener("contextmenu", Y, !0), n.removeEventListener("dragstart", Q, !0), document.removeEventListener("pointermove", y), document.removeEventListener("pointerup", g), document.removeEventListener("pointercancel", g), w(), b(), e && (O(e), e.dayOffsetBadge?.remove(), q(e), H(e)), e?.ghost && e.ghost.remove(), nt(e);
  };
}
function Dn(n, t, e) {
  const o = n.scrollEl ?? n.sourceChip?.closest?.('[data-row="body"]') ?? n.chip?.closest?.('[data-row="body"]') ?? null;
  if (!o) return;
  n.scrollEl = o;
  const s = o.getBoundingClientRect(), r = 36, i = 14;
  let a = 0;
  if (t < s.top + r) {
    const y = Math.min(1, (s.top + r - t) / r);
    a = -Math.max(2, Math.round(y * i));
  } else if (t > s.bottom - r) {
    const y = Math.min(1, (t - (s.bottom - r)) / r);
    a = Math.max(2, Math.round(y * i));
  }
  if (n.autoScrollSpeed = a, !a || n.autoScrollRaf) return;
  const d = () => {
    if (!n.autoScrollSpeed || !n.scrollEl) {
      n.autoScrollRaf = null;
      return;
    }
    const y = n.scrollEl, v = y.scrollTop, h = Math.max(0, y.scrollHeight - y.clientHeight), S = Math.max(0, Math.min(h, v + n.autoScrollSpeed)), g = S - v;
    g && Math.sign(g) === Math.sign(n.autoScrollSpeed) && (y.scrollTop = S, n.startY -= g, e?.(g)), n.autoScrollRaf = requestAnimationFrame(d);
  };
  n.autoScrollRaf = requestAnimationFrame(d);
}
function nt(n) {
  n && (n.autoScrollRaf && cancelAnimationFrame(n.autoScrollRaf), n.autoScrollRaf = null, n.autoScrollSpeed = 0);
}
function ys(n, t) {
  let e = null;
  const o = (c) => {
    const u = t.get("options");
    if (!u.editable && !u.eventDurationEditable || c.button !== void 0 && c.button !== 0) return;
    const w = c.target.closest?.(".ec-resizer");
    if (!w || !n.contains(w)) return;
    const T = w.closest("[data-event-id]");
    if (!T) return;
    const b = c.pointerType === "touch";
    if (b && !T.classList.contains("ec-event-editing")) return;
    const E = T.getAttribute("data-event-id"), A = (t.get("filteredEvents") ?? []).find((q) => q.id === E);
    if (!A) return;
    const P = ge(u.slotDuration) / 60 || 30, I = ge(u.snapDuration) / 60 || P, K = (u.slotHeight ?? 22) / P, N = Array.from(n.querySelectorAll(`[data-event-id="${typeof CSS < "u" && CSS.escape ? CSS.escape(E) : E}"]`)).map((q) => {
      const F = q.closest(".ec-time-col");
      return F ? {
        el: q,
        col: F,
        originalTop: parseFloat(q.style.top || "0") || 0,
        originalHeight: parseFloat(q.style.height || "0") || q.getBoundingClientRect().height,
        originalDisplay: q.style.display || ""
      } : null;
    }).filter(Boolean);
    if (e = {
      chip: T,
      handleSide: w.getAttribute("data-resizer") === "start" ? "start" : "end",
      event: A,
      startY: c.clientY,
      originalTopPx: parseFloat(T.style.top || "0") || 0,
      originalHeightPx: parseFloat(T.style.height || "0") || T.getBoundingClientRect().height,
      pxPerMin: K,
      slotMins: P,
      snapMins: I,
      moved: !1,
      sourceCol: T.closest(".ec-time-col"),
      previewChips: [],
      segments: N,
      touch: b,
      pointerId: c.pointerId,
      lastX: c.clientX,
      lastY: c.clientY
    }, T.classList.add("ec-resizing-y"), T.classList.add("ec-resizing"), document.body.classList.add("ec-resizing-active"), w.setPointerCapture && c.pointerId !== void 0)
      try {
        w.setPointerCapture(c.pointerId);
      } catch {
      }
    b && S(), t.get("fire")?.("eventResizeStart", { event: A, jsEvent: c, view: t.get("view") }), c.cancelable && c.preventDefault(), c.stopPropagation();
  }, s = (c) => {
    e && i(c, c.clientX, c.clientY);
  }, r = (c) => {
    if (!e?.touch) return;
    const u = D(c);
    u && (c.cancelable && c.preventDefault(), c.stopPropagation?.(), c.stopImmediatePropagation?.(), i(c, u.clientX, u.clientY));
  };
  function i(c, u, w) {
    if (!e) return;
    e.lastX = u, e.lastY = w;
    const T = w - e.startY, b = Math.round(T / e.pxPerMin / e.snapMins) * e.snapMins;
    b !== 0 && (e.moved = !0);
    let E = null;
    const A = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(u, w) : [];
    for (const N of A) {
      const q = N.closest?.(".ec-time-col");
      if (q && n.contains(q)) {
        E = q;
        break;
      }
    }
    for (const N of e.previewChips) N.remove();
    e.previewChips = [];
    for (const N of e.segments)
      N.el.style.display = N.originalDisplay, N.el.style.top = `${N.originalTop}px`, N.el.style.height = `${N.originalHeight}px`;
    const P = e.sourceCol?.parentElement, I = P ? Array.from(P.children).filter((N) => N.classList?.contains("ec-time-col")) : [], K = e.sourceCol ? I.indexOf(e.sourceCol) : -1, $ = E ? I.indexOf(E) : -1;
    if (e.handleSide === "end" && $ >= 0 && K >= 0 && $ < K)
      for (const N of e.segments) {
        const q = I.indexOf(N.col);
        if (!(q < 0 || q < $))
          if (q > $)
            N.el.style.display = "none";
          else {
            const F = E.getBoundingClientRect(), H = w - F.top, k = Math.round(H / e.pxPerMin / e.snapMins) * e.snapMins * e.pxPerMin, O = N.originalTop + e.snapMins * e.pxPerMin, V = Math.max(O, k);
            N.el.style.height = `${V - N.originalTop}px`;
          }
      }
    else if (e.handleSide === "end" && E && e.sourceCol && E !== e.sourceCol) {
      const N = e.sourceCol.getBoundingClientRect().height;
      if (e.chip.style.height = `${Math.max(e.snapMins * e.pxPerMin, N - e.originalTopPx - 2)}px`, K >= 0 && $ > K) {
        for (let H = K + 1; H < $; ++H)
          e.previewChips.push(a(I[H], 0, I[H].getBoundingClientRect().height - 2, e));
        const q = E.getBoundingClientRect(), F = Math.max(
          e.snapMins * e.pxPerMin,
          Math.round((w - q.top) / e.pxPerMin / e.snapMins) * e.snapMins * e.pxPerMin
        );
        e.previewChips.push(a(E, 0, F, e));
      }
    } else if (e.handleSide === "end") {
      const N = Math.max(e.snapMins * e.pxPerMin, e.originalHeightPx + b * e.pxPerMin);
      e.chip.style.height = `${N}px`;
    } else {
      const N = Math.max(
        -e.originalTopPx,
        // can't go above col start
        Math.min(e.originalHeightPx - e.snapMins * e.pxPerMin, b * e.pxPerMin)
      );
      e.chip.style.top = `${e.originalTopPx + N}px`, e.chip.style.height = `${e.originalHeightPx - N}px`;
    }
    Dn(e, w, () => {
      i({
        cancelable: !1,
        preventDefault() {
        },
        stopPropagation() {
        },
        stopImmediatePropagation() {
        }
      }, e.lastX, e.lastY);
    }), c.cancelable && c.preventDefault();
  }
  function a(c, u, w, T) {
    const b = T.chip.cloneNode(!0);
    return b.querySelectorAll(".ec-resizer").forEach((A) => A.remove()), b.classList.add("ec-event-preview"), b.style.position = "absolute", b.style.top = `${u}px`, b.style.height = `${w}px`, b.style.left = "0", b.style.right = "0", b.style.opacity = "0.6", b.style.pointerEvents = "none", (c.querySelector(".ec-event-overlay") ?? c).appendChild(b), b;
  }
  const d = (c) => {
    e?.touch && c.type === "pointercancel" || v(c, c.clientX, c.clientY);
  }, y = (c) => {
    if (!e?.touch) return;
    const u = M(c);
    c.cancelable && c.preventDefault(), c.stopPropagation?.(), c.stopImmediatePropagation?.(), v(c, u?.clientX ?? e.lastX, u?.clientY ?? e.lastY);
  };
  function v(c, u, w) {
    if (!e) return;
    const T = e;
    e = null, g(), nt(T), T.chip.classList.remove("ec-resizing-y"), T.chip.classList.remove("ec-resizing"), document.body.classList.remove("ec-resizing-active");
    for (const L of T.previewChips) L.remove();
    if (T.previewChips = [], !T.moved) {
      for (const L of T.segments)
        L.el.style.display = L.originalDisplay, L.el.style.top = `${L.originalTop}px`, L.el.style.height = `${L.originalHeight}px`;
      t.get("fire")?.("eventResizeStop", { event: T.event, jsEvent: c, view: t.get("view") }), tt(t);
      return;
    }
    const b = w - T.startY, A = Math.round(b / T.pxPerMin / T.snapMins) * T.snapMins * 6e4;
    let P = new Date(T.event.start.getTime()), I = new Date(T.event.end.getTime());
    const K = (() => {
      const L = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(u, w) : [];
      for (const Y of L) {
        const Q = Y.closest?.(".ec-time-col");
        if (Q && n.contains(Q)) return Q;
      }
      return null;
    })(), $ = T.chip.closest(".ec-time-col"), N = K?.getAttribute("data-date"), q = $?.getAttribute("data-date");
    if (K && $ && N !== q) {
      const L = t.get("options"), Y = ge(L.slotMinTime) / 60 || 0, Q = K.getBoundingClientRect(), m = w - Q.top, f = Math.max(0, Math.round(m / T.pxPerMin / T.snapMins) * T.snapMins) + Y;
      T.handleSide === "end" ? (I = /* @__PURE__ */ new Date(N + "T00:00:00Z"), I.setUTCMinutes(I.getUTCMinutes() + f), I <= P && (I = new Date(P.getTime() + T.snapMins * 6e4))) : (P = /* @__PURE__ */ new Date(N + "T00:00:00Z"), P.setUTCMinutes(P.getUTCMinutes() + f), P >= I && (P = new Date(I.getTime() - T.snapMins * 6e4)));
    } else T.handleSide === "end" ? (I = new Date(I.getTime() + A), I <= P && (I = new Date(P.getTime() + T.snapMins * 6e4))) : (P = new Date(P.getTime() + A), P >= I && (P = new Date(I.getTime() - T.snapMins * 6e4)));
    let F = !1;
    t.get("fire")?.("eventResizeStop", { event: T.event, jsEvent: c, view: t.get("view") }), tt(t);
    const H = { ...T.event, start: T.event.start, end: T.event.end }, k = at(T.event), O = T.handleSide === "end" ? { milliseconds: A, days: 0 } : { milliseconds: 0, days: 0 }, V = T.handleSide === "start" ? { milliseconds: A, days: 0 } : { milliseconds: 0, days: 0 };
    if (t.get("fire")?.("eventResize", {
      event: T.event,
      oldEvent: H,
      newStart: P,
      newEnd: I,
      jsEvent: c,
      view: t.get("view"),
      endDelta: O,
      startDelta: V,
      isOccurrence: k.isSeriesMember,
      seriesId: k.seriesId,
      revert: () => {
        F = !0;
      }
    }), F) {
      for (const L of T.segments)
        L.el.style.display = L.originalDisplay, L.el.style.top = `${L.originalTop}px`, L.el.style.height = `${L.originalHeight}px`;
      return;
    }
    xt({
      state: t,
      options: t.get("options"),
      event: T.event,
      kind: "resize",
      detailExtras: { oldEvent: H, startDelta: V, endDelta: O },
      updateAttrs: {
        id: T.event.id,
        start: P.toISOString(),
        end: I.toISOString()
      }
    });
  }
  let h = !1;
  function S() {
    h || (h = !0, document.addEventListener("touchmove", r, { passive: !1, capture: !0 }), document.addEventListener("touchend", y, { passive: !1, capture: !0 }), document.addEventListener("touchcancel", y, { passive: !1, capture: !0 }));
  }
  function g() {
    h && (h = !1, document.removeEventListener("touchmove", r, !0), document.removeEventListener("touchend", y, !0), document.removeEventListener("touchcancel", y, !0));
  }
  function D(c) {
    return c.touches?.[0] ?? null;
  }
  function M(c) {
    return c.changedTouches?.[0] ?? null;
  }
  return n.addEventListener("pointerdown", o), document.addEventListener("pointermove", s, { passive: !1 }), document.addEventListener("pointerup", d), document.addEventListener("pointercancel", d), () => {
    n.removeEventListener("pointerdown", o), document.removeEventListener("pointermove", s), document.removeEventListener("pointerup", d), document.removeEventListener("pointercancel", d), g(), nt(e);
  };
}
function ge(n) {
  return n ? (n.days ?? 0) * 86400 + (n.seconds ?? 0) : 0;
}
function ws(n, t) {
  let e = null, o = [];
  function s(c) {
    return c.parentElement;
  }
  function r(c) {
    const u = s(c);
    return u ? Array.from(u.children).filter((w) => w.classList?.contains("ec-time-col")) : [c];
  }
  function i(c, u) {
    const w = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(c, u) : [];
    for (const T of w) {
      const b = T.closest?.(".ec-time-col");
      if (b && n.contains(b)) return b;
    }
    return null;
  }
  function a(c) {
    const u = t.get("options"), w = u.theme, T = document.createElement("div");
    return T.className = `${w.event ?? "ec-event"} ec-event-preview`, T.style.position = "absolute", T.style.left = "0", T.style.right = "0", T.style.opacity = "0.7", T.style.pointerEvents = "none", T.style.background = u.eventBackgroundColor ?? "#2563eb", T.style.color = "#ffffff", T.style.borderRadius = "3px", T.style.padding = "2px 0.375rem", T.style.fontSize = "0.72rem", T.style.overflow = "hidden", (c.querySelector(".ec-event-overlay") ?? c).appendChild(T), T;
  }
  function d(c) {
    const u = t.get("options");
    if (!u.editable || c.button !== void 0 && c.button !== 0 || c.pointerType === "touch" || c.target.closest?.("[data-event-id], .ec-resizer, .ec-button, button, input, select, textarea, a, [data-more-link], [data-popover-action]")) return;
    const w = c.target.closest?.(".ec-time-col");
    if (!w || !n.contains(w)) return;
    const T = w.getAttribute("data-date");
    if (!T) return;
    const b = ge(u.slotDuration) / 60 || 30, E = ge(u.snapDuration) / 60 || b, A = (u.slotHeight ?? 22) / b, P = ge(u.slotMinTime) / 60 || 0, I = w.getBoundingClientRect(), K = c.clientY - I.top, $ = Math.max(0, Math.round(K / A / E) * E);
    e = {
      sourceCol: w,
      sourceDateStr: T,
      sourceMinFromTop: $,
      slotMins: b,
      snapMins: E,
      pxPerMin: A,
      slotMinMin: P,
      previewChips: [],
      moved: !1
    }, c.cancelable && c.preventDefault(), document.addEventListener("pointermove", S, { passive: !1 }), document.addEventListener("pointerup", g), document.addEventListener("pointercancel", g);
  }
  function y(c, u) {
    const w = i(c.clientX, c.clientY) ?? u.sourceCol, T = w.getBoundingClientRect(), b = c.clientY - T.top, E = Math.max(0, Math.round(b / u.pxPerMin / u.snapMins) * u.snapMins);
    return { col: w, mins: E };
  }
  function v(c) {
    for (const u of c.previewChips) u.remove();
    c.previewChips = [];
  }
  function h(c, u) {
    v(c);
    const w = r(c.sourceCol), T = w.indexOf(c.sourceCol), b = w.indexOf(u.col);
    if (T < 0 || b < 0) return;
    const E = b >= T, A = Math.min(T, b), P = Math.max(T, b);
    for (let I = A; I <= P; ++I) {
      const K = w[I], $ = K.getBoundingClientRect().height;
      let N, q;
      T === b ? (N = Math.min(c.sourceMinFromTop, u.mins), q = Math.max(c.sourceMinFromTop, u.mins), q = Math.max(q, N + c.snapMins)) : E ? I === T ? (N = c.sourceMinFromTop, q = $ / c.pxPerMin) : I === b ? (N = 0, q = Math.max(c.snapMins, u.mins)) : (N = 0, q = $ / c.pxPerMin) : I === T ? (N = 0, q = Math.max(c.snapMins, c.sourceMinFromTop)) : I === b ? (N = u.mins, q = $ / c.pxPerMin) : (N = 0, q = $ / c.pxPerMin);
      const F = Math.max(c.snapMins, q - N), H = a(K);
      if (H.style.top = `${N * c.pxPerMin}px`, H.style.height = `${F * c.pxPerMin}px`, I === A) {
        const k = E ? c.sourceMinFromTop : u.mins, O = E ? u.mins : c.sourceMinFromTop;
        H.textContent = `${Jt(k + c.slotMinMin)} – ${Jt((O || 1440) + c.slotMinMin)}`;
      }
      c.previewChips.push(H);
    }
  }
  function S(c) {
    if (!e) return;
    c.clientY - (e.previewChips[0], c.clientY);
    const u = Math.abs(c.clientY - (e.sourceCol.getBoundingClientRect().top + e.sourceMinFromTop * e.pxPerMin));
    !e.moved && u < 4 && e.previewChips.length, e.moved = !0;
    const w = y(c, e);
    h(e, w), c.cancelable && c.preventDefault();
  }
  function g(c) {
    if (!e) return;
    const u = e;
    if (e = null, document.removeEventListener("pointermove", S), document.removeEventListener("pointerup", g), document.removeEventListener("pointercancel", g), !u.moved) {
      v(u);
      return;
    }
    const w = y(c, u), T = w.col === u.sourceCol, b = w.col.getAttribute("data-date"), E = /* @__PURE__ */ new Date(u.sourceDateStr + "T00:00:00Z");
    E.setUTCMinutes(E.getUTCMinutes() + u.sourceMinFromTop + u.slotMinMin);
    const A = /* @__PURE__ */ new Date(b + "T00:00:00Z");
    A.setUTCMinutes(A.getUTCMinutes() + w.mins + u.slotMinMin);
    let P = E, I = A;
    if (T) {
      const $ = Math.min(u.sourceMinFromTop, w.mins), N = Math.max(u.sourceMinFromTop, w.mins);
      P = /* @__PURE__ */ new Date(u.sourceDateStr + "T00:00:00Z"), P.setUTCMinutes(P.getUTCMinutes() + $ + u.slotMinMin), I = /* @__PURE__ */ new Date(u.sourceDateStr + "T00:00:00Z"), I.setUTCMinutes(I.getUTCMinutes() + Math.max(N, $ + u.snapMins) + u.slotMinMin);
    } else P > I && ([P, I] = [I, P]);
    const K = u.sourceCol.closest?.("[data-resource-id]")?.getAttribute("data-resource-id");
    for (const $ of o) $.remove();
    o = u.previewChips;
    for (const $ of o) $.classList.add("ec-event-preview-committed");
    t.set("selection", { start: P, end: I, resource: K ?? null }), t.get("fire")?.("select", {
      start: P,
      end: I,
      allDay: !1,
      resource: K ?? null,
      jsEvent: c,
      view: t.get("view")
    });
  }
  const D = () => {
    for (const c of o) c.remove();
    o = [];
  }, M = t.on?.("change:selection", () => {
    t.get("selection") || D();
  });
  return n.addEventListener("pointerdown", d), () => {
    n.removeEventListener("pointerdown", d), document.removeEventListener("pointermove", S), document.removeEventListener("pointerup", g), document.removeEventListener("pointercancel", g), M?.(), D();
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
      const S = n.querySelector('.ec-time-grid [data-row="body"]');
      if (S && e.scrollTop != null && Math.abs(S.scrollTop - e.scrollTop) > 4 || n.querySelector(".ec-pager.ec-pager-dragging"))
        return;
    }
    const a = i.getAttribute("data-date"), d = t.get("fire"), y = r.target.closest(".ec-time-col");
    let v, h;
    if (y) {
      const S = t.get("options"), g = ge(S.slotDuration) / 60 || 30, D = ge(S.snapDuration) / 60 || g, c = (S.slotHeight ?? 22) / g, u = y.getBoundingClientRect(), w = r.clientY - u.top, T = ge(S.slotMinTime) / 60 || 0, b = Math.max(0, Math.round(w / c / D) * D) + T;
      v = /* @__PURE__ */ new Date(a + "T00:00:00Z"), v.setUTCMinutes(v.getUTCMinutes() + b), h = !1;
    } else
      v = /* @__PURE__ */ new Date(a + "T00:00:00Z"), h = !0;
    d?.("dateClick", {
      date: v,
      dateStr: v.toISOString().substring(0, h ? 10 : 16),
      allDay: h,
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
    const h = v.closest?.("[data-event-id]");
    return !h || !h.closest(".ec-timeline-ribbon") ? null : h;
  }, s = (v, h) => {
    const S = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(v, h) : [];
    for (const g of S) {
      const D = g.closest?.(".ec-timeline-ribbon");
      if (D && n.contains(D)) return D;
    }
    return null;
  }, r = (v) => v?.closest?.(".ec-timeline-row"), i = (v) => r(v)?.getAttribute("data-resource-id") ?? null, a = (v) => {
    const h = t.get("options");
    if (v.button !== void 0 && v.button !== 0) return;
    const S = o(v.target);
    if (!S) return;
    const g = S.closest(".ec-timeline-ribbon"), D = g.getBoundingClientRect(), M = g.querySelectorAll(":scope > .ec-timeline-cells > .ec-timeline-cell"), c = M.length ? D.width / M.length : h.slotWidth ?? 32, u = (t.get("filteredEvents") ?? []).find((b) => b.id === S.getAttribute("data-event-id"));
    if (!u) return;
    const w = v.target.closest?.(".ec-resizer"), T = !!w && w.getAttribute("data-resize-axis") === "x";
    if (!(T && !(h.editable && h.eventDurationEditable !== !1)) && !(!T && !(h.editable || h.eventStartEditable))) {
      if (e = {
        kind: T ? "resize" : "move",
        side: T ? w.getAttribute("data-resizer") === "start" ? "start" : "end" : null,
        chip: S,
        event: u,
        ribbon: g,
        ribbonRect: D,
        dayWidth: c,
        sourceResourceId: i(g),
        lastResourceId: i(g),
        originalLeft: parseFloat(S.style.left || "0") || 0,
        originalWidth: parseFloat(S.style.width || "0") || S.getBoundingClientRect().width,
        startX: v.clientX,
        startY: v.clientY,
        lastX: v.clientX,
        lastY: v.clientY,
        moved: !1,
        lastDayDelta: 0,
        pointerId: v.pointerId
      }, w && w.setPointerCapture && v.pointerId !== void 0)
        try {
          w.setPointerCapture(v.pointerId);
        } catch {
        }
      else if (S.setPointerCapture && v.pointerId !== void 0)
        try {
          S.setPointerCapture(v.pointerId);
        } catch {
        }
      v.cancelable && v.preventDefault(), v.stopPropagation?.();
    }
  }, d = (v) => {
    if (!e) return;
    e.lastX = v.clientX, e.lastY = v.clientY;
    const h = v.clientX - e.startX, S = v.clientY - e.startY, D = t.get("options").eventDragMinDistance ?? 5;
    if (!e.moved && h * h + S * S < D * D) return;
    e.moved || (e.moved = !0, e.chip.classList.add(e.kind === "resize" ? "ec-resizing-x" : "ec-dragging"), e.chip.style.zIndex = "50", t.get("fire")?.(e.kind === "resize" ? "eventResizeStart" : "eventDragStart", {
      event: e.event,
      jsEvent: v,
      view: t.get("view")
    }));
    const M = Math.round(h / e.dayWidth);
    if (e.lastDayDelta = M, e.kind === "move")
      e.chip.style.left = `${e.originalLeft + M * e.dayWidth}px`;
    else if (e.side === "end") {
      const c = e.dayWidth;
      e.chip.style.width = `${Math.max(c, e.originalWidth + M * e.dayWidth)}px`;
    } else {
      const c = Math.max(
        -e.originalLeft,
        Math.min(e.originalWidth - e.dayWidth, M * e.dayWidth)
      );
      e.chip.style.left = `${e.originalLeft + c}px`, e.chip.style.width = `${e.originalWidth - c}px`;
    }
    if (e.kind === "move") {
      const c = s(v.clientX, v.clientY), u = c ? i(c) : null;
      e.lastResourceId = u ?? e.sourceResourceId, n.querySelectorAll('.ec-timeline-row[data-row-drop="true"]').forEach((w) => w.removeAttribute("data-row-drop")), c && u !== e.sourceResourceId && r(c)?.setAttribute("data-row-drop", "true");
    }
    v.cancelable && v.preventDefault();
  }, y = (v) => {
    if (!e) return;
    const h = e;
    if (e = null, n.querySelectorAll('.ec-timeline-row[data-row-drop="true"]').forEach((P) => P.removeAttribute("data-row-drop")), h.chip.classList.remove("ec-resizing-x"), h.chip.classList.remove("ec-dragging"), h.chip.style.zIndex = "", !h.moved) return;
    t.get("fire")?.(h.kind === "resize" ? "eventResizeStop" : "eventDragStop", {
      event: h.event,
      jsEvent: v,
      view: t.get("view")
    }), tt(t);
    const S = 864e5;
    let g = new Date(h.event.start.getTime()), D = new Date(h.event.end.getTime()), M = h.event.resourceIds, c = !1;
    if (h.kind === "move") {
      if (g = new Date(g.getTime() + h.lastDayDelta * S), D = new Date(D.getTime() + h.lastDayDelta * S), h.lastResourceId && h.lastResourceId !== h.sourceResourceId) {
        const P = (h.event.resourceIds ?? []).slice(), I = P.indexOf(h.sourceResourceId);
        I >= 0 ? P[I] = h.lastResourceId : P.push(h.lastResourceId), M = P, c = !0;
      }
    } else h.side === "end" ? (D = new Date(D.getTime() + h.lastDayDelta * S), D.getTime() <= g.getTime() && (D = new Date(g.getTime() + S))) : (g = new Date(g.getTime() + h.lastDayDelta * S), g.getTime() >= D.getTime() && (g = new Date(D.getTime() - S)));
    let u = !1;
    const w = { ...h.event, start: h.event.start, end: h.event.end }, T = h.kind === "resize" ? "eventResize" : "eventDrop", b = at(h.event), E = {
      event: h.event,
      oldEvent: w,
      newStart: g,
      newEnd: D,
      jsEvent: v,
      view: t.get("view"),
      isOccurrence: b.isSeriesMember,
      seriesId: b.seriesId,
      revert: () => {
        u = !0;
      }
    };
    if (h.kind === "move")
      E.delta = { days: h.lastDayDelta, milliseconds: h.lastDayDelta * S }, c && (E.oldResource = h.sourceResourceId, E.newResource = h.lastResourceId, E.newResourceIds = M);
    else {
      const P = h.lastDayDelta * S;
      E.endDelta = h.side === "end" ? { milliseconds: P, days: h.lastDayDelta } : { milliseconds: 0, days: 0 }, E.startDelta = h.side === "start" ? { milliseconds: P, days: h.lastDayDelta } : { milliseconds: 0, days: 0 };
    }
    if (t.get("fire")?.(T, E), u) return;
    const A = {
      id: h.event.id,
      start: g.toISOString(),
      end: D.toISOString()
    };
    c && (A.resourceIds = M), xt({
      state: t,
      options: t.get("options"),
      event: h.event,
      kind: h.kind === "resize" ? "resize" : "drop",
      detailExtras: {
        oldEvent: w,
        delta: E.delta,
        startDelta: E.startDelta,
        endDelta: E.endDelta
      },
      updateAttrs: A
    });
  };
  return n.addEventListener("pointerdown", a), document.addEventListener("pointermove", d, { passive: !1 }), document.addEventListener("pointerup", y), document.addEventListener("pointercancel", y), () => {
    n.removeEventListener("pointerdown", a), document.removeEventListener("pointermove", d), document.removeEventListener("pointerup", y), document.removeEventListener("pointercancel", y);
  };
}
function Cs(n, t) {
  let e = null, o = null, s = [];
  const r = (g, D) => {
    const M = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(g, D) : [];
    for (const c of M) {
      if (c.closest?.("[data-event-id], .ec-resizer, .ec-button, button, [data-more-link], [data-popover-action]") || c.closest?.(".ec-time-col")) return null;
      const u = c.closest?.("[data-date]");
      if (u && n.contains(u)) return u;
    }
    return null;
  }, i = () => {
    for (const g of s) g.classList.remove("ec-select-highlight");
    s = [];
  }, a = (g, D) => {
    if (i(), !g || !D) return;
    const M = Array.from(n.querySelectorAll("[data-date]")).filter((b) => !b.classList.contains("ec-time-col")), c = M.indexOf(g), u = M.indexOf(D);
    if (c < 0 || u < 0) return;
    const w = Math.min(c, u), T = Math.max(c, u);
    for (let b = w; b <= T; ++b)
      M[b].classList.add("ec-select-highlight"), s.push(M[b]);
  }, d = (g) => {
    const M = t.get("options").selectConstraint;
    if (!M) return !0;
    const c = M.start ? new Date(M.start).getTime() : -1 / 0, u = M.end ? new Date(M.end).getTime() : 1 / 0, w = g instanceof Date ? g.getTime() : new Date(g).getTime();
    return w >= c && w < u;
  }, y = (g, D) => {
    e = {
      sourceCell: D,
      sourceDate: D.getAttribute("data-date"),
      startX: g.clientX,
      startY: g.clientY,
      pointerId: g.pointerId,
      moved: !1,
      lastCell: D
    }, a(D, D);
  }, v = (g) => {
    const D = t.get("options");
    if (!D.selectable || g.button !== void 0 && g.button !== 0) return;
    const M = r(g.clientX, g.clientY);
    if (M) {
      if (g.pointerType === "touch") {
        const c = D.selectLongPressDelay ?? D.longPressDelay ?? 1e3;
        o = { cell: M, jsEvent: g, timer: setTimeout(() => {
          o && (y(o.jsEvent, o.cell), o = null);
        }, c) };
        return;
      }
      y(g, M), g.cancelable && g.preventDefault();
    }
  }, h = (g) => {
    if (o && (clearTimeout(o.timer), o = null), !e) return;
    const D = g.clientX - e.startX, M = g.clientY - e.startY, c = t.get("options").selectMinDistance ?? 5;
    if (!e.moved && D * D + M * M < c * c) return;
    e.moved = !0;
    const u = r(g.clientX, g.clientY);
    u && (e.lastCell = u, a(e.sourceCell, u), g.cancelable && g.preventDefault());
  }, S = (g) => {
    if (o && (clearTimeout(o.timer), o = null), !e) return;
    const D = e;
    if (e = null, !D.moved) {
      i();
      return;
    }
    const M = D.lastCell, c = D.sourceDate, u = M.getAttribute("data-date");
    let w = c <= u ? c : u, T = c <= u ? u : c;
    const b = /* @__PURE__ */ new Date(w + "T00:00:00Z"), E = /* @__PURE__ */ new Date(T + "T00:00:00Z"), A = new Date(E.getTime() + 864e5);
    if (!d(b) || !d(A)) {
      i();
      return;
    }
    const P = D.sourceCell.closest?.("[data-resource-id]")?.getAttribute("data-resource-id"), I = {
      start: b,
      end: A,
      allDay: !0,
      resource: P ?? null,
      jsEvent: g,
      view: t.get("view")
    };
    t.set("selection", { start: b, end: A, resource: P ?? null }), t.get("fire")?.("select", I), t.get("options").unselectAuto;
  };
  return n.addEventListener("pointerdown", v), document.addEventListener("pointermove", h, { passive: !1 }), document.addEventListener("pointerup", S), document.addEventListener("pointercancel", S), () => {
    n.removeEventListener("pointerdown", v), document.removeEventListener("pointermove", h), document.removeEventListener("pointerup", S), document.removeEventListener("pointercancel", S), o && clearTimeout(o.timer), i();
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
    const a = r.replace(/-([a-z])/g, (d, y) => y.toUpperCase());
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
  const a = p("div", "ec-conflict-backdrop", "", [
    ["role", "presentation"]
  ]), d = p("div", "ec-conflict-modal", "", [
    ["role", "dialog"],
    ["aria-modal", "true"],
    ["aria-labelledby", "ec-conflict-title"]
  ]), y = p(
    "h2",
    "ec-conflict-title",
    r?.conflictTitle ?? "Edit conflict",
    [["id", "ec-conflict-title"]]
  ), v = p(
    "p",
    "ec-conflict-message",
    r?.conflictMessage ?? "This event was changed by someone else while you were editing it. Pick which version to keep."
  ), h = p("div", "ec-conflict-values");
  h.append(
    Qt("theirs", r?.conflictTheirs ?? "Theirs (server)", e),
    Qt("mine", r?.conflictMine ?? "Yours", o)
  );
  const S = p("div", "ec-conflict-actions"), g = p(
    "button",
    "ec-conflict-action ec-conflict-action-theirs",
    r?.conflictUseTheirs ?? "Use theirs",
    [["type", "button"]]
  ), D = p(
    "button",
    "ec-conflict-action ec-conflict-action-mine",
    r?.conflictKeepMine ?? "Keep mine",
    [["type", "button"]]
  );
  S.append(g, D), d.append(y, v, h, S), a.append(d), n.append(a);
  let M = !1;
  function c(w) {
    M || (M = !0, document.removeEventListener("keydown", u), a.remove(), i?.({ resolution: w, eventId: t, serverValue: e, clientValue: o }));
  }
  g.addEventListener("click", () => c("theirs")), D.addEventListener("click", () => c("mine")), a.addEventListener("click", (w) => {
    w.target === a && c("dismissed");
  });
  const u = (w) => {
    w.key === "Escape" && c("dismissed");
  };
  return document.addEventListener("keydown", u), queueMicrotask(() => g.focus?.()), { close: () => c("dismissed"), root: a };
}
function Qt(n, t, e) {
  const o = p("div", `ec-conflict-value ec-conflict-value-${n}`);
  o.append(p("h3", "ec-conflict-value-label", t));
  const s = p("pre", "ec-conflict-value-body");
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
      const y = this._state.get("options")?.[i];
      typeof y == "function" && y(a), this.dispatch(i, { detail: a });
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
      const e = t.get("options");
      if (!e) return;
      const o = hn(e.date, e.duration, e.firstDay);
      t.set("currentRange", o);
      const s = gn(o, t.get("extensions")?.activeRange);
      t.set("activeRange", s), t.set("viewDates", ke(s, e.hiddenDays ?? [])), t.set("offset", ho(e.timeZone ?? "local", e.date));
      const r = pn(e.locale, e.titleFormat);
      t.set("intlTitle", r), t.set("viewTitle", mn(r, o)), t.set("view", yn(e.view, t.get("viewTitle"), o, s));
      const i = t.get("events") ?? e.events ?? [], a = Array.isArray(i) ? i : [], d = t.get("resources") ?? e.resources ?? [], y = Array.isArray(d) ? d : [];
      t.set("filteredEvents", vn(
        a,
        t.get("view"),
        {
          eventFilter: e.eventFilter,
          eventOrder: e.eventOrder,
          filterEventsWithResources: e.filterEventsWithResources,
          resources: y
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
      onResolve: ({ resolution: i, serverValue: a, clientValue: d }) => {
        this._activeConflictModal = null;
        const y = i === "mine" ? d : a;
        y && i !== "dismissed" && this._applyEventChange("update", { id: s, ...y }), this.dispatch("conflictResolved", {
          detail: { resolution: i, eventId: s, serverValue: a, clientValue: d }
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
    const a = s.map((d) => {
      if (String(d.extendedProps?.series?.id ?? "") !== r || this._eventStartDateStr(d) !== e) return d;
      i = !0;
      const y = { ...d, ...o, id: d.id, extendedProps: { ...d.extendedProps ?? {}, ...o.extendedProps ?? {} } }, v = Ae([y], this._state.get("offset"))[0];
      return { ...d, ...v };
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
    t === "add" ? (i = [...o.filter((d) => d.id !== r), s], a = !0) : t === "update" ? o.findIndex((y) => y.id === r) === -1 ? (i = [...o, s], a = !0) : i = o.map((y) => y.id === r ? { ...y, ...s } : y) : t === "remove" && (i = o.filter((d) => d.id !== r)), a && this._markEventAppearing(r), t === "remove" && this._unmarkEventAppearing(r), i && (this._state.set("events", i), this._recompute());
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
      ro(() => this._refetchEvents(), () => this._loadedEventRange),
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
    s.className = t.theme.main, s.dataset.calendarSlot = "view", e.append(o, s), this.element.replaceChildren(e), this._root = e, this._toolbarEl = o, this.element.dataset.calendarMounted = "true", this._state.set("rootEl", e);
    const r = {
      prev: () => this._navigate(-1),
      next: () => this._navigate(1),
      today: () => this.setOption("date", /* @__PURE__ */ new Date()),
      gotoView: (a) => this.setOption("view", a),
      fireCustomButton: (a) => {
        const d = this._state.get("options").customButtons?.[a];
        typeof d?.click == "function" && d.click();
      }
    };
    ft(this._toolbarEl, this._state, r), this._teardowns.push(
      this._state.on("change:viewTitle", () => ft(this._toolbarEl, this._state, r))
    ), this._mainEl = s, this._mountView(), this._teardowns.push(
      this._state.on("change:options", () => this._mountView())
    );
    const i = this._state.get("auxComponents") ?? [];
    for (const a of i) {
      const d = a.mount?.(this._root, this._state);
      typeof d == "function" && this._teardowns.push(d);
    }
  }
  // Apply options.height according to the ACTIVE VIEW. Two strategies:
  //
  //   Day-grid views (the month overview) GROW to fit their content — the
  //   configured height becomes a min-height floor and the calendar
  //   expands past it on a tall month, so no week row is ever clipped; the
  //   page scrolls if the month is taller than the viewport. This is the
  //   Calendar.app / Google Calendar month behaviour (the whole month is
  //   visible, the page scrolls).
  //
  //   Time-axis views (time-grid week/day, resource time-grid, list,
  //   resource timeline) keep the FIXED height and scroll INTERNALLY so the
  //   24-hour body never pushes the page down — Calendar.app / Google
  //   Calendar week/day behaviour (the time grid scrolls inside a fixed
  //   frame).
  //
  // data-calendar-has-height drives the flex-fill + internal-scroll CSS and
  // is only set in fixed mode. Hosts that don't configure options.height
  // keep the legacy auto-sized layout regardless of view.
  _applyHeightMode() {
    const t = this._root;
    if (!t) return;
    const e = this._state.get("options"), o = e?.height;
    if (!o) {
      delete t.dataset.calendarHasHeight, t.style.height = "", t.style.minHeight = "";
      return;
    }
    const s = typeof o == "number" ? `${o}px` : o;
    String(e.view || "").startsWith("dayGrid") ? (t.style.height = "auto", t.style.minHeight = s, delete t.dataset.calendarHasHeight) : (t.style.height = s, t.style.minHeight = "", t.dataset.calendarHasHeight = "");
  }
  _mountView() {
    this._viewTeardown && this._viewTeardown(), this._applyHeightMode();
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
    const e = this._state.get("options"), o = B(e.date), s = e.dateIncrement ?? e.duration;
    t > 0 ? Te(o, s) : sn(o, s), this.setOption("date", o);
  }
  // Pull fresh event data from options.eventSources (function or URL) +
  // any legacy options.events function and replace state.events. Called
  // by the public refetchEvents() and on dates-set when lazyFetching is
  // on. URL sources are fetched against the active range as
  // ?start=&end= ISO strings.
  async _refetchEvents() {
    const t = this._state.get("options");
    if (!t) return [];
    const e = [], o = Array.isArray(t.eventSources) && t.eventSources.length > 0;
    t.events !== void 0 && !o && e.push(t.events), o && e.push(...t.eventSources);
    const s = this._state.get("activeRange"), r = this._eventFetchRange(s), i = r ? {
      start: Ie(r.start, 10),
      end: Ie(r.end, 10)
    } : {}, a = [];
    for (const d of e) {
      const y = await this._resolveSource(d, i);
      if (!this._state?.get("options")) return a;
      Array.isArray(y) && a.push(...y);
    }
    if (a.length || e.length) {
      const d = Ae(a, this._state.get("offset"));
      this._state.set("events", d), r && (this._loadedEventRange = { start: r.start.getTime(), end: r.end.getTime() }), this._recompute(), this.dispatch("eventSourceSuccess", { detail: { events: d } });
    }
    return a;
  }
  // Buffered date window to fetch events for, given the active range. Snaps
  // out to the month boundaries the range touches and pads a week on each
  // side, so ONE fetch covers every view anchored in this window — the
  // month grid, the weeks/days inside it, the agenda week, the resource day
  // — plus a prev/next step. View switches and short navigation then reuse
  // the cached events instead of refetching (see loadEventsEffect). Returns
  // null when there's no active range yet (the initial tick before the
  // first recompute).
  _eventFetchRange(t) {
    if (!t?.start || !t?.end) return null;
    const e = te(B(t.start));
    e.setUTCDate(1), re(e, -7);
    const o = te(B(t.end));
    return o.setUTCDate(1), o.setUTCMonth(o.getUTCMonth() + 1), re(o, 7), { start: e, end: o };
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
        const i = r.getAttribute("data-date"), a = ue(i), d = s.closest?.(".ec-time-col");
        if (d) {
          const y = d.getBoundingClientRect(), v = this._state.get("options"), h = (v.slotDuration?.seconds ?? 1800) / 60 || 30, S = (v.slotHeight ?? 22) / h, g = Math.max(0, Math.round((e - y.top) / S));
          a.setUTCMinutes(a.getUTCMinutes() + g);
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
    t === "date" && (typeof e == "string" || e instanceof Date) && (e = te(ue(e))), t === "duration" && (typeof e == "string" || typeof e == "number" || nn(e)) && (e = ce(e)), t === "dateIncrement" && e !== void 0 && !_e(e) && (e = ce(e));
    const o = this._state.get("options").view;
    if (t === "view" && e !== o) {
      if (this._viewTeardown && (this._viewTeardown(), this._viewTeardown = null), o) {
        const a = this._state.get("options").date;
        a instanceof Date && (this._viewDates[o] = te(ue(a)));
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
      s && (this._viewDates[s] = te(ue(e)));
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
