// Raw WebSocket adapter. The server format is whatever your app uses;
// this adapter just JSON-encodes outbound and JSON-decodes inbound.

export function createWebSocketAdapter(url, { protocols } = {}) {
  const ws = new WebSocket(url, protocols);
  let handler = null;
  ws.addEventListener('message', (e) => {
    try { handler?.(JSON.parse(e.data)); } catch { /* ignore non-JSON */ }
  });
  return {
    send(message) {
      const send = () => ws.send(JSON.stringify(message));
      if (ws.readyState === WebSocket.OPEN) send();
      else ws.addEventListener('open', send, { once: true });
    },
    onReceive(fn) { handler = fn; },
    close() { ws.close(); },
  };
}
