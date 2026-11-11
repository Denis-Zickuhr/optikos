# TreeGrid  (type: 'treegrid')
Purpose:        A Grid whose first column is a tree: indentation, an expander and the keyboard of an ARIA treegrid, with every other column an ordinary grid column. A Grid plugin over flat records (the Ext tree panel with columns).
Anatomy:        `op-grid--tree` on the grid; the tree column's cells hold `op-grid__expander` (`is-leaf`, `is-loading`) before the text, indented by `--_depth` times `--op-grid-indent`. Rows carry `aria-level` and `aria-expanded`; the table becomes `role=treegrid`.
Value:          Flat records that point at their parent: `{ id, parentId, ... }` (`parentId` null or missing for a root). `flattenTree(nodes, { children, parentField })` turns nested data (`{ id, name, children: [...] }`) into that. Chosen over a TreeStore (nested nodes owned by a second store): the records stay ordinary Models in the one Store, so selection, editing, sorting, `bind` and `exportGrid` work unchanged.
Config:         `treeGrid({ treeColumn?, parentField?, load?, leafField?, expanded? })`: `treeColumn` (the first column), `parentField` (`parentId`), `load(node)` fetches the children the first time a node opens (a Promise of rows; the plugin sets their `parentField` and adds them to the store; a node whose `leaf` field is true gets no expander), `expanded` starts with every node open.
API:            `expand(id)`, `collapse(id)`, `expandAll()`, `collapseAll()` on the plugin.
Events:         On the Grid: `expand-node(record)`, `collapse-node(record)`, `load-error(record, error)`.
States:         Sorting orders the siblings of each parent. A record whose parent is filtered out or not on the page shows as a root. A node waiting for `load` shows a loading expander; after a failure it closes again.
Keyboard/ARIA:  → opens a closed node, or goes to its first child; ← closes an open node, or goes to its parent; ↑/↓/Home/End/Page keys move through the visible rows; Space selects. Click on the chevron toggles.
Tokens:         `--op-grid-indent`, `--op-grid-expander-size`, plus those of the Grid.
Sandbox cases:  `data`: nested data, lazy children with a delay and a failing node, sort, lock a column.
Out of scope:   Drag and drop of nodes, checkbox cascade (select a parent selects the children), a separate TreeStore, several tree columns.
