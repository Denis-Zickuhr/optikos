import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { virtualize, measure } from '../../../core/virtual';

export interface ListItem {
  value: unknown;
  label: string;
  disabled?: boolean;
  /** Secondary text at the end of the row (e.g. the record id). */
  hint?: string;
  /** The original option/record this item was built from. */
  raw?: unknown;
}

export interface ListBoxConfig extends ComponentConfig {
  items?: ListItem[];
  selected?: unknown;
  emptyText?: string;
  maxHeight?: number | string;
  /** Custom cell content; default is the label (with `highlight` applied). */
  renderer?: (item: ListItem) => string | Node;
  /** Text to mark inside labels (the search term). */
  highlight?: string;
}

const ROW = 'var(--op-listbox-row-height, var(--op-row-height))';

/**
 * Virtualized list of options. It never takes focus: the owner keeps it (a combobox input) and points
 * `aria-activedescendant` at `getActiveId()`.
 */
export class ListBox extends Component<ListBoxConfig> {
  protected override baseCls = 'op-listbox';
  private items: ListItem[];
  private active = -1;
  private v?: ReturnType<typeof virtualize>;
  private emptyEl!: HTMLElement;

  constructor(config: ListBoxConfig = {}) {
    super(config);
    this.items = config.items ?? [];
  }

  protected override build() {
    const el = h('div', 'op-listbox', { role: 'listbox', tabindex: -1 });
    if (this.config.maxHeight != null) el.style.maxHeight = typeof this.config.maxHeight === 'number' ? `${this.config.maxHeight}px` : this.config.maxHeight;
    this.emptyEl = h('div', 'op-listbox__empty');
    el.append(this.emptyEl);
    return el;
  }

  protected override onRender() {
    this.v = virtualize({
      scroller: this.el,
      count: this.items.length,
      rowHeight: measure(this.el, ROW) || 32,
      render: (row, i) => this.renderRow(row, i),
      rowCls: 'op-listbox__item',
    });
    this.own(() => this.v?.destroy());
    this.setEmptyText(this.config.emptyText ?? t('noResults'));
    // keep focus in the owner field
    this.listen(this.el, 'mousedown', (e: Event) => e.preventDefault());
    this.listen(this.el, 'click', (e: Event) => {
      const i = this.indexOf(e.target as HTMLElement);
      if (i >= 0) this.activate(i);
    });
    this.listen(this.el, 'mousemove', (e: Event) => {
      const i = this.indexOf(e.target as HTMLElement);
      if (i >= 0 && i !== this.active && !this.items[i].disabled) this.setActive(i, false);
    });
    this.updateEmpty();
  }

  private indexOf(target: HTMLElement): number {
    const row = target.closest<HTMLElement>('.op-listbox__item');
    return row ? Number(row.dataset.i) : -1;
  }

  private renderRow(row: HTMLElement, i: number) {
    const item = this.items[i];
    const c = this.config;
    row.id = `${this.id}-opt-${i}`;
    row.dataset.i = String(i);
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(this.isSelected(item)));
    if (item.disabled) row.setAttribute('aria-disabled', 'true');
    else row.removeAttribute('aria-disabled');
    row.classList.toggle('is-active', i === this.active);
    row.classList.toggle('is-selected', this.isSelected(item));
    row.classList.toggle('is-disabled', !!item.disabled);
    const hint = item.hint ? [h('span', 'op-listbox__hint', {}, item.hint)] : [];
    if (c.renderer) return row.replaceChildren(c.renderer(item) as Node, ...hint);
    const hl = c.highlight?.trim();
    const at = hl ? item.label.toLowerCase().indexOf(hl.toLowerCase()) : -1;
    if (at < 0) return row.replaceChildren(item.label, ...hint);
    row.replaceChildren(item.label.slice(0, at), h('mark', 'op-listbox__mark', {}, item.label.slice(at, at + hl!.length)), item.label.slice(at + hl!.length), ...hint);
  }

  private isSelected(item: ListItem) {
    return this.config.selected !== undefined && item.value === this.config.selected;
  }

  private updateEmpty() {
    this.emptyEl.hidden = this.items.length > 0;
  }

  // ---- API -----------------------------------------------------------------------------------

  getItems(): ListItem[] {
    return this.items;
  }

  setItems(items: ListItem[]) {
    this.items = items;
    this.config.items = items;
    this.active = -1;
    if (!this.rendered) return;
    this.v!.setCount(items.length);
    this.updateEmpty();
  }

  setSelected(value: unknown) {
    this.config.selected = value;
    this.v?.refresh();
  }

  setHighlight(text: string) {
    this.config.highlight = text;
    this.v?.refresh();
  }

  setEmptyText(text: string) {
    this.config.emptyText = text;
    if (this.rendered) this.emptyEl.textContent = text;
  }

  /** Re-measures the row height and redraws (call after the list becomes visible). */
  refresh() {
    if (!this.rendered) return;
    const h = measure(this.el, ROW);
    if (h) this.v!.setRowHeight(h);
    else this.v!.refresh();
  }

  setActive(index: number, scroll = true) {
    const item = this.items[index];
    if (index < -1 || index >= this.items.length || (item && item.disabled)) return;
    this.active = index;
    if (scroll && index >= 0) this.v?.scrollTo(index);
    this.v?.refresh();
    this.emit('active-change', item, index);
  }

  /** Moves the active item by `delta`, skipping disabled ones and wrapping around. */
  moveActive(delta: number) {
    const n = this.items.length;
    if (!n) return;
    let i = this.active;
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n;
      if (i < 0) i += n;
      if (!this.items[i].disabled) return this.setActive(i);
    }
  }

  getActive(): ListItem | undefined {
    return this.items[this.active];
  }
  getActiveIndex(): number {
    return this.active;
  }
  getActiveId(): string {
    return this.active >= 0 ? `${this.id}-opt-${this.active}` : '';
  }

  /** Picks the item at `index` (default: the active one) and emits `select`. */
  activate(index = this.active) {
    const item = this.items[index];
    if (item && !item.disabled) this.emit('select', item, index);
  }

  scrollTo(index: number) {
    this.v?.scrollTo(index);
  }
}
register('listbox', ListBox);
