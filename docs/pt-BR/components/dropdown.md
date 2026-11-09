# Dropdown  (type: 'dropdown')
Propósito:     Painel flutuante ancorado a um elemento; base de Select/ComboBox/Suggest/DateField/Menu (e Popover, P1).
Anatomia:      `.op-dropdown[role=…]` dentro do layer global (`body > .op-layer`). Recebe `data-op-theme` do ancestral do âncora.
Config:        `anchor: HTMLElement|Component`, `content: HTMLElement|ComponentConfig|Component`, `placement` ('bottom-start'),
               `offset: 4`, `matchWidth: false`, `flip: true` (vira para cima se não couber), `closeOnOutside: true`, `closeOnEsc: true`,
               `role` ('dialog'), `autoFocus: false`, `ariaLabel`.
API:           `open()`, `close()`, `toggle()`, `isOpen()`, `setAnchor`, `setContent`, `setPlacement`, `reposition()`.
Eventos:       `before-open`/`before-close` (canceláveis), `open`, `close`.
Estados:       `is-open`; âncora ganha `aria-expanded` (quem usa o Dropdown liga `aria-haspopup`/`aria-controls`).
Teclado/ARIA:  Esc fecha e devolve foco ao âncora; clique fora fecha (pointerdown em captura, ignora o âncora); reposiciona em scroll/resize.
               Um dropdown `dialog` sem `ariaLabel` recebe o nome da âncora (`aria-labelledby`).
Tokens:        `--op-dropdown-bg/border/radius/shadow/z`.
Casos sandbox: abaixo/acima (flip), matchWidth, conteúdo qualquer, fecha fora/Esc, dentro de scroller, dentro de tema escuro.
Fora do escopo: setas apontando para o âncora (Popover, P1); animações JS (só CSS).
