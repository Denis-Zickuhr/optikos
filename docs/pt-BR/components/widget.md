# Widget  (type: 'widget')
Propósito:     Painel que **flutua por cima** da página, preso a uma borda (direita, esquerda, embaixo ou em cima): assistente de IA, chat de suporte, notas rápidas. Não empurra o layout. Diferente do `Window` (centrado, modal, arrastável).
Anatomia:      `body > .op-layer` > `.op-widget.op-panel` (`op-widget--right|left|top|bottom`, `is-floating`, `is-open`) com o cabeçalho do `Panel` (título, ícone, ferramentas), corpo e barras. Herda tudo do `Panel`.
Config:        (Panel) + `side: 'right'|'left'|'top'|'bottom'` (right), `floating: true` (`false` = painel comum na posição do layout, sem flutuar; `side` não vale),
               `size` (largura nas laterais, altura em cima/embaixo; padrão pelos tokens), `sideSwitcher: false` (botões no cabeçalho para o usuário escolher o lado) e `sides: ['left','right','bottom']` (quais lados o seletor oferece),
               `draggable: false` (o usuário move o widget pelo cabeçalho: arrastar com o ponteiro, ou Alt+setas / Shift+Alt+setas com o foco no cabeçalho; mexer o solta do lado, e `setSide()`/Alt+Home o devolvem),
               `closable: true`, `closeAction: 'hide'`, `closeOnEsc: true` (Esc com o foco dentro fecha), `autoFocus: true` (foco vai para dentro ao abrir), `layout: 'fit'`.
API:           `open()`/`show()`, `close()`/`hide()`, `setOpen(bool?)` (sem argumento alterna; `toggle()` continua sendo o recolher do Panel), `isOpen()`, `setSide(side)`, `setSize(size)`, `getSide()`, `getPosition()` (`{x, y}` em px da janela, ou `undefined` enquanto está no lado), `resetPosition()` + a API do Panel (`setTitle`, `setIcon`...).
Eventos:       `before-show` (cancelável), `show`, `before-hide` (cancelável), `hide`, `side-change(side)`, `move({x, y} | undefined)`, e os do Panel (`before-close`, `close`).
Estados:       `is-open` (visível, com transição de deslizar), `is-floating`.
Teclado/ARIA:  Não é modal: a página continua utilizável e **sem** foco preso. `role=complementary` com o título como nome; Esc fecha quando o foco está dentro; o foco volta a quem abriu. O seletor de lado são botões com `aria-pressed`.
Tokens:        `--op-widget-width` (24rem), `--op-widget-height` (26rem), `--op-widget-wide` (largura em cima/embaixo), `--op-widget-offset` (distância da borda), `--op-widget-shadow`, `--op-widget-radius`, `--op-widget-bg`.
Casos sandbox: cada lado, seletor de lado, `floating: false` (docado no layout), com um `Chat` dentro, `size` customizado, vários widgets ao mesmo tempo.
Fora do escopo: redimensionar, lembrar a posição entre visitas (o app guarda com `move`), botão flutuante (launcher) para abrir, lembrar o lado escolhido (o app guarda com `side-change`).
Casos sandbox: (acima) + `draggable` com seletor de lado; demo `workbench`: widgets que não são chat (notas, timer de foco, configurações de visão) sobre um grid.
