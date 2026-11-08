import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { Store } from '../../../data/store';
import type { Model } from '../../../data/model';
import { Pagination } from '../pagination/pagination';
import { stagger } from '../../../motion/core';

export interface DataViewConfig extends ComponentConfig {
  store?: Store<any>;
  /** Used when no `store` is given. */
  data?: Record<string, any>[];
  /** What one item shows. Text is escaped; return a Node for markup. */
  renderer: (rec: Model, index: number) => string | Node;
  selection?: 'none' | 'single' | 'multi';
  /** Minimum item width (CSS length): the columns adapt to the room there is. Default `10rem`. */
  itemWidth?: string;
  gap?: string;
  itemCls?: (rec: Model) => string;
  emptyText?: string;
  /** Items enter one after the other (30 ms apart, motion rule 3) when the data loads, the page or filter changes. Default true. */
  stagger?: boolean;
  /** A Pagination bar bound to the store. */
  paging?: boolean;
  pageSize?: number;
}

/** A Store as a responsive grid of cards: selection, 2-D keyboard navigation, per-item actions and optional paging. */
export class DataView extends Component<DataViewConfig> {
  protected override baseCls = 'op-dataview';
  private store!: Store<any>;
  private itemsEl!: HTMLElement;
  private emptyEl!: HTMLElement;
  private pager?: Pagination;
  private selected = new Set<Model>();
  private active = 0;
  private anchor = -1;
  private offStore?: () => void;

  protected override build() {
    const c = this.config;
    const el = h('div', this.baseCls, { role: 'listbox', 'aria-multiselectable': c.selection === 'multi' ? 'true' : null });
    this.itemsEl = h('div', 'op-dataview__items');
    this.emptyEl = h('div', 'op-dataview__empty');
    el.append(this.itemsEl, this.emptyEl);
    if (c.itemWidth) el.style.setProperty('--op-dataview-item-width', c.itemWidth);
    if (c.gap) el.style.setProperty('--op-dataview-gap', c.gap);
    if (c.paging) {
      this.pager = new Pagination({ cls: 'op-dataview__pager' });
      el.append(this.pager.el);
    }
    return el;
  }

  protected override onRender() {
    const c = this.config;
    this.bindStore(c.store ?? new Store({ data: c.data ?? [] }));
    this.listen(this.itemsEl, 'click', (e: MouseEvent) => this.onClick(e, 'item-click'));
    this.listen(this.itemsEl, 'dblclick', (e: MouseEvent) => this.onClick(e, 'item-dblclick'));
    this.listen(this.itemsEl, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.listen(this.itemsEl, 'focusin', (e: Event) => {
      const i = this.indexOf(e);
      if (i >= 0) this.setActive(i, false);
    });
    if (this.pager) {
      this.pager.setStore(this.store);
      if (!this.store.pageSize) this.store.setPageSize(c.pageSize ?? 24);
    }
    this.own(() => this.pager?.destroy());
    this.paint(true);
  }

  override notifyMount() {
    super.notifyMount();
    this.pager?.notifyMount();
  }

  // ---- store -----------------------------------------------------------------------------------

  private bindStore(store: Store<any>) {
    this.offStore?.();
    this.store = store;
    const a = store.subscribe((c) => this.rendered && this.paint(['load', 'page', 'filter', 'sort'].includes(c.type)));
    const b = store.on('loading', (on: boolean) => this.setLoading(on));
    this.offStore = () => (a(), b());
    this.own(() => this.offStore?.());
  }

  setStore(store: Store<any>) {
    this.config.store = store;
    this.selected.clear();
    this.active = 0;
    if (!this.rendered) return;
    this.bindStore(store);
    this.pager?.setStore(store);
    this.paint();
  }
  getStore(): Store<any> {
    this.render();
    return this.store;
  }

  // ---- rendering -------------------------------------------------------------------------------

  private paint(animate = false) {
    const c = this.config;
    for (const r of this.selected) if (this.store.indexOf(r) < 0) this.selected.delete(r);
    this.active = Math.min(this.active, Math.max(0, this.store.count - 1));
    const mode = c.selection ?? 'single';
    this.itemsEl.replaceChildren(
      ...this.store.getRange().map((rec, i) => {
        const item = h('div', `op-dataview__item${this.selected.has(rec) ? ' is-selected' : ''}${i === this.active ? ' is-active' : ''}${c.itemCls ? ` ${c.itemCls(rec)}` : ''}`, {
          role: 'option', id: `${this.id}-i${i}`, 'data-i': i, tabindex: i === this.active ? 0 : -1, 'aria-selected': mode === 'none' ? null : String(this.selected.has(rec)),
        });
        item.append(c.renderer(rec, i));
        return item;
      }),
    );
    if (animate && c.stagger !== false) void stagger(this.items(), { dy: 8 });
    this.emptyEl.textContent = c.emptyText ?? t('empty');
    this.emptyEl.hidden = this.store.count > 0;
    this.el.classList.toggle('is-empty', this.store.count === 0);
  }

  /** Redraws the items (after a field of a record changed). */
  refresh() {
    if (this.rendered) this.paint();
  }

  private items(): HTMLElement[] {
    return Array.from(this.itemsEl.children) as HTMLElement[];
  }
  private indexOf(e: Event): number {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.op-dataview__item');
    return el ? Number(el.dataset.i) : -1;
  }

  /** How many items fit in a row now (items that share the first one's top edge). */
  columns(): number {
    const els = this.items();
    if (!els.length) return 1;
    return Math.max(1, els.filter((el) => el.offsetTop === els[0].offsetTop).length);
  }

  // ---- selection -------------------------------------------------------------------------------

  getSelection(): Model[] {
    return [...this.selected];
  }

  select(target: Model | number, opts: { add?: boolean } = {}) {
    const rec = typeof target === 'number' ? this.store.getAt(target) : target;
    const mode = this.config.selection ?? 'single';
    if (!rec || mode === 'none') return;
    if (mode === 'single' || !opts.add) this.selected.clear();
    this.selected.add(rec);
    this.changed();
  }
  selectAll() {
    if (this.config.selection !== 'multi') return;
    this.store.each((r) => this.selected.add(r));
    this.changed();
  }
  deselectAll() {
    if (!this.selected.size) return;
    this.selected.clear();
    this.changed();
  }

  private changed() {
    this.paintSelection();
    this.emit('select', this.getSelection());
  }
  private paintSelection() {
    this.items().forEach((el, i) => {
      const on = this.selected.has(this.store.getAt(i)!);
      el.classList.toggle('is-selected', on);
      if ((this.config.selection ?? 'single') !== 'none') el.setAttribute('aria-selected', String(on));
    });
  }

  /** Click semantics: plain = replace, Ctrl/⌘ = toggle, Shift = range from the anchor (multi only). */
  private pick(i: number, e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) {
    const mode = this.config.selection ?? 'single';
    const rec = this.store.getAt(i);
    if (!rec || mode === 'none') return;
    if (mode === 'multi' && e.shiftKey && this.anchor >= 0) {
      this.selected.clear();
      for (const r of this.store.getRange(Math.min(this.anchor, i), Math.max(this.anchor, i) + 1)) this.selected.add(r);
    } else if (mode === 'multi' && (e.ctrlKey || e.metaKey)) {
      if (!this.selected.delete(rec)) this.selected.add(rec);
      this.anchor = i;
    } else {
      this.selected.clear();
      this.selected.add(rec);
      this.anchor = i;
    }
    this.changed();
  }

  private onClick(e: MouseEvent, name: string) {
    const i = this.indexOf(e);
    const rec = this.store.getAt(i);
    if (!rec) return;
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-op-action]');
    if (action) {
      if (name === 'item-click') this.emit('item-action', action.dataset.opAction, rec, e);
      return; // a button inside the card is not a selection
    }
    if (name === 'item-click') {
      this.setActive(i, false);
      this.pick(i, e);
    }
    this.emit(name, rec, i, e);
  }

  // ---- focus and keyboard ----------------------------------------------------------------------

  private setActive(i: number, focus = true) {
    this.active = i;
    this.items().forEach((el, n) => {
      el.tabIndex = n === i ? 0 : -1;
      el.classList.toggle('is-active', n === i);
    });
    if (focus) this.items()[i]?.focus();
    this.emit('active-change', i);
  }
  focusItem(i: number) {
    this.render();
    this.setActive(Math.max(0, Math.min(i, this.store.count - 1)));
  }

  private onKey(e: KeyboardEvent) {
    const n = this.store.count;
    if (!n) return;
    const cols = this.columns();
    const rows = Math.max(1, Math.floor(this.el.clientHeight / Math.max(1, this.items()[0]?.offsetHeight ?? 1)) || 3);
    const cur = this.active;
    const to: Record<string, number> = {
      ArrowRight: Math.min(n - 1, cur + 1), ArrowLeft: Math.max(0, cur - 1),
      ArrowDown: Math.min(n - 1, cur + cols), ArrowUp: Math.max(0, cur - cols),
      Home: 0, End: n - 1, PageDown: Math.min(n - 1, cur + cols * rows), PageUp: Math.max(0, cur - cols * rows),
    };
    const mode = this.config.selection ?? 'single';
    if (e.key in to) {
      e.preventDefault();
      this.setActive(to[e.key]);
      if (mode === 'multi' && e.shiftKey) this.pick(to[e.key], { shiftKey: true });
      else if (mode === 'single' && !e.ctrlKey) this.pick(to[e.key], {});
      if (mode === 'multi' && e.shiftKey && this.anchor < 0) this.anchor = cur;
    } else if (e.key === ' ') {
      e.preventDefault();
      this.pick(cur, mode === 'multi' ? { ctrlKey: true } : {});
    } else if (e.key === 'Enter') {
      this.emit('item-activate', this.store.getAt(cur), cur);
    } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && mode === 'multi') {
      e.preventDefault();
      this.selectAll();
    }
  }

  protected override onDestroy() {
    this.pager?.destroy();
  }
}
register('dataview', DataView);
