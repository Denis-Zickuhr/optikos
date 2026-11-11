# ExportBar  (plugin: `exportBar()`)
Purpose:       Export and print buttons inside the grid, in one row with the pager. They run `exportGrid` and `printGrid`, which still work on their own from your own buttons.
Anatomy:       `op-grid__footer` (the grid's pager and the buttons side by side; without a pager, just the buttons) > the pager, and `op-exportbar` (`role=group`) with up to four ghost `Button`s with an icon: CSV (download), Excel (table), this page as CSV (file), Print (printer).
Config:        `exportBar({ csv?, xlsx?, page?, print?, filename?, title?, labels? })`: each of `csv`, `xlsx`, `page`, `print` set to `false` leaves that button out (`page`, the CSV of what the grid shows now, defaults to true only on a paged grid); `filename` (`export`); `title` is the heading of the printed table; `labels: true` shows the text beside the icons (default: icons with a tooltip).
API:           The plugin object: `setVisible(action, visible)` and `setDisabled(action, disabled)` for `'csv' | 'xlsx' | 'page' | 'print'`. A button is disabled while its export runs.
Events:        —
States:        Hidden (left out or `setVisible(false)`), disabled, running.
Keyboard/ARIA: Each button is a tab stop with an `aria-label` and a tooltip ("Export CSV", "Print"…); the group is labelled "Export and print".
Tokens:        Those of Button and the grid (`--op-grid-border`).
Sandbox cases: `data`: a paged grid with the bar inside, next to the external buttons.
Out of scope:  Other formats, choosing columns (the grid's column menu does that), a progress bar.
