# Building from a field list (`optikos/build`)

Describe a record once, get the grid columns, the form and the filter fields from it. Everything returned is a real component, so it mixes with the rest.

```ts
import { buildGrid, buildForm, buildFilterFields, type FieldSpec } from 'optikos/build';

const fields: FieldSpec[] = [
  { name: 'number', label: 'Order', readonly: true, hide: ['form'] },
  { name: 'customer', required: true, lookup: 'customers' },
  { name: 'status', type: 'select', options: ['open', 'paid'], group: 'State' },
  { name: 'total', type: 'money', summary: 'sum' },
  { name: 'note', type: 'area', hide: ['grid', 'filter'] },
];

const grid = buildGrid(fields, { store, selection: 'multi', plugins: [grouping({ summary: 'grand' })] });
const form = buildForm(fields, { columns: 2 });
const filters = new FilterBuilder({ store, fields: buildFilterFields(fields) });
```

## `FieldSpec`

| Property | Meaning |
|---|---|
| `name` | The record's property. `label` defaults to the name as words (`unitPrice` → "Unit price"). |
| `type` | `text` (default), `email`, `area`, `number`, `money`, `date`, `datetime`, `select`, `bool`. |
| `options` · `lookup` | Choices for `select`; a LookupDef or `registerLookup` name for a lookup window. |
| `required` · `readonly` | Form field flags. |
| `group` | A band over the grid header, a group in the filter picker and a `FieldSet` in the form. |
| `width` · `summary` | Grid column width; total of the filtered rows (needs `grouping({ summary: 'grand' })`). |
| `hide` | `['grid' \| 'form' \| 'filter']`: leaves the field out of those builds. |
| `column` · `field` · `filter` | Overrides merged into what each build makes. |

## Functions

- `buildColumns(specs)` → `Column[]` (numbers and money right-aligned and formatted, booleans centred, dates formatted).
- `buildFields(specs)` → form field instances, in order.
- `buildFilterFields(specs)` → `FilterField[]` (`bool` becomes a Yes/No choice, a lookup filters as text).
- `buildGrid(specs, cfg?)` → `Grid`; `cfg` is any `GridConfig`.
- `buildForm(specs, cfg?)` → `Form` with `columns` columns (default 2); specs with a `group` go in a `FieldSet` of that title.

## Rules

- `optikos/build` has its own entry and is not part of the core budget; it pulls in the grid and the fields it builds.
- It builds what is common. A field that needs more is a spec with `field`/`column` overrides, or plain components next to it.
- Totals cover the rows the store holds (a remote store: the loaded page).
