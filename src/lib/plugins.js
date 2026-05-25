// Phase 2 — plugin registry + state initialisation. The plugin shape
// matches upstream verbatim so per-plugin code (DayGrid, TimeGrid, …)
// drops in unchanged:
//
//   {
//     createOptions(options) { ... }        // contribute to the option
//                                            // defaults table
//     createParsers(parsers) { ... }        // contribute to the parsers
//                                            // registry
//     initState(mainState) { ... }          // contribute to the runtime
//                                            // state (aux components,
//                                            // features, extensions)
//   }
//
// initState is invoked once after the MainState is built and before any
// view is mounted. Plugins use it to push e.g. interaction overlays or
// resource-axis hooks onto the live state.

import { createOptionsStore } from './options_store.js';
import { MainState } from './state.js';

// Build the full live state from a plugin set + user options.
// Returns:
//   {
//     state,           // MainState instance
//     options,         // the live option object (mutates as setOption fires)
//     setOption,       // (key, value, parsed?)  ⇒ void
//     setViewOptions,  // (view) ⇒ component factory
//     viewComponents,  // { viewName: () => Component }  (Svelte-flavoured
//                      // factories — replaced with our own renderers later)
//   }
export function createPluginState(plugins, userOptions = {}) {
  const { options, setOption, setViewOptions, viewComponents, viewNames } =
    createOptionsStore(plugins, userOptions);

  const state = new MainState({
    options,
    auxComponents: [],   // populated by plugins (e.g. Interaction)
    features: [],        // populated by per-view init (list, dayNumber, …)
    extensions: {},      // per-view overrides for activeRange, viewResources
    viewNames,           // sorted list of registered view names
  });

  for (const plugin of plugins) {
    plugin.initState?.(state);
  }

  return { state, options, setOption, setViewOptions, viewComponents, viewNames };
}

// Convenience helpers for app code that wants to assert plugin shape early
// (the controller calls them in `connect`).
export function isPlugin(maybe) {
  return !!maybe && (
    typeof maybe.createOptions === 'function' ||
    typeof maybe.createParsers === 'function' ||
    typeof maybe.initState === 'function'
  );
}

// Validate + flatten an array of plugins. Throws on anything that doesn't
// look like a plugin — better than the option pipeline silently dropping
// contributions later.
export function normalisePlugins(input) {
  if (!Array.isArray(input)) {
    throw new TypeError('plugins must be an array');
  }
  for (const [i, plugin] of input.entries()) {
    if (!isPlugin(plugin)) {
      throw new TypeError(
        `plugins[${i}] is not a plugin (expected at least one of ` +
        `createOptions / createParsers / initState)`,
      );
    }
  }
  return input;
}
