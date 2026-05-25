// Turbo Streams adapter — registers a custom <turbo-stream
// action="calendar-event"> handler that fires inbound messages, and posts
// outbound messages by emitting a CustomEvent ('stimulus-calendar:broadcast')
// that the Rails companion gem (`stimulus_calendar_rails`) listens for and
// re-broadcasts over Action Cable.
//
// The bidirectional shape lets the JS bus stay transport-agnostic while
// the gem handles the actual server fan-out via
// Turbo::StreamsChannel.broadcast_action_to.

export function createTurboStreamAdapter() {
  let handler = null;

  // Listen for inbound <turbo-stream action="calendar-event"> elements.
  function onConnect() {
    customElements.upgrade?.(document.querySelector('turbo-stream'));
    document.addEventListener('turbo:before-stream-render', (e) => {
      const stream = e.detail?.newStream;
      if (stream?.getAttribute('action') === 'calendar-event') {
        e.preventDefault();   // we handle the apply manually
        try {
          const payload = JSON.parse(stream.querySelector('template')?.innerHTML || '{}');
          handler?.(payload);
        } catch { /* ignore */ }
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
