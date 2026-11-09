# ViewManager  (type: 'viewmanager')
Purpose:       Saves and restores the "view" of a data screen: visible columns and their order, filters (with the AND/OR groups) and sorting, under a name, so the user can come back to it.
Anatomy:       `.op-viewmanager` > a ghost `Button` "Views ▾" (shows the active view's name) that opens a `Menu`:
               the views (✓ on the active one, ★ on the default), Save view, Save as new view…, Open with this view, Delete view, Back to the initial view.
Config:        `grid` (required), `filters` (a `FilterBuilder`; optional), `storage: ViewStorage` (required),
               `extra: { key: { get(), set(v) } }` (anything else in the UI to remember: density, a collapsed panel...; goes into `state.extra`), `autoLoad: true` (applies the default view on open).
Storage:       `ViewStorage { list(), save(view), remove(view) }` (sync or Promise). The app implements it for its endpoint; built in:
               `localViewStorage(key, storage = localStorage)` (used in the demos) and `restViewStorage({ url, headers?, fetch? })` (`GET url`, `POST url`, `PUT url/:id`, `DELETE url/:id`, JSON).
               Storage errors become the `error` event (nothing blows up on screen).
Data:          `SavedView { id?, name, default?, state: ViewState }`, `ViewState { columns: ColumnState[], filter: FilterGroup | null, sorters: Sorter[], extra }`: plain JSON.
API:           `getState()`, `setState(state)`, `getViews()`, `getCurrent()`, `reload()`, `apply(view|id)`, `save()` (updates the active one; without one, asks for a name), `saveAs(name?)` (asks for the name; an existing name overwrites), `setDefault(on)`, `remove(view?)` (asks first), `reset()` (back to the state at open).
Events:        `load(views)`, `before-apply(view)` (cancelable), `apply(view)`, `save(view)`, `remove(view)`, `reset`, `error(err)`.
States:        the button shows the active view's name.
Keyboard/ARIA: a button with `aria-haspopup=menu`; the menu is the regular `Menu` (arrows, Enter, Esc); the confirmation and the name prompt are `MessageBox`es (modal, trapped focus).
Tokens:        those of Button and Menu.
Sandbox cases: `data`: views in localStorage (reload the page) and on a simulated "server" (`restViewStorage` with a fake fetch and a log of the calls). CRM demo.
Out of scope:  shared/per-user views (the endpoint decides), a "view modified" indicator, renaming (save under another name).
