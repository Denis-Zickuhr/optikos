# Pagination  (type: 'pagination')
Propósito:     Navegação entre páginas de um conjunto de dados.
Anatomia:      `<nav class="op-pagination">` > botões (`first/prev`, números com reticências, `next/last`) + `.op-pagination__info` ("1–20 de 135").
Config:        `store` (lê/escreve página) OU `total`, `pageSize`, `page` (modo manual), `siblings: 1`, `showInfo: true`.
API:           `setPage`, `setTotal`, `setPageSize`, `getPage`, `setStore`.
Eventos:       `page-change(page)` (cancelável via `before-page-change`).
Teclado/ARIA:  `nav` com label localizado; página atual `aria-current="page"`; botões nativos; desabilitados nos extremos.
Tokens:        `--op-pagination-gap`, usa os do Button.
Casos sandbox: 5 páginas, 200 páginas (reticências), ligada a Store local, modo manual, pt-BR.
Fora do escopo: seletor de tamanho de página (P1), "ir para a página".
