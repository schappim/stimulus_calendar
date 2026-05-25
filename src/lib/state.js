// Phase 2 — state container for the calendar controller. Upstream uses
// Svelte 5 runes + an objectProxy. The Stimulus port replaces both with
// a plain mutable object plus a pub/sub model: subscribers register
// callbacks for `change:<name>` (or `change` for any change) and are
// invoked synchronously when `set` is called.
//
// Derived values (currentRange, activeRange, viewDates, ...) are not
// stored on the state object — instead, the state module recomputes them
// on every relevant change via `recomputeDerived` and stores the result
// back via setDerived(). This keeps lib/state.js dependency-free of the
// derived helpers (which would create a cycle since derived.js uses view).

export class MainState {
  constructor(initial = {}) {
    this._data = { ...initial };
    this._listeners = new Map();   // event name → Set<fn>
    this._anyListeners = new Set();
  }

  // Read a value.
  get(key) {
    return this._data[key];
  }

  // Read every key as an object snapshot (cheap shallow copy).
  snapshot() {
    return { ...this._data };
  }

  // Write a value and notify subscribers. Skips notifications when the
  // value didn't change (===) so derived chains don't loop.
  set(key, value) {
    if (this._data[key] === value) return;
    const prev = this._data[key];
    this._data[key] = value;
    const change = { key, value, prev };
    this._fire(`change:${key}`, change);
    this._anyListeners.forEach((fn) => fn(change));
  }

  // Bulk apply { key: value, ... }. Each change is dispatched individually
  // before the next is applied.
  assign(patch) {
    for (const [key, value] of Object.entries(patch)) this.set(key, value);
  }

  // Subscribe to `change:<name>`. Returns an unsubscribe thunk.
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }

  // Subscribe to every change. Receives the same { key, value, prev }
  // payload as targeted listeners. Useful for the derived pipeline that
  // recomputes anything that depends on any option.
  onAny(fn) {
    this._anyListeners.add(fn);
    return () => this._anyListeners.delete(fn);
  }

  // Remove every subscriber. Used on controller teardown.
  destroy() {
    this._listeners.clear();
    this._anyListeners.clear();
    this._data = {};
  }

  _fire(event, change) {
    const set = this._listeners.get(event);
    if (set) for (const fn of set) fn(change);
  }
}
