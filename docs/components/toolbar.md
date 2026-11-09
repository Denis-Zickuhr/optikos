# Toolbar  (type: 'toolbar')
Purpose:       A horizontal (or vertical) bar of buttons, fields and separators.
Anatomy:       `<div class="op-toolbar" role="toolbar">` > items. Shortcuts in `items`: `'->'` = a Spacer that pushes the rest, `'-'` = a separator, `' '` = a fixed space.
Config:        (Container, hbox layout) + `vertical: false`, `ariaLabel`.
API:           (Container).
Keyboard/ARIA: `role=toolbar`; roving tabindex: Tab enters on the first/last used item, ←→ (↑↓ when vertical) move, Home/End.
Tokens:        `--op-toolbar-bg/border/padding/gap`.
Sandbox cases: buttons + `->` + a search field, separators, vertical, disabling items.
Out of scope:  overflow into a "…" menu (P1).
