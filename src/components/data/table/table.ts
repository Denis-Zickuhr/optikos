import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { Store } from '../../../data/store';
import { t } from '../../../core/i18n';
import { cellContent, type Column } from '../../../data/column';

export interface TableConfig extends ComponentConfig {
  data?: Record<string, any>[];
  store?: Store<any>;
  columns?: Column[];
  caption?: string;
  striped?: boolean;
  emptyText?: string;
}

/** Plain semantic `<table>` for small datasets. No selection, sorting or virtualization: use Grid for those. */
export class Table extends Component<TableConfig> {
  protected override baseCls = 'op-table';
  protected override tag = 'table' as const;
  private store!: Store<any>;
  private unsub?: () => void;

  protected override onRender() {
    const c = this.config;
    this.el.classList.toggle('op-table--striped', !!c.striped);
    this.bind(c.store ?? new Store({ data: c.data ?? [] }));
    this.own(() => this.unsub?.());
  }

  private bind(store: Store<any>) {
    this.unsub?.();
    this.store = store;
    this.unsub = store.subscribe(() => this.paint());
    this.paint();
  }

  private cols(): Column[] {
    const c = this.config;
    const all: Column[] = c.columns ?? Object.keys(this.store.getAt(0)?.data ?? {}).map((field) => ({ field }));
    return all.filter((x) => !x.hidden);
  }

  private paint() {
    const c = this.config;
    const cols = this.cols();
    const head = h('tr', '', {}, ...cols.map((col) => h('th', col.align ? `op-table__cell--${col.align}` : '', { scope: 'col' }, col.header ?? col.field)));
    const rows = this.store.getRange().map((rec) =>
      h('tr', '', {}, ...cols.map((col) => h('td', `${col.align ? `op-table__cell--${col.align}` : ''} ${col.cls ?? ''}`.trim(), {}, cellContent(col, rec)))),
    );
    const body = rows.length ? rows : [h('tr', 'op-table__empty', {}, h('td', '', { colspan: cols.length || 1 }, c.emptyText ?? t('empty')))];
    this.el.replaceChildren(...(c.caption ? [h('caption', '', {}, c.caption)] : []), h('thead', '', {}, head), h('tbody', '', {}, ...body));
  }

  setData(data: Record<string, any>[]) {
    this.config.data = data;
    if (this.rendered) this.store.loadData(data);
  }
  setStore(store: Store<any>) {
    this.config.store = store;
    if (this.rendered) this.bind(store);
  }
  setColumns(columns: Column[]) {
    this.config.columns = columns;
    if (this.rendered) this.paint();
  }
  setCaption(caption: string) {
    this.config.caption = caption;
    if (this.rendered) this.paint();
  }
}
register('table', Table);
