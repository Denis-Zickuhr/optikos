# Timeline  (type: 'timeline')
Propósito:     Eventos numa lista vertical, ou um cronograma (fases do evento, escala de equipe, salas) como barras num eixo de tempo, uma linha por faixa.
Anatomia:      `op-timeline--list`: `op-timeline__item` (`is-success|warning|danger|info`) > `__when`, `__marker`, `__body` (`__title`, `__text`). `op-timeline--range`: `__axis` (marcas), uma `__lane` por faixa (`__lane-name`, `__track` com `__bar`s) e um marcador `__now`.
Valor:         Itens: `{ id?, title, text?, icon?, tone?, time? }` na lista; `{ title, start, end?, lane?, tone?, text?, icon? }` no cronograma. Datas em ISO (`2026-11-10`, ou com hora). Um `end` só com data inclui o dia inteiro.
Config:        `mode: 'list'|'range'` (list), `items` ou `store` (os registros são itens), `lanes` (ordem das linhas; as outras vêm depois), `from`/`to` (a janela; padrão do primeiro início ao último fim), `now: true` (um marcador no instante atual), `plugins` (`timeEntry()`).
API:           `setItems(items)`.
Eventos:       `select(item)` ao clicar ou Enter.
Estados:       Vazio. Um store alimenta e repinta a cada mudança.
Teclado/ARIA:  `role=list`, itens e barras são `listitem` que recebem foco; o rótulo da barra diz o título e o período ("Show, 12 de nov. até 12 de nov."). Enter seleciona.
Tokens:        `--op-timeline-marker`, `--op-timeline-when-width`, `--op-timeline-lane-width`, `--op-timeline-bar-height`, `--op-timeline-line`.
Casos sandbox: `data`: o histórico de eventos, um cronograma com faixas e um cronograma ao longo de meses.
Fora do escopo: Arrastar ou redimensionar barras (isso é o plugin `timeEntry()`), dependências entre barras, níveis de zoom, eventos recorrentes (uma visão de calendário).
