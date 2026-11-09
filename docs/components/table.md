# Table  (type: 'table')
Purpose:       A plain HTML table, without virtualization or selection, for small and static data.
Anatomy:       `<table class="op-table">` > `caption`, `thead > tr > th`, `tbody > tr > td`.
Config:        `data: object[]` or `store`, `columns: [{field, header, align, renderer, format}]`, `caption`, `striped`, `emptyText`.
API:           `setData`, `setStore`, `setColumns`, `setCaption`.
Keyboard/ARIA: native semantics; `scope=col` on the `th`.
Tokens:        `--op-table-border/header-bg/stripe-bg/cell-padding-x/y`.
Sandbox cases: plain data, formats, empty, a store with updates.
Out of scope:  sorting, selection, paging, virtualization (use Grid).
