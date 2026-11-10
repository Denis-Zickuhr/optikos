# Rodadas de fix

Itens encontrados na revisão. Cada item diz o problema, o comportamento esperado e o critério
de aceite. Ao corrigir, marque `[x]` e atualize a ficha do componente, se ela mudar.

## Rodada 1

- [x] **Tamanho estável em mudanças de estado (`stableSize`)**
  - **Problema:** na sandbox `base` ("Button · states"), "Toggle loading" faz o botão mudar de
    largura: entra o spinner e o texto troca ("Save" → "Saving"). O layout em volta pula.
  - **Esperado:** uma opção `stableSize` no `Component` (padrão `true`) garante que o componente
    não mude de tamanho quando só o *estado* muda (loading, pressed, searching, invalid). Com
    `false`, o comportamento atual continua (tamanho se ajusta ao conteúdo).
  - **Como (CSS, sem medir no JS):**
    - Button: o conteúdo normal (ícone + texto) e o conteúdo de loading (spinner + texto de
      loading) ficam empilhados na mesma célula de um `display: grid` (`grid-area: 1 / 1`); o que
      não está ativo fica com `visibility: hidden`. A largura vira o máximo dos dois, sem salto.
    - Campos com indicador (SuggestField `is-searching`, LookupField, Combo, Field `loading`):
      o espaço do spinner fica sempre reservado (padding fixo por token), em vez de surgir e empurrar o texto.
    - Mudar o *conteúdo* (`setText` com outro texto) pode mudar o tamanho; `stableSize` vale
      para estados, não para conteúdo novo.
  - **Aceite:** teste confirmando a estrutura (os dois conteúdos presentes, um oculto); caso
    novo na sandbox lado a lado (`stableSize: true` vs `false`) com um toggle de loading;
    screenshot antes/depois sem variação de largura; fichas do Button e do Field atualizadas.

## Backlog (P1, ainda sem rodada)

> Feito na rodada 3: DateRangeField. O que ficou de fora do item está na ficha (`daterangefield.md`, "Fora do escopo").

- [x] **Seleção de intervalo de datas (`DateRangeField` + `Calendar range`)** — feito (valor `{ start, end }`; ficha `daterangefield.md`; sandbox `dates`; demo admin)
  - **Problema:** só existe seleção de um dia (`DateField`, `Calendar`). Intervalo exige dois campos e
    `setMin`/`setMax` manuais, sem destaque do período.
  - **Esperado:** `Calendar` ganha `range: true` (valor `{ from, to }` em ISO; 1º clique define o início,
    2º o fim; hover mostra o período; clicar antes do início reinicia). Novo `DateRangeField` (`daterangefield`):
    um input com texto no locale (`01/11/2026 – 15/11/2026`) e Dropdown com o Calendar; valor `{ from, to }` ou `null`.
  - **Como:** reutilizar `Calendar` e `core/date.ts`; `min`/`max`/`isDisabled` valem para os dois extremos;
    validação `from <= to`; `change({from,to})`; teclado: Enter no 1º dia fixa o início, Enter no 2º fecha;
    `aria-selected` nos dias do período (`is-in-range`, `is-range-start`, `is-range-end`).
  - **Aceite:** ficha `daterangefield.md` antes do código; testes (seleção por clique e teclado, ordem invertida,
    min/max, parse do texto digitado, Form load/getValues); caso na sandbox `dates`; screenshot claro e escuro;
    tamanho dentro do orçamento.

## Rodada 2

- [x] **Navegação do dev (sandboxes e demos): voltar e trocar de página sem usar o browser**
  - **Problema:** ao abrir uma sandbox (`/sandbox/fields/`) ou um demo não há como voltar ao índice nem ir
    para outra sandbox; só pelo botão do browser. O índice (`.dev/index.html`) é uma lista crua e as páginas não apontam para ele.
  - **Esperado:** toda página de sandbox e de demo tem, fixo no topo, um frame de navegação:
    breadcrumb `Optikos › Sandbox › fields` (cada trecho é link; o último é a página atual), um menu para
    pular direto para qualquer outra sandbox/demo e os controles de tema que já existem. Demos mantêm o código
    do app limpo (só API pública): o frame de dev é um elemento flutuante pequeno injetado por `dev/kit.ts`
    (`devFrame()`), recolhível, que não interfere no layout do demo (Viewport continua ocupando a janela).
    O índice ganha o mesmo visual (usando componentes do Optikos): cards por categoria com descrição e contagem
    de seções, e uma seção "Demos".
  - **Como:** `scripts/dev.mjs` gera o índice e uma lista `pages.json` (nome, tipo, caminho) em `.dev/` para o frame
    não depender de listar diretórios; o frame usa o componente `breadcrumb` (item abaixo) e um `menu`.
    Atalho de teclado `g` `i` (ou `Alt+↑`) volta ao índice. O link de voltar respeita `?theme=` para não perder o tema.
  - **Aceite:** a partir de qualquer sandbox/demo é possível chegar ao índice e a qualquer outra página em um clique
    (ou dois, pelo menu); teste do gerador do `pages.json` (todas as pastas de `sandbox/` e `demos/` presentes);
    screenshot do frame em sandbox, em demo (recolhido e aberto) e do índice, claro e escuro; nenhum demo passa a
    importar nada fora de `optikos`.

- [x] **Componente `Breadcrumb` (P0)**
  - **Problema:** o catálogo tinha Breadcrumb como P1 e ele não existe; o frame do dev precisa dele e os demos
    (admin, CRM) também.
  - **Esperado:** `breadcrumb` (`<nav aria-label>` com `<ol>`): itens `{ text, icon?, href?, handler?, items? }`;
    o último é a página atual (`aria-current="page"`, não clicável). Separador por token/CSS (`›` por padrão, via
    `--op-breadcrumb-separator`). Eventos `navigate(item, index)` (cancelável com `before-navigate`). Quando não cabe,
    os itens do meio colapsam em um botão `…` que abre um `Menu` (config `maxItems`, padrão 4). `setItems`,
    `setSeparator`.
  - **Como:** `href` gera `<a>` (navegação nativa); sem `href`, `<button>` com `handler`. Teclado: Tab entre
    itens, Enter ativa; o `…` abre o menu com ↑↓. Tokens: `--op-breadcrumb-fg`, `-current-fg`, `-gap`, `-separator`,
    `-hover-fg`. Reutilizar `Menu` e `iconEl`; nada novo no core.
  - **Aceite:** ficha `breadcrumb.md` antes do código; testes (renderização, `aria-current`, cancelamento de
    `before-navigate`, colapso com `maxItems` e navegação por teclado no menu, `setItems`, destroy); caso na sandbox
    `navigation` (curto, longo com colapso, com ícones, separador custom, claro/escuro/compacto); screenshot; usado
    pelo frame do dev (item acima); entrada no tamanho (orçamento padrão).

## Backlog de formulários complexos (P1, pedido do dono; ainda sem rodada)

Motivação: o cadastro de cliente do demo CRM já é uma janela longa de um único bloco; cadastros reais têm dezenas
de campos. Dois padrões, que compartilham a mesma base (`Form` sabendo agrupar campos em seções):

- [x] **Form em abas (`Form` com `tabs`)** — feito (atalho `tabs: [{ title, icon, items, layout }]`; `validate()` ativa a aba do 1º inválido, selo de erros e ponto de alterado no cabeçalho via `Tabs.setTabState`; `getValues/load/reset/markClean` atravessam as abas; a regra vale para qualquer ancestral que mostre um filho por vez, ex.: layout `card`)
  - **Problema:** campos de abas diferentes precisam ser **um só** formulário (um `getValues`, um `submit`, um dirty),
    mas hoje `Tabs` dentro de `Form` funciona só por acaso e quebra com abas `lazy`: um campo cuja aba nunca foi
    aberta não é validado nem focado.
  - **Esperado:** `form.items` aceita `{ type: 'tabs', items: [...] }` (ou atalho `tabs: [{ title, items }]` no Form) e:
    `validate()` percorre **todos** os campos, inclusive de abas não renderizadas; o primeiro inválido ativa a aba
    dele e recebe foco; o cabeçalho da aba mostra um indicador de erro (`has-error`, contagem de inválidos,
    `aria-describedby`/texto para leitor de tela) e de alterado (`is-dirty`); `getValues`/`load`/`reset`/`markClean`
    atravessam as abas; `before-change` da aba pode (opcional) validar a aba atual antes de sair.
  - **Como:** `Form.getFields()` já usa `query` na árvore (campos de painéis lazy existem como instâncias, só não
    têm DOM); o Form escuta `invalid`/`valid`/`dirty-change` dos campos e atualiza o cabeçalho da aba dona (via
    `Component.parent` até o painel de aba); ao validar, `tabs.setActive(painelDoCampo)` antes do `focus()`.
  - **Aceite:** ficha atualizada (`form.md`, `tabs.md`); testes (campo em aba lazy nunca aberta é validado e
    ativa a aba ao falhar; indicadores de erro/dirty no cabeçalho; `getValues` completo; reset; `Form` + `Window`);
    caso na sandbox `form` (cadastro de cliente em 4 abas); o demo CRM passa a usar abas; screenshot claro/escuro.

- [x] **`StepForm` (formulário em etapas) + `Stepper`** — feito (fichas `stepform.md` e `stepper.md`: validação por etapa, `linear`, etapa opcional, revisão automática ou por função, `finish`, Enter = Próximo, dentro de `Window`)
  - **Problema:** cadastros longos ficam melhores guiados passo a passo (dados pessoais → endereço → contato →
    revisão), com validação por etapa e resumo final.
  - **Esperado:** `stepform` (`type: 'stepform'`): `steps: [{ title, description?, optional?, items }]`; mostra um
    `stepper` (indicador: número/ícone, título, estado `done/current/error/disabled`) e **uma etapa por vez**
    (layout `card`); botões `Back` / `Next` / `Finish` no rodapé. É **um** formulário: `getValues`, `load`,
    `dirty`, `submit` valem para todas as etapas. API: `next()`, `back()`, `goTo(i)`, `getStep()`, `setStepState`.
    Eventos: `before-step-change(from, to)` (cancelável; `Next` só avança se a etapa atual valida, `Back` sempre
    volta), `step-change`, `finish(values)` (só após validar todas as etapas; se alguma falhar, vai a ela).
    Etapas `optional` podem ser puladas. Última etapa opcional "Revisão" com resumo dos valores (config
    `review: true` ou renderer). Modo `linear: true` (padrão) impede pular adiante sem validar; `false` permite
    clicar em qualquer etapa.
  - **Como:** `Stepper` como componente próprio (P1 no catálogo: `<ol>` com `aria-current="step"`, clicável só
    nas etapas permitidas); `StepForm extends Form` com `Container` card por baixo, reaproveitando a lógica de
    "campos de painéis não renderizados" do item de abas. Teclado: Enter no último campo vai para `Next`;
    Alt+← / Alt+→ opcionais. Usável dentro de `Window` (demo CRM) e de página.
  - **Aceite:** fichas `stepper.md` e `stepform.md` antes do código; testes (validação por etapa bloqueia `Next`,
    `before-step-change` cancela, `Back` preserva valores, `finish` leva à etapa inválida, modo não linear, etapa
    opcional, ARIA do stepper, `load/getValues` completos, destroy); casos na sandbox `form` e `navigation`; o
    demo CRM ganha "Novo cliente (assistente)"; screenshot claro/escuro; tamanho dentro do orçamento.

## Rodada 3 (Grid: colunas, filtros e seleção em lote) — P1, pedido do dono

Motivação (screenshots do CRM): hoje só há ordenação por clique no cabeçalho, um filtro de texto e um `Select` de status
montados à mão na toolbar, e seleção por clique de linha. Faltam as operações que uma tela de dados real pede.

- [x] **Gestão de colunas (menu + busca)** — feito: `columnMenu`, busca, `get/setColumnState`, `columns-change`. **Não feito:** arrastar para reordenar (a ordem muda por `setColumnState`), "Restaurar padrão", ações por coluna (ordenar/fixar), fixar colunas. Ficou no próprio `Grid` (sem componente `columnmenu`: só o Grid usa, princípio 3).
  - **Problema:** não dá para esconder/mostrar colunas, reordenar ou procurar uma coluna numa grade larga.
  - **Esperado:** botão no cabeçalho (ícone de colunas, `columnMenu: true`) abre um menu/painel com a lista de colunas:
    checkbox de visibilidade, **campo de busca** que filtra a lista, "Mostrar todas / Restaurar padrão", reordenar
    (arrastar ou ↑↓ com teclado) e, por coluna, ações (ordenar asc/desc/limpar, fixar à esquerda/direita, esconder).
    O estado das colunas (visíveis, ordem, largura) é lido/escrito por `grid.getColumnState()` / `setColumnState()` (JSON,
    para o app persistir). Evento `columns-change`.
  - **Como:** componente `columnmenu` (usa `Dropdown` + `ListBox`/lista de checkboxes + `TextField` de busca);
    `Grid.setColumns` já reconstrói o cabeçalho; `hidden` por coluna já existe. A fixação de colunas depende do item
    "colunas fixas" do P1 do Grid (pode ficar para depois, o menu mostra a ação desabilitada).
  - **Aceite:** ficha `columnmenu.md` (e `grid.md` atualizada) antes do código; testes (toggle esconde/mostra e emite
    evento, busca filtra a lista, restaurar, teclado, ARIA do menu, `get/setColumnState` ida e volta); caso na sandbox
    `data`; o demo CRM usa; screenshot claro/escuro.

- [x] **Filtros dinâmicos (`FilterBuilder`) com operadores e grupos AND/OR** — feito (ficha `filterbuilder.md`; `Store.filter` aceita árvore AND/OR e os 16 operadores). **Não feito:** chips dos filtros ativos, `registerFilterEditor`, editor de enum com `Select` (usa `<select>` nativo, por tamanho), booleano como tipo próprio (use `select`).
  - **Problema:** os filtros são fixos e montados à mão (texto + status). Não há como o usuário **adicionar filtros em
    runtime**, nem operadores além de "contém"/igual, nem OR.
  - **Esperado:** `filterbuilder` (`type: 'filterbuilder'`), ligado a um `Store`/`Grid` (`store`, `fields`): um container
    com botão **"Adicionar filtro"**; cada filtro é uma linha `campo · operador · valor(es)`, os filtros **se acumulam
    embaixo** uns dos outros, cada um removível, e há "Limpar tudo". O editor de valor muda conforme o tipo do campo
    e o operador (texto → `TextField`, número → `NumberField`, data → `DateField`, enum → `Select`/múltiplo, booleano →
    `Checkbox`; `between` → dois campos, `in` → múltiplo, `is empty` → sem valor).
    Operadores: `equals`, `not equals`, `contains`, `not contains`, `starts with`, `ends with`, `>`, `>=`, `<`, `<=`,
    `between`, `not between`, `in`, `not in`, `is empty`, `is not empty`. **Grupos** `AND`/`OR` aninháveis (cada grupo
    com seu conector e botão "Adicionar grupo"). Chips resumindo os filtros ativos no topo do Grid (cada um removível).
  - **Como:** estender `Store.filter` para uma árvore `{ op: 'and'|'or', filters: [...] }` (hoje é lista AND de
    `FilterSpec`) e aceitar os novos operadores em `data/store.ts` + `RestProxy` (serialização documentada); o
    `FilterBuilder` produz/consome essa árvore (`getValue()` / `setValue()` JSON, `change`), aplica sob demanda
    (`autoApply: true`) ou com botão "Aplicar". Fábrica de editores por tipo de coluna (`Column.type`), extensível pelo
    usuário (`registerFilterEditor`). i18n dos operadores (`en`, `pt-BR`).
  - **Aceite:** ficha `filterbuilder.md` antes do código; testes de cada operador no Store (incluindo `between`, `in`,
    `is empty`, OR e grupos aninhados) e do componente (adicionar/remover/limpar, trocar operador troca o editor,
    valor é serializável, teclado, ARIA); caso na sandbox `data` e no demo CRM (substitui a toolbar de filtros
    manual); screenshot claro/escuro; tamanho dentro do orçamento (entrada própria).

- [x] **Coluna de seleção (checkbox) e ações em lote** — feito: `checkboxSelection`, selecionar página (indeterminado) e todos os filtrados (`selectAllFiltered`, link "Selecionar todos os N"), `bulkActions`, `rowActions`, `keepSelection`. Demos CRM (excluir/marcar ativo em lote) e admin.
  - **Problema:** a seleção múltipla existe (Ctrl/Shift+clique), mas não é descobrível e não há "ação sobre as linhas
    selecionadas".
  - **Esperado:** `selectionColumn: true` (ou `selection: 'multi'` + `checkboxes: true`) acrescenta uma primeira coluna
    com checkbox por linha e, no cabeçalho, um checkbox "selecionar todos" (marcado / indeterminado / vazio, com o
    escopo: **página** ou **todos os resultados filtrados**, e aviso "N selecionadas"). Barra de **ações em lote**
    que aparece quando há seleção (`bulkActions: [{ text, icon, handler(records), danger? }]`, contagem, "Limpar
    seleção"). `row-action` por linha (menu "⋯" com `rowActions`). Seleção sobrevive à ordenação e, opcionalmente
    (`keepSelection: true`), à paginação e filtros (por `id`).
  - **Como:** a coluna de checkbox é uma coluna interna do Grid (não um plugin separado), com `role=checkbox`
    por célula; `aria-selected` nas linhas já existe; "selecionar todos" usa `store.getAll()` (precisa ser exposto) e
    `Checkbox` indeterminado. Teclado: Espaço alterna a linha ativa; Ctrl+A já seleciona tudo.
  - **Aceite:** ficha `grid.md` atualizada antes do código; testes (checkbox da linha e do cabeçalho, estado
    indeterminado, escopo página vs. tudo, `keepSelection` com paginação, ações em lote recebem os registros certos,
    teclado, ARIA); caso na sandbox `data`; demo CRM: excluir/alterar status em lote; screenshot claro/escuro.

## Rodada 3b (pedido do dono, junto da rodada 3)

- [x] **`SearchGrid` + `LookupField`** — feito (fichas `searchgrid.md` e `lookupfield.md`, `registerLookup`). Digitar sugere; a lupa (ou F4) abre a janela com filtros + grid. Demos CRM e admin, sandbox `fields` e `data`.
      **Não feito:** seleção múltipla no `LookupField`, ↓ do último filtro para o grid.
- [x] **Lupa no `SuggestField`** (ícone decorativo, `icon: false` esconde) e suggest/lookup/daterange nos formulários dos demos.
- [x] **DateRange nos demos de data** — sandbox `dates` (Calendar range + DateRangeField).
- **Tamanho:** os compostos passaram do orçamento padrão porque o relatório mede cada entrada sozinha, com suas dependências (Button, Menu, Dropdown, Window, Grid...). Orçamentos novos: grid 16 kB, filterbuilder 12 (o menu de campos do `addMode: 'pick'`), searchgrid 17, lookupfield 21, pickerfield e select 7,5 (o selo do `showValue`), `data` 5 (operadores novos), viewmanager 14.

## Rodada 3c (pedido do dono)

- [x] **Visões salvas (`ViewManager`)** — feito (ficha `viewmanager.md`): salva/restaura colunas visíveis e ordem, filtros com grupos AND/OR, ordenação e `extra` do app; o destino é um `ViewStorage` (`localViewStorage` nos demos, `restViewStorage` para endpoint próprio, ou implementação sua); abre com a visão padrão. Demo CRM e sandbox `data`.
- [x] **Erro de validação no `FilterBuilder` não desce mais a linha** (a mensagem fica pendurada sob o campo, sem aumentar a linha).
- [x] **`rowActionsMode: 'visible'` e padding das colunas de checkbox/ações** — feito: botões de ícone sempre à mostra (esmaecidos até hover/ativa/selecionada), `disabled(record)` por linha, `variant: 'danger'`; o Grid cuida do padding e da largura (a coluna de ações cresce com o número de botões); Shift+F10 abre o menu da linha ativa. `'menu'` continua o padrão.
- [x] **Temas prontos que variam forma, densidade e tipografia: `brutal`, `soft`, `terminal`, `editorial`** (`src/themes/*.css`, documentados em `docs/theming.md`; teste de estrutura em `themes.test.ts`). Seletor de tema nas sandboxes e no frame dos demos (`dev/themes.ts`). Novos tokens: `--op-grid-check-accent`, `--op-filterbuilder-chip-on-fg`.

## Rodada 4 (pedido do dono): CommandPalette e Chat

- [x] **`CommandPalette` (Ctrl/⌘+K)** — feito (ficha `commandpalette.md`): comandos que o app registra (`commands`, `register()`), categorias com chips, busca com ranking (título, palavras-chave, categoria, descrição), segundo nível (`children`), atalho exibido, desabilitado/oculto, handler assíncrono com `error`, modal com foco preso. Sandbox `overlays` e demo `chat`.
- [x] **`Chat`** — feito (ficha `chat.md`): bolhas por autor/dia, tiques de status, resposta citada, "digitando…", streaming (`appendToMessage`), chips de sugestão, `setBusy`, renderizador custom; texto formatado sem nunca gerar HTML (só `**negrito**`, `*itálico*`, `` `código` ``). Sandbox nova `chat`.
- [x] **Demo `chat` ("Prosa")**: app de mensagens com lista de conversas (não lidas, prévia), grupo com autores, respostas simuladas ("digitando…", ✓ → ✓✓ → lido). O **assistente de IA é um widget lateral**: o botão ✨ (ou a paleta) abre/fecha um painel à direita com um `Chat` próprio, que lê a conversa aberta ao lado ("Conversa em foco: …") e aceita dois prompts roteirizados — *Resuma esta conversa* e *Sugira uma resposta educada* — respondendo em streaming com dados da conversa real. Paleta (Ctrl+K): abrir conversa, abrir/fechar a IA, resumir/sugerir, marcar lidas, limpar, tema claro/escuro. Visual verde só por tokens (`defineTheme`).
- Orçamentos: commandpalette e chat entram no padrão (7 kB); `daterangefield` sobe para 7,5 kB.
- [x] **`Widget` (painel flutuante preso a uma borda)** — feito (ficha `widget.md`): flutua **por cima** por padrão (vive em `body > .op-layer`, não empurra o layout nem trava a página), `side: 'right'|'left'|'top'|'bottom'`, `setSide()`, `sideSwitcher` (botões no cabeçalho para o usuário escolher o lado), `floating: false` (painel comum), `size`. A demo `chat` usa o Widget para o assistente de IA (paleta: "Posição do assistente…"); sandbox `overlays`.
- [x] **Tema `brand` (luxo/joalheria)** — `src/themes/brand.css`, agora **claro** (champagne/marfim, texto ônix, faixas de título ônix); a versão escura virou `brand night`: tipografia serifada, capitulares espaçadas, botão principal em degradê de ouro, campos em "poço" escuro com filete dourado, moldura dupla nas janelas. No seletor de temas do dev (`?theme=brand`).

## Rodada 5 (pedido do dono): moldura responsiva

- [x] **Layouts responsivos (celular)** — `border` vira centro + drawers (west/east) abaixo de 768 px do container, com `openRegion/closeRegion/toggleRegion`, `open: 'west'`, scrim e Esc; `grid` numérico colapsa para 1 coluna; `hbox` com `stackBelow`; Toolbar quebra linha; Window com `dvh`; barra do dev quebra linha. Demo `chat`: no celular a lista é a tela inicial, escolher uma conversa mostra o chat, seta ← volta; o widget da IA ocupa a largura. Demo `admin`: menu hambúrguer abre a navegação. Testado em 390 px.
- [x] **`brand` mais claro e usável** — champagne/marfim + texto ônix + faixas de título ônix; a versão escura é `brand night`.
- [x] **`Widget` móvel (`draggable`)** — arrastar pelo cabeçalho (ponteiro, inclusive toque) ou Alt+setas; mover solta do lado, `setSide()`/Alt+Home devolvem; `getPosition()`, `resetPosition()`, evento `move`. **Demo `workbench`**: três widgets que não são chat sobre um grid de pedidos — Notas (salvas no navegador, docável à esquerda/direita), Timer de foco (pausar, reiniciar, foco/pausa, toast ao fim) e Configurações da visão (formulário que muda o grid ao vivo).
- [x] **Reordenar colunas por arraste (`reorderableColumns`)** — flag no Grid: arrastar o cabeçalho (fantasma + barra de destino), Alt+←/→ no teclado, `moveColumn()`, eventos `column-move` e `columns-change`; o `ViewManager` já salva a ordem. Demo CRM e sandbox `data`. (Reordenar no menu de colunas continua só por `setColumnState`.)

## Rodada 6 (pedido do dono): demo ERP de navegação

- [x] **Demo `erp` ("NorthBridge")** — um mega-ERP de mentira para testar navegação, grid e filtros com um tema sério (`corporate`): sidebar em árvore (`NavMenu`) com módulos Vendas (pedidos, faturas, clientes), Compras (pedidos de compra, fornecedores), Estoque (produtos), Operações (jobs) e Administração (usuários); **workspace em abas** (cada página e cada registro abre numa aba, sem duplicar), breadcrumb que acompanha a aba, paleta Ctrl+K (ir para, criar, atalhos como "Faturas vencidas" que já abre a lista filtrada), dashboard com cartões que levam à lista **já filtrada** (links profundos), menu do usuário, notificações, sidebar recolhível em trilho e **drawer no celular**.
      Cada lista é gerada de uma definição (`demos/erp/pages.ts`): `Grid` com checkbox, ações em lote por módulo, ações visíveis por linha, menu de colunas, colunas reordenáveis, `FilterBuilder` (escolhe o campo antes), visões salvas por página (localStorage) incluindo a barra de filtros aberta (`extra`), formulário do registro em aba (lookups de cliente/fornecedor/responsável, validação). Pedidos e Jobs usam **store remoto simulado** (220 ms, paginação/ordenação/filtros no "servidor" via `matchFilter`); o resto é local.
- [x] **`NavMenu`** (ficha `navmenu.md`) — árvore de navegação: grupos, ativo, selos, trilho, filtro, accordion, teclado APG.
- [x] **Tema `corporate`** — sóbrio e denso, sidebar azul-marinho por tokens `--op-navmenu-*`.
- [x] **Tabs sem "setinhas" de rolagem vertical** na barra (`overflow-y: hidden`); ícones novos (`file`, `box`, `truck`, `clock`, `shield`, `list`); o demo pode pedir seu tema inicial (`<meta name="op-theme">`); a regra do teste de demos agora permite importar os próprios arquivos locais.
- Orçamentos: `datefield` 7,5 kB.
- [x] **Redimensionar colunas por arraste (`resizableColumns`)** — flag no Grid (nível de frame): alça na borda do cabeçalho, largura ao vivo com mín/máx, duplo clique reseta, Alt+Shift+←/→ no teclado, `Column.resizable: false`, `setColumnWidth()`, evento `column-resize`; a largura vai para `getColumnState` e para as visões salvas. Demos ERP e CRM, sandbox `data`.
- [x] **Guarda-corpos de layout** (ver decisão 36 em `architecture.md`): colunas `vbox` não espremem filhos e rolam por dentro; Toolbar não encolhe itens; `stackBelow` empilha com altura natural. Corrige o dashboard do ERP no celular. O rail da sidebar do ERP agora é só desktop (no drawer sempre aparecem os nomes).
- [x] **Grupos de colunas (`Column.group`)** — nível de frame, livre por grid: faixa de rótulos sobre o cabeçalho e, no menu de colunas, seções com checkbox de grupo (parcial/contagem), chips de filtro e busca por nome de grupo; `getColumnGroups()`, `setColumnGroupVisible()`. As listas do ERP agrupam por tipo (Identificação, Valores, Datas, Status, Pessoas).

## Rodada 7 (pedido do dono): exemplos de formulário complexos

- [x] **Sandbox `form` reescrita** com 7 casos: o básico (rótulo à esquerda), **Form com abas** (selo de erros, ponto de alterado, "Validar" que pula para a aba do erro), **Form em modal** (`Window` com guarda "descartar alterações?"), **StepForm** na página (etapa opcional, revisão, Enter = Próximo), **StepForm em modal** (rodapé próprio, cancelar pergunta antes), **navegação livre + revisão customizada** e **validação** (regra entre campos, erro do "servidor" com `setError`, readonly). A sandbox `navigation` ganhou o `Stepper` avulso.
- Orçamento: `stepform` 9,5 kB (puxa Form, Container, Stepper, Button, Toolbar).

## Rodada 8 (pedido do dono): campo de segredo

- [x] **`SecretField`** (ficha `secretfield.md`) — criar: digita mascarado e o olho mostra o que foi digitado (volta a esconder ao sair do campo). Editar com segredo salvo: mostra só a máscara, **nunca** o valor, sem olho; para mudar, **Substituir** (ou clicar no campo) abre um aviso modal de que o valor salvo não pode ser exibido e será descartado; confirmando, o campo esvazia e vira digitação normal, com **Manter o atual** para desistir. O valor é `null` (intacto: o servidor mantém), texto (novo) ou `''` (limpar). `form.load({ apiKey: true })` = "existe um segredo"; `required` conta como atendido enquanto intacto; `reset()` volta ao salvo. Sandbox `form` ("SecretField: create and edit"). Core 11 kB (ver decisão 39).

## Rodada 9 (pedido do dono): demo de fotos "Lumina"

- [x] **Demo `photogallery`** — app de fotos e arquivos: **Biblioteca** e **Favoritos** (grade de miniaturas com coração, ponto de backup, selo de vídeo, seleção múltipla com barra de ações: favoritar, mover para álbum, compartilhar, fazer backup, excluir; ordenar, filtrar foto/vídeo, tamanho das miniaturas), **Álbuns** (um por álbum, com "Compartilhar álbum"), **visualizador** (Window com a foto grande, Anterior/Próximo e ←/→, aba Detalhes editável e aba **Comentários** com um `Chat`), **Arquivos** (Grid com filtros, visões salvas, colunas agrupadas/reordenáveis/redimensionáveis, ações em lote e por linha), **Compartilhados** (por mim / comigo, revogar), **Backup** (cartões de status, dispositivos, "Fazer backup agora" com progresso simulado, configurações com senha de criptografia salva num `SecretField`, itens com falha), **Comunidade** (feed de posts com curtir e comentar; o `Chat` ao lado — drawer no celular —, publicar uma foto, respostas simuladas com "digitando…") e a janela **Compartilhar** (pessoas ou link, permissão, validade, senha do link, baixar). Upload real de imagens (miniaturas reais) ou 5 exemplos pela paleta (Ctrl+K). Fotos geradas em SVG: sem rede, sem imagens.
- [x] **`DataView`** (ficha `dataview.md`): grade de cartões de um Store com seleção, teclado 2-D, botões por item (`data-op-action` → `item-action`) e paginação. Sandbox `data`.
- Bugs de lib achados pelo demo: `Chat` dentro de uma aba preguiçosa quebrava no `notifyMount` (o botão de enviar ainda não existia) e perdia as mensagens definidas antes de renderizar; as duas coisas corrigidas, com teste. Ícones novos: `heart`, `image`, `cloud`, `folder`, `share`, `message`. Orçamentos: `grid` 17 kB, `daterangefield` 8 kB.

## Rodada 10 (pedido do dono): engine de animação e Slider

- [x] **Engine de animação `optikos/motion`** (ficha `docs/motion.md`) — implementa as 20 regras com os números padrão, tudo configurável (`motion.set`) e com **interruptor global** (`motion.enable/disable`, respeita `prefers-reduced-motion`): ease-out nas entradas, dropdown 150–250 ms (limitado), stagger de 30 ms, escala 0,97 ao pressionar e "sem tween no hold", knob que estica 12 %, movimento em arco, pulso de sucesso, ease-in-out, popover a partir de 0,95, origem/saída em direção ao gatilho, **sem bounce** (curvas com overshoot recusadas), saída 20 % mais curta, `swap` (sobreposição + crossfade com blur), máscaras (`reveal`, `wipeColor`), rubber band só nos limites (`rubberScroll`, `rubberBand`) e `layoutId` (FLIP em arco). Já aplicado em Dropdown/Menu/Select..., Window/MessageBox, Toast (pulso de sucesso), Button (`pulse()`, escala ao pressionar) e DataView (stagger). Testes simulando `Element.animate` (25) e verificado no Chrome (dropdown 200 ms com origem no botão, saída 160 ms, linhas do menu 0/30/60/90 ms).
- [x] **Demo `motion`** ("Motion lab"): um cartão por regra, painel de configuração ao vivo (sliders), interruptor global, "respeitar reduced-motion", **câmera lenta ×1–×8** e "Reset defaults".
- [x] **`Slider`** (ficha `slider.md`): barra com bolinha para inserir um número ou um **intervalo** (duas bolinhas que não se cruzam), min/max/step (decimais sem ruído), marcas e rótulos, balão com o valor (arrastando/foco/sempre), formato, teclado APG (setas, Page, Home/End), clique na barra, estiramento da bolinha, Field normal (Form, dirty, reset). Sandbox `fields` e demo `motion`.
- Orçamentos: os componentes com popup subiram ~1,2 kB pelo módulo de motion (window/widget 8,5, pickerfield/select 9,5, combobox/suggestfield 10, messagebox 11...).

## Rodada 11 — demos de flexibilidade

- [x] **Demo `shop`** ("Loop & Co", mini e-commerce fake): catálogo com filtros ao vivo (busca, categoria, faixa de preço com `Slider` de intervalo, "só em estoque", ordenação) sobre um `Store` + `DataView` de cartões; filtros em *drawer* no celular (layout `border`); janela do produto (tamanho, quantidade); **carrinho** num `Widget` flutuante (linhas com +/−/remover por `data-op-action`, subtotal, cupom via `MessageBox.prompt` — `WELCOME10`, `FREESHIP` —, frete grátis a partir de US$ 100); **checkout** num `StepForm` (contato, entrega, pagamento com validação Luhn e `SecretField` para o CVC, revisão customizada) dentro de uma `Window` com máscara de "processando" e confirmação do pedido. Escrito com os atalhos `ui.*`.
- [x] **Demo `events`** ("Maison Runway Week", landing page fake de semana de moda): barra fixa, hero com contagem regressiva ao vivo, programação em `Tabs` + `Table`, modelos (`DataView` + janela com bio e "Seguir"), **conteúdo de parceiros estilo publi** (cartões marcados "Partner content", história editorial, sem preço nem carrinho, aviso de publicidade), galeria com lightbox, FAQ em painéis recolhíveis, informações e formulário de convite com validação. Tema `brand`; tudo por tokens, o CSS da página só cuida da composição.
- Observação de ambiente: o servidor de dev lê as pastas de `demos/` ao subir; uma demo nova exige reiniciar `npm run dev`.
- `demos/demos.test.ts` sobe as duas demos no happy-dom e exercita o fluxo principal.
- [x] **Correção `shop`**: o carrinho quebrava ao abrir (`Object.assign(el, { dataset })` lança: `dataset` só tem getter; criado o helper `act()`), a lista rolava na horizontal e o "Remove" era cortado (agora `✕`, `itemWidth` menor, `overflow-x:hidden`). Teste de ponta a ponta: carrinho → checkout → pedido → carrinho zerado.

## Rodada 12 (pedido do dono)

- [x] **Debounce em todo campo**: `debounce` (ms) na config de qualquer `Field` e evento `settled(value)` (decisão 44). `change` continua imediato. O shop passou a filtrar em `settled` (busca 300 ms, preço 150 ms).

## Backlog do app Comptease (P1, pedido do dono; ainda sem rodada)

Motivação: o dashboard do Comptease (`/home/corin/projects/apps/competease`, doc `docs/03-prototipo/06-padroes-dashboard.md`)
segue três regras: menu lateral recolhível (`NavMenu`), todo cadastro em `Window` + `StepForm` e `LookupField` para
entidades grandes (pessoa, participante, evento...). Estes são os buracos encontrados ao desenhar essas telas. Os IDs `OPK-##`
são os mesmos citados no doc do app.

- [ ] **OPK-01 · `LookupField` com seleção múltipla** (M)
  - **Problema:** o campo só fica com o 1º registro (`recs[0]` em `lookupfield.ts`); o `selection: 'multi'` da definição vale
    só para o `SearchGrid` avulso. O app precisa escolher vários jurados para uma bancada e vários parceiros para um cupom.
  - **Esperado:** `multiple: true` no `LookupField`: valor = lista de `valueField` (`getValue(): id[]`), seleção exibida
    como `Chip`s removíveis dentro do campo (Backspace no input vazio remove o último), sugestões digitadas acrescentam,
    a janela de pesquisa abre com o grid em seleção múltipla (checkboxes) já marcando o que está no campo e "Selecionar"
    devolve o conjunto. `getSelection()` vira lista de `{ value, label, raw }`; `max` opcional; `required` = ao menos um.
  - **Como:** reaproveitar `Chip` e a coluna de checkbox do `Grid` (`checkboxSelection`, `keepSelection` por `id`);
    `load`/`getValues`/`dirty` do `Form` comparando listas.
  - **Aceite:** ficha `lookupfield.md` atualizada antes do código; testes (adicionar por sugestão e pela janela, remover chip
    por clique e teclado, janela reabre com a seleção marcada, `max`, `required`, Form load/getValues/dirty/reset, ARIA dos
    chips); caso na sandbox `fields`; screenshot claro/escuro; orçamento revisto.

- [ ] **OPK-02 · `LookupField`: "+ Novo" na janela de pesquisa** (M)
  - **Problema:** se a pessoa procurada não existe, o usuário tem que fechar o cadastro em que está, cadastrar a pessoa e
    recomeçar. A ficha lista "criar registro a partir da janela" como fora do escopo.
  - **Esperado:** `create: { text?, handler(query) => Promise<record | null> }` na definição do lookup (ou no campo). A janela
    mostra o botão "+ Novo" (e uma linha "Cadastrar «texto digitado»" quando a busca não acha nada). O handler é do app:
    normalmente abre outra `Window` com `StepForm` empilhada por cima e resolve com o registro salvo, que é selecionado no
    campo e fecha a janela de pesquisa. `null` = cancelado, volta para a pesquisa com o foco onde estava.
  - **Como:** só orquestração (janelas empilhadas já funcionam). O texto digitado vai como `query` para pré-preencher.
  - **Aceite:** ficha atualizada; testes (botão aparece só com `create`, linha "Cadastrar …" sem resultados, resolve
    seleciona e fecha, `null` mantém a janela e o foco, erro no handler não quebra a janela); caso na sandbox `fields`
    (cadastro de cliente com "Novo gerente"); screenshot.

- [ ] **OPK-03 · `StepForm`: etapas condicionais** (M)
  - **Problema:** o cadastro de competição tem etapas diferentes conforme o formato (`painel` tem critérios e bancada;
    `chaveamento` tem regras do torneio; `popular`, pacotes de voto). Hoje as etapas são fixas (ficha: "etapas
    condicionais/ramificadas" fora do escopo).
  - **Esperado:** `when?: (values) => boolean` por etapa. Etapa com `when` falso some do `Stepper` e do fluxo
    (Próximo/Voltar pulam), seus campos **não validam** e **não entram** em `getValues()` (opção `keepHiddenValues: true`
    para manter). Reavalia quando os valores mudam (no `change` dos campos, sem render global). `getStepCount()` conta só as
    visíveis; a revisão lista só as visíveis.
  - **Como:** reavaliar em `step-change` e no `change` do Form; `Stepper.setItems` para refazer o indicador; os campos da
    etapa oculta ficam `disabled` (o que já os tira da validação).
  - **Aceite:** ficha `stepform.md` atualizada antes do código; testes (etapa some e volta, Próximo/Voltar pulam, validação
    e `getValues` ignoram oculta, `keepHiddenValues`, `linear` com etapa que aparece à frente, revisão); caso na sandbox
    `form` (formato muda as etapas); screenshot.

- [ ] **OPK-04 · `StepForm`: validação assíncrona por etapa** (S)
  - **Problema:** checagens que dependem do servidor (e-mail/CPF já cadastrado, slug disponível, código de cupom único) só
    rodam no `finish`, depois que o usuário já passou da etapa.
  - **Esperado:** `validate?: (values, form) => Promise<true | Record<campo, mensagem> | string>` por etapa. Próximo mostra
    `loading` no botão, aguarda e, se falhar, marca os campos (`markInvalid`) ou mostra a mensagem geral da etapa, e não
    avança. Clique duplo não dispara duas vezes; trocar de etapa cancela a validação pendente (`AbortSignal` no 3º argumento).
    Validadores assíncronos por campo (`asyncValidator`, com `debounce`) também, se couber no mesmo mecanismo.
  - **Como:** em cima do `before-step-change` (que já é cancelável), com estado `is-validating` na etapa; `stableSize` no botão.
  - **Aceite:** ficha atualizada; testes (sucesso avança, erro por campo, erro geral, clique duplo, abort ao voltar, `finish`
    roda as validações das etapas); caso na sandbox `form` com atraso simulado; screenshot.

- [ ] **OPK-05 · Roteador de cliente (decidir antes: lib ou app)** (M)
  - **Problema:** não há roteamento. No dashboard, cada item do `NavMenu` é uma tela com URL própria (voltar/avançar do
    navegador, link direto, recarregar mantém a tela), e o `Breadcrumb` precisa refletir a rota. Hoje cada app faria à mão.
  - **Esperado:** `optikos/router` pequeno: rotas declaradas (`{ path: '/eventos/:id', view: () => Component | Promise<…>,
    title?, data? }`), modos hash e history, parâmetros, guarda `before-navigate` cancelável (ex.: form sujo), carregamento
    preguiçoso da tela, e ligações opcionais: `NavMenu.setActive` pela rota, `Breadcrumb` a partir da rota, `Tabs` ↔ sub-rota.
  - **Como:** decidir pelo princípio 3 (precisa servir a três componentes reais: NavMenu, Breadcrumb, Tabs). Se ficar no
    app, documentar a receita nos guias.
  - **Aceite:** decisão registrada em `architecture.md`; se for para a lib: ficha, testes (match, params, guarda,
    hash/history, lazy), demo admin usando, entrada própria no orçamento.

- [ ] **OPK-06 · `NavMenu`: grupos em menu flutuante no modo trilho** (C)
  - **Problema:** com `collapsed: true` os grupos viram separadores e só os ícones aparecem; não dá para chegar aos filhos
    sem expandir o menu inteiro.
  - **Esperado:** no trilho, clicar ou passar o mouse no ícone de um grupo abre um `Menu` flutuante ao lado com o título do
    grupo e os filhos (com selos). Escolher navega (`select`) e fecha; → abre e ← fecha pelo teclado.
  - **Como:** reaproveitar `Menu` + `position.ts`; o grupo no trilho ganha `aria-haspopup="menu"`.
  - **Aceite:** ficha `navmenu.md` atualizada; testes (abrir por clique/teclado, escolher filho, Esc, item ativo dentro do
    grupo destacado no ícone); caso na sandbox `navigation`; screenshot.
