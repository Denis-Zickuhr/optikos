# GridState  (type: 'gridstate')
Purpose:       Remember a grid per user: column widths, order and visibility, the sort, the filters, the page size and the page.
Anatomy:       A Grid plugin: `plugins: [persistState('grid-lots')]`. Nothing is added to the DOM.
Config:        `persistState(key, { columns, sort, filters, page, delay })`: each part on by default; `delay` (300 ms) waits after a change before saving. Where it is kept: `setStateStorage({ get(key), set(key, value) })` (both may be async: a REST endpoint follows the user across devices); the default is `localStorage` under `optikos:<key>`. `loadState(key)` and `saveState(key, value)` do the same for anything else the app wants to remember (density, a collapsed panel).
API:           `persistState`, `setStateStorage`, `loadState`, `saveState`.
Events:        —
States:        A storage that fails (private mode, offline) is ignored: the grid just starts from its configuration. Function filters are not saved (only the filter specs).
Keyboard/ARIA: —
Tokens:        —
Sandbox cases: `data`: resize a column, sort, reload the page.
Out of scope:  Named views and sharing them (`ViewManager`), per-row state.
