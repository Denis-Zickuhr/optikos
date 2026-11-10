# Menu  (type: 'menu')
Purpose:       A floating list of actions (button menu, context menu, submenus).
Anatomy:       `.op-menu[role=menu]` (inside a Dropdown) > `.op-menu__item[role=menuitem|menuitemcheckbox]` (`__icon`, `__text`, `__arrow`) and `.op-menu__sep[role=separator]`; with groups, `.op-menu__group[role=group]` (named by its `.op-menu__group-label`) holds its items; with `search`, the root holds `.op-menu__search`, the menu (`.op-menu__list[role=menu]`) and `.op-menu__empty`.
Config:        `items: ({text, icon, handler, disabled, checked, items (submenu), group} | '-')[]` (items with the same `group` sit together under its name; ungrouped ones come first), `search: false` (a search field over the items: filters as you type, and a search that matches a group name shows the whole group; submenus are not searched).
API:           `showBy(el|Component, placement='bottom-start')`, `showAt(x, y)` (context), `hide()`, `setItems`, `setSearch(bool)`, `isOpen()`.
Events:        `click(item)`, `show`, `hide`.
Keyboard/ARIA: ↑↓ move (wrapping), Home/End, Enter/Space activate, → opens a submenu, ← closes it, Esc closes (and gives the focus back), Tab closes; disabled items are skipped; with `search` the first item gets the focus on open (never the field: a phone keyboard would cover the menu), typing a letter moves it to the search field, and there ↓ goes to the first match and Enter picks it;
               `aria-haspopup`/`aria-expanded` on items with a submenu. Real focus on the items (roving tabindex).
Tokens:        `--op-menu-bg/border/radius/shadow/item-padding-x/item-hover-bg/sep`, `--op-menu-max-height` (the list scrolls past it, with search), `--op-menu-group-fg/group-tracking`.
Sandbox cases: button menu, context menu (right click), submenu, checkbox items, disabled, icons.
Out of scope:  items with embedded fields, mega menus, a menu bar (Sidebar/NavMenu).
