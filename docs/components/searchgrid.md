# SearchGrid  (type: 'searchgrid')
Purpose:       A reusable search screen: filters on top, a Grid with the results below, paging. Works on its own in a screen
               or inside the LookupField window. It is the piece to reuse: the same "people search" serves many fields and screens.
Anatomy:       `.op-searchgrid` (Container, vbox layout) > `.op-searchgrid__filters` (a Form with the filter fields + Search/Clear buttons)
               + a Grid (`flex: 1`) with Pagination when `paging`.
Config:        `lookup: LookupDef | string`: a lookup definition, passed directly or by a registered name (`lookup: 'people'`):
               `store: Store | () => Store` (a function = each instance gets its own store, recommended for reuse),
               `columns` (the Grid's), `filters: [{ type, name, op?, field?, ...fieldConfig }]` (regular fields: textfield, select, datefield, daterangefield, even another lookupfield;
               `op` = a FilterOp (default `contains` for text, `eq` for the rest; `daterangefield` becomes `between`) and `field` (the record field; default the `name`)),
               `queryField` (the filter that takes the quick text; default the first one), `valueField` (`id`), `displayField`,
               `selection: 'single'|'multi'` (single), `paging: true`, `autoSearch: true` (searches on mount), `title`, `width`, `height` (the last three are used by `LookupField` for its window).
               `registerLookup(name, def)` registers a definition for declarative use by name (screens described in JSON).
API:           `search(query?)` (returns a Promise that resolves when the results arrived), `clear()`, `setQuery(text)` (fills the `queryField`), `getSelection()`, `getFilters(): FilterSpec[]`,
               `getGrid()`, `getStore()`.
Events:        `before-search(filters)` (cancelable), `search(filters)`, `select(records)`, `confirm(records)` (Enter or a double click on a row).
States:        `is-loading` (from the Grid/Store).
Search:        Joins the non-empty filters into `FilterSpec[]` and calls `store.filter(specs)` (`clearFilter()` when there is none): local filters right away, remote reloads through the proxy
               (the Promise of `filter()` resolves after the reload). No search logic of its own: everything goes through the Store.
Keyboard/ARIA: Enter in a filter searches; Enter on a row or a double click fires `confirm` (↓ from the last filter into the Grid: not yet). `role=search` on the filter block.
Tokens:        `--op-searchgrid-gap`, `--op-searchgrid-filters-bg`, `--op-searchgrid-filters-padding`, `--op-searchgrid-field-width`, `--op-searchgrid-grid-min-height`.
Sandbox cases: a local people search (1,000 records), the same definition with a simulated remote store (delay + paging), filters of varied types
               (text, select, date), multi selection, a definition registered by name used in two independent instances.
Out of scope:  saving favorite filters, per-column filters in the header (the Grid's filter plugin, P1), exporting the results.
