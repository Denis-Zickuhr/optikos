# QuickSearch  (plugin: `quickSearch()`)
Purpose:       A search box inside the grid, in the row with the pager (beside the export and grouping buttons): the rows where any of some fields contain the text.
Anatomy:       `op-quicksearch__group` (`op-footer-group`) in the grid's `op-grid__footer` row, holding a clearable TextField `op-quicksearch`.
Config:        `quickSearch({ fields, delay?, placeholder? })`: `fields` are the record fields searched (any match keeps the row: an `or` of `contains`), `delay` ms after the last key (250), `placeholder`.
API:           —; it filters the grid's store.
Events:        The store's `filter`.
States:        Other filters (a FilterBuilder) stay and combine with it (AND); a filter that replaces them clears the box. Empty text removes only its own filter.
Keyboard/ARIA: A text field named "Search the grid"; the clear button as in any TextField.
Tokens:        `--op-quicksearch-width`.
Sandbox cases: `data`: a paged grid searching name and city, beside the export icons.
Out of scope:  Highlighting matches, fuzzy matching, searching columns that are not record fields (use `renderer` data), a remote search syntax (a remote store filters on its server).
