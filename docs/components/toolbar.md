# Toolbar  (type: 'toolbar')
Propósito:     Barra horizontal (ou vertical) de botões, campos e separadores.
Anatomia:      `<div class="op-toolbar" role="toolbar">` > itens. Atalhos em `items`: `'->'` = Spacer que empurra o resto, `'-'` = separador, `' '` = espaço fixo.
Config:        (Container, layout hbox) + `vertical: false`, `ariaLabel`.
API:           (Container).
Teclado/ARIA:  `role=toolbar`; tabindex móvel: Tab entra no primeiro/último usado, ←→ (↑↓ se vertical) movem, Home/End.
Tokens:        `--op-toolbar-bg/border/padding/gap`.
Casos sandbox: botões + `->` + campo de busca, separadores, vertical, desabilitar itens.
Fora do escopo: overflow com menu "…" (P1).
