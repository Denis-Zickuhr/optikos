# Button  (type: 'button')
Propósito:     Dispara uma ação (clique), com texto e/ou ícone, em variantes visuais.
Anatomia:      `<button class="op-button op-button--{variant} op-stable">` (grid de uma célula) > `.op-button__face` (`.op-button__icon`, `.op-button__text`) e `.op-button__busy` (`.op-button__spinner`, `.op-button__busy-text`, `aria-hidden`).
               As duas faces ocupam a mesma célula (`grid-area: 1 / 1`); a inativa fica `visibility: hidden` (com `stableSize: false`, `display: none`).
Config:        `text`, `icon`, `iconPos: 'left'|'right'` (left), `variant: 'default'|'primary'|'danger'|'ghost'` (default),
               `htmlType: 'button'|'submit'|'reset'` (button), `handler(btn, ev)`, `toggle: false`, `pressed: false`, `loading: false | string`, `loadingText` (padrão: `text`), `disabled`,
               `stableSize: true` — a largura é a maior entre a face normal e a de loading, então não muda ao entrar/sair de loading. `false`: o botão se ajusta à face ativa.
               Mudar o conteúdo (`setText` com texto maior) pode mudar a largura; `stableSize` vale para estados, não para conteúdo novo.
API:           `setText`, `setIcon`, `setVariant`, `setLoading`, `setLoadingText`, `setStableSize`, `setPressed`, `setDisabled`, `click()`.
Eventos:       `click(ev)` (cancelável: handler/listener que retorna `false` impede o submit nativo), `toggle(pressed)`.
Estados:       `is-disabled`, `is-loading` (bloqueia clique, `aria-busy`), `is-pressed` (toggle, `aria-pressed`), foco visível.
Teclado/ARIA:  Enter/Space nativos (é `<button>`); só ícone exige `ariaLabel` (aviso no console em dev); `aria-pressed` no toggle.
Tokens:        `--op-button-bg/fg/border/radius/padding-x/padding-y/gap/font-weight`, `--op-button-{hover,active}-bg`, por variante (`--op-button-primary-bg`...).
Casos sandbox: variantes, só texto/só ícone/ambos, disabled, loading, `stableSize` true vs false lado a lado com toggle de loading, toggle, submit dentro de form, tema por componente.
Fora do escopo: menu embutido e split (SplitButton é P1); grupos de botões (use Toolbar).
