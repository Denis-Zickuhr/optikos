# Catálogo de componentes

Prioridade: **P0** = necessário para os demos; **P1** = completa a lib; **P2** = depois.

## Base

| Componente | `type` | Prio |
|---|---|---|
| Button | `button` | P0 |
| Icon | `icon` | P0 |
| Label | `label` | P0 |
| SplitButton | `splitbutton` | P1 |
| Link | `link` | P1 |
| Badge | `badge` | P1 |
| Chip | `chip` | P1 |
| Avatar | `avatar` | P2 |

## Layout / Containers

| Componente | `type` | Prio |
|---|---|---|
| Container | `container` | P0 |
| Panel | `panel` | P0 |
| Viewport | `viewport` | P0 |
| FieldSet | `fieldset` | P0 |
| Toolbar | `toolbar` | P0 |
| Spacer | `spacer` | P0 |
| Card (layout `card`) | — | P0 (layout) |
| Splitter | `splitter` | P1 |
| Accordion | `accordion` | P1 |

Layouts: `fit`, `hbox`, `vbox`, `border`, `grid`, `card` (todos P0 no core).

## Campos

| Componente | `type` | Prio |
|---|---|---|
| TextField | `textfield` | P0 |
| TextArea | `textarea` | P0 |
| NumberField | `numberfield` | P0 |
| DateField | `datefield` | P0 |
| Checkbox | `checkbox` | P0 |
| Radio / RadioGroup | `radio`, `radiogroup` | P0 |
| Select | `select` | P0 |
| ComboBox | `combobox` | P0 |
| SuggestField | `suggestfield` | P0 |
| PasswordField | `passwordfield` | P1 |
| TimeField, DateTimeField | `timefield`, `datetimefield` | P1 |
| DateRangeField | `daterangefield` | P1 ✔ |
| CheckboxGroup | `checkboxgroup` | P1 |
| Slider (barra com bolinha, simples ou intervalo) | `slider` | P1 ✔ |
| Toggle | `toggle` | P1 |
| TagField | `tagfield` | P1 |
| MaskField, CurrencyField | `maskfield`, `currencyfield` | P1 |
| FileField | `filefield` | P1 |
| ColorField, Slider, Rating, HtmlEditor | — | P2 |

## Formulário

| Componente | `type` | Prio |
|---|---|---|
| Form | `form` | P0 |
| Validadores | (funções) | P0 |
| FieldContainer | `fieldcontainer` | P1 |
| Binding de dados | `form.load / getValues` | P0 (decisão na ficha) |
| Form em abas (`Form` com `tabs`) | `form` + `tabs` | P1 ✔ |
| StepForm (formulário em etapas) | `stepform` | P1 ✔ |

## Dados

| Componente | `type` | Prio |
|---|---|---|
| Grid | `grid` | P0 (ordenar, selecionar, paginar, virtualizar) |
| Table | `table` | P0 |
| Pagination | `pagination` | P0 |
| Grid P1 | ✔ gestão de colunas (menu com busca), ✔ coluna de seleção (checkbox) e ações em lote, ✔ reordenar e redimensionar colunas, ✔ edição inline (plugin `cellEditing()`); falta: colunas fixas, agrupamento | P1 |
| FilterBuilder | `filterbuilder` | P1 ✔ |
| SearchGrid | `searchgrid` | P1 ✔ |
| ViewManager (visões salvas de colunas/filtros/ordenação) | `viewmanager` | P1 ✔ |
| LookupField (campo + janela de pesquisa com grid) | `lookupfield` | P1 ✔ |
| DataView (grade de cartões de um Store) | `dataview` | P1 ✔ |
| Tree | `tree` | P1 ✔ |
| TreeGrid, PropertyGrid, pivot | — | P2 |

Dados (não visuais): Store, Model, Proxy (memória, função, REST) — P0 no core.

## Overlays

| Componente | `type` | Prio |
|---|---|---|
| Dropdown (base) | `dropdown` | P0 |
| Window (modal) | `window` | P0 |
| MessageBox (alert, confirm, prompt) | função `MessageBox` | P0 |
| Tooltip | `tooltip` / config `tooltip` | P0 |
| Menu | `menu` | P0 |
| Toast | função `toast()` | P0 |
| CommandPalette (Ctrl/⌘+K) | `commandpalette` | P1 ✔ |
| Widget (painel flutuante preso a uma borda) | `widget` | P1 ✔ |
| ContextMenu, Popover, Drawer (modal) | — | P1 |

## Navegação

| Componente | `type` | Prio |
|---|---|---|
| Tabs | `tabs` | P0 |
| Breadcrumb | `breadcrumb` | P0 (promovido: o frame das sandboxes usa) |
| Sidebar/NavMenu | `navmenu` | P1 ✔ |
| Stepper (indicador de etapas; base do StepForm) | `stepper` | P1 ✔ |
| Router simples | — | P2 |

## Feedback

| Componente | `type` | Prio |
|---|---|---|
| LoadMask (+ Spinner) | `loadmask` / `cmp.mask()` | P0 |
| ProgressBar | `progress` | P1 |
| Alert / Banner | `alert` | P1 |
| Skeleton, EmptyState | — | P2 |

## Chat

| Componente | `type` | Prio |
|---|---|---|
| Chat (conversa + composer + streaming) | `chat` | P1 ✔ |

## Datas

| Componente | `type` | Prio |
|---|---|---|
| Calendar (DatePicker) | `calendar` | P0 |
| Calendar `range: true` (intervalo) | `calendar` | P1 ✔ |
| Scheduler | — | P2 |

## Gráficos (P2)

Decisão: **fora do core**. Se vier, será um bundle separado (`optikos-charts`), porque o custo em kB
de um motor de gráficos quebra o pilar "Leve".

## Motion

| Peça | O que é |
|---|---|
| `optikos/motion` | engine de animação e micro-interações (20 regras de motion design), configurável e com interruptor global ✔ (`docs/pt-BR/motion.md`) |

## UI helpers

| Peça | O que é |
|---|---|
| `optikos/ui` | atalhos `ui.text(...)`, `ui.select(...)`, `ui.row(...)` e enums (`Variant`, `Op`...) ✔ (`docs/pt-BR/ui.md`) |

## Peças compartilhadas (viram core)

| Peça | Usada por | Onde |
|---|---|---|
| `Emitter` | Component, Store, Dropdown | `core/emitter.ts` |
| Fábrica DOM `h()` | todos | `core/dom.ts` |
| Camada flutuante (`layer`) | Dropdown, Window, Tooltip, Toast, Menu, LoadMask | `core/layer.ts` |
| Posicionamento de flutuantes | Dropdown, Tooltip, Menu (submenus) | `core/position.ts` |
| Focus trap | Window, MessageBox, Drawer (P1) | `core/focus.ts` |
| Roving tabindex / navegação por setas | Tabs, Toolbar, Menu, RadioGroup | `core/focus.ts` |
| `ListBox` (lista com `aria-activedescendant`) | Select, ComboBox, SuggestField (e List, P1) | `components/fields/listbox` |
| Virtualização | Grid, ListBox (listas longas), Tree (P1) | `core/virtual.ts` |
| Validadores | Field, Form | `core/validators.ts` |
| i18n por objeto de locale | validadores, Pagination, MessageBox, Calendar | `core/i18n.ts` |
| Ícones embutidos | Button, Select, Window, Toast, Tree... | `components/base/icon` |

Regra: uma peça só entra em `core/` se pelo menos três componentes reais a usam (princípio 3).
`ListBox` e `Dropdown` ficam como componentes (não utilitários) porque o usuário também pode usá-los.
