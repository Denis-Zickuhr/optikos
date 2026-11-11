# Paridade com o Ext JS (toolkit classic)

Matriz dos recursos que apps Ext usam no dia a dia, contra a Optikos. É o roadmap da migração e o argumento de venda.
Legenda: **tem** · **parcial** · **falta** · **fora** (fora de escopo, com o motivo). Atualizada em 2026-11-10 (rodada "grid e binding").

## Grid

| Recurso Ext | Estado | Optikos / nota |
|---|---|---|
| Virtualização / buffer | tem | `core/virtual`, 100 mil linhas |
| Ordenação local e remota | tem | `Store` (`remote: true`) |
| Filtros (local/remoto, builder) | tem | `Store.filter`, `FilterBuilder`, `SearchGrid` |
| Paginação | tem | `Pagination`, `paging` |
| Seleção: linha, checkbox model | tem | `selection`, `checkboxSelection` |
| Seleção de célula (cellmodel) | falta | próximo passo; `cellAt` já existe |
| Colunas agrupadas | tem | `Column.group`, `groupHeaders` |
| Colunas travadas (locked) | tem | `Column.locked`, `setColumnLocked`; estado salvo |
| Redimensionar, reordenar, esconder; menu de colunas | tem | `resizableColumns`, `reorderableColumns`, `columnMenu` |
| Menu de coluna (ordenar/agrupar a partir do cabeçalho) | parcial | só mostrar/esconder; sem "agrupar por esta coluna" |
| Agrupamento de linhas | tem | `grouping()` (um nível) |
| Totais por grupo e geral (summary) | tem | `Column.summary`, `grouping({ summary })` |
| Vários níveis de grupo / barra de grupos | falta | próximo passo |
| Edição de célula | tem | `cellEditing()` |
| Edição de linha (rowediting) | tem | `rowEditing()` |
| Tree-grid | tem | `treeGrid()` sobre registros planos (`parentId`), carga sob demanda |
| Drag-and-drop de linhas | falta | próximo passo |
| Exportação | tem | `exportGrid` CSV e xlsx, `printGrid` |
| Estado salvo | tem | `persistState`, `ViewManager` |
| Ações por linha / em lote | tem | `rowActions`, `bulkActions` |
| Linha expansível (rowexpander) | falta | próximo passo: cabe em `setRowLayout` (linha de detalhe como `RowEntry`) |
| Colunas de ação, checkbox, número de linha | parcial | ação e checkbox têm; coluna de número de linha falta |
| Células com widgets (widgetcolumn) | parcial | `renderer` devolve Node; sem ciclo de vida de componente |
| Pivot grid | fora | próximo passo; outro produto, pesa demais para o pilar "leve" |

## Forms

| Recurso Ext | Estado | Nota |
|---|---|---|
| text, textarea, number, checkbox, radio group | tem | |
| date, time, datetime | tem | `DateField`, `TimeField`, `DateTimeField` |
| combo, tag field | parcial | `Select`, `ComboBox`, `SuggestField`, `LookupField`; `tagfield` falta |
| file field | parcial | `ImageField`; `filefield` genérico falta |
| html editor | falta | próximo passo |
| display field | parcial | `Label`, `field.setReadonly` |
| Validação | tem | `validators`, `setErrors` (servidor) |
| Máscaras | tem | `MaskField`, `NumberField format/scale` |
| fieldset / fieldcontainer | tem | `FieldSet`, `FieldGroup`, `FormSection` |
| Binding de form a record | tem | `form.load`, `bindForm` (duas vias) |

## Layouts

| Recurso Ext | Estado | Nota |
|---|---|---|
| fit, hbox, vbox, border, card | tem | |
| grid (table) | tem | `grid` layout |
| anchor, column, absolute, accordion, center | falta | próximo passo (CSS simples; `center` é um `fit` com `align`) |

## Containers e overlays

| Recurso Ext | Estado |
|---|---|
| panel, window, tabs, toolbar, menu, tooltip, MessageBox, toast | tem |
| widget flutuante, command palette, atalhos | tem (além do Ext) |

## Dados

| Recurso Ext | Estado | Nota |
|---|---|---|
| Store, Model, fields com `convert`/`default` | tem | `ModelDef.fields` |
| validators no Model | falta | validação fica nos campos |
| associations | falta | próximo passo |
| proxies ajax/rest, memory | tem | `RestProxy`, `MemoryProxy`, função |
| readers (`rootProperty`, `totalProperty`) | parcial | o proxy devolve `{ data, total }`; mapear é no proxy |
| sorters/filters remotos | tem | |
| TreeStore | parcial | decidido não ter: árvore = registros planos no mesmo `Store` (decisão 71) |
| BufferedStore | parcial | a virtualização é no DOM; paginação remota por página |
| Tempo real | tem (além do Ext) | `applyPatches`, `connect` |

## Arquitetura

| Recurso Ext | Estado | Nota |
|---|---|---|
| ViewModel: `data`, `get/set`, formulas | tem | `viewModel` (`optikos/bind`) |
| `bind: '{record.name}'`, `'{!x}'`, templates | tem | `bindVM` |
| form ↔ record em duas vias | tem | `bindForm` |
| `stores` no ViewModel | parcial | `fromStore`; não há registro de stores no VM |
| Hierarquia de ViewModels (herança pai/filho) | falta | próximo passo |
| ViewController (handlers por nome), `reference` | falta | próximo passo: classes de app (MVC próprio) cobrem o uso comum |
| ComponentQuery (`up`/`down`/`query`) | parcial | `Container.query(fn)`; sem seletor textual |
| `Ext.define`, mixins | fora | classes ES, composição; `register(type, class)` |
| Plugins | tem | `GridPlugin` |

## Outros

| Recurso Ext | Estado | Nota |
|---|---|---|
| charts | tem | `Chart`, `Stat`; frente separada |
| calendar / scheduler | parcial | `Calendar`, `Timeline` (faixas); scheduler com arrastar falta |
| D&D genérico | falta | próximo passo |
| i18n / locales | tem | `setLocale`, `addMessages`, Intl |
| RTL | parcial | CSS com propriedades lógicas; sem teste dedicado |
| Acessibilidade | tem | ARIA por componente, axe nos exemplos (navegador) |
| Temas | tem (além do Ext) | tokens com escopo, `seeds`, contraste |

## Próximos passos (fora desta rodada)

Codemod Ext → Optikos; ponte de convivência Ext ↔ Optikos; pivot grid; scheduler; layouts anchor/column/absolute/accordion;
ComponentQuery com seletor; ViewController; rowexpander; seleção de célula; D&D de linhas; vários níveis de grupo.
