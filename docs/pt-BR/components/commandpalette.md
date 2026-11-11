# CommandPalette  (type: 'commandpalette')
Propósito:     Janela de comandos aberta por atalho (Ctrl/⌘+K): o usuário digita e roda qualquer ação que o app registrou (navegar, trocar tema, criar registro...). Rápido para quem já conhece o app.
Anatomia:      `body > .op-layer` > `.op-palette-backdrop` > `.op-palette[role=dialog]` > `__search` (input `role=combobox`) + `__filters` (chip "Todas" + um por categoria) +
               `__list[role=listbox]` com `__group` (título da categoria) e `__item[role=option]` (ícone, título com `<mark>`, descrição, atalho `<kbd>`) + `__empty`; rodapé com dicas de teclado.
Config:        `commands: Command[]`, `hotkey: 'mod+k'` (`mod` = Ctrl no Windows/Linux, ⌘ no Mac; `false` desliga), `placeholder`, `emptyText`, `maxResults: 50`,
               `categories: string[]` (ordem dos grupos; o resto vem depois), `filters: true` (chips de categoria). Um comando aceita `permission` (fica de fora enquanto `setPermissionResolver` nega).
Command:       `{ id, title, category?, icon?, description?, keywords?: string[], shortcut?: string (só exibe), disabled?, hidden?: () => boolean, handler(ctx) }`.
               `children: Command[] | () => Command[] | Promise<Command[]>` abre um segundo nível ("Trocar tema… → claro/escuro/..."); Backspace com o campo vazio volta. O `handler` roda **depois** que a paleta fechou (assim pode abrir uma janela modal).
API:           `open()`, `close()`, `toggle()`, `isOpen()`, `setCommands(list)`, `register(cmd | cmds)` (devolve a função que desregistra), `run(id)`, `getCommands()`.
Eventos:       `before-open` (cancelável), `open`, `close`, `run(command)`, `error(err)` (handler que falha não derruba a paleta).
Busca:         Sem digitar: todos os comandos, agrupados por categoria. Digitando: ranking por texto (início do título > início de palavra > substring > letras em ordem, só com 3+ letras para não achar tudo), também em `keywords`,
               `category` e `description`; os melhores primeiro, sem grupos. Os chips de categoria filtram (um por vez; "Todas" limpa).
Estados:       `is-open`; item `is-active` (destacado), `is-disabled`.
Teclado/ARIA:  Ctrl/⌘+K abre/fecha de qualquer lugar (inclusive com o foco num campo); ↑↓ movem (circular), Home/End, Enter roda, Esc fecha (ou volta um nível), Tab/Shift+Tab percorrem os chips,
               Backspace no campo vazio volta de um submenu. Modal com foco preso; `aria-activedescendant` aponta o item ativo; `aria-live` anuncia "N resultados". Foco volta a quem abriu.
Tokens:        `--op-palette-width`, `--op-palette-top`, `--op-palette-max-height`, `--op-palette-bg`, `--op-palette-item-active-bg`, `--op-palette-group-fg`, `--op-palette-radius`.
Casos sandbox: 30 comandos em 4 categorias, submenu ("Trocar tema…"), comando desabilitado e oculto, atalho exibido, handler assíncrono que falha, hotkey desligado + botão que abre.
Fora do escopo: histórico/"recentes", comandos com argumentos digitados (`:goto 12`), busca em dados remotos (use um `SuggestField`/`LookupField`).
