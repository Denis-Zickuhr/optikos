# NavMenu  (type: 'navmenu')
Purpose:       A side navigation menu as a tree (app sidebar): grouped, collapsible modules, an active item, count badges, a "rail" mode with icons only, and a filter.
Anatomy:       `nav.op-navmenu[aria-label]` > `ul[role=tree]` > `li[role=treeitem]` > `.op-navmenu__item` (icon, text, `__badge`, `__chevron` on groups) and, in groups, a `ul[role=group]` with the children.
               State classes: `is-active`, `is-group`, `is-expanded`, `is-disabled`; root `is-rail`.
Config:        `items: NavItem[]` (`{ id, text, icon?, badge?, items?, disabled?, hidden?, expanded?, data? }`), `active: id`, `collapsed: false` (rail: icons only, the text becomes `title`; a group shows its icon, or its initial, and opens a floating Menu beside it with its title and children, badges included; it lights up (`has-active`) when the active page is inside), `railWidth` (px or CSS): the width the **parent container** takes while collapsed, given back on expand, so a sidebar follows its rail (`setCollapsed` does it too).
               `accordion: false` (opening a group closes the others), `ariaLabel`. An item takes `permission` (hidden, or disabled, while `setPermissionResolver` denies it; a group goes with its children).
API:           `setActive(id)` (opens the parents), `getActive()`, `expand(id)`, `collapse(id)`, `toggle(id)`, `expandAll()`, `collapseAll()`, `setItems(items)`, `updateItem(id, patch)` (e.g. change the badge),
               `getItem(id)`, `setCollapsed(bool)`, `filter(text)` (hides what does not match and opens the groups with results; empty clears).
Events:        `before-select(item)` (cancelable), `select(item)` (leaves), `expand(item)`, `collapse(item)`.
States:        a disabled item cannot be selected; a group with no visible children disappears.
Keyboard/ARIA: WAI-ARIA APG "Tree View" pattern: ↑↓ move between visible items, → opens a group (or goes down to its first child), ← closes it (or goes up to the parent), Home/End, Enter/Space activate. One focus stop (roving tabindex).
               `role=tree`/`treeitem`/`group`, `aria-expanded` on groups, `aria-current="page"` on the active item, `aria-level`.
               Rail: a group has `aria-haspopup="menu"`; a click, → or Enter opens its menu (the Menu keyboard: ↑↓, Enter selects and closes), ← or Esc closes it and gives the focus back to the icon; hovering opens it after a short pause.
Tokens:        `--op-navmenu-bg/fg`, `--op-navmenu-item-hover-bg`, `--op-navmenu-active-bg/fg`, `--op-navmenu-active-bar`, `--op-navmenu-group-fg`, `--op-navmenu-rail-width`, `--op-navmenu-indent`.
Sandbox cases: a 3-level tree, badges, rail, filter, accordion, disabled/hidden items, keyboard.
Out of scope:  dragging items, real links (`href`: the app navigates on `select`).
