// Port of calendar/packages/core/src/lib/payload.js (vkurko/calendar v5.7.1).
// Symbol-keyed "private slot" for attaching internal state to a public-shaped
// object (event / resource / chunk) without colliding with user properties.

import { symbol } from './utils.js';

const payloadProp = symbol();

export function setPayload(obj, payload) {
  obj[payloadProp] = payload;
}

export function hasPayload(obj) {
  return !!obj?.[payloadProp];
}

export function getPayload(obj) {
  return obj[payloadProp];
}
