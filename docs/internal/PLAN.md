# Plano de implementação — Optikos

Análise inicial e roteiro. Cada fase tem uma entrega concreta e só começa quando a
anterior foi validada.

---

## Visão geral da arquitetura

```ts
import { create } from 'optikos';

create({
  type: 'window',
  title: 'Cliente',
  layout: 'vbox',
  items: [
    { type: 'textfield', name: 'name', label: 'Nome', required: true },
    { type: 'suggestfield', name: 'city', label: 'Cidade', store: cities },
    { type: 'grid', store: orders, columns: [{ field: 'id' }, { field: 'total', format: 'money' }] },
  ],
  buttons: [{ text: 'Salvar', handler: save }],
}).show();
```

Peças do núcleo:

| Peça | Papel |
|---|---|
| `Component` | Classe base: config, `el`, lifecycle (`render → mount → destroy`), eventos, tema |
| `Container` | Component que tem `items` filhos e um `layout` |
| `registry` | Mapeia `type` → classe. `create(config)` monta a árvore |
| `Emitter` | Eventos simples (`on`, `off`, `emit`), base de tudo |
| `Layout` | Estratégia de posicionamento, quase toda em CSS (flex/grid) |
| `Field` | Base de campos: `value`, validação, `dirty`, `disabled`, `readonly` |
| `Store` / `Model` | Dados para grid, combo, tree: ordenar, filtrar, paginar, carregar via proxy |
| `Theme` | Tokens globais + overrides por componente |

---

## Fase 0 — Fundação do repositório

**Entrega:** repositório que builda, testa e serve sandboxes com um comando.

- Padrões: licença MIT, npm, alvo ES2022 em navegadores atuais (sem polyfills), nome
  `optikos` (provisório até checar no NPM), i18n por objeto de locale com `en` e `pt-BR`.
- **Ícones:** o Optikos não traz nenhum. O usuário usa a lib de ícones que quiser. A config
  `icon` aceita uma classe CSS (fontes de ícone), um elemento/string SVG ou um nome resolvido
  por `setIconResolver(name => Element)`, que o usuário configura uma vez.
- `git init`, `.gitignore`, `package.json` (ESM, `exports`, `sideEffects` só para CSS).
- TypeScript estrito, saída `.js` + `.d.ts`.
- Bundler: **esbuild** (rápido, um binário, faz build e dev server). Sem Vite/Webpack.
- Testes: **vitest + happy-dom**.
- Medição de tamanho (gzip) por entry no build.
- `kai.yml` com os comandos de dev (ver abaixo), espelhados em `package.json`.

Comandos previstos no `kai.yml`:

| Comando | Faz |
|---|---|
| `dev` | dev server com sandboxes e demos, rebuild automático |
| `sandbox <categoria>` | abre a sandbox de uma categoria |
| `demo <nome>` | sobe um demo app |
| `build` | build da lib (`dist/`) + relatório de tamanho |
| `test` | testes |
| `check` | typecheck + testes + tamanho |
| `new:component <categoria> <nome>` | gera ficha, `.ts`, `.css`, teste e caso de sandbox |
| `release` | build + `npm publish` (fase 9) |

**Como escrever o `kai.yml`** (resumo do manifesto oficial; a referência completa está em
`assets/manifesto/kai-manifesto.md` no repo do kai, e os ícones válidos em `assets/manifesto/kai-icons.md`):

- O kai lê um **subconjunto de YAML**. Indentação de 2 espaços, sem tabs. Toda string entre aspas
  duplas, inclusive valores que parecem número (`PORT: "8080"`, `default: "3"`). Números e flags
  ficam sem aspas (`is_background: true`, `order: 1`). Texto de várias linhas usa `|`. Comentários
  só em linha própria. Sem anchors/aliases/tags.
- Chaves de topo: `project_name`, `icon`, `cli_path`, `cli_description`, `env_vars`, `commands`, `folders`.
  Nunca escreva `id`, `folder_id` nem `kai_export`.
- Cada comando tem `name`, `type: "command"` e `command`. Use `folder` para agrupar
  (Dev, Sandbox, Demos, Build, Tests, Generate, Release), `cli_path` para expor no terminal
  (`kai optikos sandbox open fields`), `is_background: true` + `open_last_link: true` para servidores,
  e `params` para entradas.
- Sandboxes e demos são descobertos sozinhos com `type: "select"` + `options_script: "ls sandbox"`
  (ou `"ls demos"`). Não use lista fixa.
- Os comandos do `kai.yml` só chamam scripts do `package.json`; a lógica nunca fica duplicada no yml.
- `Release` exige confirmação: use um parâmetro `bool` de dry-run com default `"true"`.
- Valide com `kai validate kai.yml` antes de entregar.

---

## Fase 1 — Coleta de componentes

**Entrega:** `docs/catalog.md` com todos os componentes, categoria e prioridade.

Prioridade: **P0** = necessário para o primeiro demo; **P1** = completa a lib; **P2** = depois.

| Categoria | Componentes |
|---|---|
| **Base** | Button (P0), SplitButton (P1), Icon (P0, só renderiza o ícone fornecido pelo usuário), Label (P0), Link (P1), Badge (P1), Avatar (P2), Chip (P1) |
| **Layout / Containers** | Panel (P0), Container (P0), Viewport (P0), Card (P1), FieldSet (P0), Splitter (P1), Accordion (P1), Toolbar (P0), Spacer (P0) |
| **Campos** | TextField (P0), TextArea (P0), NumberField (P0), PasswordField (P1), DateField (P0), TimeField (P1), DateTimeField (P1), **DateRangeField** (P1 ✔ feito), Checkbox (P0), CheckboxGroup (P1), Radio/RadioGroup (P0), Toggle (P1), Select (P0), ComboBox (P0), **SuggestField** (P0), TagField (P1), MaskField (P1), CurrencyField (P1), FileField (P1), ColorField (P2), Slider (P2), Rating (P2), HtmlEditor (P2) |
| **Formulário** | Form (P0), validadores (P0), FieldContainer (P1), binding de dados (P1), **Form em abas** (P1), **StepForm** (P1) e Stepper (P1) para cadastros complexos |
| **Dados** | **Grid** (P0: ordenar, selecionar, paginar; P1: gestão de colunas com busca, coluna de checkbox com ação em lote, filtros dinâmicos, edição inline, colunas fixas/redimensionáveis, agrupamento; P2: pivot), **FilterBuilder** (P1 ✔ feito), **SearchGrid** e **LookupField** (P1 ✔ feitos), Table simples (P0), List/DataView (P1), Tree (P1), TreeGrid (P2), Pagination (P0), PropertyGrid (P2) |
| **Overlays** | **Modal/Window** (P0), Dialog/MessageBox (alert, confirm, prompt) (P0), Tooltip (P0), Popover (P1), Menu (P0), ContextMenu (P1), Toast/Notification (P0), Drawer (P1), Dropdown base (P0, usado por Select/Combo/Menu), **CommandPalette** (P1 ✔ feito, Ctrl/⌘+K) |
| **Navegação** | Tabs (P0), Breadcrumb (P0, usado pelo frame das sandboxes e demos), Sidebar/NavMenu (P1), Stepper/Wizard (P1, subiu: ver StepForm abaixo), Router simples de telas (P2) |
| **Chat** | **Chat** (P1 ✔ feito: bolhas, status, "digitando", streaming, sugestões; base para app de mensagens ou modo IA) |
| **Feedback** | Spinner/LoadMask (P0), ProgressBar (P1), Skeleton (P2), Alert/Banner (P1), EmptyState (P2) |
| **Datas** | Calendar/DatePicker (P0, usado pelo DateField), seleção de intervalo no Calendar (P1, usada pelo DateRangeField), Scheduler (P2) |
| **Gráficos** | (P2, avaliar se entra no core ou vira bundle separado) |

Também nesta fase: listar as **peças compartilhadas** que aparecem em vários componentes
(posicionamento de dropdown, foco preso em modal, navegação por teclado em listas,
virtualização) — viram utilitários do core.

---

## Fase 2 — Ficha de componente ("pensar um componente")

**Entrega:** modelo de ficha + fichas dos P0 em `docs/components/`.

Modelo:

```md
# <Nome>  (type: '<type>')
Propósito:     uma frase
Anatomia:      partes do DOM e classes (op-x, op-x__part)
Config:        props + defaults
API:           métodos públicos
Eventos:       nome, payload, se é cancelável (before-*)
Estados:       disabled, focus, invalid, loading...
Teclado/ARIA:  teclas e roles
Tokens:        --op-<x>-* próprios
Casos sandbox: lista do que demonstrar
Fora do escopo: o que não vamos fazer
```

Ordem das fichas: Button → TextField → Field base → Form → Panel/Window → Dropdown base →
ComboBox → SuggestField → Grid. Essa ordem obriga o core a ser pensado de baixo para cima.

---

## Fase 3 — Estudo de design patterns

**Entrega:** `docs/architecture.md` com cada decisão, o motivo e o que foi descartado.

| Pattern | Onde aplicar |
|---|---|
| **Composite** | Container/items: a tela é uma árvore de componentes |
| **Factory + Registry** | `create({ type })`; o usuário registra tipos próprios |
| **Observer** | Emitter de eventos em Component e Store |
| **Template Method** | Lifecycle: subclasses sobrescrevem `render`, `onMount`, `onDestroy` |
| **Strategy** | Layouts, validadores, formatadores e renderers de célula |
| **Proxy (dados)** | Store carrega de memória, REST ou função; mesma interface |
| **Plugin** | Recursos opcionais do Grid (edição, agrupamento) sem inchar a base |
| **Flyweight / Virtualização** | Linhas do Grid e listas longas |
| **Command** | Ações reutilizáveis (botão, menu, atalho apontando para a mesma ação) |

Decididas:

- **Classes TS** para componentes.
- **Sem Web Components como base** (o Shadow DOM atrapalha o tema global). Um wrapper
  opcional pode ser avaliado depois.
- Testes com **vitest + happy-dom**.
- **Reatividade: setters como base + `bind` opcional.**
  - Componentes só conhecem setters, que atualizam o DOM de forma pontual. O core não tem signals.
  - Regra: todo config público mutável tem um setter correspondente (`text` → `setText`,
    `disabled` → `setDisabled`). É isso que permite o `bind` funcionar em qualquer componente,
    inclusive nos custom.
  - Módulo separado `optikos/bind` (P1, < 1 kB): `signal`, `computed`, `effect`.
    `bind: { text: fonte }` vira `effect(() => cmp.setText(fonte()))`, descartado
    automaticamente no `destroy`. Two-way só em campos (`value`).
  - O `Store` expõe a mesma interface observável, então grid e combo podem usar `bind`.

Em aberto:

- Binding de formulário com dados (`form.load(record)` / `form.getValues()`).

---

## Fase 4 — Core engine

**Entrega:** `src/core`, `src/layout`, `src/data` testados, com Button, TextField,
Panel e Form como prova.

- Emitter → Component → Container → registry/`create` → layouts (fit, hbox, vbox, border, card, grid).
- Field base + validação + Form.
- Store/Model/Proxy em memória e REST.
- Utilitários: posicionamento de flutuantes, focus trap, roving tabindex, virtual list.
- Meta inicial de tamanho: core < 8 kB gzip (revisar depois de medir).

---

## Fase 5 — Sistema de temas

**Entrega:** `src/themes/` com tema base, claro, escuro e um tema "compacto"; docs de tematização.

Três níveis, todos acabam virando CSS custom properties:

1. **Global:** tokens em `:root` (cores, tipografia, espaçamento, raio, sombra, densidade).
2. **Por escopo:** `[data-op-theme="dark"]` em qualquer elemento muda tudo dentro dele.
3. **Por componente:** tokens próprios (`--op-button-radius`) ou a config `theme` no componente
   (`{ type: 'button', theme: { radius: '0' } }` → vira variáveis inline no `el`).

Formatos de tema aceitos (os dois, como pedido):

- **Arquivo CSS:** sobrescreve tokens e, se quiser, classes. Zero JS.
- **Tema proprietário (TS/JSON):** `defineTheme({ color: { primary: '#06f' }, button: { radius: 0 } })`,
  com tipagem e autocompletar; gera o mesmo CSS (em runtime ou no build via comando kai).

Tokens em duas camadas: **primitivos** (`--op-blue-500`) → **semânticos**
(`--op-color-primary`) → **de componente** (`--op-button-bg: var(--op-color-primary)`).
Todo CSS fica em `@layer optikos`.

---

## Fase 6 — Sandboxes

**Entrega:** uma página por categoria em `sandbox/<categoria>/`, servidas pelo `dev`.

- Cada página mostra todos os casos da ficha: estados, tamanhos, eventos (com log na tela).
- Barra fixa com troca de tema (claro/escuro/compacto/custom) e densidade.
- Serve como teste visual manual e como base para testes de screenshot no futuro.

---

## Fase 7 — Componentes P0

**Entrega:** todos os P0 do catálogo, cada um passando o checklist do `AGENTS.md`.

Ciclo por componente: ficha → implementação → CSS por tokens → sandbox → testes → tamanho.
O Grid recebe uma sub-fase própria (render, ordenação, seleção, paginação, virtualização).

---

## Fase 8 — Demo apps

**Entrega:** três apps em `demos/`, cada um usando só a API pública.

| Demo | Exercita |
|---|---|
| **CRM** (cadastro de clientes) | Form completo, SuggestField, Grid com filtro e paginação, Modal de edição |
| **Admin dashboard** | Viewport com layout border, Sidebar, Tabs, Toasts, tema escuro |
| **Customização** | Componente custom, bundle custom, tema proprietário e tema via CSS |

Os demos revelam lacunas na API; cada lacuna volta para o core antes de seguir.

---

## Fase 9 — P1/P2, extensibilidade e publicação

- Componentes P1, depois P2.
- **Bundles custom:** `defineBundle({ components, theme })` + `use(bundle)` para o usuário
  empacotar e distribuir componentes próprios.
- Docs públicas (podem ser um demo construído com o próprio Optikos).
- Publicação no NPM: `exports` por componente, `.d.ts`, CSS separado e completo,
  CHANGELOG e versionamento semântico.

---

## Próximos passos imediatos

1. Validar este plano e as propostas da Fase 3 (classes, sem Web Components, setters explícitos).
2. Fase 0: montar o repositório e o `kai.yml` (depois de ver o formato do manifesto do kai).
3. Fase 1: fechar o catálogo e as prioridades.
