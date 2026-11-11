import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { virtualize, measure } from '../../../core/virtual';
import { Store } from '../../../data/store';
import type { Model } from '../../../data/model';
import { cellContent, type Column } from '../../../data/column';
import { allowed, gate } from '../../../core/permission';
import { iconEl } from '../../base/icon/icon';
import { Pagination } from '../pagination/pagination';
import { Button } from '../../base/button/button';
import { TextField } from '../../fields/textfield/textfield';
import { Dropdown } from '../../overlays/dropdown/dropdown';
import { Menu } from '../../overlays/menu/menu';

addMessages('en', {
  gridSelected: '{n} selected',
  gridSelectAll: 'Select all {n}',
  gridClearSel: 'Clear selection',
  gridSelectRow: 'Select row',
  gridSelectPage: 'Select all rows',
  gridRowActions: 'Row actions',
  gridColumns: 'Columns',
  gridResize: 'Resize column',
  gridGroupAll: 'All',
  gridOtherCols: 'Other',
  gridGroups: 'Column groups',
  gridColumnSearch: 'Search columns',
  gridNoColumns: 'No matching columns',
});
addMessages('pt-BR', {
  gridSelected: '{n} selecionado(s)',
  gridSelectAll: 'Selecionar todos os {n}',
  gridClearSel: 'Limpar seleção',
  gridSelectRow: 'Selecionar linha',
  gridSelectPage: 'Selecionar todas as linhas',
  gridRowActions: 'Ações da linha',
  gridColumns: 'Colunas',
  gridResize: 'Redimensionar coluna',
  gridGroupAll: 'Todas',
  gridOtherCols: 'Outras',
  gridGroups: 'Grupos de colunas',
  gridColumnSearch: 'Buscar colunas',
  gridNoColumns: 'Nenhuma coluna encontrada',
});

export interface GridConfig<T extends Record<string, any> = any> extends ComponentConfig {
  store?: Store<T>;
  /** Used when no `store` is given. */
  data?: Partial<T>[];
  columns: Column<T>[];
  selection?: 'none' | 'single' | 'multi';
  /** Row height in px. Default: measured from the `--op-grid-row-height` / `--op-row-height` tokens. */
  rowHeight?: number;
  /** Adds a Pagination bar bound to the store (give the store a `pageSize`, or set it here). */
  paging?: boolean;
  pageSize?: number;
  emptyText?: string;
  striped?: boolean;
  /** Adds a leading checkbox column with a select-all in the header. Implies multi selection; a row click toggles. */
  checkboxSelection?: boolean;
  /** Keep selected records when the page or the filters change. Default false. */
  keepSelection?: boolean;
  /** Buttons shown in a bar above the header while records are selected. */
  bulkActions?: GridAction<T>[];
  /** Actions at the end of every row (see `rowActionsMode`). */
  rowActions?: GridRowAction<T>[];
  /** Optional features (`cellEditing()`...). See `GridPlugin`. */
  plugins?: GridPlugin<T>[];
  /** `'menu'` (default): one "⋯" button opens a menu. `'visible'`: every action is an icon button, always shown (dimmed until the row is hovered, active or selected). */
  rowActionsMode?: 'menu' | 'visible';
  /** A "Columns" button in the bar: toggle columns on and off, with search. */
  columnMenu?: boolean;
  /** Drag a header to a new place (or Alt+←/→ on a focused header). `column-move` and `columns-change` fire; ViewManager saves the order. */
  reorderableColumns?: boolean;
  /** A handle on each header's edge: drag to resize (double-click resets), Alt+Shift+←/→ on a focused header. Widths are part of `getColumnState`. */
  resizableColumns?: boolean;
  /** Show the group labels (`Column.group`) as a band over the header. Default true when any column has a group. */
  groupHeaders?: boolean;
}

/** Extends a Grid without growing its base: `init` runs once the grid is rendered and may return a cleanup. */
export interface GridPlugin<T extends Record<string, any> = any> {
  init(grid: Grid<T>): void | (() => void);
  destroy?(): void;
}

/**
 * One displayed row. Without a row layout every store record is a row; a plugin (grouping, tree) replaces the list with
 * its own, mixing records with rows that are not records (a group header, a total).
 */
export interface RowEntry<T extends Record<string, any> = any> {
  /** The record this row shows; absent on a header or total row (which cannot be selected). */
  rec?: Model<T>;
  /** `aria-level` and, with `expanded`, `aria-expanded`: for rows that open and close (a group, a tree node). */
  level?: number;
  expanded?: boolean;
  /** Extra classes on the row (`op-grid__row--group`...). */
  cls?: string;
  /** Fills the row's cells after the grid did (or, on a row without a record, instead of it). */
  paint?(cells: HTMLElement[], row: HTMLElement): void;
}

/** What `cellAt` finds under a DOM node: the row index, its record, the column and the cell element. */
export interface GridCell<T extends Record<string, any> = any> {
  index: number;
  record: Model<T>;
  column: Column<T>;
  el: HTMLElement;
}

export interface GridAction<T extends Record<string, any> = any> {
  text: string;
  icon?: string;
  variant?: 'default' | 'danger';
  /** Left out (or disabled) while `setPermissionResolver` denies it. */
  permission?: string;
  handler: (records: Model<T>[], grid: Grid<T>) => void;
}
export interface GridRowAction<T extends Record<string, any> = any> {
  text: string;
  icon?: string;
  variant?: 'default' | 'danger';
  /** Left out (or disabled) while `setPermissionResolver` denies it. */
  permission?: string;
  /** Disabled for the records where this returns true. */
  disabled?: (record: Model<T>) => boolean;
  handler: (record: Model<T>, grid: Grid<T>) => void;
}
export interface ColumnState {
  field: string;
  hidden: boolean;
  width?: number;
  locked?: 'start' | 'end';
}

const SEL = '__select';
const ACT = '__actions';
const SEL_COL: Column = { field: SEL, width: 44, align: 'center', cls: 'op-grid__selcell', locked: 'start' };
const ACT_COL: Column = { field: ACT, width: 44, align: 'center', cls: 'op-grid__actcell', locked: 'end' };

const ROW = 'var(--op-grid-row-height, var(--op-row-height))';

/** Data grid with a virtualized body: only the visible rows (plus a small overscan) exist in the DOM. */
/** `T` is the record shape; `new Grid({ store })` infers it from a typed `Store<T>`. */
export class Grid<T extends Record<string, any> = any> extends Component<GridConfig<T>> {
  protected override baseCls = 'op-grid';
  private store!: Store<T>;
  private offStore?: () => void;
  private headEl!: HTMLElement;
  private headRow!: HTMLElement;
  private viewport!: HTMLElement;
  private emptyEl!: HTMLElement;
  /** The focusable `role=grid` part (header + rows); the root also holds the bulk bar and the pager, which a grid may not contain. */
  private table!: HTMLElement;
  private pager?: Pagination;
  private v!: ReturnType<typeof virtualize>;
  private entries?: RowEntry<T>[];
  private lockEdge = [-1, -1];
  private selected = new Set<Model<T>>();
  private active = -1;
  private anchor = -1;
  private justDragged = false;
  private cv = 0; // bumps when the columns change, so pooled rows rebuild their cells
  private selAll?: HTMLInputElement;
  private barEl?: HTMLElement;
  private bulkEl?: HTMLElement;
  private bulkCount?: HTMLElement;
  private bulkBtns: Button[] = [];
  private selectAllBtn?: Button;
  private rowMenu?: Menu;
  private colDd?: Dropdown;
  private colList?: HTMLElement;
  private colSearch?: TextField;
  private colChips?: HTMLElement;
  private colGroup = '';

  private cols(): Column[] {
    const c = this.config;
    return [...(c.checkboxSelection ? [SEL_COL] : []), ...this.userCols(), ...(c.rowActions?.length ? [ACT_COL] : [])];
  }
  /** Visible columns; the locked ones are kept together at their edge, whatever the order they were given or dragged to. */
  private userCols(): Column[] {
    const vis = (this.config.columns ?? []).filter((c) => !c.hidden);
    return [...vis.filter((c) => c.locked === 'start'), ...vis.filter((c) => !c.locked), ...vis.filter((c) => c.locked === 'end')];
  }
  private visibleActions(): boolean {
    return this.config.rowActionsMode === 'visible' && !!this.config.rowActions?.length;
  }
  private mode(): 'none' | 'single' | 'multi' {
    return this.config.checkboxSelection ? 'multi' : (this.config.selection ?? 'single');
  }

  protected override build() {
    const c = this.config;
    c.rowActions = gate(c.rowActions);
    c.bulkActions = gate(c.bulkActions);
    c.columns = c.columns.filter((col) => allowed(col.permission));
    const el = h('div', this.baseCls);
    this.headRow = h('div', 'op-grid__row op-grid__header-row', { role: 'row' });
    this.headEl = h('div', 'op-grid__header', {}, this.headRow);
    this.viewport = h('div', 'op-grid__viewport');
    this.emptyEl = h('div', 'op-grid__empty');
    if (c.columnMenu || c.bulkActions?.length) {
      this.bulkEl = h('div', 'op-grid__bulk');
      this.bulkEl.hidden = true;
      this.barEl = h('div', 'op-grid__bar', {}, this.bulkEl);
      el.append(this.barEl);
    }
    this.table = h('div', 'op-grid__table', { role: 'grid', tabindex: 0, 'aria-multiselectable': c.selection === 'multi' || c.checkboxSelection ? 'true' : null }, this.headEl, this.viewport, this.emptyEl);
    el.append(this.table);
    el.classList.toggle('op-grid--striped', !!c.striped);
    if (c.paging) {
      this.pager = new Pagination({ cls: 'op-grid__pager' });
      el.append(this.pager.el);
    }
    return el;
  }

  protected override onRender() {
    const c = this.config;
    this.bindStore(c.store ?? new Store<T>({ data: c.data ?? [] }));
    this.buildHeader();
    this.buildBar();
    this.v = virtualize({
      scroller: this.viewport,
      count: this.count(),
      rowHeight: c.rowHeight ?? (measure(this.el, ROW) || 36),
      render: (row, i) => this.renderRow(row, i),
      rowCls: 'op-grid__row op-grid__body-row',
    });
    this.own(() => this.v.destroy());
    this.sync();

    this.listen(this.viewport, 'scroll', () => this.onScrollX(), { passive: true });
    this.listen(this.viewport, 'click', (e: MouseEvent) => this.onRowEvent(e, 'row-click'));
    this.listen(this.viewport, 'dblclick', (e: MouseEvent) => this.onRowEvent(e, 'row-dblclick'));
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.listen(this.headRow, 'change', (e: Event) => {
      if (e.target !== this.selAll) return;
      if (this.selAll!.checked) this.store.each((r) => this.selected.add(r));
      else if (this.config.keepSelection) this.store.each((r) => this.selected.delete(r));
      else this.selected.clear();
      this.changed();
    });
    if (c.reorderableColumns) this.initColumnDrag();
    if (c.resizableColumns) this.initColumnResize();
    this.listen(this.headRow, 'click', (e: Event) => {
      if (this.justDragged || (e.target as HTMLElement).closest('.op-grid__resizer')) return;
      const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-field]');
      const col = cell && this.userCols().find((x) => x.field === cell.dataset.field);
      if (!col) return;
      this.emit('column-click', col);
      if (col.sortable) this.sortBy(col);
    });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => this.layout());
      ro.observe(this.viewport);
      this.own(() => ro.disconnect());
    }
    if (this.pager) {
      this.pager.setStore(this.store);
      if (!this.store.pageSize) this.store.setPageSize(c.pageSize ?? 20);
    }
    this.own(() => this.pager?.destroy());
    for (const p of c.plugins ?? []) {
      const off = p.init(this);
      if (off) this.own(off);
      if (p.destroy) this.own(() => p.destroy!());
    }
  }

  /** The row, record, column and cell element under a node (e.g. an event target), if it is a body cell. */
  cellAt(node: EventTarget | null): GridCell<T> | undefined {
    const cell = (node as HTMLElement | null)?.closest?.<HTMLElement>('.op-grid__body-row .op-grid__cell');
    const index = Number(cell?.parentElement?.dataset.i);
    const column = cell && this.cols()[Number(cell.getAttribute('aria-colindex')) - 1];
    const record = cell && this.recAt(index);
    return column && record && ![SEL, ACT].includes(column.field) ? { index, record, column, el: cell } : undefined;
  }

  /** The body cell of row `index` and column `field`, when that row is in the DOM (rows are virtualized). */
  getCell(index: number, field: string): HTMLElement | undefined {
    const n = this.cols().findIndex((c) => c.field === field);
    return document.getElementById(`${this.id}-r${index}`)?.querySelector<HTMLElement>(`[aria-colindex="${n + 1}"]`) ?? undefined;
  }

  /** The visible data columns, in order (no checkbox/action columns). */
  getColumns(): Column<T>[] {
    return this.userCols();
  }

  /** The active row index (keyboard cursor), or -1. */
  getActive(): number {
    return this.active;
  }

  override notifyMount() {
    super.notifyMount();
    this.layout();
    this.pager?.notifyMount();
  }

  /** The header follows the body sideways; its locked cells hold still, and the edges say when there is more to scroll. */
  private onScrollX() {
    const v = this.viewport;
    const end = Math.max(0, v.scrollWidth - v.clientWidth - v.scrollLeft);
    this.headEl.scrollLeft = v.scrollLeft;
    this.el.style.setProperty('--op-grid-scroll-x', `${v.scrollLeft}px`);
    this.el.style.setProperty('--op-grid-scroll-end', `${end}px`);
    this.el.classList.toggle('is-scrolled-start', v.scrollLeft > 0);
    this.el.classList.toggle('is-scrolled-end', end > 0);
  }

  /** Re-measures row height and scrollbar (needed after the grid becomes visible or resizes). */
  private layout() {
    if (!this.rendered) return;
    if (!this.config.rowHeight) {
      const hgt = measure(this.el, ROW);
      if (hgt) this.v.setRowHeight(hgt);
    }
    this.headEl.style.paddingInlineEnd = `${this.viewport.offsetWidth - this.viewport.clientWidth}px`;
    this.v.refresh();
    this.onScrollX();
  }

  // ---- store ---------------------------------------------------------------------------------

  private bindStore(store: Store<T>) {
    this.offStore?.();
    this.store = store;
    const offChange = store.subscribe((c) => {
      if (!this.rendered) return;
      this.sync();
      if (c.type === 'sort') this.paintSort();
    });
    const offLoading = store.on('loading', (on: boolean) => this.setLoading(on));
    this.offStore = () => (offChange(), offLoading());
    this.own(() => this.offStore?.());
  }

  /** Brings count, selection and the empty state in line with the store. */
  private sync() {
    const before = this.selected.size;
    if (!this.config.keepSelection) for (const r of this.selected) if (this.store.indexOf(r) < 0) this.selected.delete(r);
    this.active = Math.min(this.active, this.count() - 1);
    this.v.setCount(this.count());
    this.table.setAttribute('aria-rowcount', String(this.store.totalCount + 1));
    this.emptyEl.textContent = this.config.emptyText ?? t('empty');
    this.emptyEl.hidden = this.count() > 0 || !!this.config.loading;
    this.el.classList.toggle('is-empty', this.count() === 0);
    this.updateActiveDescendant();
    this.paintSelection();
    if (this.selected.size !== before) this.emit('select', this.getSelection());
  }

  setStore(store: Store<T>) {
    this.config.store = store;
    this.selected.clear();
    this.active = this.anchor = -1;
    if (!this.rendered) return;
    this.bindStore(store);
    this.pager?.setStore(store);
    this.paintSort();
    this.sync();
  }
  getStore(): Store<T> {
    this.render();
    return this.store;
  }

  private count(): number {
    return this.entries ? this.entries.length : this.store.count;
  }
  private recAt(i: number): Model<T> | undefined {
    return this.entries ? this.entries[i]?.rec : this.store.getAt(i);
  }

  /** For plugins: replaces the displayed rows (`undefined` goes back to one row per store record) and repaints. */
  setRowLayout(rows: RowEntry<T>[] | undefined): void {
    this.entries = rows;
    if (this.rendered) this.sync();
  }
  /** The displayed row `i`: its record, or the header/total a plugin put there. */
  getRowEntry(i: number): RowEntry<T> | undefined {
    return this.entries ? this.entries[i] : ((rec) => rec && { rec })(this.store.getAt(i));
  }
  /** How many rows are displayed (records plus whatever a plugin added). */
  getRowCount(): number {
    return this.count();
  }

  // ---- header / columns ----------------------------------------------------------------------

  /** Column widths → the CSS grid template shared by the header and every row. */
  private layoutColumns() {
    const cols = this.cols();
    const n = this.visibleActions() ? this.config.rowActions!.length : 1;
    const wide = (c: Column) => (c.field === ACT ? `calc(${n} * var(--op-grid-action-size) + ${n + 1} * var(--op-grid-action-gap))` : `${c.width}px`);
    const px = (c: Column) => (c.field === ACT ? wide(c) : `${c.width ?? 140}px`);
    const tpl = cols.map((c) => (c.locked ? px(c) : c.width ? `${c.width}px` : `minmax(${c.minWidth ?? 96}px, ${c.flex ?? 1}fr)`)).join(' ');
    // a locked cell sticks at the sum of the locked widths before it (or, for the end, after it)
    const sums = (list: Array<[number, Column]>) => list.reduce<string[]>((acc, [n, c]) => (this.el.style.setProperty(`--op-grid-lock-${n}`, acc.length ? `calc(${acc.join(' + ')})` : '0px'), [...acc, px(c)]), []);
    const at = cols.map((c, n): [number, Column] => [n, c]);
    sums(at.filter(([, c]) => c.locked === 'start'));
    sums(at.filter(([, c]) => c.locked === 'end').reverse());
    this.lockEdge = [cols.map((c) => c.locked).lastIndexOf('start'), cols.findIndex((c) => c.locked === 'end')];
    this.el.style.setProperty('--op-grid-cols', tpl);
    this.el.style.setProperty('--op-grid-min-width', `${cols.reduce((sum, c) => sum + (c.field === ACT ? n * 36 : (c.width ?? (c.locked ? 140 : (c.minWidth ?? 96)))), 0)}px`);
  }

  /** Classes and offset of a locked cell (header or body); `n` is the column's place. */
  private lock(cell: HTMLElement, c: Column, n: number) {
    if (!c.locked) return;
    cell.classList.add('is-locked', `is-locked-${c.locked}`);
    cell.classList.toggle('is-lock-edge', this.lockEdge[c.locked === 'start' ? 0 : 1] === n);
    cell.style.setProperty('--_lock', `var(--op-grid-lock-${n})`);
  }

  private buildHeader() {
    const cols = this.cols();
    this.layoutColumns();
    this.el.classList.toggle('op-grid--actions-visible', this.visibleActions());
    this.el.classList.toggle('op-grid--reorderable', !!this.config.reorderableColumns);
    this.el.classList.toggle('op-grid--resizable', !!this.config.resizableColumns);
    this.table.setAttribute('aria-colcount', String(cols.length));
    this.selAll = undefined;
    this.headRow.replaceChildren(
      ...cols.map((c, i) => {
        const label = c.header ?? c.field;
        const cell = h('div', `op-grid__cell op-grid__hcell${c.align ? ` op-grid__cell--${c.align}` : ''}${c.sortable ? ' is-sortable' : ''}`, { role: 'columnheader', 'aria-colindex': i + 1, 'data-field': c.field });
        this.lock(cell, c, i);
        if (c.field === SEL) cell.append((this.selAll = h('input', 'op-grid__check', { type: 'checkbox', 'aria-label': t('gridSelectPage') })));
        else if (c.field === ACT) cell.append(h('span', 'op-sr-only', {}, t('gridRowActions')));
        else if (c.sortable) cell.append(h('button', 'op-grid__sort', { type: 'button' }, h('span', 'op-grid__label', {}, label), h('span', 'op-grid__arrow', { 'aria-hidden': 'true' }, iconEl('arrow-up'))));
        else cell.append(h('span', 'op-grid__label', {}, label));
        const user = c.field !== SEL && c.field !== ACT;
        if (this.config.reorderableColumns && user) cell.classList.add('is-reorderable');
        if (this.canResize(c)) {
          cell.append(h('span', 'op-grid__resizer', { role: 'separator', 'aria-orientation': 'vertical', 'aria-label': `${t('gridResize')} ${label}` }));
        }
        // a sortable header already has its button to focus; the others need a tab stop to be moved/resized by keyboard
        if (user && !c.sortable && (this.config.reorderableColumns || this.canResize(c))) cell.tabIndex = 0;
        return cell;
      }),
    );
    const band = this.groupBand(cols);
    this.headEl.replaceChildren(...(band ? [band] : []), this.headRow);
    this.paintSort();
  }

  /** Labels over runs of neighbouring columns that share a group (a dragged column can split a group: it shows twice). */
  private groupBand(cols: Column[]): HTMLElement | null {
    if (this.config.groupHeaders === false || !cols.some((c) => c.group)) return null;
    const cells: HTMLElement[] = [];
    let i = 0;
    while (i < cols.length) {
      const g = cols[i].group ?? '';
      let n = 1;
      while (i + n < cols.length && (cols[i + n].group ?? '') === g) n++;
      const cell = h('div', `op-grid__gcell${g ? '' : ' is-empty'}`, { role: 'columnheader', 'aria-colindex': i + 1, 'aria-colspan': n }, g);
      cell.style.gridColumn = `span ${n}`;
      cells.push(cell);
      i += n;
    }
    return h('div', 'op-grid__row op-grid__group-row', { role: 'row' }, ...cells);
  }

  /** The group labels in the order they first appear. */
  getColumnGroups(): string[] {
    return [...new Set(this.config.columns.map((c) => c.group).filter((g): g is string => !!g))];
  }

  /** Shows or hides every column of a group at once (at least one column always stays visible). */
  setColumnGroupVisible(group: string, visible: boolean): void {
    const cols = this.config.columns.filter((c) => (c.group ?? '') === group);
    if (!cols.length) return;
    for (const c of cols) c.hidden = !visible;
    if (!this.config.columns.some((c) => !c.hidden)) cols[0].hidden = false;
    this.setColumns(this.config.columns);
    this.emit('columns-change', this.getColumnState());
  }

  /** Pins a column to the start or the end while the body scrolls sideways (`null` releases it). A locked column needs a `width` (default 140). */
  setColumnLocked(field: string, locked: 'start' | 'end' | null): void {
    const col = this.config.columns.find((c) => c.field === field);
    if (!col || col.locked === (locked ?? undefined)) return;
    this.setColumns(this.config.columns.map((c) => (c === col ? { ...c, locked: locked ?? undefined } : c)));
    this.emit('columns-change', this.getColumnState());
  }

  setColumns(columns: Column[]) {
    this.config.columns = columns;
    if (!this.rendered) return;
    this.cv++;
    this.buildHeader();
    this.paintSelection();
    this.v.refresh();
  }

  /** Order, visibility and width of every column; save it and give it back to `setColumnState`. */
  getColumnState(): ColumnState[] {
    return this.config.columns.map((c) => ({ field: c.field, hidden: !!c.hidden, width: c.width, locked: c.locked }));
  }
  /** Restores a saved state: columns follow its order (unknown ones keep their place at the end). */
  setColumnState(state: ColumnState[]): void {
    const by = new Map(this.config.columns.map((c) => [c.field, c]));
    const ordered = state.flatMap((s) => {
      const c = by.get(s.field);
      by.delete(s.field);
      return c ? [{ ...c, hidden: s.hidden, width: s.width ?? c.width, locked: 'locked' in s ? s.locked : c.locked }] : [];
    });
    this.setColumns([...ordered, ...by.values()]);
    this.emit('columns-change', this.getColumnState());
  }

  // ---- column drag ---------------------------------------------------------------------------

  // ---- column resize -------------------------------------------------------------------------

  private canResize(c: Column): boolean {
    return !!this.config.resizableColumns && c.field !== SEL && c.field !== ACT && c.resizable !== false;
  }

  /** Sets a column's width in px (clamped to `minWidth`/`maxWidth`); `undefined` gives it back its flexible width. */
  setColumnWidth(field: string, width: number | undefined): void {
    const col = this.config.columns.find((x) => x.field === field);
    if (!col) return;
    col.width = width == null ? undefined : Math.round(Math.max(col.minWidth ?? 48, Math.min(width, col.maxWidth ?? Infinity)));
    this.layoutColumns();
    this.emit('column-resize', field, col.width);
    this.emit('columns-change', this.getColumnState());
  }

  private initColumnResize(): void {
    const head = this.headRow;
    this.listen(head, 'pointerdown', (e: PointerEvent) => {
      const grip = (e.target as HTMLElement).closest<HTMLElement>('.op-grid__resizer');
      if (!grip || e.button) return;
      e.preventDefault();
      const cell = grip.parentElement!;
      const field = cell.dataset.field!;
      const col = this.config.columns.find((x) => x.field === field)!;
      const x0 = e.clientX;
      const w0 = cell.getBoundingClientRect().width || col.width || 96; // a flexible column starts from what it shows now
      this.el.classList.add('is-resizing');
      let last = col.width;
      const move = (m: PointerEvent) => {
        // set without events while dragging; one event when it ends
        const w = Math.round(Math.max(col.minWidth ?? 48, Math.min(w0 + (m.clientX - x0) * (this.dir() === 'rtl' ? -1 : 1), col.maxWidth ?? Infinity)));
        col.width = last = w;
        this.layoutColumns();
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        this.el.classList.remove('is-resizing');
        this.justDragged = true;
        setTimeout(() => (this.justDragged = false));
        if (last !== undefined) {
          this.emit('column-resize', field, last);
          this.emit('columns-change', this.getColumnState());
        }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      this.own(() => (document.removeEventListener('pointermove', move), document.removeEventListener('pointerup', up)));
    });
    // double-click on the handle: back to the flexible width
    this.listen(head, 'dblclick', (e: Event) => {
      const grip = (e.target as HTMLElement).closest<HTMLElement>('.op-grid__resizer');
      if (grip) this.setColumnWidth(grip.parentElement!.dataset.field!, undefined);
    });
    // keyboard: Alt+Shift+←/→ on a focused header
    this.listen(head, 'keydown', (e: KeyboardEvent) => {
      if (!(e.altKey && e.shiftKey) || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const cell = (e.target as HTMLElement).closest<HTMLElement>('.op-grid__hcell');
      const col = cell && this.config.columns.find((x) => x.field === cell.dataset.field);
      if (!cell || !col || !this.canResize(col)) return;
      e.preventDefault();
      const w = cell.getBoundingClientRect().width || col.width || 96;
      this.setColumnWidth(col.field, w + (e.key === 'ArrowRight' ? 16 : -16));
    });
  }

  private dir(): string {
    return getComputedStyle(this.el).direction;
  }

  /** Moves a (user) column in front of `before` (or to the end when null). Hidden columns keep their places. */
  moveColumn(field: string, before: string | null): void {
    const cols = this.config.columns;
    const col = cols.find((x) => x.field === field);
    if (!col || field === before) return;
    const vis = this.userCols();
    const from = vis.indexOf(col);
    const next = [...cols.filter((x) => x !== col)];
    const target = before == null ? undefined : next.find((x) => x.field === before);
    const lastVis = vis.filter((x) => x !== col).pop();
    const at = target ? next.indexOf(target) : lastVis ? next.indexOf(lastVis) + 1 : next.length;
    next.splice(at, 0, col);
    if (next.every((x, i) => x === cols[i])) return;
    this.setColumns(next);
    this.emit('column-move', field, from, this.userCols().indexOf(col));
    this.emit('columns-change', this.getColumnState());
  }

  private initColumnDrag(): void {
    const head = this.headRow;
    const cellsOf = () => Array.from(head.querySelectorAll<HTMLElement>('.is-reorderable'));
    this.listen(head, 'pointerdown', (e: PointerEvent) => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('.is-reorderable');
      if (!cell || e.button || (e.target as HTMLElement).closest('.op-grid__resizer')) return;
      const field = cell.dataset.field!;
      const x0 = e.clientX;
      let ghost: HTMLElement | undefined;
      let mark: HTMLElement | undefined;
      let before: string | null = null;
      const move = (m: PointerEvent) => {
        if (!ghost) {
          if (Math.abs(m.clientX - x0) < 6) return; // a click, not a drag
          ghost = h('div', 'op-grid__ghost', {}, cell.textContent ?? '');
          mark = h('div', 'op-grid__drop');
          this.el.append(ghost);
          this.headEl.append(mark);
          cell.classList.add('is-dragging-col');
        }
        ghost.style.left = `${m.clientX}px`;
        ghost.style.top = `${m.clientY}px`;
        // the drop boundary is the nearest cell edge: before the first cell whose middle is right of the pointer
        const cells = cellsOf();
        const hit = cells.find((c) => {
          const r = c.getBoundingClientRect();
          return m.clientX < r.left + r.width / 2;
        });
        before = hit ? hit.dataset.field! : null;
        const edge = hit ?? cells[cells.length - 1];
        const r = edge?.getBoundingClientRect();
        const hr = this.headEl.getBoundingClientRect();
        if (r && mark) mark.style.left = `${(hit ? r.left : r.right) - hr.left + this.headEl.scrollLeft}px`;
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (!ghost) return;
        ghost.remove();
        mark?.remove();
        cell.classList.remove('is-dragging-col');
        this.justDragged = true;
        setTimeout(() => (this.justDragged = false));
        this.moveColumn(field, before);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      this.own(() => (document.removeEventListener('pointermove', move), document.removeEventListener('pointerup', up)));
    });
    // keyboard: Alt+← / Alt+→ on a focused header moves its column one step
    this.listen(head, 'keydown', (e: KeyboardEvent) => {
      if (!e.altKey || e.shiftKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const cell = (e.target as HTMLElement).closest<HTMLElement>('.is-reorderable');
      if (!cell) return;
      e.preventDefault();
      const vis = this.userCols();
      const i = vis.findIndex((x) => x.field === cell.dataset.field);
      const j = e.key === 'ArrowLeft' ? i - 1 : i + 1;
      if (j < 0 || j >= vis.length) return;
      this.moveColumn(vis[i].field, e.key === 'ArrowLeft' ? vis[j].field : (vis[j + 1]?.field ?? null));
      const again = head.querySelector<HTMLElement>(`[data-field="${CSS.escape(vis[i].field)}"]`);
      (again?.querySelector<HTMLElement>('button') ?? again)?.focus();
    });
  }

  private paintSort() {
    const s = this.store.getSorters()[0];
    for (const cell of Array.from(this.headRow.children) as HTMLElement[]) {
      const on = !!s && cell.dataset.field === s.field;
      cell.classList.toggle('is-sorted-asc', on && s.dir === 'asc');
      cell.classList.toggle('is-sorted-desc', on && s.dir === 'desc');
      if (cell.classList.contains('is-sortable')) cell.setAttribute('aria-sort', on ? (s.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    }
  }

  /** asc → desc → unsorted. */
  private sortBy(col: Column) {
    const s = this.store.getSorters()[0];
    const dir = s?.field === col.field ? (s.dir === 'asc' ? 'desc' : null) : 'asc';
    if (this.emit('before-sort', col.field, dir) === false) return;
    this.store.sort(dir ? col.field : null, dir ?? undefined);
    this.emit('sort', col.field, dir);
  }

  // ---- rows ----------------------------------------------------------------------------------

  private rowIndexOffset(): number {
    return this.store.pageSize ? (this.store.page - 1) * this.store.pageSize : 0;
  }

  private renderRow(row: HTMLElement, i: number) {
    const entry = this.getRowEntry(i);
    if (!entry) return;
    const rec = entry.rec;
    const cols = this.cols();
    row.id = `${this.id}-r${i}`;
    row.dataset.i = String(i);
    row.setAttribute('role', 'row');
    row.setAttribute('aria-rowindex', String(this.rowIndexOffset() + i + 2));
    const sel = !!rec && this.selected.has(rec);
    if (row.dataset.ec) row.classList.remove(...row.dataset.ec.split(' '));
    row.dataset.ec = entry.cls ?? '';
    if (entry.cls) row.classList.add(...entry.cls.split(' '));
    for (const [a, v] of [['aria-level', entry.level], ['aria-expanded', entry.expanded]] as const) {
      if (v == null) row.removeAttribute(a);
      else row.setAttribute(a, String(v));
    }
    row.setAttribute('aria-selected', this.mode() === 'none' || !rec ? 'false' : String(sel));
    row.classList.toggle('is-selected', sel);
    row.classList.toggle('is-active', i === this.active);
    row.classList.toggle('is-odd', i % 2 === 1);
    if (row.dataset.cv !== String(this.cv) || row.dataset.cn !== String(cols.length)) {
      row.dataset.cv = String(this.cv);
      row.dataset.cn = String(cols.length);
      row.replaceChildren(
        ...cols.map((c, n) => {
          const cell = h('div', `op-grid__cell${c.align ? ` op-grid__cell--${c.align}` : ''}${c.cls ? ` ${c.cls}` : ''}`, { role: 'gridcell', 'aria-colindex': n + 1 });
          this.lock(cell, c, n);
          return cell;
        }),
      );
    }
    const cells = (Array.from(row.children) as HTMLElement[]).filter((c) => c.classList.contains('op-grid__cell')); // a plugin may add its own child (an edit bar)
    if (!rec) {
      for (const cell of cells) cell.replaceChildren();
      return entry.paint?.(cells, row);
    }
    cols.forEach((c, n) => {
      const cell = row.children[n] as HTMLElement;
      if (cell.classList.contains('is-editing')) return; // an editor plugin owns this cell until it finishes
      if (c.field === SEL) {
        const box = (cell.firstElementChild as HTMLInputElement | null) ?? cell.appendChild(h('input', 'op-grid__check', { type: 'checkbox', tabindex: -1, 'aria-label': t('gridSelectRow') }));
        box.checked = sel;
        return;
      }
      if (c.field === ACT) {
        const acts = this.config.rowActions ?? [];
        if (!this.visibleActions()) {
          if (!cell.firstChild) cell.append(h('button', 'op-grid__actbtn', { type: 'button', tabindex: -1, 'aria-label': t('gridRowActions'), 'aria-haspopup': 'menu' }, iconEl('more')));
          return;
        }
        if (cell.children.length !== acts.length || (cell.firstElementChild as HTMLElement | null)?.dataset.a == null) {
          cell.replaceChildren(...acts.map((a, k) => h('button', `op-grid__actbtn${a.variant === 'danger' ? ' is-danger' : ''}`, { type: 'button', tabindex: -1, 'data-a': k, 'aria-label': a.text, title: a.text }, a.icon ? iconEl(a.icon) : a.text)));
        }
        acts.forEach((a, k) => ((cell.children[k] as HTMLButtonElement).disabled = !!a.disabled?.(rec)));
        return;
      }
      const content = cellContent(c, rec);
      if (typeof content === 'string') cell.textContent = content;
      else cell.replaceChildren(content);
    });
    entry.paint?.(cells, row);
  }

  private indexOfEvent(e: Event): number {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.op-grid__body-row');
    return row ? Number(row.dataset.i) : -1;
  }

  private onRowEvent(e: MouseEvent, name: string) {
    const i = this.indexOfEvent(e);
    const rec = this.recAt(i);
    if (!rec) return;
    if (name === 'row-click') {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.op-grid__actbtn');
      if (btn) {
        if (btn.dataset.a == null) return this.openRowMenu(rec, btn);
        if (!btn.disabled) this.config.rowActions![Number(btn.dataset.a)].handler(rec, this);
        return;
      }
      this.setActive(i, false);
      this.pick(i, e);
    }
    this.emit(name, rec, i, e);
  }

  // ---- selection / keyboard ------------------------------------------------------------------

  getSelection(): Model<T>[] {
    return [...this.selected];
  }

  /** Selects a record or row index. `add` keeps the current selection (multi mode). */
  select(target: Model<T> | number, opts: { add?: boolean } = {}): void {
    const rec = typeof target === 'number' ? this.recAt(target) : target;
    const mode = this.mode();
    if (!rec || mode === 'none') return;
    if (mode === 'single' || !opts.add) this.selected.clear();
    this.selected.add(rec);
    this.changed();
  }

  deselectAll(): void {
    if (!this.selected.size) return;
    this.selected.clear();
    this.changed();
  }

  private changed() {
    this.v?.refresh();
    this.paintSelection();
    this.emit('select', this.getSelection());
  }

  /** Selects every record that matches the filters, across pages (a remote store: the loaded page). */
  selectAllFiltered(): void {
    if (this.mode() !== 'multi') return;
    for (const r of this.store.getFiltered()) this.selected.add(r);
    this.changed();
  }

  /** Click semantics: plain = replace, ctrl/meta = toggle, shift = range from the anchor (multi only). */
  private pick(i: number, e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) {
    const mode = this.mode();
    const rec = this.recAt(i);
    if (!rec || mode === 'none') return;
    if (mode === 'multi' && e.shiftKey && this.anchor >= 0) {
      if (!this.config.checkboxSelection) this.selected.clear();
      for (let k = Math.min(this.anchor, i); k <= Math.max(this.anchor, i); k++) {
        const r = this.recAt(k);
        if (r) this.selected.add(r);
      }
    } else if (mode === 'multi' && (e.ctrlKey || e.metaKey || this.config.checkboxSelection)) {
      if (!this.selected.delete(rec)) this.selected.add(rec);
      this.anchor = i;
    } else {
      this.selected.clear();
      this.selected.add(rec);
      this.anchor = i;
    }
    this.changed();
  }

  private setActive(i: number, scroll = true) {
    this.active = i;
    if (scroll && i >= 0) this.v.scrollTo(i);
    this.v.refresh();
    this.updateActiveDescendant();
  }

  private updateActiveDescendant() {
    if (this.active >= 0 && this.active < this.count()) this.table.setAttribute('aria-activedescendant', `${this.id}-r${this.active}`);
    else this.table.removeAttribute('aria-activedescendant');
  }

  focusRow(i: number) {
    this.render();
    this.setActive(Math.max(0, Math.min(i, this.count() - 1)));
    this.table.focus();
  }

  protected override focusEl(): HTMLElement {
    return this.table;
  }

  scrollToRow(i: number) {
    this.v?.scrollTo(i);
  }

  private onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.op-grid__header')) return; // header buttons keep their own keys
    if (target !== this.table && target.matches('input:not([type=checkbox]),textarea,select,[contenteditable]')) return; // an editor in a cell keeps its keys
    const n = this.count();
    if (!n) return;
    if ((e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) && this.active >= 0 && this.config.rowActions?.length) {
      e.preventDefault();
      const arec = this.recAt(this.active);
      if (!arec) return;
      return this.openRowMenu(arec, document.getElementById(`${this.id}-r${this.active}`) ?? this.el);
    }
    const page = Math.max(1, Math.floor((this.viewport.clientHeight || 400) / this.config.rowHeight! || 10));
    const cur = this.active < 0 ? 0 : this.active;
    const mode = this.mode();
    const targets: Record<string, number> = {
      ArrowDown: Math.min(n - 1, this.active < 0 ? 0 : cur + 1),
      ArrowUp: Math.max(0, cur - 1),
      Home: 0,
      End: n - 1,
      PageDown: Math.min(n - 1, cur + page),
      PageUp: Math.max(0, cur - page),
    };
    if (e.key in targets) {
      e.preventDefault();
      const to = targets[e.key];
      this.setActive(to);
      if (mode === 'single' || (mode === 'multi' && !e.ctrlKey && !e.metaKey && !this.config.checkboxSelection)) this.pick(to, e);
    } else if (e.key === ' ' && this.active >= 0) {
      e.preventDefault();
      if (mode === 'multi') this.pick(this.active, { ctrlKey: true });
      else this.pick(this.active, e);
    } else if (e.key === 'Enter' && this.active >= 0) {
      this.emit('row-activate', this.recAt(this.active), this.active);
    } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && mode === 'multi') {
      e.preventDefault();
      this.store.each((r) => this.selected.add(r));
      this.changed();
    }
  }

  refresh() {
    this.v?.refresh();
  }

  // ---- bar: bulk actions and the column menu ------------------------------------------------

  private buildBar() {
    const c = this.config;
    if (!this.barEl) return;
    this.bulkCount = h('span', 'op-grid__count', { 'aria-live': 'polite' });
    this.selectAllBtn = new Button({ text: '', variant: 'ghost', handler: () => this.selectAllFiltered() });
    this.bulkBtns = (c.bulkActions ?? []).map((a) => new Button({ text: a.text, icon: a.icon, variant: a.variant === 'danger' ? 'danger' : 'default', handler: () => a.handler(this.getSelection(), this) }));
    const clear = new Button({ text: t('gridClearSel'), variant: 'ghost', handler: () => this.deselectAll() });
    this.bulkEl!.append(this.bulkCount, this.selectAllBtn.el, ...this.bulkBtns.map((b) => b.el), clear.el);
    this.own(() => [this.selectAllBtn, ...this.bulkBtns, clear].forEach((b) => b?.destroy()));
    if (c.columnMenu) this.buildColumnMenu();
    this.paintSelection();
  }

  /** Header checkbox state and the bulk bar, from the current selection. */
  private paintSelection() {
    if (!this.rendered) return;
    const n = this.store.count;
    let k = 0;
    this.store.each((r) => this.selected.has(r) && k++);
    if (this.selAll) {
      this.selAll.checked = n > 0 && k === n;
      this.selAll.indeterminate = k > 0 && k < n;
    }
    if (!this.bulkEl) return;
    const size = this.selected.size;
    this.bulkEl.hidden = !size || !this.config.bulkActions?.length;
    if (this.bulkEl.hidden) return;
    this.bulkCount!.textContent = t('gridSelected', { n: size });
    const more = this.store.getFiltered().length;
    this.selectAllBtn!.el.hidden = !(this.mode() === 'multi' && k === n && more > n && size < more);
    this.selectAllBtn!.setText(t('gridSelectAll', { n: more }));
  }

  private openRowMenu(rec: Model<T>, btn: HTMLElement) {
    this.rowMenu ??= new Menu({});
    this.rowMenu.setItems((this.config.rowActions ?? []).map((a) => ({ text: a.text, icon: a.icon, disabled: !!a.disabled?.(rec), handler: () => a.handler(rec, this) })));
    this.rowMenu.showBy(btn);
  }
  private buildColumnMenu() {
    const btn = new Button({ text: t('gridColumns'), icon: 'columns', variant: 'ghost' });
    this.colSearch = new TextField({ placeholder: t('gridColumnSearch'), clearable: true });
    this.colChips = h('div', 'op-grid__colchips', { role: 'group', 'aria-label': t('gridGroups') });
    this.colList = h('div', 'op-grid__collist', { role: 'group', 'aria-label': t('gridColumns') });
    const none = h('div', 'op-grid__colempty', {}, t('gridNoColumns'));
    none.hidden = true;
    const panel = h('div', 'op-grid__colmenu', {}, this.colSearch.el, this.colChips, this.colList, none);
    this.colDd = new Dropdown({ anchor: btn.el, content: panel, placement: 'bottom-end', role: 'dialog', autoFocus: false });
    this.barEl!.append(btn.el);
    this.own(() => btn.destroy());
    /** Search text and the group chip decide what is listed; a search that names a group shows the whole group. */
    const filter = () => {
      const q = (this.colSearch!.getValue() ?? '').toLowerCase();
      let shown = 0;
      let head: HTMLElement | undefined;
      let rowsInGroup = 0;
      const closeGroup = () => head && (head.hidden = rowsInGroup === 0);
      for (const el of Array.from(this.colList!.children) as HTMLElement[]) {
        if (el.classList.contains('op-grid__colgroup')) {
          closeGroup();
          head = el;
          rowsInGroup = 0;
          continue;
        }
        const g = el.dataset.group ?? '';
        const byChip = !this.colGroup || g === this.colGroup;
        const byText = !q || g.toLowerCase().includes(q) || el.textContent!.toLowerCase().includes(q);
        el.hidden = !(byChip && byText);
        if (!el.hidden) (shown++, rowsInGroup++);
      }
      closeGroup();
      none.hidden = shown > 0;
    };
    this.colSearch.on('change', filter);
    this.listen(this.colChips, 'click', (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-g]');
      if (!b) return;
      this.colGroup = b.dataset.g!;
      this.paintColumnList();
      filter();
    });
    btn.on('click', () => {
      if (this.colDd!.isOpen()) return this.colDd!.close();
      this.colSearch!.setValue('');
      this.colGroup = '';
      this.paintColumnList();
      this.colDd!.open();
      this.colList!.querySelector<HTMLElement>('input')?.focus(); // not the search field: a phone keyboard would cover the list
    });
    this.listen(this.colList, 'change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.dataset.groupToggle != null) this.setColumnGroupVisible(input.dataset.groupToggle, input.checked);
      else {
        const col = this.config.columns.find((x) => x.field === input.value);
        if (!col) return;
        col.hidden = !input.checked;
        this.setColumns(this.config.columns);
        this.emit('columns-change', this.getColumnState());
      }
      this.paintColumnList();
      filter();
    });
  }

  private paintColumnList() {
    const cols = this.config.columns;
    const groups = this.getColumnGroups();
    const last = this.userCols().length === 1 ? this.userCols()[0] : null; // at least one column stays visible
    const row = (c: Column) => {
      const box = h('input', 'op-grid__check', { type: 'checkbox', value: c.field });
      box.checked = !c.hidden;
      box.disabled = c === last;
      return h('label', 'op-grid__colitem', { 'data-group': c.group ?? '' }, box, h('span', '', {}, c.header ?? c.field));
    };
    this.colChips!.hidden = groups.length < 2;
    this.colChips!.replaceChildren(...[['', t('gridGroupAll')], ...groups.map((g) => [g, g])].map(([g, label]) => h('button', `op-grid__colchip${this.colGroup === g ? ' is-on' : ''}`, { type: 'button', 'data-g': g, 'aria-pressed': String(this.colGroup === g) }, label)));
    if (!groups.length) return this.colList!.replaceChildren(...cols.map(row));
    const out: HTMLElement[] = [];
    for (const g of [...groups, '']) {
      const items = cols.filter((c) => (c.group ?? '') === g);
      if (!items.length) continue;
      const on = items.filter((c) => !c.hidden).length;
      const toggle = h('input', 'op-grid__check', { type: 'checkbox', 'data-group-toggle': g, 'aria-label': g || t('gridOtherCols') });
      toggle.checked = on === items.length;
      toggle.indeterminate = on > 0 && on < items.length;
      out.push(h('div', 'op-grid__colgroup', { 'data-group': g }, h('label', '', {}, toggle, h('span', '', {}, g || t('gridOtherCols'))), h('span', 'op-grid__colcount', {}, `${on}/${items.length}`)), ...items.map(row));
    }
    this.colList!.replaceChildren(...out);
  }

  protected override onDestroy() {
    this.pager?.destroy();
    this.rowMenu?.destroy();
    this.colDd?.destroy();
    this.colSearch?.destroy();
  }
}
register('grid', Grid);
