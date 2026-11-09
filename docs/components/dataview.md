# DataView  (type: 'dataview')
Purpose:       The records of a Store as a **grid of cards** (photo thumbnails, products, contacts), with selection, keyboard and paging. The app draws each item; the library handles the list, focus and selection.
Stable height: Every row is as tall as the tallest card (`grid-auto-rows: 1fr`) and the item content fills the cell (`flex: 1`): a card with a short caption is not shorter than its neighbor with two lines. Draw the card as a column and let the flexible part (the caption) grow: the footer stays at the bottom.
Anatomy:       `.op-dataview[role=listbox]` > `.op-dataview__items` (CSS grid `auto-fill`) > `.op-dataview__item[role=option]` (`is-selected`, `is-active`) with the `renderer` content; `.op-dataview__empty`; a `Pagination` bar (`paging`).
Config:        `store` (or `data`), `renderer(rec, index) => string | Node` (text is escaped; return a Node for markup), `selection: 'none'|'single'|'multi'` (single), `itemWidth: '10rem'` (minimum width: the columns adapt to the available width),
               `gap`, `itemCls(rec) => string`, `emptyText`, `paging: false` (+ `pageSize`), `ariaLabel` (required: a listbox needs a name).
Item actions:  Elements in the card with `data-op-action="favorite"` (a heart button, a menu...) do **not** select the item: they fire `item-action(action, rec, ev)`. So a card has its own buttons without the library knowing them.
API:           `getSelection(): Model[]`, `select(recOrIndex, {add})`, `selectAll()`, `deselectAll()`, `refresh()` (redraws, e.g. after a field changed), `focusItem(i)`, `setStore`, `getStore`, `columns()` (how many columns fit right now).
Events:        `select(records)`, `item-click(rec, i, ev)`, `item-dblclick`, `item-activate(rec, i)` (Enter), `item-action(action, rec, ev)`.
States:        `is-loading` (from the Store), `is-empty`; item `is-selected`, `is-active`.
Keyboard/ARIA: One focus stop (roving tabindex). ←→ ±1, ↑↓ ±one row (uses the measured number of columns), Home/End, PageUp/PageDown, Space/Enter: Space toggles (multi) or selects, Enter fires `item-activate`, Shift+arrows extend (multi), Ctrl/⌘+A selects all (multi).
               Click: plain replaces, Ctrl/⌘ toggles, Shift selects a range (multi). `role=listbox` with `aria-multiselectable`; items are `role=option` + `aria-selected`.
Tokens:        `--op-dataview-item-width`, `--op-dataview-gap`, `--op-dataview-item-radius`, `--op-dataview-selected-ring`.
Sandbox cases: `data`: 60 cards with thumbnails, multiple selection, item actions (heart), paging, empty.
Out of scope:  virtualization (page instead: the DataView draws the whole page), drag to reorder/drop into albums, grouping under headers (e.g. by day).
