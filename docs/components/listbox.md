# ListBox  (type: 'listbox')
Propósito:     Lista de opções navegável e virtualizada; usada por Select, ComboBox e SuggestField (e pelo List, P1).
Anatomia:      `.op-listbox[role=listbox]` > `.op-listbox__spacer` + `.op-listbox__rows` > `.op-listbox__item[role=option]`; `.op-listbox__empty`.
Config:        `items: {value,label,disabled?}[]`, `selected` (value), `emptyText`, `maxHeight`, `renderer(item) => string|Node`, `highlight` (texto a destacar), `rowHeight`.
API:           `setItems`, `setSelected`, `setActive(i)`, `moveActive(delta)`, `getActive()`, `getActiveId()`, `scrollTo(i)`, `setEmptyText`, `setHighlight`.
Eventos:       `select(item, index)` (clique/Enter via `selectActive()`), `active-change(item)`.
Estados:       `is-active` (item sob o cursor de teclado), `is-selected`, `is-disabled`.
Teclado/ARIA:  Não toma foco: o dono (campo) mantém o foco e aponta `aria-activedescendant` para `getActiveId()`. Itens têm `id` estável (`<uid>-opt-<i>`).
Tokens:        `--op-listbox-bg/item-padding-x/item-padding-y/item-hover-bg/item-active-bg/item-selected-fg/empty-fg`.
Casos sandbox: 5 itens, 10.000 itens, itens desabilitados, vazio, destaque do texto buscado.
Fora do escopo: itens com altura variável, grupos com cabeçalho, seleção múltipla.
