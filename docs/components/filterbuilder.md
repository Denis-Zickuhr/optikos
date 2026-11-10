# FilterBuilder  (type: 'filterbuilder')
Purpose:       Users build filters at run time: `field · operator · value` rows that add up, with nestable AND/OR groups.
Anatomy:       `.op-filterbuilder` > `.op-filterbuilder__group` (`is-nested`; `__head`: connector, "Add filter", "Add group", "Clear all"/remove) >
               `.op-filterbuilder__row` (field select, operator select, value editor(s) `__value`, `__to`, `__remove`); `__foot` with Apply when `live: false`.
Config:        `fields: [{ name, label, type: 'text'|'number'|'date'|'select', options, group }]` (`group`, as `Column.group` in the Grid: grouped in the field select (`<optgroup>`) and in the `pick` menu, which also gets a search field past 6 fields), `value: FilterGroup` (initial filter; with a `store` it is applied on mount),
               `store` (applies `store.filter(...)` / `clearFilter()`), `addMode: 'row'|'pick'` (`row`: "Add filter" creates a row with the 1st field; `pick`: first opens a menu with the fields and creates the row for the chosen one, focusing its value), `live: true` (applies on every edit, debounced by 250 ms; `false` shows an Apply button), `maxDepth: 3`.
Operators:     text: contains, does not contain, equals, not equal, starts with, ends with, is one of, is none of, empty, not empty.
               number/date: equals, not equal, >, >=, <, <=, between, not between, empty, not empty. select: equals, not equal, is one of (native multi-select), is none of, empty, not empty.
               The editor follows the type and the operator (between = two fields, empty = none, "is one of" on text = a comma-separated list). Date values are ISO.
API:           `getFilter(): FilterGroup | null` (incomplete rows are left out), `setFilter(group|null)`, `clear()` (empties and applies), `apply()`, `addRule(field?)`, `setFields`, `setStore`.
Events:        `change(filter)` on every edit, `before-apply(filter)` (cancelable), `apply(filter)`.
States:        Value editors have no `stableSize` (they reserve no error line, to align with the selects). Without filters: "No filters" text. The focus returns to the same control after the rows are redrawn (changing the operator/field).
Keyboard/ARIA: Everything is a native control or an Optikos field (Tab/arrows); `role=group` with a label on the root and on each group; Enter in a value applies. The remove button has an `aria-label`.
Tokens:        `--op-filterbuilder-gap/group-padding/value-width/nested-bg`.
Sandbox cases: `addMode: 'pick'`, an initial filter with an OR group and `between`, varied types, live with a Grid + paging. CRM demo.
Out of scope:  chips summarizing the active filters, favorite/saved filters (see ViewManager), `registerFilterEditor` (extensible editors per type), relative date operators ("last 7 days").
Data:          `Store.filter` takes `FilterNode = FilterSpec | { op: 'and'|'or', filters: FilterNode[] }` (the top is AND). Operators: `notContains`, `endsWith`, `between`, `notBetween`,
               `nin`, `empty`, `notEmpty` besides the basic ones. Dates (`Date` or ISO) compare by instant. Remote: the proxy gets the tree in `filters`; `RestProxy` sends simple specs as `field__op=value` and groups/lists/ranges as JSON in `filter`.
