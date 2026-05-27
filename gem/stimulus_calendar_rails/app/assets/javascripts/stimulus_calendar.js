var Mn = Object.defineProperty;
var xn = (n, t, e) => t in n ? Mn(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var _t = (n, t, e) => xn(n, typeof t != "symbol" ? t + "" : t, e);
import { Controller as _n, Application as jt } from "@hotwired/stimulus";
function Pe(...n) {
  return Object.assign(...n);
}
function Ne(n) {
  return Object.keys(n);
}
function Et(n, t) {
  return Object.hasOwn(n, t);
}
function En(n) {
  return Math.floor(n);
}
function Lt(...n) {
  return Math.min(...n);
}
function at(...n) {
  return Math.max(...n);
}
function Ln() {
  return Symbol("ec");
}
function Je(n = /* @__PURE__ */ new Date()) {
  return -n.getTimezoneOffset();
}
function ot(n) {
  return Array.isArray(n);
}
function _e(n) {
  return typeof n == "function";
}
function en(n) {
  if (typeof n != "object" || n === null) return !1;
  const t = Object.getPrototypeOf(n);
  return t === null || t === Object.prototype;
}
function tn(n) {
  return n instanceof Date;
}
const vt = 86400;
function de(n = /* @__PURE__ */ new Date(), t = void 0) {
  return tn(n) ? Pn(n, t) : In(n, t);
}
function $(n) {
  const t = new Date(n.getTime());
  return We(t, Qe(n)), t;
}
function ve(n, t, e = 1) {
  n.setUTCFullYear(n.getUTCFullYear() + e * t.years);
  let o = n.getUTCMonth() + e * t.months;
  for (n.setUTCMonth(o), o %= 12, o < 0 && (o += 12); n.getUTCMonth() !== o; ) on(n);
  return n.setUTCDate(n.getUTCDate() + e * t.days), n.setUTCSeconds(n.getUTCSeconds() + e * t.seconds), n;
}
function nn(n, t, e = 1) {
  return ve(n, t, -e);
}
function se(n, t = 1) {
  return n.setUTCDate(n.getUTCDate() + t), n;
}
function on(n, t = 1) {
  return se(n, -t);
}
function ne(n) {
  return n.setUTCHours(0, 0, 0, 0), n;
}
function Se(n) {
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
function ye(n, ...t) {
  return t.every((e) => n.getTime() === e.getTime());
}
function it(n, t) {
  const e = t - n.getUTCDay();
  return n.setUTCDate(n.getUTCDate() + (e <= 0 ? e : e - 7)), n;
}
function kt(n) {
  return typeof n == "string" && n.length <= 10;
}
function ge(n) {
  return n.seconds;
}
function kn(n, t) {
  n = $(n), t === 0 ? n.setUTCDate(n.getUTCDate() + 6 - n.getUTCDay()) : n.setUTCDate(n.getUTCDate() + 4 - (n.getUTCDay() || 7));
  const e = new Date(Date.UTC(n.getUTCFullYear(), 0, 1));
  return Math.ceil(((n - e) / 1e3 / vt + 1) / 7);
}
function An(n, t, e) {
  return t ? _e(t) ? t({ date: Se(e), week: n }) : t : "W" + String(n).padStart(2, "0");
}
function sn(n, t = {}) {
  const e = n.match(/([+-])(\d{2}):(\d{2})$/);
  if (e)
    return Pe(t, e), +(e[1] + "1") * (+e[2] * 60 + +e[3]);
}
function Ct(n, t) {
  return t && n.setUTCMinutes(n.getUTCMinutes() + t), n;
}
const rn = Symbol("ec");
function We(n, t) {
  return n[rn] = t, n;
}
function Qe(n) {
  return n[rn];
}
function Pn(n, t = void 0) {
  const e = new Date(Date.UTC(
    n.getFullYear(),
    n.getMonth(),
    n.getDate(),
    n.getHours(),
    n.getMinutes(),
    n.getSeconds()
  ));
  return Ct(e, t ? t - Je(e) : 0), We(e, t ?? Je(e)), e;
}
function In(n, t = void 0) {
  const e = {}, o = sn(n, e);
  o !== void 0 && (n = n.substring(0, e.index));
  const i = n.match(/\d+/g), r = new Date(Date.UTC(
    +i[0],
    +i[1] - 1,
    +i[2],
    +i[3] || 0,
    +i[4] || 0,
    +i[5] || 0
  ));
  return t !== void 0 && o !== void 0 && Ct(r, t - o), We(r, t ?? o), r;
}
function re(n) {
  if (typeof n == "number")
    n = { seconds: n };
  else if (typeof n == "string") {
    let e = 0, o = 2;
    for (const i of n.split(":", 3))
      e += parseInt(i, 10) * Math.pow(60, o--);
    n = { seconds: e };
  } else tn(n) && (n = {
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
function On(n) {
  let t, e;
  return n && ({ start: t, end: e } = n, t && (t = ne(de(t))), e && (e = ne(de(e)))), { start: t, end: e };
}
const an = Ln();
function Rn(n, t) {
  n[an] = t;
}
function Re(n) {
  return n[an];
}
function g(n, t, e, o = []) {
  const i = document.createElement(n);
  i.className = t, typeof e == "string" ? i.innerText = e : e?.domNodes ? i.replaceChildren(...e.domNodes) : e?.html && (i.innerHTML = e.html);
  for (const r of o)
    i.setAttribute(...r);
  return i;
}
let Hn = 1;
function Ae(n, t = void 0) {
  return n.map((e) => {
    const o = {
      id: "id" in e ? String(e.id) : `{generated-${Hn++}}`,
      resourceIds: ct(e, "resourceId").map(String),
      allDay: e.allDay ?? (kt(e.start) && kt(e.end)),
      start: de(e.start, t),
      end: de(e.end, t),
      title: e.title ?? "",
      editable: e.editable,
      startEditable: e.startEditable,
      durationEditable: e.durationEditable,
      display: e.display ?? "auto",
      extendedProps: e.extendedProps ?? {},
      backgroundColor: e.backgroundColor ?? e.color,
      textColor: e.textColor,
      classNames: ct(e, "className"),
      styles: ct(e, "style")
    };
    if (o.allDay) {
      ne(o.start);
      const i = $(o.end);
      ne(o.end), (!ye(o.end, i) || ye(o.end, o.start)) && se(o.end);
    }
    return Fn(o), o;
  });
}
function Fn(n) {
  return Object.defineProperties(n, {
    startLocal: {
      get() {
        return this.start ? Se(this.start) : null;
      },
      enumerable: !1,
      configurable: !0
    },
    endLocal: {
      get() {
        return this.end ? Se(this.end) : null;
      },
      enumerable: !1,
      configurable: !0
    }
  }), n;
}
function ct(n, t) {
  const e = n[t + "s"] ?? n[t] ?? [];
  return ot(e) ? e : [e];
}
function Nn(n) {
  return n.map((t) => ({
    events: t.events,
    url: t.url && t.url.replace(/&$/, "") || "",
    method: t.method && t.method.toUpperCase() || "GET",
    extraParams: t.extraParams || {}
  }));
}
function Ye(n) {
  return $n(n, Se);
}
function $n(n, t) {
  return n = Pe({}, n), n.start = t(n.start), n.end = t(n.end), n;
}
function cn(n) {
  const t = [...n].sort((i, r) => {
    const s = i.start.getTime(), a = r.start.getTime();
    return s !== a ? s - a : r.end.getTime() - i.end.getTime();
  }), e = [], o = /* @__PURE__ */ new Map();
  for (const i of t) {
    const r = i.start.getTime();
    let s = e.findIndex((a) => a <= r);
    s === -1 ? (s = e.length, e.push(i.end.getTime())) : e[s] = i.end.getTime(), o.set(i, s);
  }
  return o;
}
function Bn(n) {
  return n === "background";
}
function Un(n) {
  const t = [];
  return ln(n, 0, !1, t), t;
}
function ln(n, t, e, o) {
  const i = [];
  for (const r of n) {
    const s = Wn(r);
    i.push(s), o.push(s);
    const a = { level: t, children: [], hidden: e };
    Rn(s, a), r.children && (a.children = ln(
      r.children,
      t + 1,
      e || !s.expanded,
      o
    ));
  }
  return i;
}
function Wn(n) {
  return {
    id: String(n.id),
    title: n.title || "",
    eventBackgroundColor: zn(n),
    eventTextColor: Yn(n),
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
function zn(n) {
  return n?.eventBackgroundColor;
}
function Yn(n) {
  return n?.eventTextColor;
}
function Le(n) {
  return (t) => t === void 0 ? void 0 : n(t);
}
const dn = ["buttonText", "customButtons", "icons", "theme"];
function Gn(n, t = {}) {
  const e = qn(n), o = Xn(n);
  let i = yt(e, o);
  const r = yt(t, o), s = lt(i, "views") ?? {}, a = lt(r, "views") ?? {}, u = { ...i };
  t.view && (u.view = t.view);
  const w = {}, v = {}, h = {}, D = /* @__PURE__ */ new Set([...Ne(s), ...Ne(a)]);
  for (const y of D) {
    const l = a[y] ?? {}, b = At(
      i,
      s[y] ?? s[l.type] ?? {}
    ), T = At(b, r, l), S = lt(T, "component");
    delete T.view;
    for (const _ of Ne(T))
      Et(u, _) ? (w[_] || (w[_] = []), w[_].push(
        dn.includes(_) ? (E) => T[_] = _e(E) ? E(b[_]) : E : (E) => T[_] = E
      )) : delete T[_];
    v[y] = T, h[y] = S;
  }
  v[u.view] ? Pe(u, v[u.view]) : Pe(u, r);
  function c(y, l, b = !0) {
    Et(u, y) && (b || (y in o ? l = o[y](l) : en(l) ? l = { ...l } : ot(l) && (l = [...l])), w[y]?.forEach((T) => T(l)), u[y] = l);
  }
  function f(y) {
    if (v[y])
      return Pe(u, v[y]), h[y];
  }
  return {
    options: u,
    setOption: c,
    setViewOptions: f,
    viewComponents: h,
    // Sorted list of every view name registered by defaults + plugins +
    // the user. The controller exposes this on state so the toolbar can
    // tokenise view-switcher entries.
    viewNames: [...D].sort()
  };
}
function qn(n) {
  const t = Vn();
  for (const e of n) e.createOptions?.(t);
  return t;
}
function Xn(n) {
  const t = {
    date: (e) => ne(de(e)),
    dateIncrement: Le(re),
    duration: re,
    events: Ae,
    eventSources: Nn,
    hiddenDays: (e) => [...new Set(e)],
    highlightedDates: (e) => e.map((o) => ne(de(o))),
    resources: (e) => ot(e) ? Un(e) : e,
    validRange: On
  };
  for (const e of n) e.createParsers?.(t);
  return t;
}
function yt(n, t) {
  const e = { ...n };
  for (const o of Ne(t))
    o in e && (e[o] = t[o](e[o]));
  if (n.views) {
    e.views = {};
    for (const o of Ne(n.views))
      e.views[o] = yt(n.views[o], t);
  }
  return e;
}
function lt(n, t) {
  const e = n[t];
  return delete n[t], e;
}
function At(...n) {
  let t = {};
  for (const e of n) {
    const o = {};
    for (const i of dn)
      _e(e[i]) && (o[i] = e[i](t[i]));
    t = { ...t, ...e, ...o };
  }
  return t;
}
function Vn() {
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
    theme: Zn(),
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
function Zn() {
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
class Kn {
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
    const i = { key: t, value: e, prev: o };
    this._fire(`change:${t}`, i), this._anyListeners.forEach((r) => r(i));
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
    if (o) for (const i of o) i(e);
  }
}
function Jn(n, t = {}) {
  const { options: e, setOption: o, setViewOptions: i, viewComponents: r, viewNames: s } = Gn(n, t), a = new Kn({
    options: e,
    auxComponents: [],
    // populated by plugins (e.g. Interaction)
    features: [],
    // populated by per-view init (list, dayNumber, …)
    extensions: {},
    // per-view overrides for activeRange, viewResources
    viewNames: s
    // sorted list of registered view names
  });
  for (const u of n)
    u.initState?.(a);
  return { state: a, options: e, setOption: o, setViewOptions: i, viewComponents: r, viewNames: s };
}
function Qn(n) {
  return !!n && (typeof n.createOptions == "function" || typeof n.createParsers == "function" || typeof n.initState == "function");
}
function jn(n) {
  if (!Array.isArray(n))
    throw new TypeError("plugins must be an array");
  for (const [t, e] of n.entries())
    if (!Qn(e))
      throw new TypeError(
        `plugins[${t}] is not a plugin (expected at least one of createOptions / createParsers / initState)`
      );
  return n;
}
function eo(n, t, e, o) {
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
function st(n) {
  return n = Pe({}, n), n.currentStart = Se(n.currentStart), n.currentEnd = Se(n.currentEnd), n.activeStart = Se(n.activeStart), n.activeEnd = Se(n.activeEnd), n;
}
function to(n, t) {
  const e = /* @__PURE__ */ new Map(), o = [], i = (r) => {
    const s = e.get(r);
    typeof s == "function" && s();
    const a = r.run(n);
    typeof a == "function" ? e.set(r, a) : e.delete(r);
  };
  for (const r of t) {
    i(r);
    for (const s of r.deps ?? [])
      o.push(n.on(`change:${s}`, () => i(r)));
  }
  return () => {
    for (const r of o) r();
    for (const r of e.values()) typeof r == "function" && r();
    e.clear();
  };
}
function no(n) {
  return {
    deps: ["options"],
    run(t) {
      const e = t.get("options"), o = n(e.view);
      t.set("extensions", {}), t.set("features", []), typeof o == "function" && t.set("viewComponent", o(t));
    }
  };
}
function St(n, t, e) {
  const o = n.get("fire");
  if (typeof o == "function") {
    o(t, e);
    return;
  }
  const i = n.get("options")?.[t];
  typeof i == "function" && i(e);
}
function oo() {
  return {
    deps: ["activeRange"],
    run(n) {
      const t = n.get("activeRange"), e = n.get("view");
      !t || !e || St(n, "datesSet", {
        start: Se(t.start),
        end: Se(t.end),
        startStr: Ie(t.start),
        endStr: Ie(t.end),
        view: st(e)
      });
    }
  };
}
function io() {
  return {
    deps: ["view"],
    run(n) {
      const t = n.get("view");
      t && queueMicrotask(() => St(n, "viewDidMount", { view: st(t) }));
    }
  };
}
function so(n) {
  let t = null;
  return {
    deps: ["activeRange"],
    run(e) {
      const o = e.get("activeRange");
      if (!o?.start || !o?.end) return;
      const i = `${o.start.getTime()}|${o.end.getTime()}`;
      if (i === t) return;
      t = i;
      const r = e.get("options"), s = Array.isArray(r.eventSources) && r.eventSources.length > 0, a = typeof r.events == "function";
      !s && !a || n();
    }
  };
}
function ro() {
  let n = null;
  return {
    deps: ["filteredEvents"],
    run(t) {
      const e = t.get("view");
      e && (n || (n = setTimeout(() => {
        n = null, St(t, "eventAllUpdated", { view: st(e) });
      }, 0)));
    }
  };
}
function ao() {
  return {
    deps: ["offset"],
    run(n) {
      const t = n.get("offset"), e = () => {
        const i = de(void 0, t), r = ne($(i));
        n.set("now", i);
        const s = n.get("today");
        (!s || !ye(s, r)) && n.set("today", r);
      };
      e();
      const o = setInterval(e, 1e3);
      return () => clearInterval(o);
    }
  };
}
function co(n) {
  return {
    deps: ["offset"],
    run(t) {
      const e = t.get("offset"), o = t.get("options"), i = t.get("events") ?? o?.events ?? [];
      for (const s of i)
        if (!s.allDay)
          for (const a of ["start", "end"]) {
            const u = Qe(s[a]);
            u !== void 0 && Ct(s[a], e - u), We(s[a], e);
          }
      const r = Qe(o.date);
      if (r !== void 0) {
        const s = de(void 0, e).getUTCDay() - de(void 0, r).getUTCDay(), a = se($(o.date), s);
        n("date", a);
      }
      We(o.date, e);
    }
  };
}
const dt = /* @__PURE__ */ new Map();
function lo(n) {
  if (dt.has(n)) return dt.get(n);
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
  return dt.set(n, t), t;
}
function uo(n, t = /* @__PURE__ */ new Date()) {
  const e = lo(n);
  if (!e) return;
  let o, i, r, s, a, u;
  for (const v of e.formatToParts(t))
    switch (v.type) {
      case "year":
        o = Number(v.value);
        break;
      case "month":
        i = Number(v.value);
        break;
      case "day":
        r = Number(v.value);
        break;
      case "hour":
        s = Number(v.value);
        break;
      case "minute":
        a = Number(v.value);
        break;
      case "second":
        u = Number(v.value);
        break;
    }
  s === 24 && (s = 0);
  const w = Date.UTC(o, i - 1, r, s, a, u);
  return Math.round((w - t.getTime()) / 6e4);
}
function un(n, t) {
  let e;
  if (_e(t))
    e = t;
  else {
    const o = new Intl.DateTimeFormat(n, { timeZone: "UTC", ...t });
    e = (i, r) => {
      if (i <= r) return o.formatRange(i, r);
      const s = o.formatRangeToParts(r, i);
      let a = "";
      const u = ["startRange", "endRange"], w = [!1, !1];
      for (const v of s) {
        const h = u.indexOf(v.source);
        h >= 0 ? w[h] || (a += fo(u[1 - h], s), w[h] = !0) : a += v.value;
      }
      return a;
    };
  }
  return { formatRange: e };
}
function fo(n, t) {
  let e = "";
  for (const o of t) o.source === n && (e += o.value);
  return e;
}
function fn(n, t, e) {
  const o = $(n);
  t.years ? (o.setUTCMonth(0), o.setUTCDate(1)) : t.months ? o.setUTCDate(1) : t.inWeeks && it(o, e);
  const i = ve($(o), t);
  return { start: o, end: i };
}
function pn(n, t) {
  const e = $(n.start), o = $(n.end);
  return t ? t(e, o) : { start: e, end: o };
}
function ke(n, t) {
  const e = [], o = ne($(n.start)), i = ne($(n.end));
  for (; o < i; )
    t.includes(o.getUTCDay()) || e.push($(o)), se(o);
  return e;
}
function hn(n, t) {
  return n.formatRange(t.start, on($(t.end)));
}
function gn(n, t, e) {
  const { eventFilter: o, eventOrder: i, filterEventsWithResources: r, resources: s } = e;
  let a = [...n];
  if (_e(o)) {
    const u = n.map(Ye), w = st(t);
    a = a.filter((v, h) => o({
      event: Ye(v),
      index: h,
      events: u,
      view: w
    }));
  }
  return r && (a = a.filter((u) => s.some((w) => u.resourceIds.includes(w.id)))), _e(i) ? a.sort((u, w) => i(Ye(u), Ye(w))) : a.sort((u, w) => u.start - w.start || w.allDay - u.allDay), a;
}
function po(n, t = void 0) {
  if (n === "local") return Je(t);
  if (n === "UTC") return 0;
  const e = sn(n);
  if (e !== void 0) return e;
  const o = uo(n, t);
  return o !== void 0 ? o : Je(t);
}
function mn(n, t, e, o) {
  return eo(n, t, e, o);
}
function ut(n, t, e = {}) {
  const o = t.get("options"), i = o.theme, r = o.headerToolbar ?? {};
  n.replaceChildren();
  for (const s of ["start", "center", "end"]) {
    const a = (r[s] ?? "").trim(), u = g("div", "", "", [["data-toolbar-slot", s]]);
    a && ho(u, a, t, e, i), n.append(u);
  }
}
function ho(n, t, e, o, i) {
  for (const r of t.split(/\s+/)) {
    const s = g("div", i.buttonGroup);
    for (const a of r.split(",").filter(Boolean)) {
      const u = go(a, e, o, i);
      u && s.append(u);
    }
    s.children.length === 1 ? n.append(s.firstChild) : s.children.length > 1 && n.append(s);
  }
}
function go(n, t, e, o) {
  const i = wo[n];
  if (i) return i(t, e, o);
  const r = t.get("options");
  return (t.get("viewNames") ?? []).includes(n) ? mo(n, t, e, o) : r.customButtons && Object.hasOwn(r.customButtons, n) ? vo(n, t, e, o) : null;
}
function mo(n, t, e, o) {
  const i = t.get("options"), r = i.buttonText?.[n] ?? n, s = g("button", `${o.button} ec-${yo(n)}`, r, [
    ["type", "button"],
    ["data-toolbar-action", "view"],
    ["data-toolbar-view", n]
  ]);
  return i.view === n && s.classList.add(o.active), s.addEventListener("click", () => e?.gotoView?.(n)), s;
}
function vo(n, t, e, o) {
  const i = t.get("options").customButtons?.[n] ?? {}, r = g("button", `${o.button} ec-custom`, i.text ?? n, [
    ["type", "button"],
    ["data-toolbar-action", "customButton"],
    ["data-toolbar-button", n]
  ]);
  return r.addEventListener("click", () => e?.fireCustomButton?.(n)), r;
}
function yo(n) {
  return n.replace(/[A-Z]/g, (t) => "-" + t.toLowerCase()).replace(/^-/, "");
}
function Pt(n, t) {
  const e = n.get("options")?.validRange, o = n.get("currentRange");
  return !e || !o ? !1 : !!(t === "start" && e.start && o.start <= e.start || t === "end" && e.end && o.end >= e.end);
}
const wo = {
  title(n, t, e) {
    return g("h2", e.title, n.get("viewTitle") ?? "");
  },
  prev(n, t, e) {
    const o = g("button", `${e.button} ec-prev`, "", [
      ["type", "button"],
      ["aria-label", "Previous"],
      ["data-toolbar-action", "prev"]
    ]);
    return o.innerHTML = '<i class="ec-icon ec-prev"></i>', Pt(n, "start") ? (o.disabled = !0, o.classList.add(e.disabled)) : o.addEventListener("click", () => t?.prev?.()), o;
  },
  next(n, t, e) {
    const o = g("button", `${e.button} ec-next`, "", [
      ["type", "button"],
      ["aria-label", "Next"],
      ["data-toolbar-action", "next"]
    ]);
    return o.innerHTML = '<i class="ec-icon ec-next"></i>', Pt(n, "end") ? (o.disabled = !0, o.classList.add(e.disabled)) : o.addEventListener("click", () => t?.next?.()), o;
  },
  today(n, t, e) {
    const i = n.get("options").buttonText?.today ?? "today", r = g("button", `${e.button} ec-today`, i, [
      ["type", "button"],
      ["data-toolbar-action", "today"]
    ]);
    return r.addEventListener("click", () => t?.today?.()), r;
  }
};
let Dt = null, pe = null, $e = null, Be = null;
const bo = { hour: "numeric", minute: "2-digit" }, To = { day: "numeric", month: "short", year: "numeric" };
function It({ event: n, anchorEl: t, state: e }) {
  if (xe(), !n || !t) return null;
  const o = e.get("options"), i = o?.locale, r = e.get("fire");
  pe = g("div", "ec-event-popover", "", [
    ["role", "dialog"],
    ["aria-modal", "false"],
    ["data-popover", "event"],
    ["data-event-id", n.id]
  ]);
  const s = g("div", "ec-event-popover-card ec-event-popover-card-title"), a = g("div", "ec-event-popover-title-row");
  a.append(g("div", "ec-event-popover-title", n.title || "(untitled)"));
  const u = g("span", "ec-event-popover-swatch"), w = n.backgroundColor || o?.eventBackgroundColor || o?.eventColor;
  w && (u.style.background = w), a.append(u), s.append(a);
  const v = n.extendedProps?.location;
  v && s.append(g("div", "ec-event-popover-location", String(v)));
  const h = g("button", "ec-event-popover-close", "×", [
    ["type", "button"],
    ["aria-label", "Close"]
  ]);
  h.addEventListener("click", xe), s.append(h), pe.append(s);
  const D = g("div", "ec-event-popover-card");
  D.append(g("div", "ec-event-popover-when", Mo(n, i))), n.extendedProps?.category && D.append(g(
    "div",
    "ec-event-popover-when-meta",
    `Category: ${n.extendedProps.category}`
  )), pe.append(D);
  const c = n.extendedProps?.attendees;
  if (c) {
    const S = g("div", "ec-event-popover-card");
    S.append(g("div", "ec-event-popover-card-label", "Invitees")), S.append(g("div", "ec-event-popover-card-value", String(c))), pe.append(S);
  }
  const f = n.extendedProps?.description;
  if (f) {
    const S = g("div", "ec-event-popover-card");
    S.append(g("div", "ec-event-popover-card-label", "Notes")), S.append(g("p", "ec-event-popover-desc", String(f))), pe.append(S);
  }
  const y = Object.entries(n.extendedProps ?? {}).filter(([S]) => !["description", "category", "location", "attendees"].includes(S)).filter(([, S]) => S != null && S !== "");
  if (y.length) {
    const S = g("div", "ec-event-popover-card"), _ = g("dl", "ec-event-popover-props");
    for (const [E, I] of y)
      _.append(g("dt", "", xo(E))), _.append(g("dd", "", String(I)));
    S.append(_), pe.append(S);
  }
  const l = g("div", "ec-event-popover-footer"), b = g("button", "ec-event-popover-action", "Edit", [
    ["type", "button"],
    ["data-popover-action", "edit"]
  ]), T = g("button", "ec-event-popover-action ec-event-popover-danger", "Delete", [
    ["type", "button"],
    ["data-popover-action", "delete"]
  ]);
  return b.addEventListener("click", () => {
    r?.("eventPopoverEdit", { event: n }), xe();
  }), T.addEventListener("click", () => {
    r?.("eventPopoverDelete", { event: n }), xe();
  }), l.append(b, T), pe.append(l), document.body.appendChild(pe), Do(pe, t), setTimeout(() => {
    $e = (S) => {
      pe && !pe.contains(S.target) && !t.contains(S.target) && xe();
    }, Be = (S) => {
      S.key === "Escape" && xe();
    }, document.addEventListener("mousedown", $e, !0), document.addEventListener("keydown", Be, !0);
  }, 0), Dt = n.id, r?.("eventPopoverOpen", { event: n, el: pe }), pe;
}
function xe() {
  pe && (pe.remove(), pe = null, Dt = null, $e && (document.removeEventListener("mousedown", $e, !0), $e = null), Be && (document.removeEventListener("keydown", Be, !0), Be = null));
}
function Co() {
  return pe !== null;
}
function So() {
  return Dt;
}
function Do(n, t) {
  const e = t.getBoundingClientRect(), o = n.getBoundingClientRect(), i = 8;
  let r = e.right + i, s = e.top, a = "right";
  r + o.width + i > window.innerWidth && (r = Math.max(i, e.left - o.width - i), a = "left"), s + o.height + i > window.innerHeight && (s = Math.max(i, window.innerHeight - o.height - i));
  const u = Math.max(i, r), w = Math.max(i, s);
  n.style.position = "fixed", n.style.left = `${u}px`, n.style.top = `${w}px`, n.setAttribute("data-popover-side", a);
  const h = e.top + e.height / 2 - w, D = 14, c = o.height - 14, f = Math.max(D, Math.min(c, h));
  n.style.setProperty("--popover-arrow-top", `${f}px`);
}
function Mo(n, t) {
  const e = new Intl.DateTimeFormat(t, { timeZone: "UTC", ...To }), o = new Intl.DateTimeFormat(t, { timeZone: "UTC", ...bo });
  if (n.allDay) {
    const u = e.format(n.start);
    if (!n.end) return u;
    const w = new Date(n.end.getTime() - 1), v = e.format(w);
    return u === v ? `${u} · all day` : `${u} — ${v}`;
  }
  const i = e.format(n.start), r = o.format(n.start), s = e.format(n.end), a = o.format(n.end);
  return i === s ? `${i}  ${r} – ${a}` : `${i} ${r} → ${s} ${a}`;
}
function xo(n) {
  return n.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " ").replace(/^./, (t) => t.toUpperCase()).trim();
}
const _o = 0.22, Eo = 140, Ge = 260, Ot = "cubic-bezier(0.22, 1, 0.36, 1)", Lo = 6, ko = 180, Ao = 0.35, Po = 200, ft = 230, Rt = "cubic-bezier(0.4, 0, 1, 1)";
function Io(n, t, e, { onNavigate: o }) {
  const i = He("div", "ec-pager", { tabindex: "0" }), r = He("div", "ec-pager-track"), s = [
    He("div", "ec-pager-page"),
    He("div", "ec-pager-page"),
    He("div", "ec-pager-page")
  ];
  r.append(...s), i.append(r), n.replaceChildren(i);
  let a = 1;
  const u = [null, null, null];
  D();
  let w = e(s[a], t);
  y(0, !1);
  let v = !1;
  const h = t.on("change:currentRange", () => {
    v || f();
  });
  function D() {
    const d = Ee(a - 1), C = Ee(a + 1);
    for (let M = 0; M < 3; ++M) {
      const x = s[M];
      x.classList.remove("ec-pager-page-prev", "ec-pager-page-current", "ec-pager-page-next"), x.removeAttribute("aria-hidden"), M === a ? x.classList.add("ec-pager-page-current") : M === d ? (x.classList.add("ec-pager-page-prev"), x.setAttribute("aria-hidden", "true")) : M === C && (x.classList.add("ec-pager-page-next"), x.setAttribute("aria-hidden", "true"));
    }
  }
  function c() {
    const d = t.get("options"), C = d.dateIncrement ?? d.duration;
    if (!C) return;
    const M = Ee(a - 1), x = Ee(a + 1), U = s[a].querySelector?.('[data-row="body"]')?.scrollTop ?? 0;
    if (!u[M]) {
      const q = nn($(d.date), C), Z = Ht(t, q);
      s[M].replaceChildren(), u[M] = e(s[M], Z);
      const J = s[M].querySelector?.('[data-row="body"]');
      J && (J.scrollTop = U);
    }
    if (!u[x]) {
      const q = ve($(d.date), C), Z = Ht(t, q);
      s[x].replaceChildren(), u[x] = e(s[x], Z);
      const J = s[x].querySelector?.('[data-row="body"]');
      J && (J.scrollTop = U);
    }
  }
  function f() {
    for (let d = 0; d < 3; ++d)
      d !== a && (u[d] && (u[d](), u[d] = null), s[d].replaceChildren());
  }
  function y(d, C) {
    i.style.setProperty("--ec-pager-px", `${d}px`), i.style.setProperty(
      "--ec-pager-transition",
      C ? `transform ${Ge}ms ${Ot}` : "none"
    ), r.style.transition = C ? `transform ${Ge}ms ${Ot}` : "none", r.style.transform = `translate3d(${d}px, 0, 0)`;
  }
  function l(d) {
    const C = Ee(a + d), x = s[C].querySelector?.('[data-row="body"]')?.scrollTop ?? null;
    w && (w(), w = null), s[a].replaceChildren();
    const G = Ee(a - d);
    if (u[G] && (u[G](), u[G] = null), s[G].replaceChildren(), a = C, D(), y(0, !1), v = !0, o?.({ direction: d }), u[a] && (u[a](), u[a] = null), w = e(s[a], t), x != null) {
      const U = s[a].querySelector?.('[data-row="body"]');
      U && (U.scrollTop = x);
    }
    v = !1;
  }
  let b = null, T = !1;
  function S(d) {
    b || A || d.button !== void 0 && d.button !== 0 || d.pointerType !== "mouse" && (k(d.target, { allowEventChips: d.pointerType === "touch" }) || (I(d.clientX, d.clientY, { pointerId: d.pointerId }), document.addEventListener("pointermove", O, { passive: !1 }), document.addEventListener("pointerup", z), document.addEventListener("pointercancel", z)));
  }
  function _(d) {
    if (A || d.touches?.length !== 1) return;
    const C = d.touches[0];
    if (b) {
      b.touchId ?? (b.touchId = C.identifier), E();
      return;
    }
    k(d.target, { allowEventChips: !0 }) || (I(C.clientX, C.clientY, { touchId: C.identifier }), E());
  }
  function E() {
    T || (T = !0, document.addEventListener("touchmove", R, { passive: !1 }), document.addEventListener("touchend", N, { passive: !1 }), document.addEventListener("touchcancel", N, { passive: !1 }));
  }
  function I(d, C, { pointerId: M, touchId: x } = {}) {
    b = {
      startX: d,
      startY: C,
      lastX: d,
      lastY: C,
      pointerId: M,
      touchId: x,
      decided: !1,
      abandoned: !1
    };
  }
  function O(d) {
    !b || b.abandoned || V(d.clientX, d.clientY, d);
  }
  function R(d) {
    if (!b || b.abandoned) return;
    const C = H(d);
    C && V(C.clientX, C.clientY, d);
  }
  function V(d, C, M) {
    if (document.body.classList.contains("ec-dragging") || document.body.classList.contains("ec-resizing-active")) {
      b.abandoned = !0, K();
      return;
    }
    b.lastX = d, b.lastY = C;
    const x = d - b.startX, G = C - b.startY;
    if (!b.decided) {
      if (Math.abs(G) > Math.abs(x) + Lo) {
        b.abandoned = !0;
        return;
      }
      if (Math.abs(x) < 6) return;
      b.decided = !0, c(), i.classList.add("ec-pager-dragging");
      try {
        i.setPointerCapture?.(b.pointerId);
      } catch {
      }
    }
    M.cancelable && M.preventDefault(), y(x, !1);
  }
  function z(d) {
    K();
  }
  function N(d) {
    const C = H(d);
    C && b && (b.lastX = C.clientX, b.lastY = C.clientY), K();
  }
  function K() {
    if (!b) return;
    const d = b;
    if (b = null, document.removeEventListener("pointermove", O), document.removeEventListener("pointerup", z), document.removeEventListener("pointercancel", z), F(), !d.decided || d.abandoned) {
      i.classList.remove("ec-pager-dragging"), y(0, !1);
      return;
    }
    const C = d.lastX - d.startX, M = i.offsetWidth || n.offsetWidth || 1, x = Math.min(M * _o, Eo);
    C <= -x ? Q(-M, 1) : C >= x ? Q(+M, -1) : (y(0, !0), setTimeout(() => i.classList.remove("ec-pager-dragging"), Ge));
  }
  function H(d) {
    const C = [d.touches, d.changedTouches];
    for (const M of C)
      if (M) {
        for (const x of Array.from(M))
          if (x.identifier === b?.touchId) return x;
      }
    return d.touches?.[0] ?? d.changedTouches?.[0] ?? null;
  }
  function F() {
    T && (T = !1, document.removeEventListener("touchmove", R), document.removeEventListener("touchend", N), document.removeEventListener("touchcancel", N));
  }
  function k(d, { allowEventChips: C = !1 } = {}) {
    return d.closest?.(".ec-resizer, .ec-event.ec-event-editing") || !C && d.closest?.("[data-event-id]") ? !0 : !!d.closest?.("[data-more-link], [data-popover-action], .ec-pager-no-swipe, .ec-button, button, input, select, textarea, a");
  }
  let A = null, X = null;
  function L(d) {
    if (b || Math.abs(d.deltaX) <= Math.abs(d.deltaY)) return;
    d.preventDefault(), A || (A = { acc: 0, endTimer: null }, c(), i.classList.add("ec-pager-dragging")), A.acc -= d.deltaX;
    const C = i.offsetWidth || n.offsetWidth || 1, M = Math.max(-C, Math.min(C, A.acc));
    y(M, !1);
    const x = Math.min(C * Ao, Po);
    clearTimeout(A.endTimer), A.acc <= -x ? (A = null, i.classList.remove("ec-pager-dragging"), Q(-C, 1)) : A.acc >= x ? (A = null, i.classList.remove("ec-pager-dragging"), Q(+C, -1)) : A.endTimer = setTimeout(() => {
      A && (A = null, i.classList.remove("ec-pager-dragging"), y(0, !0));
    }, ko), clearTimeout(X), X = setTimeout(f, 1500);
  }
  function Y(d) {
    d.target !== i && !i.contains(d.target) || d.metaKey || d.ctrlKey || d.altKey || d.target.matches?.('input, textarea, select, [contenteditable="true"]') || (d.key === "ArrowLeft" ? (d.preventDefault(), c(), i.classList.add("ec-pager-dragging"), Q(window.innerWidth || i.offsetWidth, -1)) : d.key === "ArrowRight" && (d.preventDefault(), c(), i.classList.add("ec-pager-dragging"), Q(-(window.innerWidth || i.offsetWidth), 1)));
  }
  function Q(d, C) {
    y(d, !0), setTimeout(() => {
      l(C), i.classList.remove("ec-pager-dragging");
    }, Ge);
  }
  let m = null;
  function P(d) {
    return new Promise((C) => {
      const M = i.offsetWidth || n.offsetWidth || 0;
      if (!M || d !== 1 && d !== -1) {
        C();
        return;
      }
      c();
      const G = s[a].querySelector?.('[data-row="body"]')?.scrollTop ?? 0, U = Ee(a + d), q = s[U].querySelector?.('[data-row="body"]');
      q && (q.scrollTop = G), i.classList.add("ec-pager-dragging");
      const Z = -d * M;
      r.style.transition = `transform ${ft}ms ${Rt}`, i.style.setProperty(
        "--ec-pager-transition",
        `transform ${ft}ms ${Rt}`
      ), i.style.setProperty("--ec-pager-px", `${Z}px`), r.style.transform = `translate3d(${Z}px, 0, 0)`;
      const J = { resolve: C, aborted: !1 };
      J.timer = setTimeout(() => {
        if (J.aborted) return;
        m === J && (m = null), l(d), i.classList.remove("ec-pager-dragging");
        const B = s[a].querySelector?.('[data-row="body"]');
        B && (B.scrollTop = G), C();
      }, ft), m = J;
    });
  }
  function p() {
    if (!m) return !1;
    const d = m;
    return m = null, d.aborted = !0, clearTimeout(d.timer), r.style.transition = "none", i.style.setProperty("--ec-pager-transition", "none"), i.style.setProperty("--ec-pager-px", "0px"), r.style.transform = "translate3d(0px, 0, 0)", i.classList.remove("ec-pager-dragging"), d.resolve(), !0;
  }
  return i.addEventListener("pointerdown", S, { capture: !0 }), i.addEventListener("touchstart", _, { capture: !0, passive: !0 }), i.addEventListener("wheel", L, { passive: !1 }), i.addEventListener("keydown", Y), {
    destroy() {
      h?.();
      try {
        w && w();
      } catch {
      }
      f(), clearTimeout(X), i.removeEventListener("pointerdown", S, { capture: !0 }), i.removeEventListener("touchstart", _, { capture: !0 }), i.removeEventListener("wheel", L), i.removeEventListener("keydown", Y), document.removeEventListener("pointermove", O), document.removeEventListener("pointerup", z), document.removeEventListener("pointercancel", z), F(), n.replaceChildren();
    },
    // The pager root element — exposed so the Interaction plugin can
    // measure the edge zones for cross-day drag against the live
    // viewport (rather than the calendar root, which on mobile shells
    // also covers the toolbar / bottom-bar gutters).
    element: i,
    stepDuringDrag: P,
    abortStepDuringDrag: p,
    // Test helper — surfaces the inner DOM nodes without coupling tests
    // to the class names directly.
    _nodes() {
      return {
        pager: i,
        track: r,
        prevPage: s.find((d) => d.classList.contains("ec-pager-page-prev")),
        currentPage: s.find((d) => d.classList.contains("ec-pager-page-current")),
        nextPage: s.find((d) => d.classList.contains("ec-pager-page-next"))
      };
    }
  };
}
function Ht(n, t) {
  const o = { ...n.get("options"), date: t }, i = fn(o.date, o.duration, o.firstDay), r = pn(i, n.get("extensions")?.activeRange), s = ke(r, o.hiddenDays ?? []), a = un(o.locale, o.titleFormat), u = hn(a, i), w = mn(o.view, u, i, r), v = n.get("events") ?? o.events ?? [], h = Array.isArray(v) ? v : [], D = n.get("resources") ?? o.resources ?? [], c = Array.isArray(D) ? D : [], f = gn(h, w, {
    eventFilter: o.eventFilter,
    eventOrder: o.eventOrder,
    filterEventsWithResources: o.filterEventsWithResources,
    resources: c
  }), y = {
    options: o,
    currentRange: i,
    activeRange: r,
    viewDates: s,
    intlTitle: a,
    viewTitle: u,
    view: w,
    filteredEvents: f,
    fire: () => {
    }
    // snapshots are non-interactive
  }, l = () => {
  };
  return {
    get(b) {
      return b in y ? y[b] : n.get(b);
    },
    set() {
    },
    on() {
      return l;
    },
    onAny() {
      return l;
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
  for (const [i, r] of Object.entries(e)) o.setAttribute(i, r);
  return o;
}
function Ee(n) {
  return (n % 3 + 3) % 3;
}
const Ft = 600, Oo = 140, Nt = 3, Ro = 12, Ho = 0;
function Fo(n, t, { onDateChange: e }) {
  const o = g("div", "ec-month-scroller"), i = g("div", "ec-month-scroller-head"), r = g("div", "ec-month-scroller-body");
  o.append(i, r), n.replaceChildren(o), No(i, t);
  let s = [];
  const a = Xe($(t.get("options").date)), u = t.get("options").validRange?.start, w = u ? ne($(u)) : (() => {
    const H = Xe($(a));
    return H.setUTCMonth(H.getUTCMonth() - Ho), H;
  })(), v = Xe($(a));
  v.setUTCMonth(v.getUTCMonth() + Ro), pt(r, w, v, s, t), requestAnimationFrame(() => {
    const H = s.find(
      (F) => F.monthAnchor && F.monthAnchor.getUTCFullYear() === a.getUTCFullYear() && F.monthAnchor.getUTCMonth() === a.getUTCMonth()
    );
    if (H) {
      const F = H.rowEl.offsetTop - 12, k = r.style.scrollBehavior;
      r.style.scrollBehavior = "auto", l = !0, r.scrollTop = Math.max(0, F), r.offsetTop, r.style.scrollBehavior = k || "", requestAnimationFrame(() => {
        l = !1;
      });
    }
    r.addEventListener("scroll", _, { passive: !0 });
  }), r.addEventListener("click", (H) => {
    if (H.target.closest("[data-event-id], [data-more-link]")) return;
    const F = H.target.closest(".ec-month-scroller-cell");
    if (!F) return;
    H.stopPropagation();
    const k = F.getAttribute("data-date");
    if (!k) return;
    r.querySelectorAll(".ec-month-scroller-cell.ec-selected").forEach((Y) => Y.classList.remove("ec-selected")), F.classList.add("ec-selected");
    const [A, X, L] = k.split("-").map(Number);
    b = !0, f(new Date(A, X - 1, L));
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
  let h = null;
  const D = t.onAny(({ key: H }) => {
    if (["filteredEvents", "currentRange", "activeRange", "options"].includes(H)) {
      if (h) return;
      h = setTimeout(() => {
        h = null, qe(s, t, f);
      }, 0);
    }
  });
  qe(s, t, f);
  const c = t.on("change:currentRange", () => {
    if (l) return;
    const H = t.get("options").date;
    if (!H) return;
    const F = Xe($(H)), k = () => s.find(
      (L) => L.monthAnchor && L.monthAnchor.getUTCFullYear() === F.getUTCFullYear() && L.monthAnchor.getUTCMonth() === F.getUTCMonth()
    );
    let A = k();
    if (!A) {
      const L = s[s.length - 1]?.weekStart && s[s.length - 1].weekStart < F, Y = s[0]?.weekStart && s[0].weekStart > F;
      if (L)
        for (; s[s.length - 1].weekStart < F; ) N();
      else if (Y)
        for (; s[0].weekStart > F; ) {
          const Q = s[0].weekStart;
          if (K(), s[0].weekStart >= Q) break;
        }
      A = k();
    }
    if (!A) return;
    l = !0;
    const X = r.style.scrollBehavior;
    r.style.scrollBehavior = "auto", r.scrollTop = Math.max(0, A.rowEl.offsetTop - 12), r.style.scrollBehavior = X || "", requestAnimationFrame(() => {
      l = !1;
    });
  });
  function f(H, F = !0) {
    l = !0, F && (b = !0), e?.(H), requestAnimationFrame(() => {
      l = !1;
    });
  }
  let y = null, l = !1, b = !0, T = null;
  function S() {
    o.classList.add("ec-scrolling"), clearTimeout(T), T = setTimeout(
      () => o.classList.remove("ec-scrolling"),
      400
    );
  }
  function _() {
    l || (b = !1), S(), l || (r.scrollHeight - (r.scrollTop + r.clientHeight) < Ft && N(), r.scrollTop < Ft && K()), clearTimeout(y), y = setTimeout(V, Oo);
  }
  function E() {
    const H = r.scrollTop + r.clientHeight / 4;
    let F = null;
    for (const A of s) {
      if (A.rowEl.offsetTop > H) break;
      F = A;
    }
    if (F = F ?? s[0], !F) return null;
    const k = $(F.weekStart);
    return se(k, 3), new Date(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate());
  }
  const I = 220;
  let O = 0, R = null;
  function V() {
    if (l) return;
    clearTimeout(R);
    const H = r.scrollTop;
    R = setTimeout(function F() {
      const k = r.scrollTop;
      if (k !== O) {
        O = k, R = setTimeout(F, I);
        return;
      }
      const A = E();
      if (!A) return;
      const X = t.get("options").date;
      Math.abs(A.getTime() - X.getTime()) >= 864e5 / 2 && f(A, !1);
    }, I), O = H;
  }
  function z() {
    if (l || b) return;
    const H = E();
    if (!H) return;
    const F = t.get("options").date;
    Math.abs(H.getTime() - F.getTime()) >= 864e5 / 2 && e?.(H);
  }
  function N() {
    const H = s[s.length - 1];
    if (!H) return;
    const F = ve($(H.weekStart), re({ weeks: 1 })), k = $(F);
    k.setUTCMonth(k.getUTCMonth() + Nt), pt(r, F, k, s, t, {}), qe(s, t, f);
  }
  function K() {
    const H = s[0];
    if (!H) return;
    const F = t.get("options").validRange?.start;
    if (F) {
      const Q = ne($(F));
      if (H.weekStart <= Q) return;
    }
    const k = $(H.weekStart), A = $(k);
    if (A.setUTCMonth(A.getUTCMonth() - Nt), F) {
      const Q = ne($(F));
      A < Q && A.setTime(Q.getTime());
    }
    const X = t.get("options").firstDay ?? 0;
    it(A, X);
    const L = r.scrollHeight;
    pt(r, A, k, s, t, { prepend: !0 }), qe(s, t, f);
    const Y = r.scrollHeight;
    l = !0, r.scrollTop += Y - L, requestAnimationFrame(() => {
      l = !1;
    });
  }
  return {
    destroy() {
      z(), D(), c?.(), clearTimeout(h), clearTimeout(y), clearTimeout(T), r.removeEventListener("scroll", _), n.replaceChildren();
    },
    // Test/debug helper.
    _state() {
      return { weekRows: s, body: r };
    }
  };
}
function No(n, t) {
  const e = t.get("options"), o = e.theme, i = e.firstDay ?? 0, r = new Intl.DateTimeFormat(e.locale, { timeZone: "UTC", weekday: "short" });
  n.replaceChildren();
  for (let s = 0; s < 7; ++s) {
    const a = (i + s) % 7, u = new Date(Date.UTC(1970, 0, 4 + a)), w = g("div", `${o.dayHead ?? "ec-day-head"} ec-month-scroller-day-head`, r.format(u), [
      ["data-day", String(a)]
    ]);
    n.append(w);
  }
}
function pt(n, t, e, o, i, r = {}) {
  const s = i.get("options"), a = s.theme, u = s.firstDay ?? 0, w = ne($(t));
  it(w, u);
  const v = ne($(e)), h = [];
  for (; w < v; ) {
    const D = Bo(w);
    if (!o.find((f) => ye(f.weekStart, w))) {
      const f = g("div", "ec-month-scroller-row", "", [
        ["data-week-start", wt(w)]
      ]), y = g("div", "ec-month-scroller-cells"), l = ne(/* @__PURE__ */ new Date());
      for (const b of D) {
        const T = ye(ne($(b)), l), S = g(
          "div",
          `${a.day ?? "ec-day"} ec-month-scroller-cell${T ? " ec-today" : ""}`,
          "",
          [
            ["data-date", wt(b)]
          ]
        ), _ = g("div", "ec-day-number", String(b.getUTCDate()));
        S.append(_), y.append(S);
      }
      f.append(y), h.push({ rowEl: f, weekStart: $(w), monthAnchor: null });
    }
    se(w, 7);
  }
  if (r.prepend) {
    for (let D = h.length - 1; D >= 0; --D)
      n.insertBefore(h[D].rowEl, n.firstChild);
    o.unshift(...h);
  } else {
    for (const D of h) n.append(D.rowEl);
    o.push(...h);
  }
  $o(o, s);
}
function $o(n, t) {
  const e = new Intl.DateTimeFormat(t.locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric"
  });
  let o = null;
  for (const i of n) {
    const r = i.weekStart, s = `${r.getUTCFullYear()}-${r.getUTCMonth()}`, a = s !== o, u = i.rowEl.querySelector(".ec-month-scroller-month-banner");
    if (a && !u) {
      const w = g("div", "ec-month-scroller-month-banner", ""), v = e.formatToParts(r), h = g(
        "span",
        "ec-month-scroller-month-name",
        v.filter((c) => c.type === "month").map((c) => c.value).join("")
      ), D = g(
        "span",
        "ec-month-scroller-month-year",
        v.filter((c) => c.type === "year").map((c) => c.value).join("")
      );
      w.append(h, g("span", "", " "), D), i.rowEl.insertBefore(w, i.rowEl.firstChild), i.monthAnchor = $(r);
    } else !a && u && (u.remove(), i.monthAnchor = null);
    o = s;
  }
}
function Bo(n) {
  const t = [], e = $(n);
  for (let o = 0; o < 7; ++o)
    t.push($(e)), se(e);
  return t;
}
function qe(n, t, e) {
  const o = t.get("options"), i = o.theme, r = t.get("filteredEvents") ?? [], s = t.get("fire");
  for (const a of n) {
    const u = a.rowEl.querySelector(".ec-month-scroller-cells");
    if (u) {
      for (const w of u.children) {
        const v = w.querySelector(".ec-day-number");
        w.replaceChildren(v);
      }
      for (const w of u.children) {
        const v = de(w.getAttribute("data-date")), h = $(v);
        se(h);
        const D = r.filter((b) => b.start < h && b.end > v);
        if (!D.length) continue;
        const c = g("div", i.events ?? "ec-events"), f = typeof o.dayMaxEvents == "number" ? o.dayMaxEvents : 3, y = D.slice(0, f), l = D.slice(f);
        for (const b of y) {
          const T = g("div", i.event ?? "ec-event", "", [
            ["data-event-id", b.id]
          ]);
          if (b.backgroundColor && (T.style.backgroundColor = b.backgroundColor), T.append(g("span", "ec-event-dot")), !b.allDay) {
            const S = new Intl.DateTimeFormat(o.locale, {
              timeZone: "UTC",
              ...o.eventTimeFormat
            }).format(b.start);
            T.append(g("time", i.eventTime ?? "ec-event-time", S + " "));
          }
          T.append(g("span", i.eventTitle ?? "ec-event-title", b.title || "")), t.get("selectedEventId") === b.id && T.classList.add("ec-event-selected"), T.addEventListener("click", (S) => {
            document.querySelectorAll(".ec-event.ec-event-selected").forEach((E) => E.classList.remove("ec-event-selected")), T.classList.add("ec-event-selected"), t.set("selectedEventId", b.id);
            const _ = new Date(
              b.start.getUTCFullYear(),
              b.start.getUTCMonth(),
              b.start.getUTCDate()
            );
            e?.(_), s?.("eventClick", { event: b, jsEvent: S, view: t.get("view") }), S.stopPropagation();
          }), T.addEventListener("dblclick", (S) => s?.("eventDoubleClick", { event: b, jsEvent: S, view: t.get("view"), el: T })), T.addEventListener("mouseenter", (S) => s?.("eventMouseEnter", { event: b, jsEvent: S, view: t.get("view") })), T.addEventListener("mouseleave", (S) => s?.("eventMouseLeave", { event: b, jsEvent: S, view: t.get("view") })), c.append(T);
        }
        if (l.length) {
          const b = g("button", "ec-more-link", `+${l.length} more`, [
            ["type", "button"],
            ["data-more-link", "true"],
            ["data-date", wt(v)]
          ]);
          c.append(b);
        }
        w.append(c);
      }
    }
  }
}
function Xe(n) {
  return n.setUTCDate(1), ne(n), n;
}
function wt(n) {
  return n.toISOString().substring(0, 10);
}
const Ve = 7, $t = 4, Bt = 600, Uo = 180;
function Wo(n, t, e, { onDateChange: o }) {
  const i = document.createElement("div");
  i.className = "ec-continuous-time-grid", i.style.setProperty("--ec-col-w", "140px"), n.replaceChildren(i);
  const r = t.get("options").firstDay ?? 0;
  let s = Ut(t.get("options").date, r);
  se(s, -Math.floor(Ve / 2) * 7);
  let a = $(s);
  se(a, Ve * 7);
  let u = null, w = !1, v = null, h = 140;
  function D() {
    u?.(), i.style.setProperty("--ec-col-w", `${h}px`);
    const E = zo(t, s, a, h);
    u = e(i, E);
  }
  D(), requestAnimationFrame(() => {
    const E = ne(de(t.get("options").date));
    c(E);
  });
  function c(E) {
    const I = f(E);
    if (I < 0) return;
    const O = y(), R = Math.max(
      0,
      I * h + O - (i.clientWidth - h) / 2
    );
    w = !0, i.scrollLeft = R, requestAnimationFrame(() => {
      w = !1;
    });
  }
  function f(E) {
    const I = ne($(E));
    let O = 0;
    const R = $(s);
    for (; R < a; ) {
      if (ye(R, I)) return O;
      se(R), ++O;
    }
    return -1;
  }
  function y() {
    return i.querySelector(".ec-time-grid .ec-sidebar")?.getBoundingClientRect().width || 64;
  }
  const l = () => {
    w || (b(), clearTimeout(v), v = setTimeout(T, Uo));
  };
  i.addEventListener("scroll", l, { passive: !0 });
  function b() {
    const E = i.scrollLeft, I = i.clientWidth, O = i.scrollWidth;
    if (O - (E + I) < Bt) {
      $(a), se(a, $t * 7), w = !0, D(), requestAnimationFrame(() => {
        w = !1;
      });
      return;
    }
    if (E < Bt) {
      se(s, -$t * 7);
      const R = E, V = O;
      w = !0, D(), requestAnimationFrame(() => {
        const z = i.scrollWidth - V;
        i.scrollLeft = R + z, w = !1;
      });
    }
  }
  function T() {
    if (w) return;
    const E = y(), I = i.scrollLeft + i.clientWidth / 2, O = Math.floor((I - E) / h);
    if (O < 0) return;
    const R = $(s);
    se(R, O);
    const V = t.get("options").date, z = ne(de(V));
    if (ye(R, z)) return;
    w = !0;
    const N = new Date(R.getUTCFullYear(), R.getUTCMonth(), R.getUTCDate());
    o?.(N), requestAnimationFrame(() => {
      w = !1;
    });
  }
  const S = t.on("change:currentRange", () => {
    if (w) return;
    const E = ne(de(t.get("options").date));
    E < s || E >= a ? (s = Ut(E, r), se(s, -Math.floor(Ve / 2) * 7), a = $(s), se(a, Ve * 7), D(), requestAnimationFrame(() => c(E))) : c(E);
  }), _ = t.onAny(({ key: E }) => {
    if (E === "filteredEvents") {
      const I = i.scrollLeft, O = i.scrollTop;
      w = !0, D(), requestAnimationFrame(() => {
        i.scrollLeft = I, i.scrollTop = O, w = !1;
      });
    }
  });
  return {
    destroy() {
      _?.(), S?.(), clearTimeout(v), u?.(), n.replaceChildren();
    }
  };
}
function Ut(n, t) {
  const e = ne(de(n)), i = (e.getUTCDay() - t + 7) % 7;
  return se(e, -i), e;
}
function zo(n, t, e, o) {
  const i = $(t), r = $(e), s = [], a = $(i);
  for (; a < r; )
    s.push($(a)), se(a);
  const u = /* @__PURE__ */ new Map();
  u.set("activeRange", { start: i, end: r }), u.set("currentRange", { start: i, end: r }), u.set("viewDates", s);
  const v = { ...n.get("options"), columnWidth: o };
  u.set("options", v);
  const h = /* @__PURE__ */ new Map();
  return {
    get(c) {
      return u.has(c) ? u.get(c) : n.get(c);
    },
    set(c, f) {
      u.set(c, f);
      const y = h.get(`change:${c}`);
      if (y) for (const l of y) l({ key: c, value: f });
    },
    on(c, f) {
      let y = h.get(c);
      y || (y = /* @__PURE__ */ new Set(), h.set(c, y)), y.add(f);
      const l = n.on?.(c, (b) => {
        ["activeRange", "currentRange", "viewDates", "options"].includes(b.key) || f(b);
      });
      return () => {
        y.delete(f), l?.();
      };
    },
    onAny(c) {
      return n.onAny?.((f) => {
        ["activeRange", "currentRange", "viewDates", "options"].includes(f.key) || c(f);
      });
    }
  };
}
function vn(n) {
  const t = [], e = n?.extendedProps?.confirmationState;
  return e === "tentative" && t.push("ec-event-tentative"), e === "confirmed" && t.push("ec-event-confirmed"), e === "cancelled" && t.push("ec-event-cancelled"), n?.extendedProps?.conflict === !0 && t.push("ec-event-conflict"), n?.extendedProps?.rrule && t.push("ec-event-recurring"), t;
}
function De(n) {
  const t = n?.extendedProps?.dataAttrs;
  if (!t || typeof t != "object") return [];
  const e = [];
  for (const [o, i] of Object.entries(t)) {
    if (i == null || typeof i == "object") continue;
    const r = Yo(o);
    r && e.push([r, String(i)]);
  }
  return e;
}
function ze(n, t) {
  const e = n?.extendedProps?.type;
  if (!e) return null;
  const o = t?.eventTypes;
  if (!o || typeof o != "object") return null;
  const i = o[e];
  if (!i || typeof i != "object") return null;
  const r = Array.isArray(i.classNames) ? i.classNames.filter((w) => typeof w == "string" && w.length > 0) : typeof i.classNames == "string" && i.classNames.length > 0 ? [i.classNames] : [], s = String(e).toLowerCase().replace(/[^a-z0-9-]+/g, "-"), a = s ? `ec-event-type-${s}` : null, u = a ? [a, ...r.filter((w) => w !== a)] : r;
  return {
    type: e,
    color: typeof i.color == "string" ? i.color : null,
    classNames: u,
    label: typeof i.label == "string" ? i.label : null,
    icon: typeof i.icon == "string" ? i.icon : null
  };
}
function Yo(n) {
  if (typeof n != "string" || n === "") return null;
  let t = n;
  return t.includes("-") || (t = t.replace(/([A-Z])/g, "-$1").toLowerCase()), t.startsWith("-") && (t = t.slice(1)), t.startsWith("data-") || (t = `data-${t}`), /^data-[a-z0-9-]+$/i.test(t) ? t : null;
}
function yn(n, t, e) {
  if (!n || !e) return null;
  const o = n.id;
  if (o == null || o === "" || !e.has(o)) return null;
  const i = n.extendedProps?.appearAnimation ?? t?.eventAppearAnimation;
  return typeof i != "string" || i.length === 0 || !/^[a-z0-9-]+$/i.test(i) ? null : `ec-event-appear-${i}`;
}
function rt(n) {
  const t = n?.extendedProps, e = !!(t && t.rrule), o = t?.series?.id, i = !!(e || o), r = o ?? (e ? n?.id ?? null : null);
  return { isSeriesMember: i, seriesId: r ?? null };
}
function bt() {
  const n = document.createElement("span");
  return n.className = "ec-event-recurring", n.setAttribute("aria-hidden", "true"), n.textContent = "🔁", n;
}
function Go(n, t) {
  const e = $(t);
  return se(e), n.filter((o) => o.start < e && o.end > t);
}
function Wt(n, t) {
  return n.allDay ? "" : new Intl.DateTimeFormat(t.locale, { timeZone: "UTC", ...t.eventTimeFormat }).format(n.start);
}
function ht(n, t) {
  const e = () => {
    const i = t.get("options"), r = i.theme, s = qo(t), a = ke(s, i.hiddenDays ?? []), u = 7 - (i.hiddenDays?.length ?? 0), w = g("div", `${r.grid} ec-day-grid`, "", [
      ["data-grid", "day-grid"]
    ]);
    w.style.setProperty("--ec-cols", String(u));
    const v = g("div", r.colHead, "", [
      ["data-row", "header"]
    ]);
    i.weekNumbers && v.append(g("div", r.weekNumber, ""));
    const h = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayHeaderFormat }), D = i.dayHeaderDensity, c = D ? t.get("filteredEvents") ?? [] : [], f = (S) => {
      const _ = $(S);
      return se(_), c.filter((E) => E.start < _ && E.end > S).length;
    };
    for (const S of a.slice(0, u)) {
      const _ = g("div", r.dayHead, h.format(S), [
        ["data-day", String(S.getUTCDay())]
      ]);
      if (D) {
        const E = f(S);
        if (E > 0)
          if (typeof D == "function") {
            const I = D({ date: S, count: E, max: 3 }), O = g("span", "ec-day-head-density");
            typeof I == "string" ? O.textContent = I : I?.html ? O.innerHTML = I.html : I?.domNodes && I.domNodes.forEach((R) => O.append(R)), _.append(O);
          } else {
            const I = g("span", "ec-day-head-density");
            for (let O = 0; O < Math.min(3, E); ++O)
              I.append(g("span", "ec-day-head-dot"));
            _.append(I);
          }
      }
      v.append(_);
    }
    w.append(v), w.style.setProperty(
      "--ec-cols-with-week",
      String(u + (i.weekNumbers ? 1 : 0))
    );
    let y = g("div", "", "", [["data-row", "days"]]);
    const l = Xo(), b = t.get("currentRange"), T = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayCellFormat ?? { day: "numeric" } });
    for (let S = 0; S < a.length; ++S) {
      S > 0 && S % u === 0 && (w.append(y), y = g("div", "", "", [["data-row", "days"]]));
      const _ = a[S];
      if (i.weekNumbers && S % u === 0) {
        const N = kn(_, i.firstDay ?? 0), K = An(N, i.weekNumberContent, _), H = g("div", r.weekNumber, "", [
          ["data-week", String(N)]
        ]);
        typeof K == "string" ? H.textContent = K : K?.html ? H.innerHTML = K.html : K?.domNodes && H.replaceChildren(...K.domNodes), y.append(H);
      }
      const E = [r.day];
      !b || _ >= b.start && _ < b.end || E.push(r.otherMonth), ye(_, l) && E.push(r.today);
      const O = g("div", E.filter(Boolean).join(" "), "", [
        ["data-date", _.toISOString().substring(0, 10)]
      ]), R = g("div", "ec-day-number", T.format(_));
      if (O.append(R), i.dayCellContent) {
        const N = typeof i.dayCellContent == "function" ? i.dayCellContent({ date: _, view: t.get("view") }) : i.dayCellContent;
        typeof N == "string" ? R.innerText = N : N?.html ? R.innerHTML = N.html : N?.domNodes && R.replaceChildren(...N.domNodes);
      }
      const V = t.get("filteredEvents") ?? [], z = Go(V, _);
      if (z.length) {
        const N = g("div", r.events), K = typeof i.dayMaxEvents == "number" ? i.dayMaxEvents : 1 / 0, H = z.slice(0, K), F = z.slice(K);
        for (const k of H) {
          if (k.display === "background") {
            const C = g("div", r.bgEvent, "", [
              ["data-event-id", k.id],
              ...De(k)
            ]), M = k.backgroundColor ?? i.eventBackgroundColor ?? i.eventColor;
            M && (C.style.backgroundColor = M), O.append(C);
            continue;
          }
          const A = [r.event], X = i.eventClassNames;
          if (typeof X == "function") {
            const C = X({ event: k });
            C && A.push(...Array.isArray(C) ? C : [C]);
          } else X && A.push(...Array.isArray(X) ? X : [X]);
          A.push(...k.classNames), A.push(...vn(k));
          const L = ze(k, i);
          L && A.push(...L.classNames);
          const Y = yn(k, i, t.get("_pendingAppearIds"));
          Y && A.push(Y);
          const Q = i.dayCellEventStyle === "stripe";
          Q && A.push("ec-event-stripe");
          const m = g("div", A.filter(Boolean).join(" "), "", [
            ["data-event-id", k.id],
            ...De(k)
          ]), P = k.backgroundColor ?? L?.color ?? i.eventBackgroundColor ?? i.eventColor, p = k.textColor ?? i.eventTextColor;
          if (P && m.style.setProperty("--ec-event-color", P), p && (m.style.color = p), i.eventContent) {
            const C = i.eventContent, M = typeof C == "function" ? C({ event: k, timeText: Wt(k, i), view: t.get("view") }) : C;
            typeof M == "string" ? m.innerText = M : M?.html ? m.innerHTML = M.html : M?.domNodes && m.replaceChildren(...M.domNodes);
          } else if (Q)
            k.extendedProps?.rrule && m.append(bt()), m.append(g("span", r.eventTitle, k.title || ""));
          else {
            const C = g("span", "ec-event-dot"), M = Wt(k, i);
            M && i.displayEventEnd !== !1 ? m.append(C, g("time", r.eventTime, M + " ")) : m.append(C), k.extendedProps?.rrule && m.append(bt()), m.append(g("span", r.eventTitle, k.title || ""));
          }
          const d = t.get("fire");
          t.get("selectedEventId") === k.id && m.classList.add("ec-event-selected"), m.addEventListener("click", (C) => {
            document.querySelectorAll(".ec-event.ec-event-selected").forEach((M) => M.classList.remove("ec-event-selected")), m.classList.add("ec-event-selected"), t.set("selectedEventId", k.id), d?.("eventClick", { event: k, jsEvent: C, view: t.get("view") });
          }), m.addEventListener("dblclick", (C) => d?.("eventDoubleClick", { event: k, jsEvent: C, view: t.get("view"), el: m })), m.addEventListener("mouseenter", (C) => d?.("eventMouseEnter", { event: k, jsEvent: C, view: t.get("view") })), m.addEventListener("mouseleave", (C) => d?.("eventMouseLeave", { event: k, jsEvent: C, view: t.get("view") })), queueMicrotask(() => d?.("eventDidMount", { event: k, el: m, view: t.get("view") })), N.append(m);
        }
        if (F.length) {
          const k = typeof i.moreLinkContent == "function" ? i.moreLinkContent({ num: F.length, date: _ }) : i.moreLinkContent ?? `+${F.length} more`, A = g(
            "button",
            "ec-more-link",
            typeof k == "object" && k?.html ? "" : k,
            [
              ["type", "button"],
              ["data-more-link", "true"],
              ["data-date", _.toISOString().substring(0, 10)]
            ]
          );
          typeof k == "object" && k?.html && (A.innerHTML = k.html), A.addEventListener("click", () => Vo(t, _, z)), N.append(A);
        }
        O.append(N);
      }
      y.append(O);
    }
    w.append(y), n.replaceChildren(w);
  };
  e();
  const o = t.onAny(({ key: i }) => {
    ["options", "currentRange", "activeRange", "viewDates", "filteredEvents"].includes(i) && e();
  });
  return () => {
    o(), n.replaceChildren();
  };
}
function qo(n) {
  const t = n.get("activeRange");
  if (!t) return null;
  const e = n.get("options");
  if (e.view !== "dayGridMonth") return t;
  const o = e.firstDay ?? 0, i = it(ne($(t.start)), o), r = $(t.end);
  for (ne(r); r.getUTCDay() !== o; ) se(r);
  return { start: i, end: r };
}
function Xo() {
  return ne(/* @__PURE__ */ new Date());
}
function Vo(n, t, e) {
  const o = n.get("options"), i = o.theme, r = new Intl.DateTimeFormat(o.locale, { timeZone: "UTC", ...o.dayPopoverFormat }), s = g("div", `${i.popup} ec-day-popover`, "", [
    ["data-popover", "day"],
    ["data-date", t.toISOString().substring(0, 10)]
  ]), a = g("div", "ec-popup-header");
  a.append(g("div", "ec-popup-title", r.format(t)));
  const u = o.buttonText?.close ?? "Close", w = g("button", "ec-popup-close", u, [
    ["type", "button"],
    ["aria-label", "Close"]
  ]);
  a.append(w), s.append(a);
  const v = g("div", i.events);
  for (const D of e) {
    const c = g("div", i.event, "", [
      ["data-event-id", D.id],
      ...De(D)
    ]);
    D.backgroundColor && c.style.setProperty("--ec-event-color", D.backgroundColor), c.append(g("span", "ec-event-dot"));
    const f = D.allDay ? "" : new Intl.DateTimeFormat(o.locale, { timeZone: "UTC", ...o.eventTimeFormat }).format(D.start);
    f && c.append(g("time", i.eventTime, f + " ")), c.append(g("span", i.eventTitle, D.title || "")), v.append(c);
  }
  s.append(v), document.body.append(s);
  const h = () => s.remove();
  w.addEventListener("click", h), setTimeout(() => {
    document.addEventListener("click", function D(c) {
      s.contains(c.target) || (h(), document.removeEventListener("click", D, !0));
    }, !0);
  }, 0);
}
const Zo = {
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
        component: () => ht,
        dayHeaderFormat: { weekday: "long" },
        displayEventEnd: !1,
        duration: { days: 1 }
      },
      dayGridWeek: {
        component: () => ht,
        displayEventEnd: !1
      },
      dayGridMonth: {
        component: () => ht,
        dayHeaderFormat: { weekday: "short" },
        dayHeaderAriaLabelFormat: { weekday: "long" },
        displayEventEnd: !1,
        duration: { months: 1 },
        titleFormat: { year: "numeric", month: "long" }
      }
    });
  }
};
function wn(n, t, e, o, i) {
  const r = [];
  n = $(n);
  const s = $(n);
  for (ve(n, o.min), ve(s, o.max); n < s; )
    r.push([Ie(n), i.format(n)]), ve(n, t, e);
  const a = En((n - s) / 1e3 / ge(t));
  return a && a !== e && (r.at(-1)[2] = e - a), r;
}
function bn(n, t, e, o, i) {
  const r = re(n), s = re(t);
  if (e) {
    const a = re(
      Lt(ge(r), at(0, ge(s) - vt))
    ), u = re(
      at(ge(s), ge(a) + vt)
    ), w = _e(e?.eventFilter) ? e.eventFilter : (v) => !Bn(v.display);
    e: for (const v of o) {
      const h = ve($(v), r), D = ve($(v), s), c = ve($(v), a), f = ve($(v), u);
      for (const y of i)
        if (!y.allDay && w(y) && y.start < f && y.end > c) {
          if (y.start < h) {
            const l = at((y.start - v) / 1e3, ge(a));
            l < ge(r) && (r.seconds = l);
          }
          if (y.end > D) {
            const l = Lt((y.end - v) / 1e3, ge(u));
            l > ge(s) && (s.seconds = l);
          }
          if (ge(r) === ge(a) && ge(s) === ge(u))
            break e;
        }
    }
  }
  return { min: r, max: s };
}
function zt(n, t) {
  let e = null, o = null;
  const i = () => {
    o && (o(), o = null);
    const s = t.get("options"), a = s.theme, u = t.get("activeRange");
    if (!u) return;
    const w = n.querySelector('[data-row="body"]');
    w && (e = w.scrollTop);
    const v = ke(u, s.hiddenDays ?? []), h = g("div", `${a.grid} ec-time-grid`, "", [
      ["data-grid", "time-grid"]
    ]);
    h.style.setProperty("--ec-cols", String(v.length));
    const D = g("div", `${a.colHead}`, "", [
      ["data-row", "header"]
    ]);
    D.append(g("div", `${a.sidebar} ec-corner`));
    const c = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayHeaderFormat }), f = s.dayHeaderDensity, y = f ? t.get("filteredEvents") ?? [] : [], l = (H) => {
      const F = $(H);
      return se(F), y.filter((k) => k.start < F && k.end > H).length;
    };
    for (const H of v) {
      const F = g("div", a.dayHead, c.format(H), [
        ["data-day", String(H.getUTCDay())]
      ]);
      if (f) {
        const k = l(H);
        if (k > 0)
          if (typeof f == "function") {
            const A = f({ date: H, count: k, max: 3 }), X = g("span", "ec-day-head-density");
            typeof A == "string" ? X.textContent = A : A?.html ? X.innerHTML = A.html : A?.domNodes && A.domNodes.forEach((L) => X.append(L)), F.append(X);
          } else {
            const A = g("span", "ec-day-head-density");
            for (let X = 0; X < Math.min(3, k); ++X)
              A.append(g("span", "ec-day-head-dot"));
            F.append(A);
          }
      }
      D.append(F);
    }
    h.append(D);
    const b = t.get("filteredEvents") ?? [];
    if (s.allDaySlot) {
      const H = g("div", a.allDay, "", [
        ["data-row", "all-day"]
      ]), F = g("div", a.sidebar + " ec-all-day-label"), k = s.allDayContent;
      if (typeof k == "function") {
        const Y = k({ view: t.get("view") });
        typeof Y == "string" ? F.textContent = Y : Y?.html && (F.innerHTML = Y.html);
      } else typeof k == "string" ? F.textContent = k : k?.html ? F.innerHTML = k.html : F.textContent = "all-day";
      H.append(F);
      const A = g("div", "ec-all-day-cols");
      A.style.setProperty("--ec-cols", String(v.length));
      const X = [];
      for (const Y of v) {
        const Q = g("div", `${a.day} ec-all-day-cell`, "", [
          ["data-date", Y.toISOString().substring(0, 10)]
        ]);
        A.append(Q), X.push(Q);
      }
      const L = b.filter((Y) => Y.allDay);
      for (const Y of L) {
        let Q = -1, m = -1;
        for (let M = 0; M < v.length; ++M) {
          const x = v[M], G = $(x);
          se(G), Y.start < G && Y.end > x && (Q === -1 && (Q = M), m = M);
        }
        if (Q === -1) continue;
        const P = m - Q + 1, p = g("div", a.event, "", [
          ["data-event-id", Y.id],
          ...De(Y)
        ]), d = Y.backgroundColor;
        d && p.style.setProperty("--ec-event-color", d), Y.textColor && (p.style.color = Y.textColor), p.style.position = "absolute", p.style.left = "1px", p.style.right = "auto", p.style.top = "2px", p.style.width = `calc(${P * 100}% + ${P - 1}px - 2px)`, p.style.overflow = "hidden", p.append(g("div", a.eventTitle, Y.title || ""));
        const C = t.get("fire");
        t.get("selectedEventId") === Y.id && p.classList.add("ec-event-selected"), p.addEventListener("click", (M) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((x) => x.classList.remove("ec-event-selected")), p.classList.add("ec-event-selected"), t.set("selectedEventId", Y.id), C?.("eventClick", { event: Y, jsEvent: M, view: t.get("view") });
        }), p.addEventListener("dblclick", (M) => C?.("eventDoubleClick", { event: Y, jsEvent: M, view: t.get("view"), el: p })), X[Q].append(p);
      }
      H.append(A), h.append(H);
    }
    const T = g("div", "ec-time-body", "", [
      ["data-row", "body"]
    ]), S = bn(
      s.slotMinTime,
      s.slotMaxTime,
      s.flexibleSlotTimeLimits,
      v,
      b
    ), _ = {
      format: (H) => new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.slotLabelFormat }).format(H)
    }, E = Jo(s.slotLabelInterval, s.slotDuration), I = wn(
      u.start,
      s.slotDuration,
      E,
      S,
      _
    ), O = g("div", a.sidebar);
    for (const [H, F] of I) {
      const k = g("div", a.slot, "");
      if (k.style.height = `${s.slotHeight}px`, F) {
        const A = /* @__PURE__ */ new Date(H + "Z"), X = A.getUTCHours();
        if (A.getUTCMinutes() === 0) if (X === 12)
          k.append(g("span", "ec-slot-hour", "Noon"));
        else {
          const Y = X % 12 || 12, Q = X >= 12 ? "pm" : "am";
          k.append(g("span", "ec-slot-hour", String(Y))), k.append(g("span", "ec-slot-period", Q));
        }
      }
      O.append(k);
    }
    T.append(O);
    const R = g("div", a.grid + " ec-days");
    R.style.setProperty("--ec-cols", String(v.length)), s.columnWidth && R.style.setProperty("--ec-col-w", `${s.columnWidth}px`);
    for (const H of v) {
      const F = g("div", `${a.day} ec-time-col`, "", [
        ["data-date", H.toISOString().substring(0, 10)]
      ]);
      for (let x = 0; x < I.length; ++x) {
        const G = g("div", a.slot);
        G.style.height = `${s.slotHeight}px`, F.append(G);
      }
      const k = g("div", "ec-event-overlay"), A = Ko(b, H).filter((x) => !x.allDay), X = ne($(H)), L = $(X);
      se(L);
      const Y = /* @__PURE__ */ new Map();
      for (const x of A) {
        const G = x.start < X, U = x.end > L;
        Y.set(x, {
          visStart: G ? X : x.start,
          visEnd: U ? L : x.end,
          startsBefore: G,
          endsAfter: U
        });
      }
      const Q = A.filter((x) => x.display !== "background").map((x) => ({
        start: Y.get(x).visStart,
        end: Y.get(x).visEnd,
        event: x
      })), m = cn(Q), P = /* @__PURE__ */ new Map();
      for (const x of Q) P.set(x.event, m.get(x));
      const p = 16, d = Ce(s.slotDuration) / 60, C = Ce(S.min) / 60, M = s.slotHeight / d;
      for (const x of A) {
        const G = Y.get(x), { visStart: U, visEnd: q, startsBefore: Z, endsAfter: J } = G, B = (U.getTime() - X.getTime()) / 6e4 - C, j = (q.getTime() - X.getTime()) / 6e4 - C;
        if (x.display === "background") {
          const le = ["ec-bg-event"], Me = s.eventClassNames;
          if (typeof Me == "function") {
            const Te = Me({ event: x });
            Te && le.push(...Array.isArray(Te) ? Te : [Te]);
          } else Me && le.push(...Array.isArray(Me) ? Me : [Me]);
          x.classNames && le.push(...Array.isArray(x.classNames) ? x.classNames : [x.classNames]);
          const me = g("div", le.filter(Boolean).join(" "), "", [
            ["data-event-id", x.id],
            ...De(x)
          ]);
          me.style.position = "absolute", me.style.top = `${B * M}px`, me.style.height = `${Math.max((j - B) * M, 12)}px`, me.style.left = "0", me.style.right = "0", me.style.zIndex = "0", x.backgroundColor && (me.style.background = x.backgroundColor);
          const xt = s.eventContent;
          if (typeof xt == "function") {
            const Te = xt({ event: x });
            typeof Te == "string" ? me.textContent = Te : Te?.html ? me.innerHTML = Te.html : Te?.domNodes && Te.domNodes.forEach((Dn) => me.append(Dn));
          }
          k.append(me);
          continue;
        }
        const W = [a.event];
        Z && W.push("ec-event-continues-from"), J && W.push("ec-event-continues-to");
        const te = s.eventClassNames;
        if (typeof te == "function") {
          const le = te({ event: x });
          le && W.push(...Array.isArray(le) ? le : [le]);
        } else te && W.push(...Array.isArray(te) ? te : [te]);
        x.classNames && W.push(...Array.isArray(x.classNames) ? x.classNames : [x.classNames]), W.push(...vn(x));
        const ie = ze(x, s);
        ie && W.push(...ie.classNames);
        const ce = yn(x, s, t.get("_pendingAppearIds"));
        ce && W.push(ce);
        const ee = g("div", W.filter(Boolean).join(" "), "", [
          ["data-event-id", x.id],
          ["data-event-start", x.start.toISOString()],
          ["data-event-end", x.end.toISOString()],
          ...De(x)
        ]), ue = P.get(x) ?? 0;
        ee.style.position = "absolute", ee.style.top = `${B * M}px`;
        const ae = Math.max((j - B) * M, 12);
        ee.style.height = `${ae}px`, ae < 36 && ee.classList.add("ec-event-compact"), ee.style.left = ue === 0 ? "0" : `${ue * p}px`, ee.style.right = "0", ue > 0 && (ee.style.zIndex = String(ue + 1));
        const oe = x.backgroundColor ?? ie?.color;
        oe && ee.style.setProperty("--ec-event-color", oe);
        const we = g("div", a.eventTitle);
        x.extendedProps?.rrule && we.append(bt()), we.append(document.createTextNode(x.title || "")), ee.append(we);
        const fe = g("div", a.eventTime ?? "ec-event-time");
        if (fe.innerHTML = Qo, fe.append(document.createTextNode(Tn(U, q, s))), ee.append(fe), s.editable && s.eventDurationEditable !== !1) {
          if (!J) {
            const le = g("div", `${a.resizer ?? "ec-resizer"} ec-resizer-end`, "", [
              ["data-resizer", "end"]
            ]);
            ee.append(le);
          }
          if (s.eventResizableFromStart && !Z) {
            const le = g("div", `${a.resizer ?? "ec-resizer"} ec-resizer-start`, "", [
              ["data-resizer", "start"]
            ]);
            ee.append(le);
          }
        }
        const be = t.get("fire");
        t.get("selectedEventId") === x.id && ee.classList.add("ec-event-selected"), ee.addEventListener("click", (le) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((Me) => Me.classList.remove("ec-event-selected")), ee.classList.add("ec-event-selected"), t.set("selectedEventId", x.id), be?.("eventClick", { event: x, jsEvent: le, view: t.get("view") });
        }), ee.addEventListener("dblclick", (le) => be?.("eventDoubleClick", { event: x, jsEvent: le, view: t.get("view"), el: ee })), ee.addEventListener("mouseenter", (le) => be?.("eventMouseEnter", { event: x, jsEvent: le, view: t.get("view") })), ee.addEventListener("mouseleave", (le) => be?.("eventMouseLeave", { event: x, jsEvent: le, view: t.get("view") })), queueMicrotask(() => be?.("eventDidMount", { event: x, el: ee, view: t.get("view") })), k.append(ee);
      }
      if (F.style.position = "relative", F.append(k), s.nowIndicator) {
        const x = ne(de(/* @__PURE__ */ new Date()));
        if (ye(x, ne($(H)))) {
          const U = g("div", a.nowIndicator, "", [
            ["data-now-indicator", ""]
          ]), q = Ce(S.min) / 60, Z = Ce(s.slotDuration) / 60, J = s.slotHeight / Z;
          U.style.position = "absolute", U.style.left = "0", U.style.right = "0", U.style.height = "2px", U.style.background = "#dc2626", U.style.zIndex = "5";
          const B = (j) => {
            const W = j instanceof Date ? j : de(/* @__PURE__ */ new Date()), te = W.getUTCHours() * 60 + W.getUTCMinutes() - q;
            U.style.top = `${te * J}px`;
          };
          B(t.get("now")), F.append(U), o = t.on("change:now", ({ value: j }) => B(j));
        }
      }
      R.append(F);
    }
    T.append(R), h.append(T), n.replaceChildren(h);
    const V = Ce(S.min) / 60, z = Ce(S.max) / 60, N = Ce(s.slotDuration) / 60, K = s.slotHeight / N;
    if (e != null)
      T.scrollTop = e;
    else {
      const H = /* @__PURE__ */ new Date(), F = ne(/* @__PURE__ */ new Date()), k = v.some((X) => ye(F, ne($(X)))), A = H.getHours() * 60 + H.getMinutes();
      if (k && A >= V && A <= z) {
        const X = (A - V) * K, L = T.clientHeight || 0;
        T.scrollTop = Math.max(0, X - L / 2), e = T.scrollTop;
      } else if (s.scrollTime) {
        const L = (Ce(s.scrollTime) / 60 - V) * K;
        T.scrollTop = Math.max(0, L), e = T.scrollTop;
      }
    }
  };
  i();
  const r = t.onAny(({ key: s }) => {
    ["options", "currentRange", "activeRange", "viewDates", "filteredEvents", "today"].includes(s) && i();
  });
  return () => {
    r(), o && (o(), o = null), n.replaceChildren();
  };
}
function Ko(n, t) {
  const e = $(t);
  return se(e), n.filter((o) => o.start < e && o.end > t);
}
function Ce(n) {
  return n.days * 86400 + n.seconds;
}
function Jo(n, t) {
  return n ? Math.max(1, Math.round(
    Ce(n) / Ce(t)
  )) : 1;
}
function Tn(n, t, e) {
  const o = e?.eventTimeFormat || { hour: "numeric", minute: "2-digit" }, i = new Intl.DateTimeFormat(e?.locale, { timeZone: "UTC", ...o });
  if (!t || n.getTime() === t.getTime()) return i.format(n);
  const r = i.formatToParts(n), s = i.formatToParts(t), a = r.find((y) => y.type === "dayPeriod")?.value, u = s.find((y) => y.type === "dayPeriod")?.value, w = n.getMinutes() === 0, v = t.getMinutes() === 0, h = (y, l, b) => y.filter((T) => !(l && T.type === "dayPeriod")).filter((T) => !(l && T.type === "literal" && T.value.trim() === "" && T === y[y.length - 1])).filter((T, S, _) => b ? !(T.type === "minute" || T.type === "literal" && T.value === ":") : !0).map((T) => T.value).join(""), c = h(r, a && u && a === u, w), f = h(s, !1, v);
  return `${c.trim()} – ${f.trim()}`;
}
const Qo = '<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>', jo = {
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
        component: () => zt,
        dayHeaderFormat: { weekday: "long" },
        duration: { days: 1 },
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      },
      timeGridWeek: {
        component: () => zt,
        duration: { weeks: 1 }
      }
    });
  },
  createParsers(n) {
    Object.assign(n, {
      scrollTime: re,
      slotDuration: re,
      slotLabelInterval: Le(re),
      slotMaxTime: re,
      slotMinTime: re,
      snapDuration: Le(re)
    });
  }
};
function Ze(n, t) {
  const e = () => {
    const i = t.get("options"), r = i.theme, s = t.get("activeRange");
    if (!s) return;
    const a = ke(s, i.hiddenDays ?? []), u = t.get("filteredEvents") ?? [], w = g("div", `${r.grid} ec-list`, "", [
      ["data-grid", "list"]
    ]), v = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.listDayFormat }), h = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.listDaySideFormat }), D = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.eventTimeFormat });
    let c = 0;
    for (const f of a) {
      const y = $(f);
      se(y);
      const l = u.filter((T) => T.start < y && T.end > f);
      if (!l.length) continue;
      c += l.length;
      const b = g("div", r.dayHead, "", [
        ["data-row", "day-header"],
        ["data-date", f.toISOString().substring(0, 10)]
      ]);
      b.append(g("span", "", v.format(f))), b.append(g("span", r.daySide, h.format(f))), w.append(b);
      for (const T of l) {
        const S = [r.event], _ = i.eventClassNames;
        if (typeof _ == "function") {
          const z = _({ event: T });
          z && S.push(...Array.isArray(z) ? z : [z]);
        } else _ && S.push(...Array.isArray(_) ? _ : [_]);
        T.classNames && S.push(...Array.isArray(T.classNames) ? T.classNames : [T.classNames]);
        const E = ze(T, i);
        E && S.push(...E.classNames);
        const I = g("div", S.filter(Boolean).join(" "), "", [
          ["data-event-id", T.id],
          ...De(T)
        ]), O = T.backgroundColor ?? E?.color;
        O && I.style.setProperty("--ec-event-color", O), I.append(g("span", r.eventTag));
        const R = T.allDay ? "all-day" : D.format(T.start);
        I.append(g("time", r.eventTime, R)), I.append(g("span", r.eventTitle, T.title || ""));
        const V = t.get("fire");
        t.get("selectedEventId") === T.id && I.classList.add("ec-event-selected"), I.addEventListener("click", (z) => {
          document.querySelectorAll(".ec-event.ec-event-selected").forEach((N) => N.classList.remove("ec-event-selected")), I.classList.add("ec-event-selected"), t.set("selectedEventId", T.id), V?.("eventClick", { event: T, jsEvent: z, view: t.get("view") });
        }), I.addEventListener("dblclick", (z) => V?.("eventDoubleClick", { event: T, jsEvent: z, view: t.get("view"), el: I })), I.addEventListener("mouseenter", (z) => V?.("eventMouseEnter", { event: T, jsEvent: z, view: t.get("view") })), I.addEventListener("mouseleave", (z) => V?.("eventMouseLeave", { event: T, jsEvent: z, view: t.get("view") })), queueMicrotask(() => V?.("eventDidMount", { event: T, el: I, view: t.get("view") })), w.append(I);
      }
    }
    if (c === 0) {
      const f = g("div", r.noEvents), y = i.noEventsContent;
      if (typeof y == "function") {
        const l = y();
        typeof l == "string" ? f.textContent = l : l?.html && (f.innerHTML = l.html);
      } else typeof y == "string" ? f.textContent = y : y?.html && (f.innerHTML = y.html);
      typeof i.noEventsClick == "function" && (f.style.cursor = "pointer", f.addEventListener("click", (l) => i.noEventsClick({ jsEvent: l }))), w.append(f);
    }
    n.replaceChildren(w);
  };
  e();
  const o = t.onAny(({ key: i }) => {
    ["options", "currentRange", "activeRange", "viewDates", "filteredEvents"].includes(i) && e();
  });
  return () => {
    o(), n.replaceChildren();
  };
}
const ei = {
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
        component: () => Ze,
        duration: { days: 1 },
        titleFormat: { year: "numeric", month: "long", day: "numeric" }
      },
      listWeek: {
        component: () => Ze,
        duration: { weeks: 1 }
      },
      listMonth: {
        component: () => Ze,
        duration: { months: 1 },
        titleFormat: { year: "numeric", month: "long" }
      },
      listYear: {
        component: () => Ze,
        duration: { years: 1 },
        titleFormat: { year: "numeric" }
      }
    });
  }
}, gt = 1440;
function Ke(n) {
  if (typeof n != "string") return null;
  const t = /^(\d{1,2}):(\d{2})$/.exec(n.trim());
  if (!t) return null;
  const e = Number(t[1]), o = Number(t[2]);
  return e < 0 || e > 24 || o < 0 || o > 59 ? null : e * 60 + o;
}
function ti(n) {
  const t = n.getFullYear ? n.getFullYear() : NaN;
  if (Number.isNaN(t)) return null;
  const e = String(n.getMonth() + 1).padStart(2, "0"), o = String(n.getDate()).padStart(2, "0");
  return `${t}-${e}-${o}`;
}
function ni(n, t) {
  if (!n || typeof n != "object" || !t) return null;
  const e = n.overrides;
  if (e && typeof e == "object") {
    const a = ti(t);
    if (a && Object.prototype.hasOwnProperty.call(e, a)) {
      const u = e[a];
      if (u === null) return { startMin: 0, endMin: 0 };
      if (u && typeof u == "object") {
        const w = Ke(u.start), v = Ke(u.end);
        return w != null && v != null && v > w ? { startMin: w, endMin: v } : { startMin: 0, endMin: 0 };
      }
    }
  }
  const o = t.getDay ? t.getDay() : null, i = n.daysOfWeek;
  if (Array.isArray(i) && o != null && !i.includes(o))
    return { startMin: 0, endMin: 0 };
  const r = Ke(n.start), s = Ke(n.end);
  return r == null || s == null || s <= r ? { startMin: 0, endMin: 0 } : { startMin: r, endMin: s };
}
function Cn(n, t) {
  const e = ni(n, t);
  if (e == null) return [];
  const { startMin: o, endMin: i } = e;
  if (o === i) return [{ startMin: 0, endMin: gt }];
  const r = [];
  return o > 0 && r.push({ startMin: 0, endMin: o }), i < gt && r.push({ startMin: i, endMin: gt }), r;
}
function Yt(n, t) {
  const e = () => {
    const i = t.get("options"), r = i.theme, s = t.get("activeRange"), a = t.get("resources") ?? i.resources ?? [];
    if (!s || !a.length) {
      n.replaceChildren(g(
        "div",
        r.noEvents,
        "No resources configured"
      ));
      return;
    }
    const u = ke(s, i.hiddenDays ?? []), w = t.get("filteredEvents") ?? [];
    let v = a.filter((_) => _.visible !== !1);
    i.filterResourcesWithEvents && (v = a.filter((_) => w.some((E) => E.resourceIds.includes(_.id))));
    const h = g("div", `${r.grid} ec-resource ec-time-grid`, "", [
      ["data-grid", "resource-time-grid"]
    ]);
    h.style.setProperty("--ec-cols", String(u.length * v.length));
    const D = g("div", r.colHead, "", [["data-row", "header"]]);
    D.append(g("div", `${r.sidebar} ec-corner`));
    const c = new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.dayHeaderFormat });
    for (const _ of u)
      for (const E of v) {
        const I = g("div", r.dayHead, "", [
          ["data-day", String(_.getUTCDay())],
          ["data-resource-id", E.id]
        ]), O = g("div", "", c.format(_)), R = g("div", r.resourceLabel, "", [
          ["data-resource-label", ""]
        ]), V = i.resourceLabelContent;
        let z = E.title;
        if (typeof V == "function") {
          const N = V({ resource: E });
          typeof N == "string" ? z = N : N?.html && (R.innerHTML = N.html, z = null);
        }
        z !== null && (R.textContent = z), typeof i.resourceLabelDidMount == "function" && queueMicrotask(() => i.resourceLabelDidMount({ resource: E, el: R })), i.datesAboveResources ? I.append(O, R) : I.append(R, O), D.append(I);
      }
    h.append(D);
    const f = g("div", "ec-time-body", "", [["data-row", "body"]]), y = bn(
      i.slotMinTime,
      i.slotMaxTime,
      i.flexibleSlotTimeLimits,
      u,
      w
    ), l = {
      format: (_) => new Intl.DateTimeFormat(i.locale, { timeZone: "UTC", ...i.slotLabelFormat }).format(_)
    }, b = wn(
      s.start,
      i.slotDuration,
      1,
      y,
      l
    ), T = g("div", r.sidebar);
    for (const [_, E] of b) {
      const I = g("div", r.slot, E);
      I.style.height = `${i.slotHeight}px`, T.append(I);
    }
    f.append(T);
    const S = g("div", `${r.grid} ec-days`);
    S.style.setProperty("--ec-cols", String(u.length * v.length));
    for (const _ of u)
      for (const E of v) {
        const I = g("div", `${r.day} ec-time-col`, "", [
          ["data-date", _.toISOString().substring(0, 10)],
          ["data-resource-id", E.id]
        ]);
        for (let L = 0; L < b.length; ++L) {
          const Y = g("div", r.slot);
          Y.style.height = `${i.slotHeight}px`, I.append(Y);
        }
        const O = mt(i.slotDuration) / 60, R = mt(y.min) / 60, V = mt(y.max) / 60, z = i.slotHeight / O, N = Cn(E.workingHours, _);
        for (const L of N) {
          const Y = Math.max(L.startMin, R), Q = Math.min(L.endMin, V);
          if (Q <= Y) continue;
          const m = g("div", "ec-resource-offhours");
          m.style.position = "absolute", m.style.left = "0", m.style.right = "0", m.style.top = `${(Y - R) * z}px`, m.style.height = `${(Q - Y) * z}px`, m.style.pointerEvents = "none", m.style.zIndex = "0", I.append(m);
        }
        const K = g("div", "ec-event-overlay"), H = $(_);
        se(H);
        const F = w.filter(
          (L) => !L.allDay && L.start < H && L.end > _ && (L.resourceIds.length === 0 || L.resourceIds.includes(E.id))
        ), k = F.filter((L) => L.display !== "background"), A = cn(k), X = 16;
        for (const L of F) {
          const Y = Gt(L.start) - R, Q = Gt(L.end) - R;
          if (L.display === "background") {
            const q = ["ec-bg-event"], Z = i.eventClassNames;
            if (typeof Z == "function") {
              const j = Z({ event: L });
              j && q.push(...Array.isArray(j) ? j : [j]);
            } else Z && q.push(...Array.isArray(Z) ? Z : [Z]);
            L.classNames && q.push(...Array.isArray(L.classNames) ? L.classNames : [L.classNames]);
            const J = g("div", q.filter(Boolean).join(" "), "", [
              ["data-event-id", L.id],
              ...De(L)
            ]);
            J.style.position = "absolute", J.style.top = `${Y * z}px`, J.style.height = `${Math.max((Q - Y) * z, 12)}px`, J.style.left = "0", J.style.right = "0", J.style.zIndex = "0", L.backgroundColor && (J.style.background = L.backgroundColor);
            const B = i.eventContent;
            if (typeof B == "function") {
              const j = B({ event: L });
              typeof j == "string" ? J.textContent = j : j?.html ? J.innerHTML = j.html : j?.domNodes && j.domNodes.forEach((W) => J.append(W));
            }
            K.append(J);
            continue;
          }
          const m = [r.event], P = i.eventClassNames;
          if (typeof P == "function") {
            const q = P({ event: L });
            q && m.push(...Array.isArray(q) ? q : [q]);
          } else P && m.push(...Array.isArray(P) ? P : [P]);
          L.classNames && m.push(...Array.isArray(L.classNames) ? L.classNames : [L.classNames]);
          const p = ze(L, i);
          p && m.push(...p.classNames);
          const d = g("div", m.filter(Boolean).join(" "), "", [
            ["data-event-id", L.id],
            ...De(L)
          ]), C = A.get(L) ?? 0;
          d.style.position = "absolute", d.style.top = `${Y * z}px`;
          const M = Math.max((Q - Y) * z, 12);
          d.style.height = `${M}px`, M < 36 && d.classList.add("ec-event-compact"), d.style.left = C === 0 ? "0" : `${C * X}px`, d.style.right = "0", C > 0 && (d.style.zIndex = String(C + 1));
          const x = L.backgroundColor ?? p?.color ?? E.eventBackgroundColor;
          x && d.style.setProperty("--ec-event-color", x), d.append(g("div", r.eventTitle, L.title || ""));
          const G = g("div", r.eventTime ?? "ec-event-time");
          G.innerHTML = '<svg class="ec-clock-icon" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5 V6 L7.7 7" stroke-linecap="round"/></svg>', G.append(document.createTextNode(Tn(L.start, L.end, i))), d.append(G);
          const U = t.get("fire");
          d.addEventListener("click", (q) => U?.("eventClick", { event: L, jsEvent: q, view: t.get("view"), resource: E })), d.addEventListener("dblclick", (q) => U?.("eventDoubleClick", { event: L, jsEvent: q, view: t.get("view"), resource: E, el: d })), d.addEventListener("mouseenter", (q) => U?.("eventMouseEnter", { event: L, jsEvent: q, view: t.get("view"), resource: E })), d.addEventListener("mouseleave", (q) => U?.("eventMouseLeave", { event: L, jsEvent: q, view: t.get("view"), resource: E })), queueMicrotask(() => U?.("eventDidMount", { event: L, el: d, view: t.get("view"), resource: E })), K.append(d);
        }
        I.style.position = "relative", I.append(K), S.append(I);
      }
    f.append(S), h.append(f), n.replaceChildren(h);
  };
  e();
  const o = t.onAny(({ key: i }) => {
    [
      "options",
      "currentRange",
      "activeRange",
      "viewDates",
      "filteredEvents",
      "resources"
    ].includes(i) && e();
  });
  return () => {
    o(), n.replaceChildren();
  };
}
function Gt(n) {
  return n.getUTCHours() * 60 + n.getUTCMinutes();
}
function mt(n) {
  return n.days * 86400 + n.seconds;
}
const qt = {
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
        component: () => Yt,
        dayHeaderFormat: { weekday: "long" },
        duration: { days: 1 }
      },
      resourceTimeGridWeek: {
        component: () => Yt,
        duration: { weeks: 1 }
      }
    });
  },
  createParsers(n) {
    "scrollTime" in n || Object.assign(n, {
      scrollTime: re,
      slotDuration: re,
      slotLabelInterval: Le(re),
      slotMaxTime: re,
      slotMinTime: re,
      snapDuration: Le(re)
    });
  }
};
function oi({
  resources: n,
  resourceGroups: t,
  resourceGroupField: e,
  groupState: o,
  ungroupedTitle: i = "Other"
}) {
  const r = /* @__PURE__ */ new Map(), s = [];
  if (Array.isArray(t))
    for (const h of t) {
      const D = String(h.id), c = o.get(D);
      r.set(D, {
        id: D,
        title: h.title ?? "",
        color: h.color,
        resourceIds: Array.isArray(h.resourceIds) ? h.resourceIds.map(String) : [],
        action: h.action,
        expanded: c ?? h.expanded ?? !0
      }), s.push(D);
    }
  if (e)
    for (const h of n) {
      const D = h[e] ?? h.extendedProps?.[e];
      if (D == null || D === "") continue;
      const c = String(D);
      if (!r.has(c)) {
        const y = o.get(c);
        r.set(c, {
          id: c,
          title: h[`${e}Title`] ?? h.extendedProps?.[`${e}Title`] ?? c,
          color: h[`${e}Color`] ?? h.extendedProps?.[`${e}Color`],
          resourceIds: [],
          expanded: y ?? !0
        }), s.push(c);
      }
      const f = r.get(c);
      f.resourceIds.includes(h.id) || f.resourceIds.push(h.id);
    }
  const a = /* @__PURE__ */ new Set();
  for (const h of r.values()) for (const D of h.resourceIds) a.add(D);
  const u = [];
  for (const h of s) {
    const D = r.get(h);
    if (D && (u.push({ kind: "group", group: D }), !!D.expanded))
      for (const c of D.resourceIds) {
        const f = n.find((y) => y.id === c);
        f && u.push({ kind: "resource", resource: f, group: D });
      }
  }
  const w = n.filter((h) => !a.has(h.id));
  if (w.length === 0) return { layout: u, groupsById: r };
  if (s.length > 0 && i) {
    const h = "__ungrouped", D = o.get(h), c = {
      id: h,
      title: i,
      color: void 0,
      resourceIds: w.map((f) => f.id),
      expanded: D ?? !0,
      synthetic: !0
    };
    if (r.set(h, c), u.push({ kind: "group", group: c }), c.expanded)
      for (const f of w) u.push({ kind: "resource", resource: f, group: c });
  } else
    for (const h of w) u.push({ kind: "resource", resource: h, group: null });
  return { layout: u, groupsById: r };
}
function Fe(n, t) {
  const e = t.get("resourceGroupState") ?? /* @__PURE__ */ new Map();
  t.set("resourceGroupState", e);
  let o = null;
  const i = () => {
    o && (o(), o = null);
    const s = t.get("options"), a = s.theme, u = t.get("activeRange"), w = t.get("resources") ?? s.resources ?? [];
    if (!u) return;
    const v = ke(u, s.hiddenDays ?? []), h = t.get("filteredEvents") ?? [], D = s.slotMode === "hours" ? "hours" : "days", c = Xt(s.slotMinTime) / 3600, f = Xt(s.slotMaxTime) / 3600, y = D === "hours" ? Math.max(1, Math.round(f - c)) : 1, l = D === "hours" ? s.slotWidth ?? 48 : s.slotWidth ?? 32, b = v.length * y, T = b * l, S = (p) => {
      const d = v.findIndex((q) => {
        const Z = $(q);
        return se(Z), p < Z && p >= q;
      });
      if (D === "days")
        return d === -1 ? p < v[0] ? 0 : T : d * l;
      let C = d;
      if (C === -1)
        return p < v[0] ? 0 : T;
      const M = ne($(v[C])), x = (p.getTime() - M.getTime()) / 6e4, U = Math.max(c * 60, Math.min(f * 60, x)) / 60 - c;
      return C * y * l + U * l;
    }, _ = g("div", `${a.grid} ec-timeline ec-resource ec-timeline-mode-${D}`, "", [
      ["data-grid", "resource-timeline"],
      ["data-slot-mode", D]
    ]);
    s.dayHeaderTodayStyle === "circle" && _.classList.add("ec-day-head-today-circle");
    const E = t.get("rowHeight");
    E && _.style.setProperty("--ec-timeline-row-h", `${E}px`);
    const I = g("div", a.colHead, "", [["data-row", "header"]]), O = g("div", `${a.rowHead} ec-corner`);
    I.append(O);
    const R = g("div", a.slots);
    R.style.width = `${T}px`;
    const V = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", ...s.dayHeaderFormat }), z = ne(de(/* @__PURE__ */ new Date()));
    for (const p of v) {
      const d = ye(z, ne($(p))), C = g("div", `${a.dayHead}${d ? " ec-day-head-today" : ""}`, "", [
        ["data-day", String(p.getUTCDay())],
        ["data-date", p.toISOString().substring(0, 10)]
      ]);
      if (s.dayHeaderTodayStyle === "circle" && d) {
        const M = V.format(p), x = p.getUTCDate(), G = M.indexOf(String(x));
        if (G >= 0) {
          const U = M.slice(0, G), q = M.slice(G + String(x).length);
          U && C.append(document.createTextNode(U));
          const Z = g("span", "ec-day-head-today-disc", String(x));
          C.append(Z), q && C.append(document.createTextNode(q));
        } else
          C.textContent = M;
      } else
        C.textContent = V.format(p);
      C.style.width = `${l * y}px`, R.append(C);
    }
    if (I.append(R), D === "hours") {
      const p = new Intl.DateTimeFormat(s.locale, { timeZone: "UTC", hour: "numeric" }), d = g("div", `${a.colHead} ec-timeline-hour-head`, "", [
        ["data-row", "hour-header"]
      ]);
      d.append(g("div", a.rowHead));
      const C = g("div", `${a.slots} ec-timeline-hour-strip`);
      C.style.width = `${T}px`;
      for (let M = 0; M < v.length; ++M)
        for (let x = 0; x < y; ++x) {
          const G = $(v[M]);
          G.setUTCHours(c + x, 0, 0, 0);
          const U = g("div", `${a.dayHead} ec-hour-head`, p.format(G), [
            ["data-hour", String(c + x)]
          ]);
          U.style.width = `${l}px`, C.append(U);
        }
      d.append(C), _.append(I, d);
    } else
      _.append(I);
    const N = w.filter((p) => (Re(p)?.level ?? 0) === 0);
    if (s.resourceExpand !== void 0) {
      const p = (d, C) => {
        const M = Re(d);
        if (M) {
          (s.resourceExpand === "all" || s.resourceExpand === !0 || typeof s.resourceExpand == "number" && C < s.resourceExpand) && (d.expanded = !0);
          for (const x of M.children) p(x, C + 1);
        }
      };
      for (const d of N) p(d, 0);
    }
    const { layout: K, groupsById: H } = oi({
      resources: N,
      resourceGroups: s.resourceGroups,
      resourceGroupField: s.resourceGroupField,
      ungroupedTitle: s.ungroupedGroupTitle,
      groupState: e
    });
    t.set("resourceGroupsById", H);
    const F = /* @__PURE__ */ new Map();
    for (const p of H.values())
      for (const d of p.resourceIds) F.set(d, p);
    const k = (p) => F.get(p.id) ?? null, A = g("div", "ec-timeline-body", "", [["data-row", "body"]]);
    A.style.position = "relative";
    let X = -1;
    for (let p = 0; p < v.length; p++)
      if (ye(z, ne($(v[p])))) {
        X = p;
        break;
      }
    if (X >= 0) {
      const p = X * y * l, d = l * y, C = g("div", "ec-timeline-today-band", "", [
        ["data-today-band", ""]
      ]);
      if (C.style.position = "absolute", C.style.top = "0", C.style.bottom = "0", C.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${p}px)`, C.style.width = `${d}px`, C.style.pointerEvents = "none", C.style.zIndex = "0", A.append(C), s.nowIndicator) {
        const M = g("div", "ec-timeline-now-line", "", [
          ["data-now-indicator", ""]
        ]);
        M.style.position = "absolute", M.style.top = "0", M.style.bottom = "0", M.style.width = "2px", M.style.background = "var(--ec-now-indicator-color, #dc2626)", M.style.pointerEvents = "none", M.style.zIndex = "1";
        const x = v[X], G = (U) => {
          const Z = ((U instanceof Date ? U : de(/* @__PURE__ */ new Date())).getTime() - x.getTime()) / 6e4;
          let J;
          D === "hours" ? J = (Math.max(c * 60, Math.min(f * 60, Z)) - c * 60) / 60 * l : J = Math.max(0, Math.min(1440, Z)) / 1440 * l, M.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${p + J}px)`;
        };
        G(t.get("now")), A.append(M), o = t.on("change:now", ({ value: U }) => G(U));
      }
    }
    const L = t.get("suggestedSlot");
    if (L?.start && L?.end) {
      const p = S(L.start), d = S(L.end);
      if (!(d <= 0 || p >= T)) {
        const C = g("div", "ec-suggested-slot", "", [
          ["data-suggested-slot", ""],
          ["data-resource-id", L.resourceId ?? ""]
        ]);
        C.style.left = `calc(var(--ec-timeline-rowhead-w, 160px) + ${Math.max(0, p)}px)`, C.style.width = `${Math.max(8, Math.min(T, d) - Math.max(0, p))}px`, C.style.top = "4px", C.style.bottom = "4px", C.style.pointerEvents = "auto", C.addEventListener("click", (M) => {
          t.get("fire")?.("suggestedSlotClick", {
            start: L.start,
            end: L.end,
            resourceId: L.resourceId,
            jsEvent: M,
            view: t.get("view")
          });
        }), A.append(C);
      }
    }
    const Y = t.get("mode"), Q = Y && typeof s.cellAffordanceWhen == "function" && s.cellAffordanceWhen(Y), m = (p) => {
      const d = g("div", `ec-timeline-row ${a.groupHeader}`, "", [
        ["data-row", "group-header"],
        ["data-group-id", p.id],
        ["data-expanded", p.expanded ? "true" : "false"]
      ]), C = g("div", `${a.rowHead} ec-group-head`), M = g("button", a.groupHeaderToggle, "", [
        ["type", "button"],
        ["aria-label", p.expanded ? "Collapse" : "Expand"],
        ["aria-expanded", String(p.expanded)]
      ]);
      M.innerHTML = p.expanded ? s.icons.collapse?.html ?? "−" : s.icons.expand?.html ?? "+", M.addEventListener("click", () => {
        const J = !p.expanded;
        e.set(p.id, J), p.expanded = J, t.get("fire")?.(J ? "groupExpand" : "groupCollapse", {
          groupId: p.id,
          view: t.get("view")
        }), i();
      }), C.append(M);
      const x = g("span", a.groupHeaderSwatch);
      p.color && (x.style.background = p.color), C.append(x), C.append(g("span", a.groupHeaderName, p.title)), C.append(g("span", a.groupHeaderCount, `${p.resourceIds.length}`));
      const G = g("span", a.groupHeaderAction, "", [
        ["data-group-header-action", ""]
      ]), U = s.groupHeaderContent;
      if (typeof U == "function") {
        const J = U({ group: p, view: t.get("view") });
        typeof J == "string" ? G.textContent = J : J?.html ? G.innerHTML = J.html : J?.domNodes && J.domNodes.forEach((B) => G.append(B));
      }
      C.append(G), d.append(C);
      const q = g("div", "ec-group-header-strip");
      q.style.width = `${T}px`, d.append(q), A.append(d);
      const Z = s.groupHeaderDidMount;
      typeof Z == "function" && queueMicrotask(() => Z({ group: p, el: d, view: t.get("view") }));
    }, P = (p, d) => {
      const C = Re(p);
      if (C?.hidden || p.visible === !1) return;
      const M = g("div", "ec-timeline-row", "", [
        ["data-resource-id", p.id],
        ["data-depth", String(d)]
      ]), x = g("div", a.rowHead, "", [["data-resource-label", ""]]);
      x.style.setProperty("--ec-row-head-indent", `${d * 16}px`);
      const G = C?.children?.length > 0;
      if (G) {
        const B = g("button", a.expander, "", [
          ["type", "button"],
          ["data-toolbar-action", "expand"]
        ]);
        B.innerHTML = p.expanded ? s.icons.collapse?.html ?? "−" : s.icons.expand?.html ?? "+", B.addEventListener("click", () => {
          p.expanded = !p.expanded;
          const j = (W, te) => {
            const ie = Re(W);
            if (ie)
              for (const ce of ie.children) {
                const ee = Re(ce);
                ee && (ee.hidden = te), j(ce, te || !ce.expanded);
              }
          };
          j(p, !p.expanded), i();
        }), x.append(B);
      }
      x.append(g("span", "", p.title)), M.append(x);
      const U = g("div", "ec-timeline-ribbon");
      if (U.style.position = "relative", U.style.minHeight = "30px", U.style.width = `${T}px`, p.workingHours)
        for (let B = 0; B < v.length; ++B) {
          const j = v[B], W = Cn(p.workingHours, j);
          if (W.length !== 0) {
            if (D === "days") {
              if (W.length === 1 && W[0].startMin === 0 && W[0].endMin === 1440) {
                const ie = g("div", "ec-resource-offhours");
                ie.style.position = "absolute", ie.style.top = "0", ie.style.bottom = "0", ie.style.left = `${B * l}px`, ie.style.width = `${l}px`, ie.style.pointerEvents = "none", U.append(ie);
              }
              continue;
            }
            for (const te of W) {
              const ie = Math.max(te.startMin / 60, c), ce = Math.min(te.endMin / 60, f);
              if (ce <= ie) continue;
              const ee = (B * y + (ie - c)) * l, ue = (ce - ie) * l;
              if (ue <= 0) continue;
              const ae = g("div", "ec-resource-offhours");
              ae.style.position = "absolute", ae.style.top = "0", ae.style.bottom = "0", ae.style.left = `${ee}px`, ae.style.width = `${ue}px`, ae.style.pointerEvents = "none", U.append(ae);
            }
          }
        }
      if (D === "hours" && s.lunchHour != null) {
        const B = Number(s.lunchHour);
        if (Number.isFinite(B) && B >= c && B < f)
          for (let j = 0; j < v.length; ++j) {
            const W = g("div", "ec-timeline-lunch-band"), te = (j * y + (B - c)) * l;
            W.style.position = "absolute", W.style.top = "0", W.style.bottom = "0", W.style.left = `${te}px`, W.style.width = `${l}px`, W.style.pointerEvents = "none", U.append(W);
          }
      }
      const q = g("div", "ec-timeline-cells");
      q.style.position = "absolute", q.style.inset = "0", q.style.display = "grid", q.style.gridTemplateColumns = `repeat(${b}, ${l}px)`, q.style.pointerEvents = "none";
      const Z = t.get("fire");
      for (let B = 0; B < v.length; ++B) {
        const j = v[B];
        for (let W = 0; W < y; ++W) {
          const te = $(j);
          D === "hours" && te.setUTCHours(c + W, 0, 0, 0);
          const ie = W === 0, ce = D === "days" && B > 0 && B % 7 === 0 && W === 0, ee = g(
            "div",
            `ec-timeline-cell${ie ? " ec-timeline-cell-day-edge" : ""}${ce ? " ec-timeline-cell-week-edge" : ""}${Q ? " ec-timeline-cell-affordance" : ""}`,
            "",
            [
              ["data-date", j.toISOString().substring(0, 10)],
              ["data-day", String(j.getUTCDay())],
              ...D === "hours" ? [["data-hour", String(c + W)]] : []
            ]
          );
          ee.style.pointerEvents = "auto";
          const ue = s.emptyCellAddButton || Q;
          if (ue) {
            const ae = g("span", "ec-timeline-cell-add", "+");
            if (typeof ue == "function") {
              const oe = ue({ date: te, resource: p, group: k(p) });
              typeof oe == "string" ? ae.textContent = oe : oe?.html ? ae.innerHTML = oe.html : oe?.domNodes && (ae.textContent = "", oe.domNodes.forEach((we) => ae.append(we)));
            }
            ee.append(ae);
          }
          ee.addEventListener("click", (ae) => {
            Z?.("cellClick", {
              date: te,
              resource: p,
              group: k(p),
              jsEvent: ae,
              view: t.get("view")
            });
          }), q.append(ee);
        }
      }
      U.append(q);
      const J = h.filter((B) => B.resourceIds.length === 0 || B.resourceIds.includes(p.id));
      for (const B of J) {
        const j = S(B.start), W = S(B.end);
        if (W <= 0 || j >= T) continue;
        const te = Math.max(0, j), ie = Math.min(T, W), ce = Math.max(l / 4, ie - te), ee = [a.event], ue = s.eventClassNames;
        if (typeof ue == "function") {
          const fe = ue({ event: B });
          fe && ee.push(...Array.isArray(fe) ? fe : [fe]);
        } else ue && ee.push(...Array.isArray(ue) ? ue : [ue]);
        B.classNames && ee.push(...Array.isArray(B.classNames) ? B.classNames : [B.classNames]);
        const ae = ze(B, s);
        ae && ee.push(...ae.classNames);
        const oe = g("div", ee.filter(Boolean).join(" "), B.title || "", [
          ["data-event-id", B.id],
          ...De(B)
        ]);
        oe.style.position = "absolute", oe.style.left = `${te}px`, oe.style.width = `${ce}px`;
        const we = B.backgroundColor ?? ae?.color;
        if (we && oe.style.setProperty("--ec-event-color", we), ce < Number(s.eventNarrowThreshold ?? 60) && oe.classList.add("ec-event-narrow"), typeof ResizeObserver < "u" && new ResizeObserver(() => {
          const be = oe.getBoundingClientRect().width;
          oe.classList.toggle("ec-event-narrow", be < Number(s.eventNarrowThreshold ?? 60));
        }).observe(oe), s.editable && s.eventDurationEditable !== !1) {
          const fe = g(
            "div",
            `${s.theme.resizer ?? "ec-resizer"} ec-resizer-x ec-resizer-x-end`,
            "",
            [
              ["data-resizer", "end"],
              ["data-resize-axis", "x"]
            ]
          );
          if (oe.append(fe), s.eventResizableFromStart) {
            const be = g(
              "div",
              `${s.theme.resizer ?? "ec-resizer"} ec-resizer-x ec-resizer-x-start`,
              "",
              [
                ["data-resizer", "start"],
                ["data-resize-axis", "x"]
              ]
            );
            oe.append(be);
          }
        }
        oe.addEventListener("click", (fe) => Z?.("eventClick", { event: B, jsEvent: fe, view: t.get("view"), resource: p })), oe.addEventListener("dblclick", (fe) => Z?.("eventDoubleClick", { event: B, jsEvent: fe, view: t.get("view"), resource: p, el: oe })), oe.addEventListener("mouseenter", (fe) => Z?.("eventMouseEnter", { event: B, jsEvent: fe, view: t.get("view"), resource: p })), oe.addEventListener("mouseleave", (fe) => Z?.("eventMouseLeave", { event: B, jsEvent: fe, view: t.get("view"), resource: p })), queueMicrotask(() => Z?.("eventDidMount", { event: B, el: oe, view: t.get("view"), resource: p })), U.append(oe);
      }
      if (M.append(U), A.append(M), p.expanded && G)
        for (const B of C.children) P(B, d + 1);
    };
    for (const p of K)
      p.kind === "group" ? m(p.group) : P(p.resource, 0);
    _.append(A), s.allowPinchZoom && ii(A, t, s), n.replaceChildren(_);
  };
  i();
  const r = t.onAny(({ key: s }) => {
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
    ].includes(s) && i();
  });
  return () => {
    r(), o && (o(), o = null), n.replaceChildren();
  };
}
function Xt(n) {
  return n ? (n.days ?? 0) * 86400 + (n.seconds ?? 0) : 0;
}
function ii(n, t, e) {
  let o = null;
  const i = (a) => {
    a.touches.length === 2 && (o = {
      startDist: Vt(a.touches[0], a.touches[1]),
      startHeight: t.get("rowHeight") ?? e.compactRowHeight ?? 52
    });
  }, r = (a) => {
    if (!o || a.touches.length !== 2) return;
    const u = Vt(a.touches[0], a.touches[1]);
    if (Math.abs(u - o.startDist) < 14) return;
    const w = u > o.startDist ? Number(e.comfyRowHeight ?? 88) : Number(e.compactRowHeight ?? 52);
    w !== t.get("rowHeight") && (t.set("rowHeight", w), t.get("fire")?.("rowHeightChange", { height: w })), a.preventDefault();
  }, s = () => {
    o = null;
  };
  n.addEventListener("touchstart", i, { passive: !1 }), n.addEventListener("touchmove", r, { passive: !1 }), n.addEventListener("touchend", s, { passive: !0 }), n.addEventListener("touchcancel", s, { passive: !0 });
}
function Vt(n, t) {
  const e = n.clientX - t.clientX, o = n.clientY - t.clientY;
  return Math.sqrt(e * e + o * o);
}
const si = {
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
      scrollTime: re,
      slotDuration: re,
      slotLabelInterval: Le(re),
      slotMaxTime: re,
      slotMinTime: re,
      snapDuration: Le(re)
    });
  }
}, je = "_suppressNextChipClick", Ue = "_suppressNextChipClickTimer";
function et(n, t = 400) {
  if (!n) return;
  n.set(je, !0);
  const e = n.get(Ue);
  e && clearTimeout(e), n.set(Ue, setTimeout(() => {
    n.set(je, !1), n.set(Ue, null);
  }, t));
}
function ri(n) {
  if (!n) return !1;
  const t = n.get(je) === !0;
  if (t) {
    const e = n.get(Ue);
    e && clearTimeout(e), n.set(je, !1), n.set(Ue, null);
  }
  return t;
}
function Mt({ state: n, options: t, event: e, kind: o, detailExtras: i, updateAttrs: r }) {
  const s = rt(e), a = t.confirmEventChange;
  if (typeof a == "function" && s.isSeriesMember) {
    Promise.resolve(a({
      kind: o,
      event: e,
      oldEvent: i?.oldEvent,
      delta: i?.delta,
      startDelta: i?.startDelta,
      endDelta: i?.endDelta,
      isOccurrence: !0,
      seriesId: s.seriesId
    })).then((u) => {
      !u || u.proceed === !1 || (n.get("hostEl")?.calendarApi?.updateEvent(r), n.get("fire")?.("eventChangeConfirmed", {
        event: e,
        kind: o,
        scope: u.scope ?? null,
        seriesId: s.seriesId
      }));
    });
    return;
  }
  n.get("hostEl")?.calendarApi?.updateEvent(r);
}
const ai = {
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
        const o = wi(t, e), i = mi(t, e), r = vi(t, e), s = yi(t, e), a = bi(t, e), u = Ti(t, e);
        return () => {
          o(), i(), r(), s(), a(), u();
        };
      }
    });
  }
}, ci = 240, Zt = 8, li = 0.18, di = 72, ui = 120, fi = 850, pi = 375, hi = 8, gi = 5;
function mi(n, t) {
  let e = null, o = null;
  const i = /* @__PURE__ */ new WeakMap(), r = (m) => m.closest?.("[data-event-id]"), s = (m, P) => {
    const p = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(m, P) : [];
    for (const d of p) {
      const C = d.closest?.("[data-date]");
      if (C && n.contains(C)) return C;
    }
    return null;
  }, a = (m, P) => {
    const p = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(m, P) : [];
    for (const d of p) {
      const C = d.closest?.(".ec-time-col");
      if (C && n.contains(C)) return C;
    }
    return null;
  }, u = (m) => {
    const P = t.get("options");
    if (!P.editable && !P.eventStartEditable || m.button !== void 0 && m.button !== 0 || m.target.closest?.(".ec-resizer")) return;
    const p = r(m.target);
    if (!p) return;
    const d = m.pointerType === "touch", C = p.getAttribute("data-event-id"), M = (t.get("filteredEvents") ?? []).find((ee) => ee.id === C);
    if (!M) return;
    const x = p.closest("[data-date]"), G = p.closest(".ec-time-col"), U = G?.getBoundingClientRect(), q = p.getBoundingClientRect(), Z = he(P.slotDuration) / 60 || 30, B = (P.slotHeight ?? 22) / Z, j = he(P.snapDuration) / 60 || Z, W = he(P.slotMinTime) / 60 || 0, te = U ? (m.clientY - U.top) / B : null, ie = M.start.getUTCHours() * 60 + M.start.getUTCMinutes(), ce = M.end.getUTCHours() * 60 + M.end.getUTCMinutes() + (M.end.getTime() < M.start.getTime() ? 1440 : 0);
    if (e = {
      event: M,
      sourceChip: p,
      sourceDateStr: x?.getAttribute("data-date"),
      sourceTimeCol: G,
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
      touch: d,
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
      originalStartMin: ie,
      originalEndMin: ce,
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
    }, !d && p.setPointerCapture && m.pointerId !== void 0) {
      try {
        p.setPointerCapture(m.pointerId);
      } catch {
      }
      e.captured = !0;
    }
    d && (b(), S(m, p), p.classList.contains("ec-event-editing") && document.body.classList.add("ec-dragging"));
  }, w = (m) => {
    e && (e.touch && E(m.clientX, m.clientY), D(m, m.clientX, m.clientY));
  }, v = (m) => {
    if (!e?.touch) return;
    const P = V(m);
    P && D(m, P.clientX, P.clientY);
  }, h = (m) => {
    r(m.target)?.classList.contains("ec-event-editing") && (m.cancelable && m.preventDefault(), m.stopPropagation?.(), m.stopImmediatePropagation?.());
  };
  function D(m, P, p) {
    if (!e) return;
    const d = e.touch && e.sourceChip.classList.contains("ec-event-editing");
    if (d && (m.cancelable && m.preventDefault(), m.stopPropagation?.(), m.stopImmediatePropagation?.(), document.body.classList.add("ec-dragging")), e.touch && !d) return;
    e.lastX = P, e.lastY = p;
    const C = P - e.startX, M = p - e.startY, x = t.get("options"), G = x.eventDragMinDistance ?? 5;
    if (!e.moved && C * C + M * M < G * G) return;
    if (!e.moved) {
      if (_(), e.moved = !0, !e.touch && e.sourceChip.setPointerCapture && e.pointerId !== void 0)
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
      for (let ie = 0; ie < te.length; ie++) {
        const ce = te[ie];
        W.style.setProperty(ce, te.getPropertyValue(ce), te.getPropertyPriority(ce));
      }
      W.classList.add(x.theme.ghost ?? "ec-ghost"), W.style.position = "fixed", W.style.pointerEvents = "none", W.style.opacity = "0.85", W.style.zIndex = "1000", W.style.margin = "0", W.style.right = "auto", W.style.bottom = "auto", W.style.width = `${e.chipWidth}px`, W.style.height = `${e.chipHeight}px`, W.style.left = `${P - e.grabOffsetX}px`, W.style.top = `${p - e.grabOffsetY}px`, e.ghost = W, document.body.appendChild(W), e.sourceChip.style.opacity = "0.4", document.body.classList.add("ec-dragging"), N(e);
    }
    const U = (p - e.startY) / e.pxPerMin, q = e.originalStartMin + U, Z = Math.round(q / e.snapMins) * e.snapMins, B = (Z - e.originalStartMin) * e.pxPerMin;
    Sn(e, p, () => {
      D({
        cancelable: !1,
        preventDefault() {
        },
        stopPropagation() {
        },
        stopImmediatePropagation() {
        }
      }, e.lastX, e.lastY);
    }), e.ghost && (e.ghost.style.left = `${P - e.grabOffsetX}px`, e.ghost.style.top = `${e.startY - e.grabOffsetY + B}px`);
    let j = !1;
    if (d) {
      const W = e.daySteps;
      k(P, p), j = e.daySteps !== W;
    }
    if (H(e, Z), Z !== e.lastSnappedStartMin) {
      if (e.lastSnappedStartMin !== null && !j && typeof navigator < "u" && navigator.vibrate)
        try {
          navigator.vibrate(gi);
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
    const P = z(m);
    y(m, P?.clientX ?? e.lastX, P?.clientY ?? e.lastY);
  };
  function y(m, P, p) {
    if (!e) return;
    const d = e;
    e = null, _(), A(d), d.pointerCancelWatchdog && (clearTimeout(d.pointerCancelWatchdog), d.pointerCancelWatchdog = null);
    const C = t.get("pagerApi");
    if (C?.abortStepDuringDrag)
      try {
        C.abortStepDuringDrag();
      } catch {
      }
    if (T(), tt(d), document.body.classList.remove("ec-dragging"), d.dayOffsetBadge && d.dayOffsetBadge.remove(), K(d), F(d), d.ghost && d.ghost.remove(), d.sourceChip && (d.sourceChip.style.opacity = ""), !d.moved) return;
    const x = s(P, p)?.getAttribute("data-date"), G = a(P, p);
    if (t.get("fire")?.("eventDragStop", {
      event: d.event,
      jsEvent: m,
      view: t.get("view")
    }), et(t), !x) return;
    const U = t.get("options"), q = he(U.slotDuration) / 60 || 30, Z = he(U.snapDuration) / 60 || q, B = (U.slotHeight ?? 22) / q;
    let j, W, te;
    if (d.sourceTimeCol && G) {
      const oe = (p - d.startY) / B, we = d.originalStartMin + oe, be = Math.round(we / Z) * Z - d.originalStartMin, le = (/* @__PURE__ */ new Date(d.sourceDateStr + "T00:00:00Z")).getTime();
      te = (/* @__PURE__ */ new Date(x + "T00:00:00Z")).getTime() - le + be * 6e4;
    } else {
      if (x === d.sourceDateStr) return;
      const oe = (/* @__PURE__ */ new Date(d.sourceDateStr + "T00:00:00Z")).getTime();
      te = (/* @__PURE__ */ new Date(x + "T00:00:00Z")).getTime() - oe;
    }
    if (te === 0) return;
    j = new Date(d.event.start.getTime() + te), W = new Date(d.event.end.getTime() + te);
    const ie = 864e5;
    let ce = !1;
    const ee = { ...d.event, start: d.event.start, end: d.event.end }, ue = rt(d.event), ae = {
      event: d.event,
      oldEvent: ee,
      newStart: j,
      newEnd: W,
      delta: { days: Math.round(te / ie), milliseconds: te },
      jsEvent: m,
      view: t.get("view"),
      isOccurrence: ue.isSeriesMember,
      seriesId: ue.seriesId,
      revert: () => {
        ce = !0;
      }
    };
    t.get("fire")?.("eventDrop", ae), !ce && Mt({
      state: t,
      options: t.get("options"),
      event: d.event,
      kind: "drop",
      detailExtras: { oldEvent: ee, delta: ae.delta },
      updateAttrs: {
        id: d.event.id,
        start: j.toISOString(),
        end: W.toISOString()
      }
    });
  }
  let l = !1;
  function b() {
    l || (l = !0, document.addEventListener("touchmove", v, { passive: !1, capture: !0 }), document.addEventListener("touchend", f, { passive: !1, capture: !0 }), document.addEventListener("touchcancel", f, { passive: !1, capture: !0 }));
  }
  function T() {
    l && (l = !1, document.removeEventListener("touchmove", v, !0), document.removeEventListener("touchend", f, !0), document.removeEventListener("touchcancel", f, !0));
  }
  function S(m, P) {
    _();
    const d = t.get("options").eventLongPressDelay ?? ci;
    o = {
      chip: P,
      startX: m.clientX,
      startY: m.clientY,
      moved: !1,
      timer: setTimeout(() => {
        !o || o.chip !== P || o.moved || !e || e.sourceChip !== P || (o = null, I(P), O(P), document.body.classList.add("ec-dragging"), typeof navigator < "u" && navigator.vibrate && navigator.vibrate(15));
      }, d)
    };
  }
  function _() {
    o && (clearTimeout(o.timer), o = null);
  }
  function E(m, P) {
    if (!o) return;
    const p = m - o.startX, d = P - o.startY;
    p * p + d * d > Zt * Zt && (o.moved = !0, _());
  }
  function I(m) {
    const P = m.getAttribute("data-event-id"), p = P && typeof CSS < "u" && CSS.escape ? CSS.escape(P) : P, d = P ? Array.from(n.querySelectorAll?.(`[data-event-id="${p}"]`) ?? []) : [m], C = new Set(d);
    n.querySelectorAll?.(".ec-event.ec-event-editing").forEach((M) => {
      C.has(M) || M.classList.remove("ec-event-editing");
    }), d.forEach((M) => M.classList.add("ec-event-editing"));
  }
  function O(m) {
    i.set(m, Date.now() + 800);
  }
  function R(m) {
    const P = r(m.target);
    if (!P) return;
    const p = i.get(P) || 0;
    if (p && Date.now() <= p) {
      m.preventDefault(), m.stopImmediatePropagation?.(), m.stopPropagation?.();
      return;
    }
    p && i.delete(P);
  }
  function V(m) {
    const P = m.touches?.[0] ?? null;
    return P && E(P.clientX, P.clientY), m.touches?.[0] ?? null;
  }
  function z(m) {
    return m.changedTouches?.[0] ?? null;
  }
  function N(m) {
    if (m.timeTextHidden) return;
    m.timeTextHidden = !0;
    const P = [];
    m.sourceChip && P.push(...m.sourceChip.querySelectorAll(".ec-event-time")), m.ghost && P.push(...m.ghost.querySelectorAll(".ec-event-time"));
    for (const p of P)
      p.dataset.ecDragPriorVisibility = p.style.visibility || "", p.style.visibility = "hidden";
  }
  function K(m) {
    if (!m.timeTextHidden) return;
    m.timeTextHidden = !1;
    const P = [];
    m.sourceChip && P.push(...m.sourceChip.querySelectorAll(".ec-event-time")), m.ghost && P.push(...m.ghost.querySelectorAll(".ec-event-time"));
    for (const p of P) {
      const d = p.dataset.ecDragPriorVisibility ?? "";
      p.style.visibility = d, delete p.dataset.ecDragPriorVisibility;
    }
  }
  function H(m, P) {
    if (!m.pxPerMin) return;
    const p = n.querySelector?.('.ec-pager-page-current .ec-time-grid [data-row="body"] > .ec-sidebar') ?? n.querySelector?.('.ec-time-grid [data-row="body"] > .ec-sidebar');
    if (!p) return;
    const d = n.querySelectorAll?.("[data-ec-draft-start-label]") ?? [];
    for (const G of d) G !== m.draftStartLabel && G.remove();
    const C = (Math.round(P) % 60 + 60) % 60;
    if (C === 0) {
      m.draftStartLabel?.remove(), m.draftStartLabel = null;
      return;
    }
    let M = m.draftStartLabel;
    (!M || M.parentNode !== p) && (M?.remove(), M = document.createElement("span"), M.dataset.ecDraftStartLabel = "", M.className = "ec-draft-start-label", M.style.position = "absolute", M.style.right = "0.5rem", M.style.fontSize = "0.7rem", M.style.fontWeight = "600", M.style.color = "var(--ec-text-color, #1a1a1a)", M.style.fontVariantNumeric = "tabular-nums", M.style.lineHeight = "1", M.style.pointerEvents = "none", M.style.zIndex = "3", p.appendChild(M), m.draftStartLabel = M);
    const x = (P - m.slotMinMin) * m.pxPerMin - 6;
    M.style.top = `${x}px`, M.textContent = `:${String(C).padStart(2, "0")}`;
  }
  function F(m) {
    m?.draftStartLabel?.remove(), m && (m.draftStartLabel = null);
    const P = n.querySelectorAll?.("[data-ec-draft-start-label]") ?? [];
    for (const p of P) p.remove();
  }
  function k(m, P) {
    if (!e || !e.touch || !e.sourceChip?.classList.contains("ec-event-editing") || e.swapping) return;
    const p = t.get("pagerApi");
    if (!p || typeof p.stepDuringDrag != "function" || (t.get("viewDates") ?? []).length !== 1) return;
    const C = p.element;
    if (!C) return;
    const M = C.getBoundingClientRect(), x = M.width || C.offsetWidth || 0;
    if (!x) return;
    if (P < M.top || P > M.bottom) {
      A(e), e.edgeHoldFirstFired = !1;
      return;
    }
    const G = Math.max(
      di,
      Math.min(ui, x * li)
    ), U = m <= M.left + G, q = m >= M.right - G, Z = U ? -1 : q ? 1 : 0;
    if (Z === 0) {
      A(e), e.edgeHoldFirstFired = !1;
      return;
    }
    if (e.edgeHoldDirection === Z && e.edgeHoldTimer) return;
    e.edgeHoldDirection !== Z && (e.edgeHoldFirstFired = !1), A(e), e.edgeHoldDirection = Z;
    const J = e.edgeHoldFirstFired ? pi : fi;
    e.edgeHoldTimer = setTimeout(() => X(Z), J);
  }
  function A(m) {
    m && (m.edgeHoldTimer && (clearTimeout(m.edgeHoldTimer), m.edgeHoldTimer = null), m.edgeHoldDirection = 0);
  }
  async function X(m) {
    if (!e || e.swapping) return;
    const P = t.get("pagerApi");
    if (P?.stepDuringDrag) {
      e.swapping = !0, e.edgeHoldTimer = null;
      try {
        await P.stepDuringDrag(m);
      } catch {
      }
      if (e) {
        if (e.daySteps = (e.daySteps ?? 0) + m, e.edgeHoldFirstFired = !0, e.swapping = !1, L(e), typeof navigator < "u" && navigator.vibrate)
          try {
            navigator.vibrate(hi);
          } catch {
          }
        k(e.lastX, e.lastY);
      }
    }
  }
  function L(m) {
    if (!m.ghost) return;
    const P = m.daySteps ?? 0;
    if (P === 0) {
      m.dayOffsetBadge?.remove(), m.dayOffsetBadge = null;
      return;
    }
    let p = m.dayOffsetBadge;
    p || (p = document.createElement("div"), p.className = "ec-day-offset-badge", p.setAttribute("aria-hidden", "true"), p.style.position = "absolute", p.style.top = "6px", p.style.right = "8px", p.style.padding = "2px 6px", p.style.borderRadius = "999px", p.style.background = "rgba(15, 23, 42, 0.78)", p.style.color = "#fff", p.style.fontSize = "11px", p.style.fontWeight = "600", p.style.lineHeight = "1", p.style.letterSpacing = "0.01em", p.style.pointerEvents = "none", p.style.zIndex = "2", m.ghost.appendChild(p), m.dayOffsetBadge = p);
    const d = Math.abs(P), C = d === 1 ? "day" : "days";
    p.textContent = P > 0 ? `+${P} ${C}` : `−${d} ${C}`;
  }
  const Y = (m) => {
    m.target.closest?.("[data-event-id]") && m.preventDefault();
  }, Q = (m) => {
    m.target.closest?.("[data-event-id]") && m.preventDefault();
  };
  return n.addEventListener("pointerdown", u), n.addEventListener("touchstart", h, { passive: !1, capture: !0 }), n.addEventListener("click", R, !0), n.addEventListener("contextmenu", Y, !0), n.addEventListener("dragstart", Q, !0), document.addEventListener("pointermove", w, { passive: !1 }), document.addEventListener("pointerup", c), document.addEventListener("pointercancel", c), () => {
    n.removeEventListener("pointerdown", u), n.removeEventListener("touchstart", h, !0), n.removeEventListener("click", R, !0), n.removeEventListener("contextmenu", Y, !0), n.removeEventListener("dragstart", Q, !0), document.removeEventListener("pointermove", w), document.removeEventListener("pointerup", c), document.removeEventListener("pointercancel", c), T(), _(), e && (A(e), e.dayOffsetBadge?.remove(), K(e), F(e)), e?.ghost && e.ghost.remove(), tt(e);
  };
}
function Sn(n, t, e) {
  const o = n.scrollEl ?? n.sourceChip?.closest?.('[data-row="body"]') ?? n.chip?.closest?.('[data-row="body"]') ?? null;
  if (!o) return;
  n.scrollEl = o;
  const i = o.getBoundingClientRect(), r = 36, s = 14;
  let a = 0;
  if (t < i.top + r) {
    const w = Math.min(1, (i.top + r - t) / r);
    a = -Math.max(2, Math.round(w * s));
  } else if (t > i.bottom - r) {
    const w = Math.min(1, (t - (i.bottom - r)) / r);
    a = Math.max(2, Math.round(w * s));
  }
  if (n.autoScrollSpeed = a, !a || n.autoScrollRaf) return;
  const u = () => {
    if (!n.autoScrollSpeed || !n.scrollEl) {
      n.autoScrollRaf = null;
      return;
    }
    const w = n.scrollEl, v = w.scrollTop, h = Math.max(0, w.scrollHeight - w.clientHeight), D = Math.max(0, Math.min(h, v + n.autoScrollSpeed)), c = D - v;
    c && Math.sign(c) === Math.sign(n.autoScrollSpeed) && (w.scrollTop = D, n.startY -= c, e?.(c)), n.autoScrollRaf = requestAnimationFrame(u);
  };
  n.autoScrollRaf = requestAnimationFrame(u);
}
function tt(n) {
  n && (n.autoScrollRaf && cancelAnimationFrame(n.autoScrollRaf), n.autoScrollRaf = null, n.autoScrollSpeed = 0);
}
function vi(n, t) {
  let e = null;
  const o = (l) => {
    const b = t.get("options");
    if (!b.editable && !b.eventDurationEditable || l.button !== void 0 && l.button !== 0) return;
    const T = l.target.closest?.(".ec-resizer");
    if (!T || !n.contains(T)) return;
    const S = T.closest("[data-event-id]");
    if (!S) return;
    const _ = l.pointerType === "touch";
    if (_ && !S.classList.contains("ec-event-editing")) return;
    const E = S.getAttribute("data-event-id"), I = (t.get("filteredEvents") ?? []).find((K) => K.id === E);
    if (!I) return;
    const O = he(b.slotDuration) / 60 || 30, R = he(b.snapDuration) / 60 || O, V = (b.slotHeight ?? 22) / O, N = Array.from(n.querySelectorAll(`[data-event-id="${typeof CSS < "u" && CSS.escape ? CSS.escape(E) : E}"]`)).map((K) => {
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
      chip: S,
      handleSide: T.getAttribute("data-resizer") === "start" ? "start" : "end",
      event: I,
      startY: l.clientY,
      originalTopPx: parseFloat(S.style.top || "0") || 0,
      originalHeightPx: parseFloat(S.style.height || "0") || S.getBoundingClientRect().height,
      pxPerMin: V,
      slotMins: O,
      snapMins: R,
      moved: !1,
      sourceCol: S.closest(".ec-time-col"),
      previewChips: [],
      segments: N,
      touch: _,
      pointerId: l.pointerId,
      lastX: l.clientX,
      lastY: l.clientY
    }, S.classList.add("ec-resizing-y"), S.classList.add("ec-resizing"), document.body.classList.add("ec-resizing-active"), T.setPointerCapture && l.pointerId !== void 0)
      try {
        T.setPointerCapture(l.pointerId);
      } catch {
      }
    _ && D(), t.get("fire")?.("eventResizeStart", { event: I, jsEvent: l, view: t.get("view") }), l.cancelable && l.preventDefault(), l.stopPropagation();
  }, i = (l) => {
    e && s(l, l.clientX, l.clientY);
  }, r = (l) => {
    if (!e?.touch) return;
    const b = f(l);
    b && (l.cancelable && l.preventDefault(), l.stopPropagation?.(), l.stopImmediatePropagation?.(), s(l, b.clientX, b.clientY));
  };
  function s(l, b, T) {
    if (!e) return;
    e.lastX = b, e.lastY = T;
    const S = T - e.startY, _ = Math.round(S / e.pxPerMin / e.snapMins) * e.snapMins;
    _ !== 0 && (e.moved = !0);
    let E = null;
    const I = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(b, T) : [];
    for (const N of I) {
      const K = N.closest?.(".ec-time-col");
      if (K && n.contains(K)) {
        E = K;
        break;
      }
    }
    for (const N of e.previewChips) N.remove();
    e.previewChips = [];
    for (const N of e.segments)
      N.el.style.display = N.originalDisplay, N.el.style.top = `${N.originalTop}px`, N.el.style.height = `${N.originalHeight}px`;
    const O = e.sourceCol?.parentElement, R = O ? Array.from(O.children).filter((N) => N.classList?.contains("ec-time-col")) : [], V = e.sourceCol ? R.indexOf(e.sourceCol) : -1, z = E ? R.indexOf(E) : -1;
    if (e.handleSide === "end" && z >= 0 && V >= 0 && z < V)
      for (const N of e.segments) {
        const K = R.indexOf(N.col);
        if (!(K < 0 || K < z))
          if (K > z)
            N.el.style.display = "none";
          else {
            const H = E.getBoundingClientRect(), F = T - H.top, k = Math.round(F / e.pxPerMin / e.snapMins) * e.snapMins * e.pxPerMin, A = N.originalTop + e.snapMins * e.pxPerMin, X = Math.max(A, k);
            N.el.style.height = `${X - N.originalTop}px`;
          }
      }
    else if (e.handleSide === "end" && E && e.sourceCol && E !== e.sourceCol) {
      const N = e.sourceCol.getBoundingClientRect().height;
      if (e.chip.style.height = `${Math.max(e.snapMins * e.pxPerMin, N - e.originalTopPx - 2)}px`, V >= 0 && z > V) {
        for (let F = V + 1; F < z; ++F)
          e.previewChips.push(a(R[F], 0, R[F].getBoundingClientRect().height - 2, e));
        const K = E.getBoundingClientRect(), H = Math.max(
          e.snapMins * e.pxPerMin,
          Math.round((T - K.top) / e.pxPerMin / e.snapMins) * e.snapMins * e.pxPerMin
        );
        e.previewChips.push(a(E, 0, H, e));
      }
    } else if (e.handleSide === "end") {
      const N = Math.max(e.snapMins * e.pxPerMin, e.originalHeightPx + _ * e.pxPerMin);
      e.chip.style.height = `${N}px`;
    } else {
      const N = Math.max(
        -e.originalTopPx,
        // can't go above col start
        Math.min(e.originalHeightPx - e.snapMins * e.pxPerMin, _ * e.pxPerMin)
      );
      e.chip.style.top = `${e.originalTopPx + N}px`, e.chip.style.height = `${e.originalHeightPx - N}px`;
    }
    Sn(e, T, () => {
      s({
        cancelable: !1,
        preventDefault() {
        },
        stopPropagation() {
        },
        stopImmediatePropagation() {
        }
      }, e.lastX, e.lastY);
    }), l.cancelable && l.preventDefault();
  }
  function a(l, b, T, S) {
    const _ = S.chip.cloneNode(!0);
    return _.querySelectorAll(".ec-resizer").forEach((I) => I.remove()), _.classList.add("ec-event-preview"), _.style.position = "absolute", _.style.top = `${b}px`, _.style.height = `${T}px`, _.style.left = "0", _.style.right = "0", _.style.opacity = "0.6", _.style.pointerEvents = "none", (l.querySelector(".ec-event-overlay") ?? l).appendChild(_), _;
  }
  const u = (l) => {
    e?.touch && l.type === "pointercancel" || v(l, l.clientX, l.clientY);
  }, w = (l) => {
    if (!e?.touch) return;
    const b = y(l);
    l.cancelable && l.preventDefault(), l.stopPropagation?.(), l.stopImmediatePropagation?.(), v(l, b?.clientX ?? e.lastX, b?.clientY ?? e.lastY);
  };
  function v(l, b, T) {
    if (!e) return;
    const S = e;
    e = null, c(), tt(S), S.chip.classList.remove("ec-resizing-y"), S.chip.classList.remove("ec-resizing"), document.body.classList.remove("ec-resizing-active");
    for (const L of S.previewChips) L.remove();
    if (S.previewChips = [], !S.moved) {
      for (const L of S.segments)
        L.el.style.display = L.originalDisplay, L.el.style.top = `${L.originalTop}px`, L.el.style.height = `${L.originalHeight}px`;
      t.get("fire")?.("eventResizeStop", { event: S.event, jsEvent: l, view: t.get("view") }), et(t);
      return;
    }
    const _ = T - S.startY, I = Math.round(_ / S.pxPerMin / S.snapMins) * S.snapMins * 6e4;
    let O = new Date(S.event.start.getTime()), R = new Date(S.event.end.getTime());
    const V = (() => {
      const L = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(b, T) : [];
      for (const Y of L) {
        const Q = Y.closest?.(".ec-time-col");
        if (Q && n.contains(Q)) return Q;
      }
      return null;
    })(), z = S.chip.closest(".ec-time-col"), N = V?.getAttribute("data-date"), K = z?.getAttribute("data-date");
    if (V && z && N !== K) {
      const L = t.get("options"), Y = he(L.slotMinTime) / 60 || 0, Q = V.getBoundingClientRect(), m = T - Q.top, p = Math.max(0, Math.round(m / S.pxPerMin / S.snapMins) * S.snapMins) + Y;
      S.handleSide === "end" ? (R = /* @__PURE__ */ new Date(N + "T00:00:00Z"), R.setUTCMinutes(R.getUTCMinutes() + p), R <= O && (R = new Date(O.getTime() + S.snapMins * 6e4))) : (O = /* @__PURE__ */ new Date(N + "T00:00:00Z"), O.setUTCMinutes(O.getUTCMinutes() + p), O >= R && (O = new Date(R.getTime() - S.snapMins * 6e4)));
    } else S.handleSide === "end" ? (R = new Date(R.getTime() + I), R <= O && (R = new Date(O.getTime() + S.snapMins * 6e4))) : (O = new Date(O.getTime() + I), O >= R && (O = new Date(R.getTime() - S.snapMins * 6e4)));
    let H = !1;
    t.get("fire")?.("eventResizeStop", { event: S.event, jsEvent: l, view: t.get("view") }), et(t);
    const F = { ...S.event, start: S.event.start, end: S.event.end }, k = rt(S.event), A = S.handleSide === "end" ? { milliseconds: I, days: 0 } : { milliseconds: 0, days: 0 }, X = S.handleSide === "start" ? { milliseconds: I, days: 0 } : { milliseconds: 0, days: 0 };
    if (t.get("fire")?.("eventResize", {
      event: S.event,
      oldEvent: F,
      newStart: O,
      newEnd: R,
      jsEvent: l,
      view: t.get("view"),
      endDelta: A,
      startDelta: X,
      isOccurrence: k.isSeriesMember,
      seriesId: k.seriesId,
      revert: () => {
        H = !0;
      }
    }), H) {
      for (const L of S.segments)
        L.el.style.display = L.originalDisplay, L.el.style.top = `${L.originalTop}px`, L.el.style.height = `${L.originalHeight}px`;
      return;
    }
    Mt({
      state: t,
      options: t.get("options"),
      event: S.event,
      kind: "resize",
      detailExtras: { oldEvent: F, startDelta: X, endDelta: A },
      updateAttrs: {
        id: S.event.id,
        start: O.toISOString(),
        end: R.toISOString()
      }
    });
  }
  let h = !1;
  function D() {
    h || (h = !0, document.addEventListener("touchmove", r, { passive: !1, capture: !0 }), document.addEventListener("touchend", w, { passive: !1, capture: !0 }), document.addEventListener("touchcancel", w, { passive: !1, capture: !0 }));
  }
  function c() {
    h && (h = !1, document.removeEventListener("touchmove", r, !0), document.removeEventListener("touchend", w, !0), document.removeEventListener("touchcancel", w, !0));
  }
  function f(l) {
    return l.touches?.[0] ?? null;
  }
  function y(l) {
    return l.changedTouches?.[0] ?? null;
  }
  return n.addEventListener("pointerdown", o), document.addEventListener("pointermove", i, { passive: !1 }), document.addEventListener("pointerup", u), document.addEventListener("pointercancel", u), () => {
    n.removeEventListener("pointerdown", o), document.removeEventListener("pointermove", i), document.removeEventListener("pointerup", u), document.removeEventListener("pointercancel", u), c(), tt(e);
  };
}
function he(n) {
  return n ? (n.days ?? 0) * 86400 + (n.seconds ?? 0) : 0;
}
function yi(n, t) {
  let e = null;
  function o(c) {
    return c.parentElement;
  }
  function i(c) {
    const f = o(c);
    return f ? Array.from(f.children).filter((y) => y.classList?.contains("ec-time-col")) : [c];
  }
  function r(c, f) {
    const y = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(c, f) : [];
    for (const l of y) {
      const b = l.closest?.(".ec-time-col");
      if (b && n.contains(b)) return b;
    }
    return null;
  }
  function s(c) {
    const f = t.get("options"), y = f.theme, l = document.createElement("div");
    return l.className = `${y.event ?? "ec-event"} ec-event-preview`, l.style.position = "absolute", l.style.left = "0", l.style.right = "0", l.style.opacity = "0.7", l.style.pointerEvents = "none", l.style.background = f.eventBackgroundColor ?? "#2563eb", l.style.color = "#ffffff", l.style.borderRadius = "3px", l.style.padding = "2px 0.375rem", l.style.fontSize = "0.72rem", l.style.overflow = "hidden", (c.querySelector(".ec-event-overlay") ?? c).appendChild(l), l;
  }
  function a(c) {
    const f = t.get("options");
    if (!f.editable || c.button !== void 0 && c.button !== 0 || c.pointerType === "touch" || c.target.closest?.("[data-event-id], .ec-resizer, .ec-button, button, input, select, textarea, a, [data-more-link], [data-popover-action]")) return;
    const y = c.target.closest?.(".ec-time-col");
    if (!y || !n.contains(y)) return;
    const l = y.getAttribute("data-date");
    if (!l) return;
    const b = he(f.slotDuration) / 60 || 30, T = he(f.snapDuration) / 60 || b, S = (f.slotHeight ?? 22) / b, _ = he(f.slotMinTime) / 60 || 0, E = y.getBoundingClientRect(), I = c.clientY - E.top, O = Math.max(0, Math.round(I / S / T) * T);
    e = {
      sourceCol: y,
      sourceDateStr: l,
      sourceMinFromTop: O,
      slotMins: b,
      snapMins: T,
      pxPerMin: S,
      slotMinMin: _,
      previewChips: [],
      moved: !1
    }, c.cancelable && c.preventDefault(), document.addEventListener("pointermove", h, { passive: !1 }), document.addEventListener("pointerup", D), document.addEventListener("pointercancel", D);
  }
  function u(c, f) {
    const y = r(c.clientX, c.clientY) ?? f.sourceCol, l = y.getBoundingClientRect(), b = c.clientY - l.top, T = Math.max(0, Math.round(b / f.pxPerMin / f.snapMins) * f.snapMins);
    return { col: y, mins: T };
  }
  function w(c) {
    for (const f of c.previewChips) f.remove();
    c.previewChips = [];
  }
  function v(c, f) {
    w(c);
    const y = i(c.sourceCol), l = y.indexOf(c.sourceCol), b = y.indexOf(f.col);
    if (l < 0 || b < 0) return;
    const T = b >= l, S = Math.min(l, b), _ = Math.max(l, b);
    for (let E = S; E <= _; ++E) {
      const I = y[E], O = I.getBoundingClientRect().height;
      let R, V;
      l === b ? (R = Math.min(c.sourceMinFromTop, f.mins), V = Math.max(c.sourceMinFromTop, f.mins), V = Math.max(V, R + c.snapMins)) : T ? E === l ? (R = c.sourceMinFromTop, V = O / c.pxPerMin) : E === b ? (R = 0, V = Math.max(c.snapMins, f.mins)) : (R = 0, V = O / c.pxPerMin) : E === l ? (R = 0, V = Math.max(c.snapMins, c.sourceMinFromTop)) : E === b ? (R = f.mins, V = O / c.pxPerMin) : (R = 0, V = O / c.pxPerMin);
      const z = Math.max(c.snapMins, V - R), N = s(I);
      if (N.style.top = `${R * c.pxPerMin}px`, N.style.height = `${z * c.pxPerMin}px`, E === S) {
        const K = T ? c.sourceMinFromTop : f.mins, H = T ? f.mins : c.sourceMinFromTop;
        N.textContent = `${Kt(K + c.slotMinMin)} – ${Kt((H || 1440) + c.slotMinMin)}`;
      }
      c.previewChips.push(N);
    }
  }
  function h(c) {
    if (!e) return;
    c.clientY - (e.previewChips[0], c.clientY);
    const f = Math.abs(c.clientY - (e.sourceCol.getBoundingClientRect().top + e.sourceMinFromTop * e.pxPerMin));
    !e.moved && f < 4 && e.previewChips.length, e.moved = !0;
    const y = u(c, e);
    v(e, y), c.cancelable && c.preventDefault();
  }
  function D(c) {
    if (!e) return;
    const f = e;
    if (e = null, document.removeEventListener("pointermove", h), document.removeEventListener("pointerup", D), document.removeEventListener("pointercancel", D), w(f), !f.moved) return;
    const y = u(c, f), l = y.col === f.sourceCol, b = y.col.getAttribute("data-date"), T = /* @__PURE__ */ new Date(f.sourceDateStr + "T00:00:00Z");
    T.setUTCMinutes(T.getUTCMinutes() + f.sourceMinFromTop + f.slotMinMin);
    const S = /* @__PURE__ */ new Date(b + "T00:00:00Z");
    S.setUTCMinutes(S.getUTCMinutes() + y.mins + f.slotMinMin);
    let _ = T, E = S;
    if (l) {
      const I = Math.min(f.sourceMinFromTop, y.mins), O = Math.max(f.sourceMinFromTop, y.mins);
      _ = /* @__PURE__ */ new Date(f.sourceDateStr + "T00:00:00Z"), _.setUTCMinutes(_.getUTCMinutes() + I + f.slotMinMin), E = /* @__PURE__ */ new Date(f.sourceDateStr + "T00:00:00Z"), E.setUTCMinutes(E.getUTCMinutes() + Math.max(O, I + f.snapMins) + f.slotMinMin);
    } else _ > E && ([_, E] = [E, _]);
    t.get("fire")?.("dateClick", {
      date: _,
      dateStr: _.toISOString().substring(0, 10),
      allDay: !1,
      end: E,
      jsEvent: c,
      view: t.get("view")
    });
  }
  return n.addEventListener("pointerdown", a), () => {
    n.removeEventListener("pointerdown", a), document.removeEventListener("pointermove", h), document.removeEventListener("pointerup", D), document.removeEventListener("pointercancel", D);
  };
}
function Kt(n) {
  const t = Math.floor(n / 60) % 24, e = Math.floor(n) % 60, o = t % 12 || 12, i = t >= 12 ? "pm" : "am";
  return `${o}:${String(e).padStart(2, "0")} ${i}`;
}
function wi(n, t) {
  let e = null;
  const o = (r) => {
    const s = n.querySelector('.ec-time-grid [data-row="body"]');
    e = {
      pointerType: r.pointerType,
      scrollTop: s?.scrollTop ?? null
    };
  }, i = (r) => {
    const s = r.target.closest("[data-date]");
    if (!s || r.target.closest("[data-event-id], .ec-resizer, [data-more-link], [data-popover-action]")) return;
    if (e?.pointerType === "touch") {
      const D = n.querySelector('.ec-time-grid [data-row="body"]');
      if (D && e.scrollTop != null && Math.abs(D.scrollTop - e.scrollTop) > 4 || n.querySelector(".ec-pager.ec-pager-dragging"))
        return;
    }
    const a = s.getAttribute("data-date"), u = t.get("fire"), w = r.target.closest(".ec-time-col");
    let v, h;
    if (w) {
      const D = t.get("options"), c = he(D.slotDuration) / 60 || 30, f = he(D.snapDuration) / 60 || c, l = (D.slotHeight ?? 22) / c, b = w.getBoundingClientRect(), T = r.clientY - b.top, S = he(D.slotMinTime) / 60 || 0, _ = Math.max(0, Math.round(T / l / f) * f) + S;
      v = /* @__PURE__ */ new Date(a + "T00:00:00Z"), v.setUTCMinutes(v.getUTCMinutes() + _), h = !1;
    } else
      v = /* @__PURE__ */ new Date(a + "T00:00:00Z"), h = !0;
    u?.("dateClick", {
      date: v,
      dateStr: v.toISOString().substring(0, h ? 10 : 16),
      allDay: h,
      jsEvent: r,
      view: t.get("view")
    });
  };
  return n.addEventListener("pointerdown", o, !0), n.addEventListener("click", i), () => {
    n.removeEventListener("pointerdown", o, !0), n.removeEventListener("click", i);
  };
}
function bi(n, t) {
  let e = null;
  const o = (v) => {
    const h = v.closest?.("[data-event-id]");
    return !h || !h.closest(".ec-timeline-ribbon") ? null : h;
  }, i = (v, h) => {
    const D = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(v, h) : [];
    for (const c of D) {
      const f = c.closest?.(".ec-timeline-ribbon");
      if (f && n.contains(f)) return f;
    }
    return null;
  }, r = (v) => v?.closest?.(".ec-timeline-row"), s = (v) => r(v)?.getAttribute("data-resource-id") ?? null, a = (v) => {
    const h = t.get("options");
    if (v.button !== void 0 && v.button !== 0) return;
    const D = o(v.target);
    if (!D) return;
    const c = D.closest(".ec-timeline-ribbon"), f = c.getBoundingClientRect(), y = c.querySelectorAll(":scope > .ec-timeline-cells > .ec-timeline-cell"), l = y.length ? f.width / y.length : h.slotWidth ?? 32, b = (t.get("filteredEvents") ?? []).find((_) => _.id === D.getAttribute("data-event-id"));
    if (!b) return;
    const T = v.target.closest?.(".ec-resizer"), S = !!T && T.getAttribute("data-resize-axis") === "x";
    if (!(S && !(h.editable && h.eventDurationEditable !== !1)) && !(!S && !(h.editable || h.eventStartEditable))) {
      if (e = {
        kind: S ? "resize" : "move",
        side: S ? T.getAttribute("data-resizer") === "start" ? "start" : "end" : null,
        chip: D,
        event: b,
        ribbon: c,
        ribbonRect: f,
        dayWidth: l,
        sourceResourceId: s(c),
        lastResourceId: s(c),
        originalLeft: parseFloat(D.style.left || "0") || 0,
        originalWidth: parseFloat(D.style.width || "0") || D.getBoundingClientRect().width,
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
      else if (D.setPointerCapture && v.pointerId !== void 0)
        try {
          D.setPointerCapture(v.pointerId);
        } catch {
        }
      v.cancelable && v.preventDefault(), v.stopPropagation?.();
    }
  }, u = (v) => {
    if (!e) return;
    e.lastX = v.clientX, e.lastY = v.clientY;
    const h = v.clientX - e.startX, D = v.clientY - e.startY, f = t.get("options").eventDragMinDistance ?? 5;
    if (!e.moved && h * h + D * D < f * f) return;
    e.moved || (e.moved = !0, e.chip.classList.add(e.kind === "resize" ? "ec-resizing-x" : "ec-dragging"), e.chip.style.zIndex = "50", t.get("fire")?.(e.kind === "resize" ? "eventResizeStart" : "eventDragStart", {
      event: e.event,
      jsEvent: v,
      view: t.get("view")
    }));
    const y = Math.round(h / e.dayWidth);
    if (e.lastDayDelta = y, e.kind === "move")
      e.chip.style.left = `${e.originalLeft + y * e.dayWidth}px`;
    else if (e.side === "end") {
      const l = e.dayWidth;
      e.chip.style.width = `${Math.max(l, e.originalWidth + y * e.dayWidth)}px`;
    } else {
      const l = Math.max(
        -e.originalLeft,
        Math.min(e.originalWidth - e.dayWidth, y * e.dayWidth)
      );
      e.chip.style.left = `${e.originalLeft + l}px`, e.chip.style.width = `${e.originalWidth - l}px`;
    }
    if (e.kind === "move") {
      const l = i(v.clientX, v.clientY), b = l ? s(l) : null;
      e.lastResourceId = b ?? e.sourceResourceId, n.querySelectorAll('.ec-timeline-row[data-row-drop="true"]').forEach((T) => T.removeAttribute("data-row-drop")), l && b !== e.sourceResourceId && r(l)?.setAttribute("data-row-drop", "true");
    }
    v.cancelable && v.preventDefault();
  }, w = (v) => {
    if (!e) return;
    const h = e;
    if (e = null, n.querySelectorAll('.ec-timeline-row[data-row-drop="true"]').forEach((O) => O.removeAttribute("data-row-drop")), h.chip.classList.remove("ec-resizing-x"), h.chip.classList.remove("ec-dragging"), h.chip.style.zIndex = "", !h.moved) return;
    t.get("fire")?.(h.kind === "resize" ? "eventResizeStop" : "eventDragStop", {
      event: h.event,
      jsEvent: v,
      view: t.get("view")
    }), et(t);
    const D = 864e5;
    let c = new Date(h.event.start.getTime()), f = new Date(h.event.end.getTime()), y = h.event.resourceIds, l = !1;
    if (h.kind === "move") {
      if (c = new Date(c.getTime() + h.lastDayDelta * D), f = new Date(f.getTime() + h.lastDayDelta * D), h.lastResourceId && h.lastResourceId !== h.sourceResourceId) {
        const O = (h.event.resourceIds ?? []).slice(), R = O.indexOf(h.sourceResourceId);
        R >= 0 ? O[R] = h.lastResourceId : O.push(h.lastResourceId), y = O, l = !0;
      }
    } else h.side === "end" ? (f = new Date(f.getTime() + h.lastDayDelta * D), f.getTime() <= c.getTime() && (f = new Date(c.getTime() + D))) : (c = new Date(c.getTime() + h.lastDayDelta * D), c.getTime() >= f.getTime() && (c = new Date(f.getTime() - D)));
    let b = !1;
    const T = { ...h.event, start: h.event.start, end: h.event.end }, S = h.kind === "resize" ? "eventResize" : "eventDrop", _ = rt(h.event), E = {
      event: h.event,
      oldEvent: T,
      newStart: c,
      newEnd: f,
      jsEvent: v,
      view: t.get("view"),
      isOccurrence: _.isSeriesMember,
      seriesId: _.seriesId,
      revert: () => {
        b = !0;
      }
    };
    if (h.kind === "move")
      E.delta = { days: h.lastDayDelta, milliseconds: h.lastDayDelta * D }, l && (E.oldResource = h.sourceResourceId, E.newResource = h.lastResourceId, E.newResourceIds = y);
    else {
      const O = h.lastDayDelta * D;
      E.endDelta = h.side === "end" ? { milliseconds: O, days: h.lastDayDelta } : { milliseconds: 0, days: 0 }, E.startDelta = h.side === "start" ? { milliseconds: O, days: h.lastDayDelta } : { milliseconds: 0, days: 0 };
    }
    if (t.get("fire")?.(S, E), b) return;
    const I = {
      id: h.event.id,
      start: c.toISOString(),
      end: f.toISOString()
    };
    l && (I.resourceIds = y), Mt({
      state: t,
      options: t.get("options"),
      event: h.event,
      kind: h.kind === "resize" ? "resize" : "drop",
      detailExtras: {
        oldEvent: T,
        delta: E.delta,
        startDelta: E.startDelta,
        endDelta: E.endDelta
      },
      updateAttrs: I
    });
  };
  return n.addEventListener("pointerdown", a), document.addEventListener("pointermove", u, { passive: !1 }), document.addEventListener("pointerup", w), document.addEventListener("pointercancel", w), () => {
    n.removeEventListener("pointerdown", a), document.removeEventListener("pointermove", u), document.removeEventListener("pointerup", w), document.removeEventListener("pointercancel", w);
  };
}
function Ti(n, t) {
  let e = null, o = null, i = [];
  const r = (c, f) => {
    const y = typeof document < "u" && document.elementsFromPoint ? document.elementsFromPoint(c, f) : [];
    for (const l of y) {
      if (l.closest?.("[data-event-id], .ec-resizer, .ec-button, button, [data-more-link], [data-popover-action]"))
        return null;
      const b = l.closest?.("[data-date]");
      if (b && n.contains(b)) return b;
    }
    return null;
  }, s = () => {
    for (const c of i) c.classList.remove("ec-select-highlight");
    i = [];
  }, a = (c, f) => {
    if (s(), !c || !f) return;
    const y = Array.from(n.querySelectorAll("[data-date]")), l = y.indexOf(c), b = y.indexOf(f);
    if (l < 0 || b < 0) return;
    const T = Math.min(l, b), S = Math.max(l, b);
    for (let _ = T; _ <= S; ++_)
      y[_].classList.add("ec-select-highlight"), i.push(y[_]);
  }, u = (c) => {
    const y = t.get("options").selectConstraint;
    if (!y) return !0;
    const l = y.start ? new Date(y.start).getTime() : -1 / 0, b = y.end ? new Date(y.end).getTime() : 1 / 0, T = c instanceof Date ? c.getTime() : new Date(c).getTime();
    return T >= l && T < b;
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
        const l = f.selectLongPressDelay ?? f.longPressDelay ?? 1e3;
        o = { cell: y, jsEvent: c, timer: setTimeout(() => {
          o && (w(o.jsEvent, o.cell), o = null);
        }, l) };
        return;
      }
      w(c, y), c.cancelable && c.preventDefault();
    }
  }, h = (c) => {
    if (o && (clearTimeout(o.timer), o = null), !e) return;
    const f = c.clientX - e.startX, y = c.clientY - e.startY, l = t.get("options").selectMinDistance ?? 5;
    if (!e.moved && f * f + y * y < l * l) return;
    e.moved = !0;
    const b = r(c.clientX, c.clientY);
    b && (e.lastCell = b, a(e.sourceCell, b), c.cancelable && c.preventDefault());
  }, D = (c) => {
    if (o && (clearTimeout(o.timer), o = null), !e) return;
    const f = e;
    if (e = null, !f.moved) {
      s();
      return;
    }
    const y = f.lastCell, l = f.sourceDate, b = y.getAttribute("data-date");
    let T = l <= b ? l : b, S = l <= b ? b : l;
    const _ = /* @__PURE__ */ new Date(T + "T00:00:00Z"), E = /* @__PURE__ */ new Date(S + "T00:00:00Z"), I = new Date(E.getTime() + 864e5);
    if (!u(_) || !u(I)) {
      s();
      return;
    }
    const O = f.sourceCell.closest?.("[data-resource-id]")?.getAttribute("data-resource-id"), R = {
      start: _,
      end: I,
      allDay: !0,
      resource: O ?? null,
      jsEvent: c,
      view: t.get("view")
    };
    t.set("selection", { start: _, end: I, resource: O ?? null }), t.get("fire")?.("select", R), t.get("options").unselectAuto;
  };
  return n.addEventListener("pointerdown", v), document.addEventListener("pointermove", h, { passive: !1 }), document.addEventListener("pointerup", D), document.addEventListener("pointercancel", D), () => {
    n.removeEventListener("pointerdown", v), document.removeEventListener("pointermove", h), document.removeEventListener("pointerup", D), document.removeEventListener("pointercancel", D), o && clearTimeout(o.timer), s();
  };
}
const Ci = {
  DayGrid: Zo,
  TimeGrid: jo,
  List: ei,
  Resource: qt,
  ResourceTimeGrid: qt,
  ResourceTimeline: si,
  Interaction: ai
};
function Si(n) {
  const t = [];
  for (const e of n)
    if (typeof e == "string") {
      const o = Ci[e];
      o && t.push(o);
    } else
      t.push(e);
  return t;
}
const Di = () => globalThis.crypto?.randomUUID?.() ?? `o-${Math.random().toString(36).slice(2)}-${Date.now()}`;
class Mi {
  constructor(t, { filter: e } = {}) {
    this.adapter = t, this.filter = typeof e == "function" ? e : null, this.origin = Di(), this.subscribers = /* @__PURE__ */ new Set(), t && typeof t.onReceive == "function" && t.onReceive((o) => {
      if (o?.origin !== this.origin)
        for (const i of this.subscribers) i(o);
    });
  }
  // op: 'add' | 'update' | 'remove' | 'refetch'
  // event: the normalised event object (or { id } for remove)
  // meta: { user?, channel?, ... } — adapter-specific extras
  publish({ op: t, event: e, meta: o }) {
    if (this.filter && !this.filter({ op: t, event: e, meta: o })) return;
    const i = { op: t, event: e, meta: o, origin: this.origin };
    this.adapter?.send?.(i);
  }
  // Subscribe to incoming messages. Returns an unsubscribe thunk.
  subscribe(t) {
    return this.subscribers.add(t), () => this.subscribers.delete(t);
  }
  close() {
    this.subscribers.clear(), this.adapter?.close?.();
  }
}
function xi(n) {
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
function _i(n, { protocols: t } = {}) {
  const e = new WebSocket(n, t);
  let o = null;
  return e.addEventListener("message", (i) => {
    try {
      o?.(JSON.parse(i.data));
    } catch {
    }
  }), {
    send(i) {
      const r = () => e.send(JSON.stringify(i));
      e.readyState === WebSocket.OPEN ? r() : e.addEventListener("open", r, { once: !0 });
    },
    onReceive(i) {
      o = i;
    },
    close() {
      e.close();
    }
  };
}
function Ei(n, t) {
  let e = null;
  const o = n.subscriptions.create(t, {
    received(i) {
      e?.(i);
    }
  });
  return {
    send(i) {
      o.send(i);
    },
    onReceive(i) {
      e = i;
    },
    close() {
      o.unsubscribe();
    }
  };
}
function Li(n) {
  const t = {};
  for (const i of Array.from(n.attributes)) {
    const { name: r, value: s } = i;
    if (r === "action") continue;
    const a = r.replace(/-([a-z])/g, (u, w) => w.toUpperCase());
    t[a] = s;
  }
  const o = n.querySelector("template")?.innerHTML;
  if (o)
    try {
      const i = JSON.parse(o);
      t.op === "add" || t.op === "update" || t.op === "remove" ? t.event = i : i && typeof i == "object" && Object.assign(t, i);
    } catch {
    }
  return t;
}
function ki() {
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
          n?.(Li(o));
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
function Ai(n, t, e = {}) {
  if (!n) return null;
  if (typeof n == "object" && typeof n.send == "function")
    return n;
  switch (n) {
    case "broadcast-channel":
      return xi(t || "stimulus-calendar");
    case "websocket":
      return _i(t, e);
    case "action-cable":
      return Ei(e.consumer, t);
    case "turbo-stream":
      return ki();
    default:
      return console.warn("[stimulus_calendar] unknown broadcast adapter", n), null;
  }
}
function Pi({
  hostEl: n,
  eventId: t,
  serverValue: e,
  clientValue: o,
  locale: i,
  buttonText: r,
  onResolve: s
}) {
  const a = g("div", "ec-conflict-backdrop", "", [
    ["role", "presentation"]
  ]), u = g("div", "ec-conflict-modal", "", [
    ["role", "dialog"],
    ["aria-modal", "true"],
    ["aria-labelledby", "ec-conflict-title"]
  ]), w = g(
    "h2",
    "ec-conflict-title",
    r?.conflictTitle ?? "Edit conflict",
    [["id", "ec-conflict-title"]]
  ), v = g(
    "p",
    "ec-conflict-message",
    r?.conflictMessage ?? "This event was changed by someone else while you were editing it. Pick which version to keep."
  ), h = g("div", "ec-conflict-values");
  h.append(
    Jt("theirs", r?.conflictTheirs ?? "Theirs (server)", e),
    Jt("mine", r?.conflictMine ?? "Yours", o)
  );
  const D = g("div", "ec-conflict-actions"), c = g(
    "button",
    "ec-conflict-action ec-conflict-action-theirs",
    r?.conflictUseTheirs ?? "Use theirs",
    [["type", "button"]]
  ), f = g(
    "button",
    "ec-conflict-action ec-conflict-action-mine",
    r?.conflictKeepMine ?? "Keep mine",
    [["type", "button"]]
  );
  D.append(c, f), u.append(w, v, h, D), a.append(u), n.append(a);
  let y = !1;
  function l(T) {
    y || (y = !0, document.removeEventListener("keydown", b), a.remove(), s?.({ resolution: T, eventId: t, serverValue: e, clientValue: o }));
  }
  c.addEventListener("click", () => l("theirs")), f.addEventListener("click", () => l("mine")), a.addEventListener("click", (T) => {
    T.target === a && l("dismissed");
  });
  const b = (T) => {
    T.key === "Escape" && l("dismissed");
  };
  return document.addEventListener("keydown", b), queueMicrotask(() => c.focus?.()), { close: () => l("dismissed"), root: a };
}
function Jt(n, t, e) {
  const o = g("div", `ec-conflict-value ec-conflict-value-${n}`);
  o.append(g("h3", "ec-conflict-value-label", t));
  const i = g("pre", "ec-conflict-value-body");
  return i.textContent = Ii(e), o.append(i), o;
}
function Ii(n) {
  if (n == null) return "(none)";
  try {
    return JSON.stringify(n, Oi, 2);
  } catch {
    return String(n);
  }
}
function Oi(n, t) {
  return t instanceof Date ? t.toISOString() : t;
}
const nt = class nt extends _n {
  connect() {
    this._teardowns = [];
    const t = this._collectUserOptions(), e = this._loadPlugins(this.pluginsValue), { state: o, setOption: i, setViewOptions: r } = Jn(e, t);
    this._state = o, this._setOption = i, this._setViewOptions = r, this._viewDates = {}, this._state.set("hostEl", this.element), this._state.set("_pendingAppearIds", /* @__PURE__ */ new Set()), this._state.set("fire", (s, a = {}) => {
      const w = this._state.get("options")?.[s];
      typeof w == "function" && w(a), this.dispatch(s, { detail: a });
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
    for (const e of nt.OPTION_KEYS ?? []) {
      const o = `has${Ri(e)}Value`, i = `${e}Value`;
      this[o] && (t[e] = this[i]);
    }
    return t;
  }
  _loadPlugins(t) {
    if (!ot(t) || !t.length) return [];
    const e = Si(t);
    return jn(e);
  }
  // Install the derived-state pipeline. _recompute() is exposed on `this`
  // so setOption can call it directly after mutating the live options.
  // (state.set('options', {...}) doesn't work for this — the options
  // identity inside options_store is mutated in place; replacing the
  // state ref would desync them.)
  _installDerivations() {
    const t = this._state;
    this._recompute = () => {
      const e = t.get("options"), o = fn(e.date, e.duration, e.firstDay);
      t.set("currentRange", o);
      const i = pn(o, t.get("extensions")?.activeRange);
      t.set("activeRange", i), t.set("viewDates", ke(i, e.hiddenDays ?? [])), t.set("offset", po(e.timeZone ?? "local", e.date));
      const r = un(e.locale, e.titleFormat);
      t.set("intlTitle", r), t.set("viewTitle", hn(r, o)), t.set("view", mn(e.view, t.get("viewTitle"), o, i));
      const s = t.get("events") ?? e.events ?? [], a = Array.isArray(s) ? s : [], u = t.get("resources") ?? e.resources ?? [], w = Array.isArray(u) ? u : [];
      t.set("filteredEvents", gn(
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
    const t = this._state.get("options"), e = Ai(t.broadcast, t.broadcastChannel);
    e && (this._bus = new Mi(e, { filter: t.broadcastFilter }), this._teardowns.push(this._bus.subscribe((o) => this._applyBroadcast(o))), this._teardowns.push(() => this._bus?.close()));
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
    const e = this._state.get("options"), o = typeof e.conflictRenderer == "function" ? e.conflictRenderer : Pi, i = String(t.eventId ?? t.event?.id), r = {
      hostEl: this.element,
      eventId: i,
      serverValue: t.serverValue ?? t.server_value ?? null,
      clientValue: t.clientValue ?? t.client_value ?? null,
      locale: e.locale,
      buttonText: e.buttonText,
      onResolve: ({ resolution: s, serverValue: a, clientValue: u }) => {
        this._activeConflictModal = null;
        const w = s === "mine" ? u : a;
        w && s !== "dismissed" && this._applyEventChange("update", { id: i, ...w }), this.dispatch("conflictResolved", {
          detail: { resolution: s, eventId: i, serverValue: a, clientValue: u }
        });
      }
    };
    this._activeConflictModal = o(r);
  }
  _applySeriesOccurrenceSkip(t, e) {
    const o = this._state.get("events") ?? this._state.get("options").events ?? [], i = String(t), r = o.filter((s) => String(s.extendedProps?.series?.id ?? "") !== i ? !0 : this._eventStartDateStr(s) !== e);
    r.length !== o.length && (this._state.set("events", r), this._recompute(), this.dispatch("seriesOccurrenceSkipped", { detail: { seriesId: i, date: e } }));
  }
  _applySeriesOccurrenceOverride(t, e, o) {
    const i = this._state.get("events") ?? this._state.get("options").events ?? [], r = String(t);
    let s = !1;
    const a = i.map((u) => {
      if (String(u.extendedProps?.series?.id ?? "") !== r || this._eventStartDateStr(u) !== e) return u;
      s = !0;
      const w = { ...u, ...o, id: u.id, extendedProps: { ...u.extendedProps ?? {}, ...o.extendedProps ?? {} } }, v = Ae([w], this._state.get("offset"))[0];
      return { ...u, ...v };
    });
    s && (this._state.set("events", a), this._recompute(), this.dispatch("seriesOccurrenceOverridden", { detail: { seriesId: r, date: e, overrides: o } }));
  }
  _eventStartDateStr(t) {
    const e = t?.start;
    return e ? typeof e == "string" ? e.substring(0, 10) : e instanceof Date ? e.toISOString().substring(0, 10) : null : null;
  }
  _applyEventChange(t, e) {
    const o = this._state.get("events") ?? this._state.get("options").events ?? [], i = t === "remove" ? e : Ae([e], this._state.get("offset"))[0], r = String(e.id);
    let s, a = !1;
    t === "add" ? (s = [...o.filter((u) => u.id !== r), i], a = !0) : t === "update" ? o.findIndex((w) => w.id === r) === -1 ? (s = [...o, i], a = !0) : s = o.map((w) => w.id === r ? { ...w, ...i } : w) : t === "remove" && (s = o.filter((u) => u.id !== r)), a && this._markEventAppearing(r), t === "remove" && this._unmarkEventAppearing(r), s && (this._state.set("events", s), this._recompute());
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
    const t = to(this._state, [
      no(this._setViewOptions),
      oo(),
      io(),
      ro(),
      // Auto-load URL/function event sources on initial mount and on
      // every genuine range change (prev / next / today / view switch /
      // gotoDate). Dedupes by activeRange content so the post-fetch
      // recompute doesn't trigger another fetch.
      so(() => this._refetchEvents()),
      co((e, o) => this.setOption(e, o)),
      ao()
    ]);
    this._teardowns.push(t);
  }
  _mountRootDOM() {
    const t = this._state.get("options"), e = document.createElement("div");
    e.className = t.theme.calendar, e.dataset.calendarRoot = "";
    const o = document.createElement("div");
    o.className = t.theme.toolbar, o.dataset.calendarSlot = "toolbar";
    const i = document.createElement("div");
    i.className = t.theme.main, i.dataset.calendarSlot = "view", e.append(o, i), t.height && (e.style.height = typeof t.height == "number" ? `${t.height}px` : t.height), this.element.replaceChildren(e), this._root = e, this._toolbarEl = o, this.element.dataset.calendarMounted = "true", this._state.set("rootEl", e);
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
    ut(this._toolbarEl, this._state, r), this._teardowns.push(
      this._state.on("change:viewTitle", () => ut(this._toolbarEl, this._state, r))
    ), this._mainEl = i, this._mountView(), this._teardowns.push(
      this._state.on("change:options", () => this._mountView())
    );
    const s = this._state.get("auxComponents") ?? [];
    for (const a of s) {
      const u = a.mount?.(this._root, this._state);
      typeof u == "function" && this._teardowns.push(u);
    }
  }
  _mountView() {
    this._viewTeardown && this._viewTeardown();
    const t = this._state.get("viewComponent"), e = this._state.get("options"), o = e?.view;
    if (o === "dayGridMonth" && e?.continuousMonthScroll && typeof t == "function") {
      const i = Fo(this._mainEl, this._state, {
        onDateChange: (r) => this.element.calendarApi?.gotoDate(r)
      });
      this._monthScroller = i, this._pager = null, this._state.set("pagerApi", null), this._viewTeardown = () => {
        i.destroy(), this._monthScroller = null;
      };
      return;
    }
    if (o === "timeGridWeek" && e?.continuousWeekScroll && typeof t == "function") {
      const i = Wo(this._mainEl, this._state, t, {
        onDateChange: (r) => this.element.calendarApi?.gotoDate(r)
      });
      this._weekScroller = i, this._pager = null, this._state.set("pagerApi", null), this._viewTeardown = () => {
        i.destroy(), this._weekScroller = null;
      };
      return;
    }
    if (o && o.startsWith("resourceTimeline") && typeof t == "function") {
      const i = t(this._mainEl, this._state);
      this._pager = null, this._monthScroller = null, this._weekScroller = null, this._state.set("pagerApi", null), this._viewTeardown = () => {
        i?.();
      };
      return;
    }
    if (typeof t == "function") {
      const i = Io(this._mainEl, this._state, t, {
        onNavigate: ({ direction: r, date: s }) => {
          s ? this.element.calendarApi?.gotoDate(s) : r > 0 ? this.element.calendarApi?.next() : r < 0 && this.element.calendarApi?.prev();
        }
      });
      this._pager = i, this._monthScroller = null, this._state.set("pagerApi", i), this._viewTeardown = () => {
        i.destroy(), this._pager = null, this._state.set("pagerApi", null);
      };
    } else
      this._mainEl.replaceChildren(), this._viewTeardown = null, this._pager = null, this._monthScroller = null, this._state.set("pagerApi", null);
  }
  // -- Public API (`element.calendarApi`) ----------------------------------
  _exposeApi() {
    const t = {
      // Events (full impls land in Phase 10/12)
      addEvent: (e) => {
        const [o] = Ae([e], this._state.get("offset")), i = [...this._state.get("events") ?? this._state.get("options").events ?? []];
        return i.push(o), this._markEventAppearing(o.id), this._state.set("events", i), this._recompute(), this._publishBroadcast("add", e), o;
      },
      updateEvent: (e) => {
        let o = null;
        const i = (this._state.get("events") ?? this._state.get("options").events ?? []).map((r) => {
          if (r.id !== String(e.id)) return r;
          const [s] = Ae([{ ...r, ...e }], this._state.get("offset"));
          return o = s, s;
        });
        return this._state.set("events", i), this._recompute(), this._publishBroadcast("update", Hi(o ?? e)), e;
      },
      removeEventById: (e) => {
        const o = String(e);
        this._state.set(
          "events",
          (this._state.get("events") ?? this._state.get("options").events ?? []).filter((i) => i.id !== o)
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
        const i = this._state.get("resourceGroupState") ?? /* @__PURE__ */ new Map();
        i.set(String(e), !!o), this._state.set("resourceGroupState", i);
        const s = this._state.get("resourceGroupsById")?.get(String(e));
        s && (s.expanded = !!o), this._recompute();
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
        const i = e ? String(e) : null;
        i ? this.element.setAttribute("data-calendar-mode", i) : this.element.removeAttribute("data-calendar-mode"), this._state.set("mode", i), this._state.set("modeContext", o ?? null), this.dispatch("modeChange", { detail: { mode: i, context: o ?? null } });
      },
      clearMode: () => this.element.calendarApi.setMode(null, null),
      getMode: () => this._state.get("mode") ?? null,
      getModeContext: () => this._state.get("modeContext") ?? null,
      // Phase D3 — paint a "suggested slot" on the strip / time grid.
      // Renderer-agnostic: lives in state.suggestedSlot, picked up by
      // each view's render loop.
      setSuggestedSlot: ({ start: e, end: o, resourceId: i } = {}) => {
        const r = e && o ? { start: new Date(e), end: new Date(o), resourceId: i ?? null } : null;
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
        const i = o instanceof Date ? o.getTime() : new Date(o).getTime();
        return i < e.start.getTime() || i >= e.end.getTime();
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
        const i = t.getEventById(String(e));
        if (!i) return null;
        const r = o || this._root?.querySelector(`[data-event-id="${CSS.escape(String(e))}"]`);
        return r ? It({ event: i, anchorEl: r, state: this._state }) : null;
      },
      closeEventPopover: xe,
      isEventPopoverOpen: Co,
      openEventPopoverId: So
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
      e.target?.closest?.("[data-event-id]") && ri(this._state) && e.stopImmediatePropagation();
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
      const i = e.target?.closest?.("[data-bridge-action]");
      if (!i) return;
      const r = {
        kind: i.getAttribute("data-bridge-action"),
        payload: i.getAttribute("data-payload"),
        fallbackHref: i.getAttribute("href") ?? null,
        el: i,
        jsEvent: e
      }, s = new CustomEvent("calendar:bridgeAction", {
        bubbles: !0,
        cancelable: !0,
        detail: r
      });
      i.dispatchEvent(s) || (e.preventDefault(), e.stopPropagation());
    };
    this.element.addEventListener("click", t, !0), this._teardowns.push(() => this.element.removeEventListener("click", t, !0));
  }
  _installEventPopoverDefault() {
    const t = (e) => {
      const { event: o, el: i } = e.detail ?? {};
      !o || !i || queueMicrotask(() => {
        e.defaultPrevented || this._state.get("options")?.suppressEventPopover || It({ event: o, anchorEl: i, state: this._state });
      });
    };
    this.element.addEventListener("calendar:eventDoubleClick", t), this._teardowns.push(() => this.element.removeEventListener("calendar:eventDoubleClick", t)), this._teardowns.push(() => xe());
  }
  _navigate(t) {
    const e = this._state.get("options"), o = $(e.date), i = e.dateIncrement ?? e.duration;
    t > 0 ? ve(o, i) : nn(o, i), this.setOption("date", o);
  }
  // Pull fresh event data from options.eventSources (function or URL) +
  // any legacy options.events function and replace state.events. Called
  // by the public refetchEvents() and on dates-set when lazyFetching is
  // on. URL sources are fetched against the active range as
  // ?start=&end= ISO strings.
  async _refetchEvents() {
    const t = this._state.get("options"), e = [];
    t.events !== void 0 && e.push(t.events), Array.isArray(t.eventSources) && e.push(...t.eventSources);
    const o = this._state.get("activeRange"), i = o ? {
      start: Ie(o.start, 10),
      end: Ie(o.end, 10)
    } : {}, r = [];
    for (const s of e) {
      const a = await this._resolveSource(s, i);
      Array.isArray(a) && r.push(...a);
    }
    if (r.length || e.length) {
      const s = Ae(r, this._state.get("offset"));
      this._state.set("events", s), this._recompute(), this.dispatch("eventSourceSuccess", { detail: { events: s } });
    }
    return r;
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
    for (const [i, r] of Object.entries(e)) r != null && o.searchParams.set(i, r);
    try {
      const i = await fetch(o.toString(), { headers: { Accept: "application/json" } });
      return i.ok ? await i.json() : (this.dispatch("eventSourceFailure", { detail: { url: o.toString(), status: i.status } }), null);
    } catch (i) {
      return this.dispatch("eventSourceFailure", { detail: { url: o.toString(), error: i.message } }), null;
    }
  }
  // Clear the active selection (set by the Interaction plugin) and call
  // options.unselect when registered.
  _unselect(t) {
    if (this._state.get("selection")) {
      this._state.set("selection", null), this._root?.querySelectorAll(".ec-select-highlight").forEach((i) => i.classList.remove("ec-select-highlight"));
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
    for (const i of o) {
      const r = i.closest?.("[data-date]");
      if (r && this._root.contains(r)) {
        const s = r.getAttribute("data-date"), a = de(s), u = i.closest?.(".ec-time-col");
        if (u) {
          const w = u.getBoundingClientRect(), v = this._state.get("options"), h = (v.slotDuration?.seconds ?? 1800) / 60 || 30, D = (v.slotHeight ?? 22) / h, c = Math.max(0, Math.round((e - w.top) / D));
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
    t === "date" && (typeof e == "string" || e instanceof Date) && (e = ne(de(e))), t === "duration" && (typeof e == "string" || typeof e == "number" || en(e)) && (e = re(e)), t === "dateIncrement" && e !== void 0 && !_e(e) && (e = re(e));
    const o = this._state.get("options").view;
    if (t === "view" && e !== o) {
      if (this._viewTeardown && (this._viewTeardown(), this._viewTeardown = null), o) {
        const a = this._state.get("options").date;
        a instanceof Date && (this._viewDates[o] = ne(de(a)));
      }
      this._setOption(t, e);
      const i = this._setViewOptions(e);
      typeof i == "function" && this._state.set("viewComponent", i(this._state));
      const r = this._viewDates[e];
      r instanceof Date && this._setOption("date", r), this._recompute(), this._mountView();
      const s = this._toolbarActions();
      ut(this._toolbarEl, this._state, s);
      return;
    }
    if (this._setOption(t, e), t === "date" && e instanceof Date) {
      const i = this._state.get("options").view;
      i && (this._viewDates[i] = ne(de(e)));
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
_t(nt, "values", {
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
let Oe = nt;
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
function Ri(n) {
  return n.charAt(0).toUpperCase() + n.slice(1);
}
function Hi(n) {
  if (!n) return n;
  const t = { ...n };
  return t.start instanceof Date && (t.start = Qt(t.start)), t.end instanceof Date && (t.end = Qt(t.end)), t;
}
function Qt(n) {
  const t = Ie(n, 19), e = Qe(n);
  if (e === void 0) return t;
  const o = e >= 0 ? "+" : "-", i = Math.abs(e), r = String(Math.floor(i / 60)).padStart(2, "0"), s = String(i % 60).padStart(2, "0");
  return `${t}${o}${r}:${s}`;
}
const Fi = "0.0.0";
function Ni(n) {
  const t = n ?? jt.start();
  return t.register("calendar", Oe), t;
}
const Tt = /* @__PURE__ */ new WeakMap();
function $i(n, t = {}) {
  if (!n || n.nodeType !== 1)
    throw new TypeError("StimulusCalendar.create: first arg must be a DOM element");
  n.dataset.calendarOptionsValue = JSON.stringify(t), n.setAttribute(
    "data-controller",
    [(n.getAttribute("data-controller") || "").trim(), "calendar"].filter(Boolean).join(" ")
  );
  const e = jt.start();
  return e.register("calendar", Oe), Tt.set(n, e), n;
}
function Bi(n) {
  const t = Tt.get(n);
  t && t.stop(), n.removeAttribute("data-controller"), delete n.dataset.calendarOptionsValue, delete n.calendarApi, Tt.delete(n);
}
const Ui = {
  start: Ni,
  create: $i,
  destroy: Bi,
  CalendarController: Oe,
  VERSION: Fi
};
typeof window < "u" && !window.__stimulusCalendarStarted && (window.__stimulusCalendarStarted = !0, window.StimulusCalendar = Ui);
export {
  Oe as CalendarController,
  Fi as VERSION,
  $i as create,
  Ui as default,
  Bi as destroy,
  Ni as start
};
//# sourceMappingURL=stimulus_calendar.esm.js.map
