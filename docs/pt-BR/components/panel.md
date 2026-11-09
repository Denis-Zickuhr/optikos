# Panel  (type: 'panel')
Propósito:     Container com cabeçalho (título, ferramentas), corpo com layout e rodapé; opcionalmente recolhível.
Anatomia:      `.op-panel` > `.op-panel__header` (`__title`, `__tools`), `.op-panel__body` (itens), `.op-panel__footer` (buttons).
               `tbar`/`bbar` são Toolbars dentro do panel (acima/abaixo do corpo).
Config:        (Container) + `title`, `icon`, `collapsible: false`, `collapsed: false`, `closable: false`, `tbar`, `bbar`, `buttons`, `tools: [{icon, handler, label}]`, `bodyCls`, `closeAction: 'destroy'|'hide'` (destroy).
API:           `setTitle`, `setIcon`, `collapse()`, `expand()`, `toggle()`, `close()`, `getBody()`, + Container (`add`, `remove`, `items`).
Eventos:       `before-collapse`/`before-expand`/`before-close` (canceláveis), `collapse`, `expand`, `close`.
Estados:       `is-collapsed`, `is-loading` (via `loading`).
Teclado/ARIA:  `role="region"` + `aria-labelledby` (título). Header recolhível tem botão com `aria-expanded`/`aria-controls`. Fechar = botão com label localizado.
Tokens:        `--op-panel-bg/fg/border/radius/shadow/header-bg/header-fg/header-padding/body-padding`.
Casos sandbox: simples, recolhível, com tbar/bbar/buttons, layouts hbox/vbox/grid dentro, closable, loading.
Fora do escopo: arrastar/redimensionar panel (só Window arrasta); abas (Tabs).
