// BroadcastChannel adapter — tab-to-tab sync inside a single browser,
// no server required. Great for local demos.

export function createBroadcastChannelAdapter(channelName) {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  const channel = new BroadcastChannel(channelName);
  let handler = null;
  channel.onmessage = (e) => handler?.(e.data);
  return {
    send(message) { channel.postMessage(message); },
    onReceive(fn) { handler = fn; },
    close() { channel.close(); },
  };
}
