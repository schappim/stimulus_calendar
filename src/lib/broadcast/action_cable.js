// Action Cable adapter — subscribes a Cable channel and routes messages.
// Caller passes a Cable consumer + channel identifier.
//
//   import { createConsumer } from '@rails/actioncable';
//   const consumer = createConsumer();
//   const adapter = createActionCableAdapter(consumer, { channel: 'CalendarChannel' });

export function createActionCableAdapter(consumer, identifier) {
  let handler = null;
  const subscription = consumer.subscriptions.create(identifier, {
    received(data) { handler?.(data); },
  });
  return {
    send(message) { subscription.send(message); },
    onReceive(fn) { handler = fn; },
    close() { subscription.unsubscribe(); },
  };
}
