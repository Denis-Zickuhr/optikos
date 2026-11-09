# CellEditing  (type: 'cellediting')
Purpose:       A Grid plugin that edits cells in place: double click (or F2/Enter) a cell, type, Enter to save. The value is written to the record, which becomes modified.
Anatomy:       `plugins: [cellEditing()]` on the Grid; while editing, the cell gets `is-editing` and holds a regular field with `op-grid__editor` (no label, no reserved error line; the error floats under the cell).
Config:        `cellEditing({ trigger: 'dblclick' | 'click' })` (dblclick). On each column: `editor: true` (a field for the value's type: number → `numberfield`, boolean → `checkbox`, else `textfield`), `editor: 'select'` (a field type) or `editor: { type, ...fieldConfig }` (e.g. `{ type: 'select', options: [...] }`, `{ type: 'textfield', required: true }`), and `editable(record) => boolean` to lock some records.
               Editors are created by type through the registry, so with per-component imports import the field types the columns use.
API:           none of its own; the Grid gets `cellAt(node)`, `getCell(index, field)`, `getColumns()` and `getActive()`, which any plugin can use.
Events:        on the Grid: `before-edit(record, field)` (cancelable), `edit(record, field, value, old)` (after a valid value was written with `record.set`), `edit-cancel(record, field)`.
States:        cell `is-editing`; the editor shows `is-invalid` and its message while the value fails validation (Enter/Tab do not leave until it is valid).
Keyboard/ARIA: F2 or Enter on the active row edits its first editable cell; in the editor, Enter saves and gives the focus back to the grid, Esc cancels, Tab/Shift+Tab save and move to the next/previous editable cell (across rows). The editor is named by the column header (`aria-label`). Leaving the cell or scrolling saves.
Tokens:        `--op-grid-editor-inset` (space around the editor in the cell), plus those of the editor fields.
Sandbox cases: `data`: a grid with text, number and select editors, a required column, a locked record, the event log.
Out of scope:  editing several cells at once, an edit-whole-row mode, undo, saving to a server (listen to `edit`, or use `store.getModified()` and `store.sync()`).
