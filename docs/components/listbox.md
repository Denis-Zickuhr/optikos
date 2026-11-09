# ListBox  (type: 'listbox')
Purpose:       A navigable, virtualized list of options; used by Select, ComboBox and SuggestField (and by List, P1).
Anatomy:       `.op-listbox[role=listbox]` > `.op-listbox__spacer` + `.op-listbox__rows` > `.op-listbox__item[role=option]`; `.op-listbox__empty`.
Config:        `items: {value,label,disabled?}[]`, `selected` (value), `emptyText`, `maxHeight`, `renderer(item) => string|Node`, `highlight` (text to highlight), `rowHeight`, `ariaLabel` (needed when used on its own).
API:           `setItems`, `setSelected`, `setActive(i)`, `moveActive(delta)`, `getActive()`, `getActiveId()`, `scrollTo(i)`, `setEmptyText`, `setHighlight`.
Events:        `select(item, index)` (click/Enter through `selectActive()`), `active-change(item)`.
States:        `is-active` (the item under the keyboard cursor), `is-selected`, `is-disabled`.
Keyboard/ARIA: It does not take focus: the owner (a field) keeps the focus and points `aria-activedescendant` at `getActiveId()`. Items have a stable `id` (`<uid>-opt-<i>`).
Tokens:        `--op-listbox-bg/item-padding-x/item-padding-y/item-hover-bg/item-active-bg/item-selected-fg/empty-fg`.
Sandbox cases: 5 items, 10,000 items, disabled items, empty, highlighting the searched text.
Out of scope:  items with variable height, groups with headers, multiple selection.
