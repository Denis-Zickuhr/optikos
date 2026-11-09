import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';
import { Menu } from '../../overlays/menu/menu';

addMessages('en', {
  breadcrumb: 'Breadcrumb',
  breadcrumbMore: 'Show more',
});
addMessages('pt-BR', {
  breadcrumb: 'Trilha de navegação',
  breadcrumbMore: 'Mostrar mais',
});

export interface BreadcrumbItem {
  text: string;
  icon?: string;
  /** Renders a real link (native navigation, middle-click, copy link). */
  href?: string;
  handler?: (item: BreadcrumbItem) => void;
}

export interface BreadcrumbConfig extends ComponentConfig {
  items?: BreadcrumbItem[];
  /** More items than this collapse the middle into a "…" menu. Minimum 3, default 4. */
  maxItems?: number;
  separator?: string;
}

export class Breadcrumb extends Component<BreadcrumbConfig> {
  protected override baseCls = 'op-breadcrumb';
  protected override tag = 'nav' as const;
  private list!: HTMLElement;
  private menu?: Menu;

  protected override onRender() {
    this.list = h('ol', 'op-breadcrumb__list');
    this.el.append(this.list);
    if (!this.config.ariaLabel) this.el.setAttribute('aria-label', t('breadcrumb'));
    if (this.config.separator != null) this.setSeparator(this.config.separator);
    this.listen(this.list, 'click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.op-breadcrumb__more')) return this.showHidden(target.closest('button')!);
      const el = target.closest<HTMLElement>('[data-i]');
      if (el) this.go(Number(el.dataset.i), e);
    });
    this.own(() => this.menu?.destroy());
    this.paint();
  }

  private items(): BreadcrumbItem[] {
    return this.config.items ?? [];
  }

  /** Indexes hidden behind the "…" button (empty when everything fits). */
  private collapsed(): number[] {
    const n = this.items().length;
    const max = Math.max(3, this.config.maxItems ?? 4);
    if (n <= max) return [];
    return Array.from({ length: n - (max - 1) }, (_, i) => i + 1);
  }

  private paint() {
    const items = this.items();
    const hidden = this.collapsed();
    const last = items.length - 1;
    const lis: HTMLElement[] = [];
    items.forEach((item, i) => {
      if (hidden.includes(i)) {
        if (i === hidden[0]) lis.push(h('li', '', {}, h('button', 'op-breadcrumb__more', { type: 'button', 'aria-label': t('breadcrumbMore'), 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, '…')));
        return;
      }
      const content = [item.icon ? iconEl(item.icon) : null, item.text];
      const node =
        i === last
          ? h('span', 'op-breadcrumb__current', { 'aria-current': 'page' }, ...content)
          : item.href
            ? h('a', 'op-breadcrumb__item', { href: item.href, 'data-i': i }, ...content)
            : h('button', 'op-breadcrumb__item', { type: 'button', 'data-i': i }, ...content);
      lis.push(h('li', '', {}, node));
    });
    this.list.replaceChildren(...lis);
  }

  /** Runs `before-navigate` / handler / `navigate`. Returns false when cancelled. */
  private go(i: number, e?: Event): boolean {
    const item = this.items()[i];
    if (!item || i === this.items().length - 1) return false;
    if (this.emit('before-navigate', item, i) === false) {
      e?.preventDefault();
      return false;
    }
    item.handler?.(item);
    this.emit('navigate', item, i);
    return true;
  }

  private showHidden(button: HTMLElement) {
    const items = this.items();
    this.menu ??= new Menu({});
    this.menu.setItems(
      this.collapsed().map((i) => ({
        text: items[i].text,
        icon: items[i].icon,
        handler: () => {
          if (this.go(i) && items[i].href) location.href = items[i].href!;
        },
      })),
    );
    this.menu.on('show', () => button.setAttribute('aria-expanded', 'true'));
    this.menu.on('hide', () => button.setAttribute('aria-expanded', 'false'));
    this.menu.showBy(button);
  }

  setItems(items: BreadcrumbItem[]) {
    this.config.items = items;
    if (this.rendered) this.paint();
  }

  setMaxItems(max: number) {
    this.config.maxItems = max;
    if (this.rendered) this.paint();
  }

  /** Any text, e.g. `'/'` or `'›'`. */
  setSeparator(separator: string) {
    this.config.separator = separator;
    if (this.rendered) this.el.style.setProperty('--op-breadcrumb-separator', JSON.stringify(separator));
  }
}
register('breadcrumb', Breadcrumb);
