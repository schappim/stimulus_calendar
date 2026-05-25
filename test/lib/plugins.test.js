import { describe, it, expect, vi } from 'vitest';
import { createPluginState, isPlugin, normalisePlugins } from '../../src/lib/plugins.js';

const dayGridPlugin = {
  createOptions(o) {
    Object.assign(o, { view: 'dayGridMonth' });
    o.views.dayGridMonth = {};
    o.views.dayGridDay = {};
  },
};

describe('lib/plugins', () => {
  it('createPluginState wires the options store and the state', () => {
    const { state, options, setOption } = createPluginState([dayGridPlugin]);
    expect(state).toBeDefined();
    expect(options).toBe(state.get('options'));
    expect(options.view).toBe('dayGridMonth');
    setOption('firstDay', 1);
    expect(options.firstDay).toBe(1);
  });

  it('initState is invoked once per plugin with the live state', () => {
    const initSpy = vi.fn();
    const plugin = {
      createOptions(o) { Object.assign(o, { view: 'dayGridMonth' }); o.views.dayGridMonth = {}; },
      initState: initSpy,
    };
    createPluginState([plugin]);
    expect(initSpy).toHaveBeenCalledOnce();
    expect(initSpy.mock.calls[0][0].get('auxComponents')).toEqual([]);
  });

  it('isPlugin accepts any plugin-shaped object', () => {
    expect(isPlugin({ createOptions() {} })).toBe(true);
    expect(isPlugin({ createParsers() {} })).toBe(true);
    expect(isPlugin({ initState() {} })).toBe(true);
    expect(isPlugin({})).toBe(false);
    expect(isPlugin(null)).toBe(false);
    expect(isPlugin('plugin')).toBe(false);
  });

  it('normalisePlugins throws on non-array', () => {
    expect(() => normalisePlugins(null)).toThrow(/array/);
  });

  it('normalisePlugins throws on a non-plugin element', () => {
    expect(() => normalisePlugins([dayGridPlugin, { notAPlugin: true }])).toThrow(/plugins\[1\]/);
  });
});
