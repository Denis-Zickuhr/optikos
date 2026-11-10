# Tabs  (type: 'tabs')
Propósito:     Alternar entre painéis, um visível por vez.
Anatomia:      `.op-tabs` > `.op-tabs__bar[role=tablist]` > `.op-tabs__tab[role=tab]` (+ botões recarregar e fechar) ; `.op-tabs__panels` (Container com layout `card`) > painéis `[role=tabpanel]`.
Config:        `items` (cada um: `title`, `icon`, `closable`, `reloadable` (um ↻ que chama o `onReload(panel)` do painel; uma Promise devolvida mostra a máscara de carregamento do painel), `disabled` + config do painel), `reloadable` (padrão para todas as abas), `active: 0|id`, `position: 'top'|'left'` (top), `lazy: true` (o DOM do painel só é construído ao ativar), `closable` (default dos itens).
API:           `setActive(indexOrId)`, `getActive()`, `add(tab)`, `closeTab(indexOrId)`, `reloadTab(indexOrId): Promise<boolean>`, `setTitle(tab, text)`, `setTabState(tab, { errors?, dirty? })` (selo de erros e ponto de alterado no cabeçalho; o `Form` usa).
Eventos:       `before-change(next, prev)` (cancelável), `change(tab, index)`, `before-close(tab)` (cancelável), `close(tab)`, `before-reload(tab)` (cancelável), `reload(tab)`.
Teclado/ARIA:  Padrão APG: ←→ (↑↓ se left) movem e ativam, Home/End, Delete fecha aba closable, R recarrega aba reloadable; só a aba ativa está no Tab; `aria-selected`, `aria-controls`/`aria-labelledby`; o painel tem `tabindex="0"` (alcançável pelo Tab mesmo sem nada focável dentro, ou quando rola).
Tokens:        `--op-tabs-bar-bg/tab-fg/tab-active-fg/tab-active-border/tab-padding-x`.
Casos sandbox: simples, closable, ícones, lazy, lateral, add dinâmico, aba desabilitada.
Fora do escopo: arrastar para reordenar, overflow com scroll de abas (P1).
