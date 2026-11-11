# RowEditing  (type: 'rowediting')
Purpose:        Edit a whole row at once, under a Save / Cancel bar, as a Grid plugin (the Ext `rowediting` plugin). Reuses the `editor` of the columns and the fields' validation.
Anatomy:        The row gets `is-row-editing`; each editable cell holds a field (`op-grid__editor`, `is-editing`) and a bar `op-grid__rowbar` with two buttons (`op-grid__rowbtn`, `is-primary`) hangs under the row.
Config:         `rowEditing({ trigger: 'dblclick' | 'click' })` (dblclick). On each column: `editor` (`true`, a field type or a field config) and `editable(rec)`, exactly as for `cellEditing()` (use one of the two, not both).
API:            None of its own; it uses `getRowEntry`, `cellAt`, `getCell`, `getColumns` and `getActive` of the Grid.
Events:         On the Grid: `before-edit(record)` (cancelable), `edit(record, values, old)` after the new values were written with `record.set` (only the changed fields; a remote app saves from here — the plugin never calls the API), `cancel-edit(record)`.
States:         Editing / not. Save validates every field and keeps the row open, focusing the first invalid one. Opening another row saves the open one first (and stays put if it is invalid). Scrolling the row out of the rendered window cancels.
Keyboard/ARIA:  Double click, or Enter / F2 on the active row, opens it. Esc cancels; Enter (not in a textarea or on a button) saves; Tab walks the editors and the two buttons and wraps. The bar is `role=group` named "Editing row".
Tokens:         `--op-grid-row-selected-bg` (the row), `--op-grid-editor-inset`, plus the semantic color tokens of the bar.
Sandbox cases:  `data`: a grid with a text, a number and a select editor; a required field; a remote-style save from the `edit` event.
Out of scope:   Calling the API for you, editing across rows (a batch), a form-in-a-window editor (use a `Window` with a `Form`).
