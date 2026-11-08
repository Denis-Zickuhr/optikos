import { Component, type ComponentConfig } from '../../../core/component';
import { register, create, type AnyConfig } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import type { Store } from '../../../data/store';
import type { Model } from '../../../data/model';
import type { Column } from '../../../data/column';
import type { FilterOp, FilterSpec } from '../../../data/proxy';
import { Button } from '../../base/button/button';
import { Grid } from '../grid/grid';

/** A filter field of a lookup: any field config, plus how its value is matched. */
export type LookupFilter = AnyConfig & { name: string; op?: FilterOp; field?: string };

/** Everything that describes "search for a record": shared by SearchGrid and LookupField. */
export interface LookupDef {
  /** A function gives every instance its own store (recommended when the definition is reused). */
  store: Store<any> | (() => Store<any>);
  columns: Column[];
  filters?: LookupFilter[];
  /** Name of the filter that receives the quick text (LookupField typing). Default: the first filter. */
  queryField?: string;
  valueField?: string;
  displayField?: string;
  selection?: 'single' | 'multi';
  paging?: boolean;
  /** Search when shown. Default true. */
  autoSearch?: boolean;
  title?: string;
  width?: number;
  height?: number;
}

const defs = new Map<string, LookupDef>();
/** Registers a lookup definition for declarative use by name (`lookup: 'people'`). */
export function registerLookup(name: string, def: LookupDef): void {
  defs.set(name, def);
}
export function resolveLookup(lookup: LookupDef | string): LookupDef {
  const d = typeof lookup === 'string' ? defs.get(lookup) : lookup;
  if (!d) throw new Error(`Optikos: unknown lookup "${lookup}". Did you call registerLookup?`);
  return d;
}
export const lookupStore = (def: LookupDef): Store<any> => (typeof def.store === 'function' ? def.store() : def.store);

export interface SearchGridConfig extends ComponentConfig {
  lookup: LookupDef | string;
}

const textual = (type?: string) => !type || type === 'textfield' || type === 'textarea';
const blank = (v: unknown) => v == null || v === '' || (Array.isArray(v) && !v.length);

/** Filters on top, results grid below. The Store does the searching; this component only turns the filter fields into specs. */
export class SearchGrid extends Component<SearchGridConfig> {
  protected override baseCls = 'op-searchgrid';
  private def!: LookupDef;
  private store!: Store<any>;
  private fields: Array<{ cfg: LookupFilter; cmp: Component }> = [];
  private grid!: Grid;
  private form!: HTMLElement;

  protected override build() {
    this.def = resolveLookup(this.config.lookup);
    this.store = lookupStore(this.def);
    const d = this.def;
    this.form = h('div', 'op-searchgrid__filters', { role: 'search' });
    const btns = [
      new Button({ text: t('search'), icon: 'search', variant: 'primary', handler: () => void this.search() }),
      new Button({ text: t('clear'), handler: () => this.clear() }),
    ];
    this.fields = (d.filters ?? []).map((cfg) => {
      const { op: _o, field: _f, ...fieldCfg } = cfg;
      const cmp = create({ ...fieldCfg, renderTo: undefined } as AnyConfig);
      cmp.on('enter', () => void this.search());
      return { cfg, cmp };
    });
    this.form.append(...this.fields.map((f) => f.cmp.el), h('div', 'op-searchgrid__buttons', {}, ...btns.map((b) => b.el)));
    this.grid = new Grid({ store: this.store, columns: d.columns, selection: d.selection ?? 'single', paging: d.paging !== false, flex: 1 });
    this.grid.on('select', (recs: Model[]) => this.emit('select', recs));
    this.grid.on('row-activate', () => this.confirm());
    this.grid.on('row-dblclick', () => this.confirm());
    this.own(() => [...btns, this.grid, ...this.fields.map((f) => f.cmp)].forEach((c) => c.destroy()));
    return h('div', this.baseCls, {}, this.form, this.grid.el);
  }

  protected override onRender() {
    if (this.def.autoSearch !== false) void this.search();
  }

  override notifyMount() {
    super.notifyMount();
    this.fields.forEach((f) => f.cmp.notifyMount());
    this.grid.notifyMount();
  }

  private confirm() {
    const recs = this.grid.getSelection();
    if (recs.length) this.emit('confirm', recs);
  }

  /** The non-empty filter fields as filter specs. */
  getFilters(): FilterSpec[] {
    return this.fields.flatMap(({ cfg, cmp }) => {
      const v = (cmp as any).getValue?.();
      if (blank(v)) return [];
      const field = cfg.field ?? cfg.name;
      if (typeof v === 'object' && !Array.isArray(v) && 'start' in v) return v.start ? [{ field, op: 'between' as const, value: [v.start, v.end ?? v.start] }] : [];
      return [{ field, op: cfg.op ?? (textual(cfg.type) ? 'contains' : 'eq'), value: v }];
    });
  }

  /** Filters the store with the current fields (or loads it, when there are none). Resolves when the results are in. */
  async search(query?: string): Promise<void> {
    if (query != null) this.setQuery(query);
    const specs = this.getFilters();
    if (this.emit('before-search', specs) === false) return;
    await (specs.length ? this.store.filter(specs) : this.store.clearFilter());
    this.emit('search', specs);
  }

  /** Empties the filter fields and searches again. */
  clear(): void {
    this.fields.forEach((f) => (f.cmp as any).clear?.());
    void this.search();
  }

  /** Fills the quick-search field (`queryField`, default the first filter) without searching. */
  setQuery(text: string): void {
    const name = this.def.queryField ?? this.def.filters?.[0]?.name;
    (this.fields.find((f) => f.cfg.name === name)?.cmp as any)?.setValue?.(text);
  }

  getSelection(): Model[] {
    return this.grid.getSelection();
  }
  getGrid(): Grid {
    return this.grid;
  }
  getStore(): Store<any> {
    return this.store;
  }
  override focus(): void {
    (this.fields[0]?.cmp ?? this.grid).focus();
  }
}
register('searchgrid', SearchGrid);
