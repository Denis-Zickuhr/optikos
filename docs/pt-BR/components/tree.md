# Tree  (type: 'tree')
Propósito:     Mostra uma hierarquia (pastas, categorias, organograma) que o usuário abre, seleciona e marca, com filhos carregados sob demanda.
Anatomia:      `.op-tree` > `ul.op-tree__root[role=tree]` > `li[role=none]` > `.op-tree__item[role=treeitem]` (`__toggle` seta ou spinner, `__check` caixa, `__icon`, `__text`) e, quando aberto, `ul.op-tree__group[role=group]` com os filhos.
Config:        `items: TreeNode[]` (`{ id, text, icon?, children?, leaf?, expanded?, disabled?, checked?, data? }`), `selection: 'single'|'multi'|'none'` (single), `checkboxes: false` (tri-estado, em cascata),
               `load?: (nó) => Promise<TreeNode[]> | TreeNode[]` (filhos sob demanda: chamado na primeira vez que um nó sem `children` e sem `leaf` é aberto), `emptyText`, `ariaLabel`.
API:           `expand(id)` (Promise: resolve depois de carregar), `collapse(id)`, `toggle(id)`, `expandAll()` (nós carregados), `collapseAll()`, `select(id, {add})`, `getSelection()`, `deselectAll()`,
               `setChecked(id, bool)`, `toggleChecked(id)`, `checkState(nó)` (`true`/`false`/`'mixed'`), `getChecked()`, `getNode(id)`, `getPath(id)` (ancestrais), `setItems(items)`, `filter(texto)`.
Eventos:       `select(nós)`, `activate(nó)` (Enter ou duplo clique), `check(nósMarcados, nó)`, `expand(nó)`, `collapse(nó)`, `load(nó, filhos)`, `error(err, nó)` (um `load` que falhou; o nó continua fechado).
Estados:       item `is-selected`, `is-expanded`, `is-loading` (`aria-busy`), `is-disabled`; caixa `is-checked`/`is-mixed`.
Teclado/ARIA:  Padrão "Tree View" do WAI-ARIA APG: ↑↓ movem entre nós visíveis, → abre (ou vai ao primeiro filho), ← fecha (ou vai ao pai), Home/End, Enter seleciona e ativa, Espaço alterna a caixa (ou a seleção no modo multi).
               Uma parada de foco (roving tabindex); `aria-level`, `aria-expanded`, `aria-selected`, `aria-checked` (`mixed` para um pai marcado em parte), `aria-multiselectable`.
Tokens:        `--op-tree-indent`, `--op-tree-item-height`, `--op-tree-hover-bg`, `--op-tree-selected-bg/fg`, `--op-tree-check-size`, `--op-tree-icon-fg`, `--op-tree-fg/bg`.
Casos sandbox: `data`: árvore de arquivos com ícones, seleção múltipla, caixas de marcar, filhos carregados com atraso (e um que falha), filtro.
Fora do escopo: arrastar e soltar nós, virtualização (árvores muito grandes: carregue sob demanda), renomear no lugar, colunas (TreeGrid, P2).
