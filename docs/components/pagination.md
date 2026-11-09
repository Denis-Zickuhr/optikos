# Pagination  (type: 'pagination')
Purpose:       Moves between the pages of a data set.
Anatomy:       `<nav class="op-pagination">` > buttons (`first/prev`, numbers with ellipses, `next/last`) + `.op-pagination__info` ("1–20 of 135").
Config:        `store` (reads/writes the page) OR `total`, `pageSize`, `page` (manual mode), `siblings: 1`, `showInfo: true`.
API:           `setPage`, `setTotal`, `setPageSize`, `getPage`, `setStore`.
Events:        `page-change(page)` (cancelable through `before-page-change`).
Keyboard/ARIA: `nav` with a localized label; the current page has `aria-current="page"`; native buttons; disabled at the ends.
Tokens:        `--op-pagination-gap`, uses those of Button.
Sandbox cases: 5 pages, 200 pages (ellipses), bound to a local Store, manual mode, pt-BR.
Out of scope:  a page size picker (P1), "go to page".
