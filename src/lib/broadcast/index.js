// Broadcast adapter resolution.

import { BroadcastBus } from './bus.js';
import { createBroadcastChannelAdapter } from './broadcast_channel.js';
import { createWebSocketAdapter } from './websocket.js';
import { createActionCableAdapter } from './action_cable.js';
import { createTurboStreamAdapter } from './turbo_stream.js';

export { BroadcastBus };

// Resolve options.broadcast + options.broadcastChannel into an adapter.
//   'broadcast-channel' + channel name      → BroadcastChannel
//   'websocket'         + url               → raw WebSocket
//   'action-cable'      + identifier        → Action Cable subscription
//   'turbo-stream'                          → Turbo Stream custom action
//   false / undefined                       → no adapter (broadcasting off)
//   adapter object                          → used as-is
export function resolveAdapter(broadcast, channel, extras = {}) {
  if (!broadcast) return null;
  if (typeof broadcast === 'object' && typeof broadcast.send === 'function') {
    return broadcast;
  }
  switch (broadcast) {
    case 'broadcast-channel':
      return createBroadcastChannelAdapter(channel || 'stimulus-calendar');
    case 'websocket':
      return createWebSocketAdapter(channel, extras);
    case 'action-cable':
      return createActionCableAdapter(extras.consumer, channel);
    case 'turbo-stream':
      return createTurboStreamAdapter();
    default:
      // eslint-disable-next-line no-console
      console.warn('[stimulus_calendar] unknown broadcast adapter', broadcast);
      return null;
  }
}
