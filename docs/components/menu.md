# Menu  (type: 'menu')
Purpose:       A floating list of actions (button menu, context menu, submenus).
Anatomy:       `.op-menu[role=menu]` (inside a Dropdown) > `.op-menu__item[role=menuitem|menuitemcheckbox]` (`__icon`, `__text`, `__arrow`) and `.op-menu__sep[role=separator]`.
Config:        `items: ({text, icon, handler, disabled, checked, items (submenu)} | '-')[]`.
API:           `showBy(el|Component, placement='bottom-start')`, `showAt(x, y)` (context), `hide()`, `setItems`, `isOpen()`.
Events:        `click(item)`, `show`, `hide`.
Keyboard/ARIA: ↑↓ move (wrapping), Home/End, Enter/Space activate, → opens a submenu, ← closes it, Esc closes (and gives the focus back), Tab closes; disabled items are skipped;
               `aria-haspopup`/`aria-expanded` on items with a submenu. Real focus on the items (roving tabindex).
Tokens:        `--op-menu-bg/border/radius/shadow/item-padding-x/item-hover-bg/sep`.
Sandbox cases: button menu, context menu (right click), submenu, checkbox items, disabled, icons.
Out of scope:  items with embedded fields, mega menus, a menu bar (Sidebar/NavMenu).
