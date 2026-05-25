// BroadcastBus — transport-agnostic core for live multi-user sync.
//
// Each adapter (turbo_stream, action_cable, websocket, broadcast_channel)
// implements:
//   { send(message) }        — push a JSON message to peers
//   onReceive(handler)       — register a handler called for inbound messages
//   close()                  — tear down the transport
//
// The bus origin-tags every outbound message with a per-bus nonce so
// the originator can ignore its own echoes when a server fan-out includes
// the originating client.

const newOrigin = () =>
  (globalThis.crypto?.randomUUID?.() ?? `o-${Math.random().toString(36).slice(2)}-${Date.now()}`);

export class BroadcastBus {
  constructor(adapter, { filter } = {}) {
    this.adapter = adapter;
    this.filter = typeof filter === 'function' ? filter : null;
    this.origin = newOrigin();
    this.subscribers = new Set();
    if (adapter && typeof adapter.onReceive === 'function') {
      adapter.onReceive((message) => {
        // Drop our own echoes.
        if (message?.origin === this.origin) return;
        for (const fn of this.subscribers) fn(message);
      });
    }
  }

  // op: 'add' | 'update' | 'remove' | 'refetch'
  // event: the normalised event object (or { id } for remove)
  // meta: { user?, channel?, ... } — adapter-specific extras
  publish({ op, event, meta }) {
    if (this.filter && !this.filter({ op, event, meta })) return;
    const message = { op, event, meta, origin: this.origin };
    this.adapter?.send?.(message);
  }

  // Subscribe to incoming messages. Returns an unsubscribe thunk.
  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  close() {
    this.subscribers.clear();
    this.adapter?.close?.();
  }
}
