# ComboBox  (type: 'combobox')
Purpose:       A field with a list of known options; the user types to filter it locally and picks one.
Anatomy:       Field > `.op-picker` > `input[role=combobox]` + arrow button; the list is a ListBox inside a Dropdown (`matchWidth`).
Config:        (Field/TextField) + `options: (string|{value,label,disabled?})[]` or `store`, `valueField: 'value'`, `displayField: 'label'`,
               `forceSelection: true` (text that is not in the list is dropped on blur), `filter: 'contains'|'startsWith'|fn` (contains), `emptyText` (no results),
               `openOnFocus: false`, `maxHeight`.
API:           (Field) + `setOptions`, `setStore`, `getSelection()` (item), `setSelection(item)`, `expand()`, `collapse()`, `setEmptyText`.
Events:        `select(item)`, `expand`, `collapse`, `change(value)`.
States:        `is-open`; active item (`aria-activedescendant`); `has-value`.
Keyboard/ARIA: `role=combobox`, `aria-expanded`, `aria-controls`, `aria-autocomplete=list`, `aria-activedescendant`. Typing filters and highlights the first match; arrows move the active item (↓ opens), Enter picks,
               Esc closes (a 2nd Esc clears when `clearable`), Home/End in the popup, Tab picks the active item when `forceSelection`.
Tokens:        `--op-picker-arrow-fg`, `--op-listbox-*` (see ListBox).
Sandbox cases: short list, 5,000 items (virtualized), {value,label} objects, forceSelection false, disabled/readonly, store.
Out of scope:  multiple selection (TagField, P1), visual grouping of options, HTML templates per item.
