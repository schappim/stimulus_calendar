// Turbo Streams adapter — registers a custom <turbo-stream
// action="calendar-event"> handler that fires inbound messages, and posts
// outbound messages by emitting a CustomEvent ('stimulus-calendar:broadcast')
// that the Rails companion gem (`stimulus_calendar_rails`) listens for and
// re-broadcasts over Action Cable.
//
// The bidirectional shape lets the JS bus stay transport-agnostic while
// the gem handles the actual server fan-out via
// Turbo::StreamsChannel.broadcast_action_to.

// Internal — pull a calendar-event message out of a <turbo-stream>
// element. The Ruby helper encodes:
//
//   - op + identifiers as kebab-cased HTML attributes on the
//     <turbo-stream> tag itself (op="add", event-id="42",
//     series-id="abc", date="2026-06-09").
//   - the per-op data block inside <template> as JSON.
//
// For ops that carry a full event object (add / update / remove) the
// template JSON becomes `message.event`. For series-aware ops
// (skip-occurrence / override-occurrence) the template JSON is the
// data block (`{ seriesId, date, overrides }`) and we merge its keys
// onto the message directly so the controller can read them flat.
export function readCalendarEventStream(stream) {
  const message = {};
  for (const attr of Array.from(stream.attributes)) {
    const { name, value } = attr;
    if (name === 'action') continue;
    const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    message[camel] = value;
  }
  const template = stream.querySelector('template');
  const raw = template?.innerHTML;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (message.op === 'add' || message.op === 'update' || message.op === 'remove') {
        message.event = parsed;
      } else if (parsed && typeof parsed === 'object') {
        Object.assign(message, parsed);
      }
    } catch { /* ignore */ }
  }
  return message;
}

export function createTurboStreamAdapter() {
  let handler = null;

  function onConnect() {
    // Upgrade any pre-existing <turbo-stream> nodes so they're known to
    // the custom-element registry before we start dispatching. Passing
    // a null Node throws ("parameter 1 is not of type 'Node'") — on
    // pages where the adapter mounts before the first stream element
    // exists, querySelector returns null and the unguarded call
    // breaks _installBroadcastBus, taking the calendar's connect with it.
    if (typeof customElements?.upgrade === 'function') {
      for (const node of document.querySelectorAll('turbo-stream')) {
        customElements.upgrade(node);
      }
    }
    document.addEventListener('turbo:before-stream-render', (e) => {
      const stream = e.detail?.newStream;
      if (stream?.getAttribute('action') === 'calendar-event') {
        e.preventDefault();   // we handle the apply manually
        try { handler?.(readCalendarEventStream(stream)); } catch { /* ignore */ }
      }
    });
  }

  if (typeof document !== 'undefined') onConnect();

  return {
    send(message) {
      if (typeof document === 'undefined') return;
      document.dispatchEvent(new CustomEvent('stimulus-calendar:broadcast', { detail: message }));
    },
    onReceive(fn) { handler = fn; },
    close() {},   // nothing to dispose
  };
}
