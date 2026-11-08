# Label  (type: 'label')
Propósito:     Texto estático (títulos de seção, legendas, texto em toolbar).
Anatomia:      `<span class="op-label">`.
Config:        `text`, `for` (id de um campo; vira `<label for>`), `variant: 'default'|'muted'|'title'` (default).
API:           `setText`, `setVariant`.
Eventos:       —
Tokens:        `--op-label-fg`, `--op-label-muted-fg`, `--op-label-title-size/weight`.
Casos sandbox: variantes, associado a um campo.
Fora do escopo: HTML interno (use `textContent`; quem precisa de HTML cria um Component custom).
