# MessageBox  (função; usa Window)
Propósito:     Diálogos prontos `alert`, `confirm`, `prompt` baseados em Promise.
API:           `MessageBox.alert(text, {title, okText, icon}) → Promise<void>`;
               `MessageBox.confirm(text, {title, okText, cancelText, danger}) → Promise<boolean>`;
               `MessageBox.prompt(text, {title, value, placeholder, validators, autoFocus}) → Promise<string|null>` (`autoFocus: true` foca o campo de texto; por padrão o diálogo recebe o foco, então o teclado do celular não aparece);
               `MessageBox.show({text, title, icon, buttons: [{id, text, variant}], cancelId})` para botões customizados → Promise<string> (id do botão).
Anatomia:      Window modal pequena: ícone + texto + (TextField no prompt) + botões no rodapé. Não escurece a página (uma Window modal com `mask: false`: a página fica inerte e não recebe cliques, mas continua como está); toda chamada aceita `mask: true` para escurecer.
Teclado/ARIA:  `role=alertdialog`; foco inicial no botão primário (ou no campo do prompt); Enter confirma, Esc cancela (resolve false/null);
               texto vira `aria-describedby`.
Tokens:        usa os de Window/Button.
Casos sandbox: alert, confirm, confirm perigoso, prompt com validação, botões custom, empilhado sobre outra Window.
Fora do escopo: HTML no texto (apenas texto), barra de progresso, textos longos com scroll customizado.
