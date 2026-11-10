# Menu  (type: 'menu')
Propósito:     Lista de ações flutuante (menu de botão, menu de contexto, submenus).
Anatomia:      `.op-menu[role=menu]` (dentro de Dropdown) > `.op-menu__item[role=menuitem|menuitemcheckbox]` (`__icon`, `__text`, `__arrow`) e `.op-menu__sep[role=separator]`; com grupos, `.op-menu__group[role=group]` (nomeado pelo seu `.op-menu__group-label`) contém seus itens; com `search`, o raiz contém `.op-menu__search`, o menu (`.op-menu__list[role=menu]`) e `.op-menu__empty`.
Config:        `items: ({text, icon, badge, handler, disabled, checked, items (submenu), group} | '-')[]` (`badge`: um número ou rótulo curto no fim da linha) (itens com o mesmo `group` ficam juntos sob o nome dele; os sem grupo vêm primeiro), `search: false` (um campo de busca sobre os itens: filtra enquanto você digita, e uma busca que bate com o nome de um grupo mostra o grupo inteiro; submenus não entram na busca).
API:           `showBy(el|Component, placement='bottom-start')`, `showAt(x, y)` (contexto), `hide()`, `setItems`, `setSearch(bool)`, `isOpen()`.
Eventos:       `click(item)`, `show`, `hide`.
Teclado/ARIA:  ↑↓ movem (com loop), Home/End, Enter/Space ativam, → abre submenu, ← fecha submenu, Esc fecha (e devolve o foco), Tab fecha; itens desabilitados são pulados; com `search` o primeiro item recebe o foco ao abrir (nunca o campo: o teclado do celular cobriria o menu), digitar uma letra a leva ao campo de busca, e lá ↓ vai ao primeiro resultado e Enter o escolhe;
               `aria-haspopup`/`aria-expanded` nos itens com submenu. Foco real nos itens (roving tabindex).
Tokens:        `--op-menu-bg/border/radius/shadow/item-padding-x/item-hover-bg/sep`, `--op-menu-max-height` (a lista rola além disso, com busca), `--op-menu-group-fg/group-tracking`.
Casos sandbox: menu de botão, contexto (botão direito), submenu, checkbox, desabilitado, ícones.
Fora do escopo: itens com campos embutidos, mega-menu, menu bar (Sidebar/NavMenu, P1).
