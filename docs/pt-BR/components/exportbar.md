# ExportBar  (plugin: `exportBar()`)
Propósito:      Botões de exportar e imprimir dentro da grid, na mesma linha da paginação. Eles chamam `exportGrid` e `printGrid`, que continuam funcionando sozinhos nos seus próprios botões.
Anatomia:       `op-grid__footer` (a paginação da grid e os botões lado a lado; sem paginação, só os botões) > a paginação e `op-exportbar` (`role=group`) com até quatro `Button` ghost com ícone: CSV (download), Excel (table), esta página em CSV (file), Imprimir (printer).
Config:         `exportBar({ csv?, xlsx?, page?, print?, filename?, title?, labels? })`: cada um de `csv`, `xlsx`, `page`, `print` em `false` tira o botão (`page`, o CSV do que a grid mostra agora, é true por padrão só numa grid paginada); `filename` (`export`); `title` é o título da tabela impressa; `labels: true` mostra o texto ao lado dos ícones (padrão: ícones com tooltip).
API:            O objeto do plugin: `setVisible(action, visible)` e `setDisabled(action, disabled)` para `'csv' | 'xlsx' | 'page' | 'print'`. O botão fica desabilitado enquanto a exportação roda.
Eventos:        —
Estados:        Escondido (fora da config ou `setVisible(false)`), desabilitado, executando.
Teclado/ARIA:   Cada botão é uma parada de Tab com `aria-label` e tooltip ("Exportar CSV", "Imprimir"…); o grupo se chama "Exportar e imprimir".
Tokens:         Os do Button e da grid (`--op-grid-border`).
Casos sandbox:  `data`: uma grid paginada com a barra dentro, ao lado dos botões externos.
Fora do escopo: Outros formatos, escolher colunas (o menu de colunas da grid já faz), barra de progresso.
