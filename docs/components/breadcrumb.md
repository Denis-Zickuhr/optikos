# Breadcrumb  (type: 'breadcrumb')
Propósito:     Mostrar onde a pessoa está numa hierarquia e permitir voltar a qualquer nível.
Anatomia:      `<nav class="op-breadcrumb" aria-label>` > `<ol class="op-breadcrumb__list">` > `<li>` com `a.op-breadcrumb__item` (item com `href`),
               `button.op-breadcrumb__item` (item com `handler`), ou `span.op-breadcrumb__current[aria-current=page]` (o último).
               Quando colapsa: `button.op-breadcrumb__more` ("…", `aria-haspopup=menu`) no lugar dos itens do meio. Separador por CSS (`li + li::before`).
Config:        `items: { text, icon?, href?, handler?(item) }[]`, `maxItems: 4` (mínimo 3; acima disso o meio colapsa: primeiro + "…" + últimos `maxItems - 2`),
               `separator: '›'` (texto; vira `--op-breadcrumb-separator`), `ariaLabel` (padrão localizado "Breadcrumb"/"Trilha de navegação").
API:           `setItems`, `setSeparator`, `setMaxItems`.
Eventos:       `before-navigate(item, index)` (cancelável; em `<a>` cancela a navegação nativa), `navigate(item, index)`. O último item nunca navega.
Estados:       foco visível; o item atual não é interativo.
Teclado/ARIA:  Padrão "Breadcrumb" do WAI-ARIA APG. Tab percorre os itens (links/botões nativos), Enter ativa; o "…" abre um Menu (↑↓, Enter, Esc, ver Menu) com os itens escondidos, na ordem.
               `aria-current="page"` no último; separadores são decorativos (pseudo-elemento, fora da árvore de acessibilidade).
Tokens:        `--op-breadcrumb-fg`, `--op-breadcrumb-hover-fg`, `--op-breadcrumb-current-fg`, `--op-breadcrumb-gap`, `--op-breadcrumb-separator`.
Casos sandbox: curta, longa com colapso (`maxItems`), com ícones, separador custom, `before-navigate` cancelando, claro/escuro/compacto.
Fora do escopo: trilha gerada automaticamente de um router (Router é P2), dropdown de irmãos em cada nível.
