// Port of calendar/packages/core/src/lib/attachments.js (vkurko/calendar v5.7.1).
// Each helper returns an "attachment" — a function that takes a DOM element,
// does its setup, and (where applicable) returns a tear-down function. This
// matches the Svelte 5 `use:` directive shape but works in plain JS too.

// Replace an element's contents with a string / { domNodes } / { html }.
export function contentFrom(content) {
  return (el) => {
    if (typeof content === 'string') {
      el.innerText = content;
    } else if (content?.domNodes) {
      el.replaceChildren(...content.domNodes);
    } else if (content?.html) {
      el.innerHTML = content.html;
    }
  };
}

// Dispatch a `<type>outside` CustomEvent on the element when the matching
// event happens elsewhere on the page. Capture phase so it fires before
// inner handlers can stopPropagation. Returns a tear-down thunk.
export function outsideEvent(type) {
  return (el) => {
    const listener = (jsEvent) => {
      if (el && !el.contains(jsEvent.target)) {
        el.dispatchEvent(new CustomEvent(type + 'outside', { detail: { jsEvent } }));
      }
    };
    document.addEventListener(type, listener, true);
    return () => document.removeEventListener(type, listener, true);
  };
}

// ResizeObserver attachment — invokes callback(el, entry) on every resize.
// Returns a tear-down thunk.
export function resizeObserver(callback) {
  return (el) => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) callback(el, entry);
    });
    observer.observe(el);
    return () => observer.unobserve(el);
  };
}

// IntersectionObserver attachment — same shape as resizeObserver.
export function intersectionObserver(callback, options) {
  return (el) => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) callback(el, entry);
    }, options);
    observer.observe(el);
    return () => observer.unobserve(el);
  };
}
