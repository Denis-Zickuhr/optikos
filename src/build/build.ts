// One list of field specs feeds the grid columns, the form fields and the filter fields, so a screen is described once.
import { ui } from '../ui/ui';
import { Grid, type GridConfig } from '../components/data/grid/grid';
import { Form, type FormConfig } from '../components/form/form/form';
import { FieldSet } from '../components/layout/fieldset/fieldset';
import type { FilterField } from '../components/data/filterbuilder/filterbuilder';
import type { Column } from '../data/column';
import type { Component } from '../core/component';

export type FieldKind = 'text' | 'email' | 'area' | 'number' | 'money' | 'duration' | 'date' | 'datetime' | 'select' | 'bool';
type Cfg = Record<string, any>;

export interface FieldSpec {
  /** The record's property. */
  name: string;
  /** Default: the name as words (`unitPrice` → "Unit price"). */
  label?: string;
  /** Default `text`. `duration` is a number of minutes, shown as `7h 30m`. */
  type?: FieldKind;
  /** For `select`. */
  options?: Array<string | number | { value: string | number; label: string }>;
  /** Picks the value in a lookup window: a LookupDef or the name given to `registerLookup`. */
  lookup?: Cfg | string;
  required?: boolean;
  readonly?: boolean;
  /** A band over the grid header and a section of the form. */
  group?: string;
  /** Total of the (filtered) rows in the grid: the starting total of the `columnTotals()` plugin. */
  summary?: Column['summary'];
  /** Grid column width in px. */
  width?: number;
  /** Leaves the field out of some of the builds. */
  hide?: Array<'grid' | 'form' | 'filter'>;
  /** Overrides for what each build makes. */
  column?: Partial<Column>;
  field?: Cfg;
  filter?: Partial<FilterField>;
}

const words = (name: string) => {
  const s = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const label = (s: FieldSpec) => s.label ?? words(s.name);
const shown = (specs: FieldSpec[], where: 'grid' | 'form' | 'filter') => specs.filter((s) => !s.hide?.includes(where));

/** Grid columns: right-aligned numbers and money, formatted dates and booleans. */
export function buildColumns(specs: FieldSpec[]): Column[] {
  return shown(specs, 'grid').map((s) => {
    const col: Column = { field: s.name, header: label(s), sortable: true, width: s.width, group: s.group, summary: s.summary };
    if (s.type === 'number') col.align = 'right';
    else if (s.type === 'duration') Object.assign(col, { format: 'duration', align: 'right' });
    else if (s.type === 'money') Object.assign(col, { format: 'money', align: 'right' });
    else if (s.type === 'date' || s.type === 'datetime') col.format = 'date';
    else if (s.type === 'bool') Object.assign(col, { format: 'bool', align: 'center' });
    return { ...col, ...s.column };
  });
}

/** Form fields (instances), in order. */
export function buildFields(specs: FieldSpec[]): Component[] {
  return shown(specs, 'form').map((s) => {
    const c: Cfg = { required: s.required || undefined, readonly: s.readonly || undefined, ...s.field };
    const l = label(s);
    if (s.lookup) return ui.lookup(s.name, l, s.lookup, c);
    switch (s.type) {
      case 'email': return ui.email(s.name, l, c);
      case 'area': return ui.area(s.name, l, { colspan: 'full', ...c });
      case 'number': return ui.number(s.name, l, c);
      case 'duration': return ui.number(s.name, l, { min: 0, ...c });
      case 'money': return ui.number(s.name, l, { decimals: 2, min: 0, ...c });
      case 'date': return ui.date(s.name, l, c);
      case 'datetime': return ui.datetime(s.name, l, c);
      case 'select': return ui.select(s.name, l, (s.options ?? []) as any, c);
      case 'bool': return ui.check(s.name, l, c);
      default: return ui.text(s.name, l, c);
    }
  });
}

/** Fields for a `FilterBuilder`; `bool` filters as a Yes/No choice. */
export function buildFilterFields(specs: FieldSpec[]): FilterField[] {
  return shown(specs, 'filter').map((s) => {
    const type = s.type === 'number' || s.type === 'money' || s.type === 'duration' ? 'number' : s.type === 'date' || s.type === 'datetime' ? 'date' : s.type === 'select' || s.type === 'bool' ? 'select' : 'text';
    const options = s.type === 'bool' ? [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] : s.type === 'select' ? s.options : undefined;
    return { name: s.name, label: label(s), type, group: s.group, options, ...s.filter };
  });
}

/** A `Grid` whose columns come from the specs. `cfg` adds or overrides anything (`store`, `selection`, ...). */
export const buildGrid = (specs: FieldSpec[], cfg: Partial<GridConfig> = {}) => new Grid({ columns: buildColumns(specs), ...cfg });

/** A `Form` with the fields in `columns` columns (default 2); specs with a `group` go in a `FieldSet` of that title. */
export function buildForm(specs: FieldSpec[], cfg: FormConfig & { columns?: number } = {}) {
  const columns = cfg.columns ?? 2;
  const visible = shown(specs, 'form');
  const fields = buildFields(specs);
  const items: Array<Component | string> = [];
  const sets = new Map<string, Component[]>();
  fields.forEach((f, i) => {
    const g = visible[i].group;
    if (!g) return void items.push(f);
    if (!sets.has(g)) {
      sets.set(g, []);
      items.push(g);
    }
    sets.get(g)!.push(f);
  });
  const done = items.map((i) => (typeof i === 'string' ? new FieldSet({ title: i, columns, items: sets.get(i) as any }) : i));
  return new Form({ ...cfg, columns: sets.size ? undefined : columns, items: done as any });
}
