# FieldSet  (type: 'fieldset')
Propósito:     Agrupar campos com legenda, opcionalmente recolhível.
Anatomia:      `<fieldset class="op-fieldset">` > `<legend>` (`__legend`, com botão se recolhível) + `.op-fieldset__body` (itens).
Config:        (Container) + `title`, `description` (uma linha sob a legenda; descreve o grupo), `variant: 'box'` (`'box'` com moldura, `'line'` um filete sob a legenda, `'plain'` só a legenda), `columns` (uma grade responsiva; os itens aceitam `colspan`, um número ou `'full'`), `collapsible: false`, `collapsed: false`. Layout padrão `vbox`.
API:           `setTitle`, `setDescription`, `setVariant`, `collapse`, `expand`, `toggle`, `setDisabled` (desce aos campos).
Eventos:       `collapse`, `expand`.
Teclado/ARIA:  `<fieldset>`/`<legend>` nativos; botão da legenda com `aria-expanded`.
Tokens:        `--op-fieldset-border/radius/padding/legend-fg`.
Casos sandbox: simples, recolhível, desabilitado, com layout grid de 2 colunas, as três variantes com descrição.
Fora do escopo: —
