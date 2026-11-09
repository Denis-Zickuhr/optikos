# Arquitetura do Optikos

Cada decisão tem motivo e alternativa descartada. Os pilares de `PHILOSOPHY.md` são o critério de desempate.

## Visão em camadas

```
bind (opcional, optikos/bind)   signal / computed / effect  →  chama setters
components/*                    Button, Field, Grid...        (usam só a API pública do core)
core + layout + data            Emitter, Component, Container, registry, Layout, Store...
CSS                             tokens → @layer optikos
```

Dependências só descem. `core` não conhece componentes; componentes não conhecem `bind`.

## Decisões de design pattern

| Pattern | Aplicação | Motivo | Descartado |
|---|---|---|---|
| **Composite** | `Container.items` forma a árvore; `destroy` desce pela árvore | Uma tela é uma árvore de componentes, e isso mapeia direto para a config declarativa. | Árvore só de DOM (perde ciclo de vida e eventos tipados). |
| **Factory + Registry** | `register('button', Button)`, `create({type})`; `create` aceita instância pronta | Declarativo primeiro; usuário registra tipos próprios com a mesma função. | `new X()` obrigatório (quebra o princípio 1); decorators (exigem build/TS flags). |
| **Observer** | `Emitter` com `on/off/once/emit`; `on` devolve função de cancelamento; handler que retorna `false` cancela eventos `before-*` | Pequeno (~300 B), sem dependência, igual no Component e no Store. | `EventTarget`/`CustomEvent` (alocação por evento, sem cancelamento tipado, payload dentro de `detail`). |
| **Template Method** | `Component.render()` chama `build()` → `onRender()`; `mount` → `onMount()`; `destroy` → `onDestroy()` | Subclasses sobrescrevem só o que muda; o core garante a ordem. | Hooks por config (`onRender: fn`), pior para tipagem e herança. |
| **Strategy** | Layouts (`registerLayout`), validadores (funções), formatadores (`registerFormat`), `renderer` de coluna, `filter` do ComboBox | Funções simples são a estratégia; nada de classes. | Hierarquias de classes por estratégia. |
| **Proxy (dados)** | `Proxy` = `{ read(params), create?, update?, destroy? }` com `MemoryProxy`, `FunctionProxy`, `RestProxy` | Store não sabe de onde vêm os dados; testável sem rede. | Store com `fetch` embutido. |
| **Plugin** | Grid recebe `plugins: [...]` (P1: edição, filtros, agrupamento): objeto com `init(grid)` e `destroy()` | Mantém a base do Grid enxuta e tree-shakeable. A API existe, os plugins são P1. | Herança por feature (`EditableGrid`). |
| **Flyweight / Virtualização** | `core/virtual.ts`: pool de linhas reutilizadas + spacer; usado por Grid e ListBox | Pilar "Rápido": 100 mil linhas = ~30 nós. | Paginação como única defesa; render completo "para simplificar". |
| **Command** | Não é uma classe. Uma ação é uma função; botão, item de menu e atalho apontam para a mesma função (`handler`). | Evita uma camada que só serviria a 1 caso hoje. Reavaliar com atalhos globais (P1). | Objeto `Action` separado (config duplicada + estado `disabled` sincronizado). |

## Decisões estruturais

### Classes TS, sem Web Components
Componentes são classes (`class Button extends Component`). Shadow DOM isolaria o CSS e quebraria o tema global
(tokens herdam, mas `@layer` do usuário e seletores externos não). Wrapper `customElements` fica como opção futura.

### `el` preguiçoso, DOM construído uma vez
O construtor só guarda a config. `el` é um getter que chama `render()` na primeira leitura. Motivo: campos de classe
das subclasses são inicializados *depois* de `super()`, então o DOM não pode ser construído no construtor da base.
Efeito colateral bom: componentes em abas inativas (`lazy`) não custam DOM.

### Setters explícitos, sem reatividade no core
Todo config público mutável tem `setX`. O setter grava em `config` e, se já renderizado, atualiza só aquele pedaço do DOM.
Não há re-render, nem diff, nem scheduler. O `bind` opcional chama os mesmos setters, então vale para componentes custom.
Descartado: proxy reativo na config (mágica escondida, custo em todos os componentes) e signals no core (impõe um modelo).

### Dono do DOM é o componente; limpeza é obrigatória
`Component.own(fn)` registra qualquer coisa a liberar; `listen(target, ev, fn)` adiciona listener DOM com limpeza.
`destroy()` roda tudo, remove `el`, solta filhos e limpa o Emitter. Teste de vazamento: criar/destruir e conferir `document.body` limpo.

### Layouts quase todos em CSS
Um layout é `{ init(container), add?(container, cmp), remove?(container, cmp) }`. `fit/hbox/vbox/border/grid` só colocam uma classe e
custom properties (`--op-layout-gap`); `card` é o único com lógica (alterna `hidden`). Descartado: medir e posicionar em JS (lento, frágil, contra o princípio 5).

### Camada global para flutuantes (`core/layer.ts`)
Dropdown, Window, Menu, Tooltip e Toast vivem em `body > .op-layer`, fora de containers com `overflow`/`transform`.
Como saem do escopo `[data-op-theme]`, o layer copia o tema do ancestral do âncora. Modal torna os irmãos do layer `inert`.

### Hierarquia de campos
`Component → Field → TextField → (TextArea, NumberField, DateField, PickerField → (Select, ComboBox, SuggestField))`; `Checkbox` e `RadioGroup` herdam
de `Field`. `PickerField` só existe porque quatro campos compartilham input + Dropdown + ListBox + ARIA de combobox (regra das três peças).

### Valor de DateField é string ISO
`'2026-11-07'`, sem fuso, serializável em JSON e comparável como texto. O que o usuário vê segue `Intl` e o locale.

### Modelo de dados
`Model` = registro (`id`, `data`, `modified`, `phantom`) com schema opcional (`defineModel`); `Store` guarda `Model`s, mantém uma *visão*
(filtrada, ordenada, paginada) e implementa `subscribe(fn)` para o `bind`. Paginação/ordenação/filtro são locais por padrão e viram remotos com `remote: true` (o proxy recebe `sort`, `filters`, `page`, `pageSize`).

### i18n
`core/i18n.ts`: objetos de locale planos (`en`, `pt-BR`), `setLocale(nameOrObject)`, `t(key, vars)`. Datas e números usam `Intl`.
Descartado: ICU message format (peso) e arquivos de tradução carregados em runtime.

### Build e distribuição
esbuild, ESM, ES2022. Entradas: `index` (tudo registrado), `core` (sem componentes), `bind`, `components/<nome>` (cada um registra só a si mesmo e suas dependências).
`optikos.css` completo, `css/<nome>.css` por componente, `themes/*.css`. Tamanhos medidos por entrada isolada, com orçamento que quebra o `npm run build`.
Os `.d.ts` emitidos pelo `tsc` têm os imports relativos reescritos para `./x.js` / `./dir/index.js` no build, porque com `moduleResolution: node16/nodenext` um import sem extensão não resolve e o pacote ficaria sem tipos. Os sourcemaps (com `sourcesContent`) vão no pacote: o JS é minificado, e sem eles um stack trace dentro da lib é ilegível.

### Segurança
Texto sempre via `textContent`. `innerHTML` só em SVG de ícones registrados pelo desenvolvedor. Config de usuário nunca vira HTML.

## Decisões tomadas durante a implementação

(Atualizado conforme o código avança. Formato: data curta, decisão, motivo.)

Datas: todas de 2026-11-07, durante as Fases 4 a 8.

1. **`Emitter.clear` virou `clearListeners`.** `Store.clear()` (limpar registros) colidia com o método herdado. Nome do Store mantido porque `clear` é o verbo esperado para "esvaziar a coleção".
2. **Filhos de `Container` são instanciados no construtor, renderizados no `render`.** Permite `container.get(id)`/`items` antes de montar. Custo: criar um componente é barato (config + objeto), DOM só nasce no `render`. Abas `lazy` não renderizam painéis inativos (o layout `card` só marca `hidden` na config de quem nunca renderizou).
3. **`sideEffects` não é "só CSS".** Todo componente se registra ao ser importado (`register('button', Button)`), isso é efeito colateral. `package.json` marca `src/**` (o build parte dele) e `dist/**` como com efeito, além de `**/*.css`. Consequência: `import { Button } from 'optikos'` traz todos os componentes; quem quer pouco importa `optikos/components/button` (e `optikos/core`, que é puro). Alternativa descartada: registrar tudo em runtime por função `registerAll()` (quebra o `create({type})` sem ritual).
4. **Entradas de build:** `index`, `core` (Emitter, Component, Container, Field, registry, layouts, utilitários), `data` (Store/Model/Proxy/formatos), `bind`, `components/<nome>`. `data` saiu do `core` depois da primeira medição para o core caber no orçamento.
5. **Medição de tamanho:** cada entrada é empacotada sozinha. O componente é avaliado pelo que **soma** sobre o "runtime mínimo" (`Component + register + create`, ~2,3 kB), para que dependências compartilhadas (Field, Toolbar...) contem para quem precisa delas. Orçamentos: core 10 kB, data 4 kB, componente 7 kB; ComboBox, SuggestField, MessageBox e Grid 8 kB porque carregam cadeias inteiras (Field → TextField → PickerField → Dropdown + ListBox; Window → Panel → Toolbar → Button...). Meta inicial do plano (core < 8 kB) respeitada: 7,6 kB.
6. **Tokens de componente têm dois níveis de declaração.** Valores literais (`--op-spinner-size: 1.5rem`) ficam num bloco `:root {}` no topo do CSS do componente; valores que dependem do tema usam `var(--op-button-bg, var(--op-color-surface))` no ponto de uso (e aliases privados `--_bg` no elemento). Motivo: uma variável declarada em `:root` com `var()` é resolvida lá e não muda dentro de `[data-op-theme="dark"]`. Um teste (`themes/css.test.ts`) falha se um CSS de componente tiver cor/tamanho literal fora desses blocos.
7. **Temas combináveis:** `data-op-theme` é uma lista (`"dark compact"`, seletor `~=`). `defineTheme()` gera o mesmo CSS que um arquivo escrito à mão; `scripts/theme.mjs` (comando kai "Theme to CSS") compila um tema TS para `.css`. `Theme.inject()` instala sem ativar; `setTheme()` troca o tema de qualquer elemento.
8. **Flutuantes herdam o tema do âncora.** O layer fica em `body`; `toLayer(el, from)` copia `data-op-theme` do ancestral de `from`.
9. **Esc fecha um nível por vez.** `Dropdown` mantém uma pilha global de abertos e só o último reage; Window ignora Esc já tratado. Evita fechar a janela ao fechar o combo dentro dela.
10. **Valor do `TextField` é o texto atual a cada edição**; `change` dispara a cada tecla, então `getValue()` nunca fica defasado do que está na tela. Descartado: separar "valor digitado" de "valor confirmado" (dois estados em todo campo, `getValue()` defasado no meio da digitação).
11. **`PickerField` (Select/ComboBox/SuggestField) não vira tipo público** (não registra `type`), só é a base compartilhada. Seleção de item que não está na lista (valor remoto) usa `setSelection(item)`.
12. **Radio é opção do `RadioGroup`**, não componente solto (o catálogo listava "Radio/RadioGroup"). Inputs nativos com o mesmo `name` dão teclado e foco corretos de graça.
13. **Máscara de carregamento no `Component` base** (`loading`), 20 linhas, porque Panel, Grid, Form e Window usam. O `spinner` é só o elemento.
14. **Tooltip é atributo + delegação.** `tooltip: 'x'` só grava `data-op-tip`; o módulo `tooltip` (um listener no document) mostra. Quem importa só `optikos/components/button` não tem tooltip a menos que importe `optikos/components/tooltip`.
15. **Grid sempre virtualizado.** Um caminho de código só (pool de linhas + spacer). `aria-activedescendant` no grid, nenhuma linha recebe foco, então reciclar linhas não perde foco. Altura de linha é medida do token (`measure()` resolve `var(--op-row-height)` para px) e remedida ao montar/redimensionar (`ResizeObserver`).
16. **`Form` binding (Fase 2):** nomes com ponto viram objetos aninhados; `load(record|Model)`, `getValues({dirtyOnly})`, `updateRecord(model)`. Sem two-way automático.
17. **Datas como ISO `YYYY-MM-DD`** (`core/date.ts`), nunca `Date` UTC. Texto exibido/aceito segue o `Intl` do locale (ordem dia/mês/ano derivada de `formatToParts`).
18. **Command** não virou classe (já previsto na Fase 3): `handler` é a ação.
19. **`new Panel/Toolbar` por dentro, `create()` por fora:** componentes do próprio core instanciam classes importadas (sem passar pelo registry) para não depender de `type` registrado.
20. **`stableSize` (padrão `true`) no `Component`.** Só adiciona a classe `op-stable`; quem sabe ter estados que crescem reserva o espaço **em CSS** (Button: duas faces na mesma célula do grid; Field: linha de erro; SuggestField: padding do spinner). Sem medição em JS. Efeito colateral aceito: com o padrão, todo campo reserva uma linha de erro, e o botão fica tão largo quanto sua face de loading (`textContent` do botão inclui a face oculta; leia `.op-button__text`).

21. **Navegação do dev (`dev/nav.ts`).** `scripts/dev.mjs` gera `.dev/pages.json` (lido das pastas `sandbox/` e `demos/`) e o índice em `/dev/`; o frame (breadcrumb + "Go to…" + atalhos `g i` / Alt+↑) é compartilhado por sandboxes, demos e índice. Os demos recebem o frame por um entry gerado (`.dev/_entry/<demo>.ts`), então o código do demo continua só com a API pública (teste em `scripts/pages.test.mjs`). `?theme=dark%20compact` força o tema (útil para screenshots). Para o esbuild não descartar os imports "só de efeito" do wrapper, o `scripts/dev.mjs` usa `ignoreAnnotations: true` (o dev não precisa de tree-shaking); antes isso era feito listando `dev/`, `demos/` e `.dev/` no `sideEffects`, caminhos que nem existem no pacote publicado.
22. **`iconEl` avisa no console** quando o ícone não está registrado (antes ficava um espaço vazio silencioso).

23. **Filtro do Store é uma árvore.** `Store.filter` aceita `FilterNode = FilterSpec | { op: 'and'|'or', filters }` (o topo continua AND, então `filter([...])` antigo funciona igual) e devolve uma `Promise` que resolve depois do reload (remoto) ou na hora (local). `matchFilter` é exportado para quem quiser avaliar um filtro fora do Store. Operadores: eq, ne, contains, notContains, startsWith, endsWith, gt, ge, lt, le, between, notBetween, in, nin, empty, notEmpty. Datas (`Date` ou string ISO) comparam por instante, por isso o `FilterBuilder` só precisa produzir ISO.
24. **Seleção em lote mora no Grid** (coluna `__select`/`__actions` internas, barra `op-grid__bar`, menu de colunas): só o Grid as usa, então não viram componentes (princípio 3). Os controles de linha são `<input type=checkbox>` nativos, não `Checkbox`, para não instanciar um componente por linha virtualizada. As linhas do pool reconstroem as células quando as colunas mudam (`cv`).
25. **`SearchGrid` e `LookupField` partilham uma `LookupDef`**, registrável por nome (`registerLookup`). `store` como função dá um Store por instância; o `LookupField` usa um Store à parte para as sugestões digitadas e outro dentro da janela. `Field.clear()` (valor vazio + `change`) entrou no core porque o SearchGrid precisa limpar campos de qualquer tipo.
26. **Intervalos de data são `{ start, end }`** (Calendar `range: true` e DateRangeField); `end` é `null` entre os dois cliques. A ficha inicial dizia `{ from, to }`; mudou para casar com o `between` (`[start, end]`).
27. **Orçamento de tamanho por entrada é "sozinha, com dependências"**: compostos (Grid, FilterBuilder, SearchGrid, LookupField) pagam Button/Menu/Dropdown/Window. Se isso pesar, o caminho é carregar o menu de colunas e o menu de linha sob demanda (`import()`); não feito agora.

28. **Visões salvas são JSON + um adaptador de armazenamento.** O `ViewManager` não sabe onde guarda: recebe `ViewStorage { list, save, remove }`. Nos demos é `localStorage`; em produção, `restViewStorage` ou código do app. O estado (`ViewState`) usa só tipos já públicos (`ColumnState`, `FilterGroup`, `Sorter`), então o servidor pode guardá-lo como blob. Estado extra da interface entra por `extra: { get, set }` em vez de a lib adivinhar o que lembrar.

29. **`CommandPalette` escuta o `document` (capture) desde o construtor**, não desde a primeira renderização: o atalho precisa funcionar sem o app tocar em `.el`. O comando roda **depois** de a paleta fechar e devolver o foco (senão uma janela modal aberta pelo comando nasceria com a página inerte). Submenus são dados (`children`), não retorno do handler, para a paleta saber antes de fechar.
30. **`Chat` não usa `innerHTML` nunca.** O texto vira nós (`**`, `*`, `` ` ``, quebras); qualquer outra coisa fica texto. Conteúdo rico é opt-in por `renderer` (responsabilidade do app). Streaming (`appendToMessage`) redesenha só o nó de texto da bolha; `setBusy` põe `aria-busy` no log para leitores de tela esperarem a resposta completa. Sem virtualização: conversas muito longas devem ser paginadas pelo app.

31. **`Widget` estende `Panel`, mas `toggle()` continua sendo o recolher do Panel**; abrir/fechar é `setOpen()`/`open()`/`close()`. Flutuante por padrão (camada global, sem inércia na página, sem foco preso, Esc só com o foco dentro); o lado é uma classe CSS (`op-widget--right`...) e a animação é só CSS (`--_from` por lado), então trocar o lado em runtime não mede nada.

32. **Responsividade é do layout e é medida no container.** `watchNarrow` (ResizeObserver no corpo do container, não `matchMedia` da janela) põe `is-narrow` e emite `narrow-change`; o CSS reage à classe. Assim o mesmo layout funciona num painel pequeno ou numa tela de celular. O `border` vira "um centro + drawers" (padrão 768 px), o `grid` numérico colapsa para 1 coluna (480 px) e o `hbox` pode empilhar (`stackBelow`). O app só decide *quando* abrir um drawer (`openRegion`/`closeRegion`) e mostra/oculta o que for só-mobile por CSS (`.op-layout-border.is-narrow .meu-botao`). Também: Toolbar quebra linha, Window respeita `dvh`, abas rolam na horizontal.
33. **Orçamento do core** está em 9,6 de 10 kB; o próximo recurso de núcleo precisa de poda antes.

34. **Telas de lista por definição.** O demo `erp` descreve cada módulo uma vez (`Col`: tipo, opções, tom do status, lookup) e daí saem as colunas do grid, os campos do `FilterBuilder`, o formulário do registro e as ações em lote. A fonte da verdade são os arrays em memória; depois de gravar, o store recarrega (`loadData` no local, `load()` no remoto). Serve de teste de que a lib dispensa um "gerador de CRUD" próprio: é composição.
35. **Navegação por abas + árvore.** Abrir algo é sempre `openPage(id)`/`openRecord`: se a aba existe, ativa; senão cria. Quem sincroniza o resto (item ativo do `NavMenu`, breadcrumb, título do documento) é o evento `change` do `Tabs`, não cada chamador.

36. **Guarda-corpos de layout (o frame impede, o app não precisa lembrar).** (a) filhos de `vbox` não encolhem (`flex-shrink: 0`): quem quer crescer/encolher declara `flex`; (b) `vbox` rola por dentro quando o conteúdo é maior que a coluna, em vez de vazar por cima do vizinho; (c) itens de `Toolbar` não encolhem nem quebram o texto, e a barra quebra de linha; (d) `hbox` com `stackBelow` empilha com altura natural (`flex: 0 0 auto !important`); (e) `grid` numérico vira 1 coluna; (f) `border` vira drawers. A causa do bug do dashboard no celular era o conjunto `min-height: 0` + encolhimento padrão do flexbox: a coluna espremia os cartões em vez de rolar.

37. **"Mostrar o campo inválido" é responsabilidade do pai que escolhe um filho por vez.** `Form.reveal(field)` sobe pela árvore e pede a cada ancestral que mostre o ramo (`setActive` do Tabs ou `layout.activate` de um card), então abas e etapas usam o mesmo caminho e o Form não conhece nenhum dos dois. O `StepForm` é um Form cujo corpo é um layout `card`: `Next` valida só os campos da etapa, `Finish` é o `submit()` do Form (valida tudo e, se falhar, o `reveal` leva à etapa certa), e `Enter` num campo chama o mesmo `submit()`, que nas etapas anteriores vira `next()`.

38. **Segredo salvo nunca volta ao navegador.** O `SecretField` não recebe o valor salvo, só o *fato* de existir (`stored`, ou `true` no `form.load`). O valor é `null` (intacto), texto (novo) ou `''` (limpar): o app só envia o que mudou. Substituir exige um aviso modal (`MessageBox`), e o texto digitado nunca passa por `getDisplayText` (resumos, revisão do wizard).
39. **Orçamento do core subiu para 11 kB** (estava em 10; as mensagens `en`/`pt-BR` de todos os componentes moram em `core/i18n`). Próximo passo natural: cada componente registrar as próprias mensagens (`addMessages`), para elas entrarem só no bundle de quem usa. `data` 5,25 e `messagebox` 9 kB.

40. **Motion é um módulo com uma configuração global e funções puras sobre a Web Animations API.** `motion.get/set/enable/disable/reset` (um objeto, defaults = números das 20 regras, interruptor global, `prefers-reduced-motion` respeitado) escreve tokens CSS na raiz (`--op-motion-*`, neutros quando desligado) e uma classe `op-motion-off`; o que é CSS (escala ao pressionar, "hold") lê os tokens, o que é JS (`popIn/popOut/stagger/pulse/arc/swap/reveal/layoutId`) lê `motion.get()`. Sem `Element.animate` ou com motion desligado tudo devolve `null`: a lógica dos componentes nunca espera a animação (o Dropdown esconde na hora, ou quando a saída termina, e reabrir cancela a saída pendente). Curvas com overshoot são recusadas por padrão (`isBouncy`), a duração do dropdown é limitada a 150–250 ms, a saída dura `exitRatio` (0,8) da entrada. O setup dos testes desliga o motion.
41. **O `Slider` é um Field comum** (valor, dirty, reset, Form) com bolinhas `role=slider`; o estiramento da bolinha (regra 5) e a ausência de transição durante o arrasto (regra 14) vêm de `knobStretch` do módulo de motion, então `motion.disable()` o deixa estático.

### Lacunas de API achadas pelos demos (e corrigidas no core)

- **Trocar o tema do documento inteiro** exigia `setAttribute` manual → `setTheme(names, el?)`.
- **Oferecer um tema `defineTheme` num seletor sem ativá-lo** → `Theme.inject()` separado de `apply()`.
- **Fonte do tema não chegava em Grid/Table/Pagination** (apareciam em serifa) → regra de fonte de baixa especificidade para todo elemento `op-*`.
- **Linhas do Grid sem posicionamento** (só o CSS padrão do virtualizador as posicionava) → `virtualize` posiciona as linhas inline, qualquer que seja a classe.
- **`Field.build` ignorava `baseCls`** e perdia a classe do componente (`op-textfield`): campos sem borda. Corrigido; teste de classe raiz adicionado.
- **`Grid.getSelection()` devolve `Model<Record>`**, então com `Store<T>` tipado o `store.remove(sel)` não compila: o demo usa `Store<any>`. Pendente: tipar `Grid<T>`.
- **Sidebar/NavMenu (P1)** não existe: o demo admin monta a navegação com botões `ghost` num container `vbox`.
- **Bundle custom** (`defineBundle`/`use`) é Fase 9: o demo usa uma função `installBundle()` simples.

42. **Docs vivas e MCP leem a mesma fonte.** `docs/components/*.md` + `site/examples.json` → `scripts/docs-data.mjs` → site (`npm run site`) e servidor MCP stdio (`npm run mcp`). Exemplos em JSON puro (com `$store`/`$tpl`) para que o MCP os sirva sem executar TypeScript; teste exige exemplo para toda ficha. Descartado: gerar o site estático (a ideia é a doc viva, ao lado do código) e usar o SDK do MCP (dependência; o protocolo stdio cabe em ~100 linhas).
43. **Escrita enxuta em três níveis.** `create({type})` (declarativo/JSON), classes e `ui.*` (atalhos que devolvem instâncias; `(name, label, cfg?)`). Enums são objetos `as const` + tipo homônimo: o valor é a string, então nada quebra e strings continuam válidas. Nomes que colidiam com tipos existentes ficaram `LayoutKind` e `ThemeName`. Módulo `src/ui/` fora do core (entrada `optikos/ui`). Descartado: `const enum` (não funciona com `isolatedModules`), proxies/Proxy para gerar atalhos (caro e sem tipos), um atalho por componente (só os usados com frequência).
44. **Debounce em todo campo: `debounce` + `settled`.** `Field` ganha `debounce` (ms) e o evento `settled(value)`, que dispara depois do silêncio (ou junto do `change` sem `debounce`) e antes, na hora, ao perder o foco, no Enter e ao soltar o slider. `change` nunca é adiado, para não mexer em validação, dirty e `commit`. Descartado: atrasar o próprio `change` (muda o contrato do evento) e debounce só em TextField/Slider (a regra vale para todos). SuggestField mantém `delay` (debounce da consulta).
45. **Publicação só por tag.** O workflow `release.yml` roda num push de tag `v*.*.*`: publica no npm (`npm run release -- --dry-run=false`, com provenance; trusted publishing por OIDC, com `NPM_TOKEN` como alternativa) e, se deu certo, publica o site de docs no GitHub Pages. O `scripts/release.mjs` recusa publicar se o commit não tem a tag `v<versão do package.json>` ou se a árvore está suja, então nem localmente se publica sem tag. Rodar o workflow à mão só republica o site. Descartado: publicar a cada push na `main` (versão viraria efeito colateral de merge) e `semantic-release` (dependência e convenção de commit).
46. **Site estático = o mesmo código do site de dev.** O site acha seus arquivos (`site.json`, temas) ao lado do `optikos.css` que a página carregou (`assetBase()` em `dev/themes.ts`): `/.dev/` no servidor, `./` no build estático. Assim funciona sob qualquer caminho base, sem `define` de build. Descartado: publicar também sandboxes e demos (dependem do servidor de dev e da moldura de navegação; os links apontam para o código no GitHub).
47. **Cada componente traz as próprias mensagens (`addMessages`).** O `core/i18n` ficou só com as chaves partilhadas (validação, `close`, `cancel`, `search`...); as ~107 chaves exclusivas foram para o arquivo do componente (`addMessages('en', …)` / `addMessages('pt-BR', …)` no topo do módulo, chaves já existentes não são sobrescritas, então o override do app vence). 4 chaves mortas saíram (`notInList`, `stepOf`, `sortAsc`, `sortDesc`). Medido (gzip): core 10,27 → 8,11 kB, data 5,02 → 3,84 kB, runtime mínimo 3,30 → 2,12 kB, e o total isolado de cada componente caiu ~0,5 kB (ex.: grid 21,1 → 20,6; lookupfield 28,7 → 28,2). Limites: core 11 → 9 kB e data 5,25 → 4,25 kB (novo patamar + ~10%). Como o orçamento de componente mede o que ele soma sobre o runtime mínimo e o runtime encolheu 1,18 kB, as mensagens que antes eram "grátis" passaram a contar para o dono: os 8 que estouraram por isso subiram 1 kB cada (grid 19, searchgrid 20, filterbuilder 15, viewmanager 15, lookupfield 27, stepform 11, widget 9,5, breadcrumb 8), o que ainda **aperta** o total permitido deles em 0,18 kB; os demais ficaram iguais (apertam 1,18 kB). Descartado agora: carregar o menu de linha do Grid com `import()` (decisão 27). Ganho de ~3 kB só no primeiro carregamento, ao custo de a primeira abertura esperar rede, testes assíncronos e de a medição sem divisão de código embutir o `import()` de qualquer jeito; reavaliar quando o Grid ganhar plugins.
48. **Testes em navegador real ao lado do happy-dom.** `npm run test:browser` (Vitest browser mode + Playwright/Chromium, só dev deps) roda os `*.browser.test.ts`: foco preso e Tab de verdade no Window, teclado real em Menu/Tabs/ComboBox/Select, `border` medido por ResizeObserver real virando drawers, virtualização do Grid com altura de linha medida do token, arrasto do Widget. O setup injeta o CSS na mesma ordem do `buildCss`, com todos os temas. Fica **fora** do `npm run check` (precisa de um Chromium instalado) e roda num job próprio do CI. Descartado: trocar o happy-dom pelo navegador em tudo (10× mais lento e exige navegador em qualquer máquina) e screenshots comparados pixel a pixel (frágeis entre fontes e sistemas; as asserções medem caixas e foco).
49. **Acessibilidade verificada por máquina, em todos os temas.** `site/a11y.browser.test.ts` roda o axe-core (dev dep) em todo exemplo do site, no navegador real com o CSS real, em 10 combinações de tema (`light`, `dark`, `dark compact`, `corporate`, `soft`, `brutal`, `terminal`, `editorial`, `brand`, `brand night`): 520 casos. Regras de página inteira (um `h1`, landmarks, título) ficam de fora porque um componente aparece sozinho. Exceção única, comentada no teste: `scrollable-region-focusable` no viewport do Grid, que não é parada de Tab de propósito (o `role=grid` focável move a linha ativa e rola). O que a primeira rodada achou e foi corrigido: (a) o Grid punha `role=grid` na raiz, que também contém a barra de lote e a paginação (`nav`), e grid só pode ter linhas: agora a raiz é a moldura e um `.op-grid__table` interno é o `role=grid` focável com `aria-activedescendant` e contagens (os testes leem `[role=grid]`); (b) Button em loading ficava sem nome (a face de loading tinha `aria-hidden`): agora só o spinner é decorativo, e o botão ganha `aria-disabled` porque ignora cliques; (c) Stepper no celular escondia o texto dos passos com `display: none` (botões sem nome): agora esconde só visualmente; (d) DateField/DateRangeField usavam `aria-expanded` num textbox: viraram o combobox do padrão "date picker" do APG; (e) Dropdown `role=dialog` sem nome passa a ser nomeado pela âncora; (f) contraste: `fg-muted` do tema claro (#64748b → #5e6b80), primário do `dark` (blue-500 → blue-400), hora da bolha do Chat sem opacidade, e tokens de `brand`/`brand night`/`soft`/`brutal` (texto em ouro, violeta, rosa e amarelo) ajustados para 4,5:1, com cor sólida sob os gradientes dos botões. Limite: `daterangefield` 9,5 → 10 kB (as mensagens do calendário passaram a contar para ele na decisão 47, mais o nome automático do Dropdown).
50. **Desempenho medido no navegador real (`npm run bench`).** `scripts/bench.mjs` empacota `scripts/bench.ts` com esbuild e roda no Chromium via Playwright (sem dependência nova): Store com 100 mil registros (carregar, ordenar, filtrar), Grid sobre 100 mil linhas (montar, rolar), Form com 1000 campos (criar, validar). Mediana de 7 rodadas; os números ficam em `docs/performance.md` com data e máquina. Não roda no CI (máquinas compartilhadas oscilam demais para reprovar build). A primeira rodada achou um defeito real: `localeCompare(b, undefined, { numeric: true })` cria um collator por comparação, e ordenar 100 mil textos levava 5,4 s; um `Intl.Collator` único, criado no primeiro uso, deixou em 0,41 s (13×) com a mesma ordem.
51. **`Grid<T>` genérico, com padrão `any`.** `Grid`, `GridConfig`, `GridAction`, `GridRowAction` e `Column` recebem o tipo do registro; `new Grid({ store })` o infere de um `Store<T>` tipado, e daí `getSelection()`, `getStore()`, as ações em lote e por linha e os `renderer` saem como `Model<T>`. `Column.field` sugere as chaves de `T` e ainda aceita qualquer texto (`Extract<keyof T, string> | (string & {})`). O padrão é `any`, e não `Record<string, any>`, porque o `Store<T>` é invariante (os filtros-função recebem `Model<T>`): com o padrão estreito, `create<Grid>(...)` seguido de `setStore(storeTipado)` deixaria de compilar. Com `create()` a config é solta (declarativa) e nada muda; para tipar, use `new Grid({...})` ou `create<Grid<Pedido>>`. Os `Store<any>` das demos saíram, menos no `erp/pages.ts`, em que as telas são geradas de uma definição e o registro é dinâmico de verdade. Teste de tipos com `expectTypeOf` em `data.test.ts`.
