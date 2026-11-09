# SuggestField  (type: 'suggestfield')
Purpose:       A search field with suggestions from an async query (city, customer, postal code...).
Anatomy:       like ComboBox, without the arrow button; a magnifier on the left (`.op-suggest__icon`); a loading indicator (`.op-picker__spinner`).
Config:        (ComboBox) + `query: (text, {signal}) => Promise<Item[]> | Item[]` or a `store` with a remote proxy (uses `store.load({query})`),
               `minChars: 1`, `delay: 250` (debounce in ms), `forceSelection: true`, `emptyText`, `highlight: true`, `showValue: false` (shows the record's value/id as a badge at the start of the field, hidden while typing, and as a hint at the end of each list row), `icon: 'search'` (magnifier on the left; `false` hides it).
               `setSelection(item)` — to fill it without a query (the text comes from `item.label`); `setValue(v)` only finds items already loaded.
API:           (ComboBox) + `setQuery`, `search(text)`, `clearSuggestions()`.
Events:        `before-query(text)` (cancelable), `query(text)`, `load(items)`, `select(item)`, `error(err)`.
States:        (stableSize) the spinner space is always reserved in the input;
               `is-loading`, `is-open` (only when there are results or `emptyText`).
Keyboard/ARIA: as in ComboBox; an `aria-live=polite` region announces "N results". Stale answers are dropped (AbortController) when the text changes.
Tokens:        those of ComboBox; `--op-picker-id-bg/fg` (the `showValue` badge), `--op-listbox-hint-fg`.
Sandbox cases: local search with a simulated delay, a failing search, an empty result, forceSelection false (free text), a preloaded value.
Out of scope:  query caching, multiple selection, grouped results.
