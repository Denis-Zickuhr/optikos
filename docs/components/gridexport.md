# GridExport  (type: 'gridexport')
Purpose:       Export a grid as CSV or Excel (.xlsx), and print it as a plain table. No library: the .xlsx is written by hand.
Anatomy:       Functions, not a component: `exportGrid(grid, options)` and `printGrid(grid, options)`. Printing uses a temporary `op-print-sheet` and the class `op-printing` on `<html>`.
Config:        `exportGrid`: `format: 'csv'|'xlsx'` (csv), `filename` (`export`), `scope: 'all'|'page'` (all: every record that matches the sort and filters, across pages; a remote store is read page by page through its proxy), `pageSize` (500, for a remote store), `download: false` (only build the file). `printGrid`: `title`, `scope`, `pageSize`.
API:           `exportGrid(grid, o): Promise<Blob>`, `printGrid(grid, o): Promise<void>`; `Store.fetchAll(pageSize?)` is what reads "all".
Events:        —
States:        The columns are the visible ones, in their current order; values are as shown (money, dates), a number nobody formatted stays a number in Excel. A cell that starts with `=`, `+` or `@` is quoted so it cannot run as a formula.
Keyboard/ARIA: —
Tokens:        Print uses `--op-font-family`, `--op-color-*`, `--op-space-*`. The table repeats its header on every page and does not split a row.
Sandbox cases: `data`: buttons for CSV, Excel and Print on a grid with money and date columns.
Out of scope:  Several sheets, styles and column widths in the .xlsx, formulas, PDF (print to PDF from the browser), importing.
