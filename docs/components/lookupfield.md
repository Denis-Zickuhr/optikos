# LookupField  (type: 'lookupfield')
Purpose:       Picks one record from a large set (customer, manager, product): type and get suggestions, or open a search window with filters and a grid from the magnifier.
Anatomy:       like `SuggestField` (`op-suggest`) + `op-lookup`; a magnifier button on the right (`.op-lookup__btn`, `aria-haspopup=dialog`) instead of the decorative icon.
               The magnifier opens a modal `Window` with a `SearchGrid` (filters on top, grid below) and the Cancel / Select buttons.
Config:        (SuggestField, incl. `showValue` to display the record id) + `lookup: LookupDef | string` (the definition, or the name given to `registerLookup`; see `searchgrid.md`).
               `valueField` (`id`) and `displayField` (`name`) come from the definition; typed suggestions filter `queryField` (default: the 1st filter) with `contains`.
API:           (SuggestField) + `openDialog()`. `getValue()` is the record's `valueField`; `getSelection()` is `{ value, label, raw }`.
Events:        (SuggestField) `select(item)` when picking (in the list or in the window), `change(value)`.
States:        disabled/readonly disable the magnifier; `is-searching` (a spinner left of the magnifier).
Keyboard/ARIA: F4 or Alt+↓ opens the window (the typed text pre-fills the quick filter); ↓/↑/Enter in the suggestion list as in SuggestField;
               in the window: Enter in a filter searches, Enter/double click on a row picks it, Esc cancels and gives the focus back to the field.
Tokens:        those of SuggestField and SearchGrid.
Sandbox cases: `fields` (default, required, disabled); CRM demo ("Account manager" in the customer form) and admin demo ("Manager" in Settings).
Out of scope:  multiple selection (the definition's `selection: 'multi'` only applies to a standalone `SearchGrid`; the field takes the 1st record), creating a record from the window, a field without text editing.
