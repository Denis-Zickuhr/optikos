# NavMenu  (type: 'navmenu')
Propósito:     Menu de navegação lateral em árvore (sidebar de app): módulos agrupados e recolhíveis, item ativo, selos de contagem, modo "trilho" só com ícones e filtro.
Anatomia:      `nav.op-navmenu[aria-label]` > `ul[role=tree]` > `li[role=treeitem]` > `.op-navmenu__item` (ícone, texto, selo `__badge`, seta `__chevron` nos grupos) e, nos grupos, `ul[role=group]` com os filhos.
               Estados de classe: `is-active`, `is-group`, `is-expanded`, `is-disabled`; raiz `is-rail`.
Config:        `items: NavItem[]` (`{ id, text, icon?, badge?, items?, disabled?, hidden?, expanded?, data? }`), `active: id`, `collapsed: false` (trilho: só ícones, texto vira `title`; um grupo mostra o ícone, ou a inicial, e abre um Menu flutuante ao lado com o título e os filhos, selos incluídos; ele acende (`has-active`) quando a página ativa está dentro), `railWidth` (px ou CSS): a largura que o **contêiner pai** assume enquanto recolhido, devolvida ao expandir, para a sidebar acompanhar o trilho (o `setCollapsed` também faz).
               `accordion: false` (abrir um grupo fecha os outros), `ariaLabel`. Um item aceita `permission` (some, ou fica desabilitado, enquanto `setPermissionResolver` nega; um grupo vai junto com os filhos).
API:           `setActive(id)` (abre os pais), `getActive()`, `expand(id)`, `collapse(id)`, `toggle(id)`, `expandAll()`, `collapseAll()`, `setItems(items)`, `updateItem(id, patch)` (ex.: trocar o selo),
               `getItem(id)`, `setCollapsed(bool)`, `filter(text)` (esconde o que não casa e abre os grupos com resultado; vazio limpa).
Eventos:       `before-select(item)` (cancelável), `select(item)` (folhas), `expand(item)`, `collapse(item)`.
Estados:       item desabilitado não recebe seleção; grupo sem filhos visíveis some.
Teclado/ARIA:  Padrão "Tree View" do WAI-ARIA APG: ↑↓ movem entre itens visíveis, → abre o grupo (ou desce ao primeiro filho), ← fecha (ou sobe ao pai), Home/End, Enter/Espaço ativam. Foco único (roving tabindex).
               `role=tree`/`treeitem`/`group`, `aria-expanded` nos grupos, `aria-current="page"` no ativo, `aria-level`.
               Trilho: um grupo tem `aria-haspopup="menu"`; clique, → ou Enter abrem o menu dele (teclado do Menu: ↑↓, Enter escolhe e fecha), ← ou Esc fecham e devolvem o foco ao ícone; passar o mouse abre depois de uma pausa curta.
Tokens:        `--op-navmenu-bg/fg`, `--op-navmenu-item-hover-bg`, `--op-navmenu-active-bg/fg`, `--op-navmenu-active-bar`, `--op-navmenu-group-fg`, `--op-navmenu-rail-width`, `--op-navmenu-indent`.
Casos sandbox: árvore de 3 níveis, selos, trilho, filtro, accordion, itens desabilitados/ocultos, teclado.
Fora do escopo: arrastar itens, links reais (`href`: o app navega no `select`).
