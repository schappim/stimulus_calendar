# Tradie / field service patterns

How to build a ServiceM8 / Tradify / Fergus‑style dispatch board, field view
and customer touchpoints on top of `stimulus_calendar` **without** baking job
lifecycle into the core. Every feature here is either:

- **L0 — already supported by the library** (use existing hooks, pass shape
  via `extendedProps`),
- **L1 — small, generic extension** (a few CSS classes, a `data-*`
  attribute the library already understands, or a tiny helper),
- **L2 — new option / view** in the library (called out explicitly).

See `demo/22-…` through `demo/40-…` for runnable examples of every feature.

---

## Convention: tradie data lives under `extendedProps`

The calendar already passes `extendedProps` through every callback. Park the
tradie‑specific fields there — none of these become library concerns:

```js
{
  id: "j-1042",
  resourceIds: ["van-7"],          // who's doing it
  start: "2026-05-26T09:00",
  end:   "2026-05-26T11:00",
  title: "Hot water replacement",  // shown on the chip
  extendedProps: {
    status:      "scheduled",      // quoted | scheduled | inProgress | completed | invoiced | cancelled
    jobNumber:   "J-1042",
    customer:    { name: "Marcus S.", phone: "+61 400 000 000" },
    address:     { line1: "12 Ada St", suburb: "Surry Hills", postcode: "2010",
                   lat: -33.886, lng: 151.214, gateCode: "1234#" },
    arrival:     { kind: "window", from: "09:00", to: "11:00" }, // or { kind: "fixed" }
    durationEst: 120,              // minutes; used by find-slot + heatmap
    actuals:     { startedAt: null, stoppedAt: null }, // clock on/off writes here
    dependsOn:   ["j-1041"],       // job-dependencies
    onCall:      false,            // on-call/after-hours
    reminderId:  "rem-1042",       // sms-reminders link
    series:      { id: "maint-acme", instance: 4 } // recurring-maintenance
  }
}
```

A matching convention for **resources** (tradies, vans, crews):

```js
{
  id: "van-7",
  title: "Dan — Van 7",
  eventBackgroundColor: "#0ea5e9",    // default chip colour for this lane
  extendedProps: {
    role:     "plumber",
    homeBase: { lat: -33.86, lng: 151.21 },
    workingHours: { start: "07:00", end: "16:00" },
    onCall:   false
  }
}
```

---

## Feature → hook map

### Dispatch board (the spine)

| Feature | Built on | Demo |
|---|---|---|
| **Resource lanes** — column‑per‑tradie | `resourceTimeGridDay` / `resourceTimeGridWeek` (already in library) | `22-dispatch-board.html` |
| **Status‑coloured events** | `eventClassNames: ({ event }) => 'job-status-' + event.extendedProps.status` + a CSS file the host app ships | `24-status-lifecycle.html` |
| **Drag‑to‑reassign** | `eventDrop` event — `event.getResources()` exposes the new lane; emit your own `tradie:reassigned` notification from inside | `22-dispatch-board.html` |
| **Unscheduled job tray** | Sidebar `<ul>` of jobs with a `pointerdown`/`pointermove` handler that calls `api.dateFromPoint(x, y)` on drop and `api.addEvent({ resourceIds, start, end, ... })`. No library change. | `23-unscheduled-tray.html` |

### Geography

| Feature | Built on | Demo |
|---|---|---|
| **Travel‑time blocks** | After every `eventDrop` / `addEvent`, re‑scan each resource's day, compute travel between consecutive jobs using `extendedProps.address.{lat,lng}`, and `addEvent({ display: 'background' })` for each gap. Library renders background events as a translucent band. | `25-travel-time.html` |
| **Map sidecar** | Pure DOM — render an `<svg>` or `<canvas>` next to the calendar. `calendar:eventClick` ⇄ pin highlight. No library change. | `26-map-sidecar.html` |
| **Nearby‑hint on drag** | `calendar:eventDragStart` snapshots the day's other events with addresses; `pointermove` on the calendar root computes nearest by lat/lng and writes a tooltip. | `27-nearby-hint.html` |

### Tradie reality

| Feature | Built on | Demo |
|---|---|---|
| **Arrival windows** | Per job, add a `display: 'background'` companion event spanning the window, plus a normal chip at the booked time. `eventClassNames` gives the band a hatched fill. | `28-arrival-windows.html` |
| **Multi‑day site work** | Existing all‑day multi‑day events — already render across day‑columns in `dayGridWeek`, and in the all‑day strip of `resourceTimeGridWeek`. | `29-multi-day-site.html` |
| **On‑call / after‑hours** | Background events for the on‑call window per resource; jobs that land inside the window get an extra class via `eventClassNames`. | `30-on-call-shifts.html` |
| **Recurring maintenance** | The library doesn't expand RRULE itself — the host app expands the series and pushes one `event` per occurrence with `extendedProps.series.id`. Per‑occurrence skip = `api.removeEventById(occurrenceId)`. | `31-recurring-maintenance.html` |
| **Job dependencies** | `calendar:eventDrop` — look up `extendedProps.dependsOn`, compare new times, call `detail.revert()` and toast if the order would invert. | `32-job-dependencies.html` |

### Field view

| Feature | Built on | Demo |
|---|---|---|
| **Single‑tradie agenda** | `listDay` or `timeGridDay`, filtered to one resource (`eventFilter`). | `33-field-view.html` |
| **Tap‑to‑call / tap‑to‑navigate** | `eventContent` renderer that returns `{ html }` containing `<a href="tel:…">` and `<a href="https://maps.apple.com/?q=lat,lng">`. | `33-field-view.html` |
| **Clock on/off → actuals** | Button inside `eventContent`; on click, mutate `extendedProps.actuals`. Render the actual band as a sibling `display: 'background'` event with class `job-actual`. | `34-clock-on-off.html` |
| **Printable run sheet** | A second `<section>` on the page that lists the day's events in order. `@media print` hides the calendar; the run sheet prints. | `35-run-sheet.html` |
| **Offline edits** | Wrap `addEvent` / `updateEvent` so when `navigator.onLine === false` they push to a local queue, and a `online` listener replays. UI shows a pending badge. | `40-offline-edits.html` |

### Capacity & customer hooks

| Feature | Built on | Demo |
|---|---|---|
| **Capacity heatmap** | `eventDidMount` per day‑cell isn't a thing yet, so use `eventAllUpdated` — iterate events grouped by `(resourceId, day)`, compute % of working hours, and stamp a `--capacity` CSS var on the matching day‑header cell. | `36-capacity-heatmap.html` |
| **Find me a slot** | Pure JS over `api.getEvents()` + the resource list — no library change. | `37-find-slot.html` |
| **SMS reminders** | Each job has a child reminder event with `extendedProps.reminderId`; `eventDrop` on the job re‑computes and `updateEvent`s the reminder. | `38-sms-reminders.html` |
| **Customer confirm / reschedule** | A second page that subscribes to the same `BroadcastChannel` and renders a single event. Customer's "confirm" or proposed new time round‑trips into the dispatcher view. | `39-customer-confirm.html` |

---

## Library changes worth considering (none are blockers)

Everything above runs against `main`. These would make a few demos cleaner but
are optional:

1. **`event.display: 'band'`** — semantically the same as `'background'` but
   with a hatched/striped fill out of the box, instead of host‑app CSS. Used
   by arrival windows, on‑call, travel‑time, and actuals.
2. **`view.resourceHeaderContent`** — a render hook for the per‑resource
   column header (avatar + working‑hours + on‑call toggle). Today the host
   app does it with `resourceLabelDidMount`.
3. **`capacityFor(resourceId, date) → number`** — a built‑in % computation
   so the heatmap demo doesn't have to roll its own.
4. **Drag‑from‑outside helper** — a `data-calendar-drop-source` controller
   that wraps the `pointerdown → dateFromPoint → addEvent` pattern. Today
   the unscheduled tray re‑implements it per demo.

None of these block any of the demos; they just shorten the code.

---

## What this is NOT

This is *not* a job‑lifecycle engine. It doesn't know what a quote is, doesn't
know how invoices work, doesn't enforce status transitions, and doesn't talk
to your CRM. It's a calendar that exposes enough hooks for your tradie app to
do all of that on top.

The contract is one‑way: the host app owns the job model and pushes events
into the calendar; the calendar emits drag/drop/click events back; the host
app updates its own model and re‑pushes. That's it.
