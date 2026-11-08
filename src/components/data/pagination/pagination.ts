import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h, clamp } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';
import type { Store } from '../../../data/store';

export interface PaginationConfig extends ComponentConfig {
  /** Reads and drives the store's page. Without it, use `total`/`pageSize`/`page`. */
  store?: Store<any>;
  total?: number;
  pageSize?: number;
  page?: number;
  /** Page buttons shown on each side of the current one. Default 1. */
  siblings?: number;
  showInfo?: boolean;
}

export class Pagination extends Component<PaginationConfig> {
  protected override baseCls = 'op-pagination';
  protected override tag = 'nav' as const;
  private unsub?: () => void;

  protected override onRender() {
    this.el.setAttribute('aria-label', t('pageLabel'));
    this.listen(this.el, 'click', (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-page]');
      if (b && !b.disabled) this.setPage(Number(b.dataset.page));
    });
    this.bindStore(this.config.store);
    this.own(() => this.unsub?.());
    this.paint();
  }

  private bindStore(store?: Store<any>) {
    this.unsub?.();
    this.unsub = store?.subscribe(() => this.paint());
  }

  getPage(): number {
    return this.config.store?.page ?? this.config.page ?? 1;
  }
  private size(): number {
    return this.config.store?.pageSize || this.config.pageSize || 20;
  }
  private total(): number {
    return this.config.store?.totalCount ?? this.config.total ?? 0;
  }
  private pages(): number {
    return Math.max(1, Math.ceil(this.total() / this.size()));
  }

  /** Goes to a page (`before-page-change` can cancel), updating the store when there is one. */
  setPage(page: number): void {
    page = clamp(page, 1, this.pages());
    if (page === this.getPage() || this.emit('before-page-change', page) === false) return;
    if (this.config.store) this.config.store.setPage(page);
    else {
      this.config.page = page;
      this.paint();
    }
    this.emit('page-change', page);
  }
  setTotal(total: number) {
    this.config.total = total;
    this.paint();
  }
  setPageSize(size: number) {
    this.config.pageSize = size;
    this.paint();
  }
  setStore(store: Store<any>) {
    this.config.store = store;
    this.bindStore(store);
    this.paint();
  }

  /** Page numbers with `null` where a gap is collapsed: 1 … 4 5 6 … 20. */
  private window(): Array<number | null> {
    const last = this.pages();
    const cur = this.getPage();
    const s = this.config.siblings ?? 1;
    if (last <= s * 2 + 5) return Array.from({ length: last }, (_, i) => i + 1); // small sets: no gaps
    const set = new Set([1, last, ...Array.from({ length: s * 2 + 1 }, (_, i) => cur - s + i)].filter((n) => n >= 1 && n <= last));
    const out: Array<number | null> = [];
    let prev = 0;
    for (const n of [...set].sort((a, b) => a - b)) {
      if (n - prev > 1) out.push(n - prev === 2 ? n - 1 : null);
      out.push(n);
      prev = n;
    }
    return out;
  }

  private paint() {
    if (!this.rendered) return;
    const cur = this.getPage();
    const last = this.pages();
    const btn = (page: number, content: Node | string, label: string, disabled = false, current = false) =>
      h('button', `op-button op-button--ghost op-pagination__btn${current ? ' is-current' : ''}`, { type: 'button', 'data-page': page, 'aria-label': label, 'aria-current': current ? 'page' : null, disabled }, content);
    const nodes: Node[] = [
      btn(1, iconEl('chevrons-left'), t('pageFirst'), cur === 1),
      btn(cur - 1, iconEl('chevron-left'), t('pagePrev'), cur === 1),
      ...this.window().map((n) => (n == null ? h('span', 'op-pagination__gap', { 'aria-hidden': 'true' }, '…') : btn(n, String(n), t('pageGoto', { n }), false, n === cur))),
      btn(cur + 1, iconEl('chevron-right'), t('pageNext'), cur === last),
      btn(last, iconEl('chevrons-right'), t('pageLast'), cur === last),
    ];
    if (this.config.showInfo !== false) {
      const total = this.total();
      const size = this.size();
      nodes.push(h('span', 'op-pagination__info', {}, total ? t('pageInfo', { from: (cur - 1) * size + 1, to: Math.min(cur * size, total), total }) : ''));
    }
    const focusPage = this.el.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.page : undefined;
    this.el.replaceChildren(...nodes);
    if (focusPage) this.el.querySelector<HTMLElement>(`[data-page="${focusPage}"]:not(:disabled)`)?.focus();
  }
}
register('pagination', Pagination);
