// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { contentFrom, outsideEvent, resizeObserver, intersectionObserver }
  from '../../src/lib/attachments.js';

describe('lib/attachments', () => {
  it('contentFrom(string) sets innerText', () => {
    const el = document.createElement('div');
    contentFrom('hi')(el);
    expect(el.innerText).toBe('hi');
  });

  it('contentFrom({ html }) sets innerHTML', () => {
    const el = document.createElement('span');
    contentFrom({ html: '<b>x</b>' })(el);
    expect(el.innerHTML).toBe('<b>x</b>');
  });

  it('contentFrom({ domNodes }) replaces children', () => {
    const el = document.createElement('p');
    const child = document.createElement('em');
    contentFrom({ domNodes: [child] })(el);
    expect(el.firstChild).toBe(child);
  });

  it('outsideEvent fires `<type>outside` for events outside the element', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('button');
    document.body.appendChild(outer);
    document.body.appendChild(inner);

    const teardown = outsideEvent('click')(outer);
    const handler = vi.fn();
    outer.addEventListener('clickoutside', handler);

    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.jsEvent).toBeDefined();

    teardown();
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledOnce();  // not called again
  });

  it('outsideEvent does NOT fire when the event is inside', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('button');
    outer.appendChild(inner);
    document.body.appendChild(outer);

    outsideEvent('click')(outer);
    const handler = vi.fn();
    outer.addEventListener('clickoutside', handler);

    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('resizeObserver delegates entries to callback(el, entry)', () => {
    const el = document.createElement('div');
    const cb = vi.fn();

    let captured;
    class FakeRO {
      constructor(handler) { captured = handler; }
      observe() {}
      unobserve() {}
    }
    globalThis.ResizeObserver = FakeRO;

    const teardown = resizeObserver(cb)(el);
    captured([{ contentRect: { width: 10 } }]);
    expect(cb).toHaveBeenCalledWith(el, { contentRect: { width: 10 } });
    expect(typeof teardown).toBe('function');
  });

  it('intersectionObserver delegates entries to callback(el, entry)', () => {
    const el = document.createElement('div');
    const cb = vi.fn();

    let captured;
    let lastOpts;
    class FakeIO {
      constructor(handler, opts) { captured = handler; lastOpts = opts; }
      observe() {}
      unobserve() {}
    }
    globalThis.IntersectionObserver = FakeIO;

    intersectionObserver(cb, { threshold: 0.5 })(el);
    expect(lastOpts).toEqual({ threshold: 0.5 });

    captured([{ isIntersecting: true }]);
    expect(cb).toHaveBeenCalledWith(el, { isIntersecting: true });
  });
});
