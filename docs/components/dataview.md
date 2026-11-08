# DataView  (type: 'dataview')
Propósito:     Os registros de um Store como uma **grade de cartões** (miniaturas de fotos, produtos, contatos), com seleção, teclado e paginação. O app decide o desenho de cada item; a lib cuida da lista, do foco e da seleção.
Altura estável: Todas as linhas têm a altura do cartão mais alto (`grid-auto-rows: 1fr`) e o conteúdo do item preenche a célula (`flex: 1`): um cartão com legenda curta não fica mais baixo que o vizinho com legenda de duas linhas. Desenhe o cartão como coluna e deixe a parte flexível (legenda) crescer: o rodapé fica colado embaixo.
Anatomia:      `.op-dataview[role=listbox]` > `.op-dataview__items` (CSS grid `auto-fill`) > `.op-dataview__item[role=option]` (`is-selected`, `is-active`) com o conteúdo do `renderer`; `.op-dataview__empty`; barra de `Pagination` (`paging`).
Config:        `store` (ou `data`), `renderer(rec, index) => string | Node` (texto é escapado; devolva um Node para marcação), `selection: 'none'|'single'|'multi'` (single), `itemWidth: '10rem'` (largura mínima: as colunas se ajustam à largura disponível),
               `gap`, `itemCls(rec) => string`, `emptyText`, `paging: false` (+ `pageSize`), `ariaLabel`.
Ações no item: Elementos do cartão com `data-op-action="favorite"` (botão de coração, menu...) **não** selecionam o item: disparam `item-action(action, rec, ev)`. Assim o cartão tem botões próprios sem a lib conhecê-los.
API:           `getSelection(): Model[]`, `select(recOrIndex, {add})`, `selectAll()`, `deselectAll()`, `refresh()` (redesenha, ex.: depois de mudar um campo), `focusItem(i)`, `setStore`, `getStore`, `columns()` (quantas colunas cabem agora).
Eventos:       `select(records)`, `item-click(rec, i, ev)`, `item-dblclick`, `item-activate(rec, i)` (Enter), `item-action(action, rec, ev)`.
Estados:       `is-loading` (via Store), `is-empty`; item `is-selected`, `is-active`.
Teclado/ARIA:  Foco único (roving tabindex). ←→ ±1, ↑↓ ±uma linha (usa o número de colunas medido), Home/End, PageUp/PageDown, Espaço/Enter: Espaço alterna (multi) ou seleciona, Enter dispara `item-activate`, Shift+setas estende (multi), Ctrl/⌘+A seleciona tudo (multi).
               Clique: simples substitui, Ctrl/⌘ alterna, Shift faz intervalo (multi). `role=listbox` com `aria-multiselectable`; itens `role=option` + `aria-selected`.
Tokens:        `--op-dataview-item-width`, `--op-dataview-gap`, `--op-dataview-item-radius`, `--op-dataview-selected-ring`.
Casos sandbox: `data`: 60 cartões com miniaturas, seleção múltipla, ações no item (coração), paginação, vazio.
Fora do escopo: virtualização (pagine: o DataView desenha a página inteira), arrastar para reordenar/soltar em álbuns, agrupar por cabeçalhos (ex.: por dia).
