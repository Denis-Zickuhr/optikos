# FilterBuilder  (type: 'filterbuilder')
Propósito:     O usuário monta filtros em runtime: linhas `campo · operador · valor`, que se acumulam, com grupos AND/OR aninháveis.
Anatomia:      `.op-filterbuilder` > `.op-filterbuilder__group` (`is-nested`; `__head`: conector, "Adicionar filtro", "Adicionar grupo", "Limpar tudo"/remover) >
               `.op-filterbuilder__row` (select de campo, select de operador, editor(es) de valor `__value`, `__to`, `__remove`); `__foot` com Aplicar quando `live: false`.
Config:        `fields: [{ name, label, type: 'text'|'number'|'date'|'select', options }]`, `value: FilterGroup` (filtro inicial; com `store`, é aplicado já ao montar),
               `store` (aplica `store.filter(...)` / `clearFilter()`), `addMode: 'row'|'pick'` (`row`: "Adicionar filtro" cria uma linha com o 1º campo; `pick`: abre antes um menu com os campos e cria a linha para o escolhido, com foco no valor), `live: true` (aplica a cada edição, com debounce de 250 ms; `false` mostra o botão Aplicar), `maxDepth: 3`.
Operadores:    texto: contém, não contém, igual, diferente, começa com, termina com, é um de, não é nenhum de, vazio, não vazio.
               número/data: igual, diferente, >, >=, <, <=, entre, fora do intervalo, vazio, não vazio. select: igual, diferente, é um de (multiseleção nativa), não é nenhum de, vazio, não vazio.
               O editor muda com o tipo e o operador (entre = dois campos, vazio = nenhum, "é um de" em texto = lista separada por vírgulas). Valor de data é ISO.
API:           `getFilter(): FilterGroup | null` (linhas incompletas ficam de fora), `setFilter(group|null)`, `clear()` (esvazia e aplica), `apply()`, `addRule(field?)`, `setFields`, `setStore`.
Eventos:       `change(filter)` a cada edição, `before-apply(filter)` (cancelável), `apply(filter)`.
Estados:       Editores de valor sem `stableSize` (não reservam linha de erro, para alinhar com os selects). Sem filtros: texto "Sem filtros". O foco volta ao mesmo controle depois que as linhas são redesenhadas (trocar operador/campo).
Teclado/ARIA:  Tudo são controles nativos ou campos Optikos (Tab/setas); `role=group` com rótulo no raiz e em cada grupo; Enter num valor aplica. Botão de remover com `aria-label`.
Tokens:        `--op-filterbuilder-gap/group-padding/value-width/nested-bg`.
Casos sandbox: `addMode: 'pick'`, filtro inicial com grupo OR e `between`, tipos variados, live com Grid + paginação. Demo CRM (toolbar manual substituída).
Fora do escopo: chips resumindo os filtros ativos, filtros favoritos/salvos, `registerFilterEditor` (editores por tipo extensíveis), operadores de data relativa ("últimos 7 dias").
Dados:         `Store.filter` aceita `FilterNode = FilterSpec | { op: 'and'|'or', filters: FilterNode[] }` (topo = AND). Operadores novos: `notContains`, `endsWith`, `between`, `notBetween`,
               `nin`, `empty`, `notEmpty`. Datas (`Date` ou ISO) comparam por instante. Remoto: o proxy recebe a árvore em `filters`; o `RestProxy` manda specs simples como `campo__op=valor` e grupos/listas/intervalos como JSON em `filter`.
