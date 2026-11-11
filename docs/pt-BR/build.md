# Construir a partir de uma lista de campos (`optikos/build`)

Descreva o registro uma vez e tire dele as colunas do grid, o formulário e os campos de filtro. Tudo que volta é um componente de verdade, então se mistura com o resto.

```ts
import { buildGrid, buildForm, buildFilterFields, type FieldSpec } from 'optikos/build';

const fields: FieldSpec[] = [
  { name: 'number', label: 'Pedido', readonly: true, hide: ['form'] },
  { name: 'customer', required: true, lookup: 'customers' },
  { name: 'status', type: 'select', options: ['open', 'paid'], group: 'Situação' },
  { name: 'total', type: 'money', summary: 'sum' },
  { name: 'note', type: 'area', hide: ['grid', 'filter'] },
];

const grid = buildGrid(fields, { store, selection: 'multi', plugins: [grouping({ summary: 'grand' })] });
const form = buildForm(fields, { columns: 2 });
const filters = new FilterBuilder({ store, fields: buildFilterFields(fields) });
```

## `FieldSpec`

| Propriedade | Significado |
|---|---|
| `name` | A propriedade do registro. `label` vem do nome em palavras (`unitPrice` → "Unit price"). |
| `type` | `text` (padrão), `email`, `area`, `number`, `money`, `date`, `datetime`, `select`, `bool`. |
| `options` · `lookup` | Opções do `select`; um LookupDef ou o nome dado a `registerLookup`. |
| `required` · `readonly` | Flags do campo do formulário. |
| `group` | Faixa sobre o cabeçalho do grid, grupo no seletor de filtros e `FieldSet` no formulário. |
| `width` · `summary` | Largura da coluna; total das linhas filtradas (precisa de `grouping({ summary: 'grand' })`). |
| `hide` | `['grid' \| 'form' \| 'filter']`: tira o campo dessas construções. |
| `column` · `field` · `filter` | Ajustes mesclados no que cada construção gera. |

## Funções

- `buildColumns(specs)` → `Column[]` (números e valores alinhados à direita e formatados, booleanos centralizados, datas formatadas).
- `buildFields(specs)` → instâncias dos campos do formulário, em ordem.
- `buildFilterFields(specs)` → `FilterField[]` (`bool` vira escolha Sim/Não, lookup filtra como texto).
- `buildGrid(specs, cfg?)` → `Grid`; `cfg` é qualquer `GridConfig`.
- `buildForm(specs, cfg?)` → `Form` com `columns` colunas (padrão 2); specs com `group` vão num `FieldSet` com esse título.

## Regras

- `optikos/build` tem entrada própria e não conta no orçamento do core; traz o grid e os campos que gera.
- Constrói o comum. O que precisa de mais é uma spec com `field`/`column`, ou componentes comuns ao lado.
- Os totais cobrem as linhas que o store tem (store remoto: a página carregada).
