# Spacer  (type: 'spacer')
Propósito:     Espaço flexível ou fixo (e separador visual) em toolbars e layouts flex.
Anatomia:      `<span class="op-spacer">`; sem `width`/`flex` = ocupa o espaço livre (`flex:1`).
Config:        `width`, `flex`, `line: false` (vira separador vertical 1px por token).
Teclado/ARIA:  `aria-hidden`; a linha usa `role=separator`.
Tokens:        `--op-spacer-line`.
Casos sandbox: fill, fixo, separador.
Fora do escopo: —
