# Table  (type: 'table')
Propósito:     Tabela HTML simples, sem virtualização nem seleção, para dados pequenos e estáticos.
Anatomia:      `<table class="op-table">` > `caption`, `thead > tr > th`, `tbody > tr > td`.
Config:        `data: object[]` ou `store`, `columns: [{field, header, align, renderer, format}]`, `caption`, `striped`, `emptyText`.
API:           `setData`, `setStore`, `setColumns`, `setCaption`.
Teclado/ARIA:  semântica nativa; `scope=col` nos `th`.
Tokens:        `--op-table-border/header-bg/stripe-bg/cell-padding-x/y`.
Casos sandbox: dados simples, formatos, vazio, store com atualização.
Fora do escopo: ordenação, seleção, paginação, virtualização (use Grid).
