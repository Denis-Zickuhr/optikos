# Tree  (type: 'tree')
Purpose:       Shows a hierarchy (folders, categories, an org chart) that the user expands, selects and checks, with children loaded on demand.
Anatomy:       `.op-tree` > `ul.op-tree__root[role=tree]` > `li[role=none]` > `.op-tree__item[role=treeitem]` (`__toggle` arrow or spinner, `__check` box, `__icon`, `__text`) and, when open, `ul.op-tree__group[role=group]` with the children.
Config:        `items: TreeNode[]` (`{ id, text, icon?, children?, leaf?, expanded?, disabled?, checked?, data? }`), `selection: 'single'|'multi'|'none'` (single), `checkboxes: false` (tri-state, cascading),
               `load?: (node) => Promise<TreeNode[]> | TreeNode[]` (children on demand: called the first time a node without `children` and not `leaf` is expanded), `emptyText`, `ariaLabel`.
API:           `expand(id)` (Promise: resolves after loading), `collapse(id)`, `toggle(id)`, `expandAll()` (loaded nodes), `collapseAll()`, `select(id, {add})`, `getSelection()`, `deselectAll()`,
               `setChecked(id, bool)`, `toggleChecked(id)`, `checkState(node)` (`true`/`false`/`'mixed'`), `getChecked()`, `getNode(id)`, `getPath(id)` (ancestors), `setItems(items)`, `filter(text)`.
Events:        `select(nodes)`, `activate(node)` (Enter or double click), `check(checkedNodes, node)`, `expand(node)`, `collapse(node)`, `load(node, children)`, `error(err, node)` (a failed `load`; the node stays closed).
States:        item `is-selected`, `is-expanded`, `is-loading` (`aria-busy`), `is-disabled`; checkbox `is-checked`/`is-mixed`.
Keyboard/ARIA: WAI-ARIA APG "Tree View" pattern: ↑↓ move between visible nodes, → opens (or goes to the first child), ← closes (or goes to the parent), Home/End, Enter selects and activates, Space toggles the checkbox (or the selection in multi mode).
               One focus stop (roving tabindex); `aria-level`, `aria-expanded`, `aria-selected`, `aria-checked` (`mixed` for a partly checked parent), `aria-multiselectable`.
Tokens:        `--op-tree-indent`, `--op-tree-item-height`, `--op-tree-hover-bg`, `--op-tree-selected-bg/fg`, `--op-tree-check-size`, `--op-tree-icon-fg`, `--op-tree-fg/bg`.
Sandbox cases: `data`: a file tree with icons, multi selection, checkboxes, children loaded with a delay (and one that fails), filter.
Out of scope:  drag and drop of nodes, virtualization (very large trees: load on demand), inline renaming, columns (TreeGrid, P2).
