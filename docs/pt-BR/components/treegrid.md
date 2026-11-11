# TreeGrid  (type: 'treegrid')
Propósito:      Uma Grid cuja primeira coluna é uma árvore: indentação, um expansor e o teclado de um treegrid ARIA, com as demais colunas comuns de grid. Um plugin da Grid sobre registros planos (o tree panel com colunas do Ext).
Anatomia:       `op-grid--tree` na grid; as células da coluna da árvore guardam `op-grid__expander` (`is-leaf`, `is-loading`) antes do texto, indentadas por `--_depth` vezes `--op-grid-indent`. As linhas levam `aria-level` e `aria-expanded`; a tabela vira `role=treegrid`.
Valor:          Registros planos que apontam para o pai: `{ id, parentId, ... }` (`parentId` nulo ou ausente numa raiz). `flattenTree(nodes, { children, parentField })` transforma dados aninhados (`{ id, name, children: [...] }`) nisso. Escolhido no lugar de um TreeStore (nós aninhados de um segundo store): os registros continuam Models comuns no único Store, então seleção, edição, ordenação, `bind` e `exportGrid` funcionam sem mudança.
Config:         `treeGrid({ treeColumn?, parentField?, load?, leafField?, expanded? })`: `treeColumn` (a primeira coluna), `parentField` (`parentId`), `load(node)` busca os filhos na primeira vez que um nó abre (uma Promise de linhas; o plugin põe o `parentField` e adiciona ao store; um nó com o campo `leaf` verdadeiro não tem expansor), `expanded` começa com todos os nós abertos.
API:            `expand(id)`, `collapse(id)`, `expandAll()`, `collapseAll()` no plugin.
Eventos:        Na Grid: `expand-node(record)`, `collapse-node(record)`, `load-error(record, error)`.
Estados:        Ordenar ordena os irmãos de cada pai. Um registro cujo pai foi filtrado ou não está na página aparece como raiz. Um nó esperando o `load` mostra um expansor de carregamento; depois de uma falha ele fecha de novo.
Teclado/ARIA:   → abre um nó fechado, ou vai ao primeiro filho; ← fecha um nó aberto, ou vai ao pai; ↑/↓/Home/End/Page movem pelas linhas visíveis; Espaço seleciona. Clicar no chevron alterna.
Tokens:         `--op-grid-indent`, `--op-grid-expander-size`, mais os da Grid.
Casos sandbox:  `data`: dados aninhados, filhos preguiçosos com atraso e um nó que falha, ordenar, travar uma coluna.
Fora do escopo: Arrastar e soltar nós, seleção em cascata (selecionar o pai seleciona os filhos), um TreeStore separado, várias colunas de árvore.
