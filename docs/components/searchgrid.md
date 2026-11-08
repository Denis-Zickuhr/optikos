# SearchGrid  (type: 'searchgrid')
Propósito:     Tela de pesquisa reutilizável: filtros em cima, Grid com os resultados embaixo, paginação. Funciona sozinha numa tela
               ou dentro do modal do LookupField. É a peça de reuso: a mesma "pesquisa de pessoas" serve a vários campos e telas.
Anatomia:      `.op-searchgrid` (Container, layout vbox) > `.op-searchgrid__filters` (Form com os campos de filtro + botões Pesquisar/Limpar)
               + Grid (`flex: 1`) com Pagination quando `paging`.
Config:        `lookup: LookupDef | string`: uma definição de lookup, passada direto ou por nome registrado (`lookup: 'people'`):
               `store: Store | () => Store` (função = cada instância tem seu próprio store, recomendado para reuso),
               `columns` (as do Grid), `filters: [{ type, name, op?, field?, ...configDoCampo }]` (campos normais: textfield, select, datefield, daterangefield, até outro lookupfield;
               `op` = FilterOp (padrão `contains` para texto, `eq` para o resto; `daterangefield` vira `between`) e `field` (campo do registro; padrão o `name`)),
               `queryField` (nome do filtro que recebe o texto rápido; padrão o primeiro), `valueField` (`id`), `displayField`,
               `selection: 'single'|'multi'` (single), `paging: true`, `autoSearch: true` (pesquisa ao montar), `title`, `width`, `height` (as três últimas, o `LookupField` usa na janela).
               `registerLookup(name, def)` registra uma definição para uso declarativo por nome (telas descritas em JSON).
API:           `search(query?)` (devolve uma Promise: resolve quando o resultado chegou), `clear()`, `setQuery(text)` (preenche o `queryField`), `getSelection()`, `getFilters(): FilterSpec[]`,
               `getGrid()`, `getStore()`.
Eventos:       `before-search(filters)` (cancelável), `search(filters)`, `select(records)`, `confirm(records)` (Enter ou duplo clique numa linha).
Estados:       `is-loading` (vem do Grid/Store).
Busca:         Junta os filtros não vazios em `FilterSpec[]` e chama `store.filter(specs)` (`clearFilter()` se não houver nenhum): local filtra na hora, remoto recarrega pelo proxy
               (a Promise de `filter()` resolve depois do reload). Sem lógica de busca própria: tudo passa pelo Store.
Teclado/ARIA:  Enter num filtro pesquisa; Enter numa linha ou duplo clique dispara `confirm` (↓ no último filtro levar ao Grid: ainda não). `role=search` no bloco de filtros.
Tokens:        `--op-searchgrid-gap`, `--op-searchgrid-filters-bg`, `--op-searchgrid-filters-padding`, `--op-searchgrid-field-width`, `--op-searchgrid-grid-min-height`.
Casos sandbox: pesquisa de pessoas local (1.000 registros), a mesma definição com store remoto simulado (delay + paginação), filtros de tipos
               variados (texto, select, data), seleção multi, definição registrada por nome usada em duas instâncias independentes.
Fora do escopo: salvar filtros favoritos, filtro por coluna no cabeçalho (é o plugin de filtros do Grid, P1), exportar resultados.
