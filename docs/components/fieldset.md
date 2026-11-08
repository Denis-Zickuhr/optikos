# FieldSet  (type: 'fieldset')
Propósito:     Agrupar campos com legenda, opcionalmente recolhível.
Anatomia:      `<fieldset class="op-fieldset">` > `<legend>` (`__legend`, com botão se recolhível) + `.op-fieldset__body` (itens).
Config:        (Container) + `title`, `collapsible: false`, `collapsed: false`. Layout padrão `vbox`.
API:           `setTitle`, `collapse`, `expand`, `toggle`, `setDisabled` (desce aos campos).
Eventos:       `collapse`, `expand`.
Teclado/ARIA:  `<fieldset>`/`<legend>` nativos; botão da legenda com `aria-expanded`.
Tokens:        `--op-fieldset-border/radius/padding/legend-fg`.
Casos sandbox: simples, recolhível, desabilitado, com layout grid de 2 colunas.
Fora do escopo: —
