# Panel  (type: 'panel')
Propósito:     Container com cabeçalho (título, ferramentas), corpo com layout e rodapé; opcionalmente recolhível.
Anatomia:      `.op-panel` > `.op-panel__header` (`__title`, `__tools`), `.op-panel__body` (itens), `.op-panel__footer` (buttons).
               `tbar`/`bbar` são Toolbars dentro do panel (acima/abaixo do corpo).
Config:        (Container) + `title`, `icon`, `collapsible: false`, `collapsed: false`, `closable: false`, `reloadable: false` (uma ferramenta ↻ que chama `onReload(panel)`; a máscara de carregamento fica até uma Promise devolvida terminar), `onReload`, `tbar`, `bbar`, `buttons`, `tools: [{icon, handler, label}]`, `bodyCls`, `closeAction: 'destroy'|'hide'` (destroy).
API:           `setTitle`, `setIcon`, `collapse()`, `expand()`, `toggle()`, `close()`, `reload(): Promise<boolean>`, `getBody()`, + Container (`add`, `remove`, `items`).
Eventos:       `before-collapse`/`before-expand`/`before-close`/`before-reload` (canceláveis), `collapse`, `expand`, `close`, `reload`.
Estados:       `is-collapsed`, `is-loading` (via `loading`), `is-reloading` (o painel mostra a máscara de carregamento e o ↻ gira).
Teclado/ARIA:  `role="region"` + `aria-labelledby` (título). Header recolhível tem botão com `aria-expanded`/`aria-controls`. Fechar = botão com label localizado.
Tokens:        `--op-panel-bg/fg/border/radius/shadow/header-bg/header-fg/header-border/header-padding/body-padding`.
Casos sandbox: simples, recolhível, com tbar/bbar/buttons, layouts hbox/vbox/grid dentro, closable, loading.
Fora do escopo: arrastar/redimensionar panel (só Window arrasta); abas (Tabs).
