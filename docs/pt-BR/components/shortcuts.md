# Shortcuts  (type: 'shortcuts')
Propósito:     Atalhos de teclado registrados globalmente ou por tela (escopo), sem conflitos, com painel de ajuda em `?`.
Anatomia:      Um objeto, não um componente: `shortcuts.register`, `setScope`, `list`, `help`. O painel de ajuda é uma `Window` com `op-shortcuts` > `op-shortcuts__group`, `__row`, `__kbd`.
Config:        `shortcuts.register({ keys, title, handler, scope?, group?, when?, inInputs? })` (ou um array); devolve a função que remove. `keys`: `'mod+s'` (`mod` = Ctrl, ou ⌘ no Mac), `'alt+n'`, `'shift+?'`, `'g'`. `scope` é `global` por padrão; `setScope('lotes')` ativa os atalhos daquela tela além dos globais, e eles vencem um global com as mesmas teclas. `when()` é checado a cada tecla. Um atalho sem Ctrl/⌘/Alt é ignorado enquanto se digita num campo, a menos que `inInputs`. As mesmas teclas duas vezes num escopo avisam em dev e vale a mais nova.
API:           `shortcuts.register(s | s[])`, `setScope(nome | undefined)`, `getScope()`, `list()` (o que está ativo agora), `help()` (abre ou fecha o painel), `formatKeys('mod+s')` (`⌘S` ou `Ctrl+S`).
Eventos:       —
Estados:       `?` (Shift+/) abre o painel de ajuda de qualquer lugar menos de um campo de texto.
Teclado/ARIA:  O painel é uma janela modal (foco preso, Esc fecha) que lista cada atalho como `<kbd>`.
Tokens:        Os da `Window`; as linhas usam `--op-space-*` e `--op-color-*`.
Casos sandbox: `overlays`: atalhos globais, duas telas com os seus, o painel de ajuda.
Fora do escopo: Sequências de teclas (`g` e depois `i`), teclas reconfiguráveis pelo usuário, teclas específicas de plataforma além de `mod`.
