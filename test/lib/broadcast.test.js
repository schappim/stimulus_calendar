import { describe, it, expect, vi } from 'vitest';
import { BroadcastBus } from '../../src/lib/broadcast/bus.js';

function fakeAdapter() {
  let received;
  const messages = [];
  return {
    messages,
    send(m) { messages.push(m); },
    onReceive(fn) { received = fn; },
    fire(m) { received?.(m); },
    close() {},
  };
}

describe('BroadcastBus', () => {
  it('publish sends through the adapter with the bus origin tag', () => {
    const adapter = fakeAdapter();
    const bus = new BroadcastBus(adapter);
    bus.publish({ op: 'add', event: { id: '1' } });
    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].op).toBe('add');
    expect(adapter.messages[0].origin).toBe(bus.origin);
  });

  it('subscribers fire on inbound messages from other origins', () => {
    const adapter = fakeAdapter();
    const bus = new BroadcastBus(adapter);
    const handler = vi.fn();
    bus.subscribe(handler);
    adapter.fire({ op: 'add', event: { id: '1' }, origin: 'other' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('subscribers do NOT fire on echoes from the same origin', () => {
    const adapter = fakeAdapter();
    const bus = new BroadcastBus(adapter);
    const handler = vi.fn();
    bus.subscribe(handler);
    adapter.fire({ op: 'add', event: { id: '1' }, origin: bus.origin });
    expect(handler).not.toHaveBeenCalled();
  });

  it('filter blocks outbound publishes when it returns false', () => {
    const adapter = fakeAdapter();
    const bus = new BroadcastBus(adapter, { filter: ({ op }) => op !== 'remove' });
    bus.publish({ op: 'add', event: { id: '1' } });
    bus.publish({ op: 'remove', event: { id: '1' } });
    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].op).toBe('add');
  });

  it('close clears subscribers and stops the adapter', () => {
    const adapter = fakeAdapter();
    const close = vi.spyOn(adapter, 'close');
    const bus = new BroadcastBus(adapter);
    bus.subscribe(() => {});
    bus.close();
    expect(close).toHaveBeenCalled();
    expect(bus.subscribers.size).toBe(0);
  });
});
