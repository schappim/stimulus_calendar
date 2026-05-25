// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import {
  createElement, rect, ancestor, height,
  getElementWithPayload, elementFromPoint,
  listen, stopPropagation, isRtl,
} from '../../src/lib/dom.js';
import { setPayload } from '../../src/lib/payload.js';

describe('lib/dom', () => {
  it('createElement: text content + class + attrs', () => {
    const el = createElement('div', 'cls', 'hello', [['data-x', '1']]);
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('cls');
    expect(el.innerText).toBe('hello');
    expect(el.getAttribute('data-x')).toBe('1');
  });

  it('createElement: { html } content sets innerHTML', () => {
    const el = createElement('span', 'sp', { html: '<b>x</b>' });
    expect(el.innerHTML).toBe('<b>x</b>');
  });

  it('createElement: { domNodes } content replaces children', () => {
    const child = document.createElement('em');
    const el = createElement('p', 'p', { domNodes: [child] });
    expect(el.firstChild).toBe(child);
  });

  it('rect / height pass through getBoundingClientRect', () => {
    const el = document.createElement('div');
    // jsdom returns zeros, but the wrapper should still call cleanly.
    expect(rect(el)).toEqual(expect.objectContaining({ width: 0, height: 0 }));
    expect(height(el)).toBe(0);
  });

  it('ancestor walks N parentElements up', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const c = document.createElement('div');
    a.appendChild(b); b.appendChild(c);
    expect(ancestor(c, 1)).toBe(b);
    expect(ancestor(c, 2)).toBe(a);
  });

  it('getElementWithPayload returns the first element with a payload', () => {
    const root = document;
    const el = document.createElement('div');
    document.body.appendChild(el);
    // Stub elementsFromPoint so we don't need real geometry.
    root.elementsFromPoint = () => [document.createElement('div'), el];
    setPayload(el, { kind: 'event' });
    const found = getElementWithPayload(0, 0, root);
    expect(found).toBe(el);
  });

  it('getElementWithPayload returns null when nothing has a payload', () => {
    document.elementsFromPoint = () => [document.createElement('span')];
    expect(getElementWithPayload(0, 0)).toBeNull();
  });

  it('elementFromPoint returns the topmost element or null', () => {
    const a = document.createElement('div');
    document.elementsFromPoint = () => [a];
    expect(elementFromPoint(1, 1)).toBe(a);
    document.elementsFromPoint = () => [];
    expect(elementFromPoint(1, 1)).toBeNull();
  });

  it('listen attaches and the returned thunk detaches', () => {
    const el = document.createElement('button');
    const handler = vi.fn();
    const off = listen(el, 'click', handler);
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledOnce();
    off();
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('stopPropagation wraps and calls stopPropagation before the inner fn', () => {
    const inner = vi.fn();
    const fakeEvent = { stopPropagation: vi.fn() };
    stopPropagation(inner)(fakeEvent);
    expect(fakeEvent.stopPropagation).toHaveBeenCalledOnce();
    expect(inner).toHaveBeenCalledWith(fakeEvent);
  });

  it('stopPropagation tolerates a null inner fn', () => {
    const fakeEvent = { stopPropagation: vi.fn() };
    expect(() => stopPropagation(null)(fakeEvent)).not.toThrow();
    expect(fakeEvent.stopPropagation).toHaveBeenCalledOnce();
  });

  it('isRtl reads computedStyle on documentElement', () => {
    expect(isRtl()).toBe(false);  // jsdom default LTR
    document.documentElement.style.direction = 'rtl';
    expect(isRtl()).toBe(true);
    document.documentElement.style.direction = '';
  });
});
