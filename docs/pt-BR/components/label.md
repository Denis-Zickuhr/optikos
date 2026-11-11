# Label  (type: 'label')
Propósito:     Texto estático (títulos de seção, legendas, texto em toolbar).
Anatomia:      `<span class="op-label">`.
Config:        `text`, `for` (id de um campo; vira `<label for>`), `variant: 'default'|'muted'|'title'` (default). `tag: 'span'|'div'|'p'|'h1'…'h6'` (span; `label` com `for`) faz dele um título ou parágrafo; `icon`, ou `src` + `alt` (uma imagem, ex.: um logo, com tamanho em `--op-label-image-size`), antes do texto.
API:           `setText`, `setVariant`. `setIcon`, `setImage(src, alt?)`.
Eventos:       —
Tokens:        `--op-label-fg`, `--op-label-muted-fg`, `--op-label-title-size/weight`. `--op-label-image-size`.
Casos sandbox: variantes, associado a um campo.
Fora do escopo: HTML interno (use `textContent`; quem precisa de HTML cria um Component custom).
