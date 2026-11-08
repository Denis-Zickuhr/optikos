# Menu  (type: 'menu')
Propósito:     Lista de ações flutuante (menu de botão, menu de contexto, submenus).
Anatomia:      `.op-menu[role=menu]` (dentro de Dropdown) > `.op-menu__item[role=menuitem|menuitemcheckbox]` (`__icon`, `__text`, `__arrow`) e `.op-menu__sep[role=separator]`.
Config:        `items: ({text, icon, handler, disabled, checked, items (submenu)} | '-')[]`.
API:           `showBy(el|Component, placement='bottom-start')`, `showAt(x, y)` (contexto), `hide()`, `setItems`, `isOpen()`.
Eventos:       `click(item)`, `show`, `hide`.
Teclado/ARIA:  ↑↓ movem (com loop), Home/End, Enter/Space ativam, → abre submenu, ← fecha submenu, Esc fecha (e devolve o foco), Tab fecha; itens desabilitados são pulados;
               `aria-haspopup`/`aria-expanded` nos itens com submenu. Foco real nos itens (roving tabindex).
Tokens:        `--op-menu-bg/border/radius/shadow/item-padding-x/item-hover-bg/sep`.
Casos sandbox: menu de botão, contexto (botão direito), submenu, checkbox, desabilitado, ícones.
Fora do escopo: itens com campos embutidos, mega-menu, menu bar (Sidebar/NavMenu, P1).
