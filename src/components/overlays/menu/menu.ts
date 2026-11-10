import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { roving } from '../../../core/focus';
import type { Placement } from '../../../core/position';
import { iconEl } from '../../base/icon/icon';
import { Dropdown } from '../dropdown/dropdown';
import { stagger } from '../../../motion/core';

export interface MenuItem {
  text?: string;
  icon?: string;
  handler?: (item: MenuItem) => void;
  disabled?: boolean;
  /** Present (true/false) makes it a checkable item. */
  checked?: boolean;
  items?: MenuEntry[];
  /** Items with the same group sit together under its name (ungrouped items come first). */
  group?: string;
  /** A count or short label at the end of the row. */
  badge?: string | number;
}
export type MenuEntry = MenuItem | '-';

export interface MenuConfig extends ComponentConfig {
  items?: MenuEntry[];
  /** A search field over the items: filters as you type; a search that names a group shows the whole group. */
  search?: boolean;
}

const ITEM = '.op-menu__item';

/** Floating menu with submenus. Use `showBy(button)` for button menus and `showAt(x, y)` for context menus. */
export class Menu extends Component<MenuConfig> {
  protected override baseCls = 'op-menu';
  parentMenu?: Menu;
  private dd?: Dropdown;
  private sub?: Menu;
  private subOwner?: HTMLElement;
  private opener: Element | null = null;
  private hoverCancel?: () => void;
  /** The `role=menu` element: the root itself, or a list under the search field. */
  private list!: HTMLElement;
  private searchEl?: HTMLInputElement;
  private emptyEl?: HTMLElement;

  protected override build() {
    return h('div', 'op-menu');
  }

  /** Without search the root is the menu; with it, the root holds the field, the menu and the "no results" line. */
  private shell() {
    const on = !!this.config.search;
    if (on && !this.searchEl) {
      this.searchEl = h('input', 'op-menu__search', { type: 'search', placeholder: `${t('search')}…`, 'aria-label': t('search'), autocomplete: 'off' });
      this.emptyEl = h('div', 'op-menu__empty', {}, t('noResults'));
      this.listen(this.searchEl, 'input', () => this.filter());
      this.listen(this.searchEl, 'keydown', (e: KeyboardEvent) => {
        const first = this.first();
        if (first && (e.key === 'ArrowDown' || e.key === 'Enter')) (e.preventDefault(), e.key === 'Enter' ? this.activate(first) : first.focus());
      });
    }
    this.list = on ? (this.list !== this.el && this.list) || h('div', 'op-menu__list', { role: 'menu' }) : this.el;
    this.el.setAttribute('role', on ? 'none' : 'menu');
    if (on) this.el.replaceChildren(this.searchEl!, this.list, this.emptyEl!);
  }

  private first(): HTMLElement | null {
    return this.list.querySelector<HTMLElement>(`${ITEM}:not([hidden]):not([aria-disabled=true])`);
  }

  /** Hides the items that do not match the search (a group whose name matches keeps all of them); empty groups hide in CSS. */
  private filter() {
    const q = (this.searchEl?.value ?? '').trim().toLowerCase();
    this.el.classList.toggle('is-searching', !!q);
    for (const row of Array.from(this.list.querySelectorAll<HTMLElement>(ITEM))) {
      const group = row.parentElement!.getAttribute('aria-label') ?? '';
      row.hidden = !!q && !`${group}\n${row.textContent}`.toLowerCase().includes(q);
    }
    if (this.emptyEl) this.emptyEl.hidden = !!this.first() || !this.list.querySelector(ITEM);
  }

  protected override onRender() {
    this.shell();
    this.renderItems();
    const rover = roving(this.el, { selector: ITEM, orientation: 'vertical' });
    this.own(() => rover.destroy());
    this.listen(this.el, 'click', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>(ITEM);
      if (row) this.activate(row);
    });
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>(ITEM);
      if (e.target === this.searchEl) return;
      if (e.key === 'Tab') return this.closeAll();
      // type to search: a printable key on an item goes to the search field
      if (this.searchEl && e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.searchEl.focus();
        this.searchEl.value += e.key;
        return this.filter();
      }
      if (!row) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.activate(row);
      } else if (e.key === 'ArrowRight' && row.getAttribute('aria-haspopup')) {
        e.preventDefault();
        this.openSub(row, true);
      } else if (e.key === 'ArrowLeft' && this.parentMenu) {
        e.preventDefault();
        this.hide();
      }
    });
    this.listen(this.el, 'pointerover', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>(ITEM);
      if (!row || row.getAttribute('aria-disabled') === 'true') return;
      this.hoverCancel?.();
      row.focus();
      if (row.getAttribute('aria-haspopup')) this.hoverCancel = this.later(() => this.openSub(row, false), 150);
      else this.sub?.hide();
    });
  }

  private entries(): MenuEntry[] {
    return this.config.items ?? [];
  }

  private renderItems() {
    const entries = this.entries();
    const rows = entries.map((it, i) => {
        if (it === '-') return h('div', 'op-menu__sep', { role: 'separator' });
        const checkable = it.checked !== undefined;
        const row = h('div', 'op-menu__item', {
          role: checkable ? 'menuitemcheckbox' : 'menuitem',
          tabindex: -1,
          'data-i': i,
          'aria-disabled': it.disabled ? 'true' : null,
          'aria-checked': checkable ? String(!!it.checked) : null,
          'aria-haspopup': it.items ? 'menu' : null,
          'aria-expanded': it.items ? 'false' : null,
        });
        row.append(h('span', 'op-menu__icon', {}, it.icon ? iconEl(it.icon) : checkable && it.checked ? iconEl('check') : null), h('span', 'op-menu__text', {}, it.text ?? ''));
        if (it.badge != null && it.badge !== '') row.append(h('span', 'op-menu__badge', {}, String(it.badge)));
        if (it.items) row.append(h('span', 'op-menu__arrow', {}, iconEl('chevron-right')));
        return row;
      });
    const groupOf = (i: number) => (entries[i] === '-' ? '' : ((entries[i] as MenuItem).group ?? ''));
    const groups = [...new Set(entries.map((_, i) => groupOf(i)).filter(Boolean))];
    if (!groups.length) return (this.list.replaceChildren(...rows), this.filter());
    // ungrouped entries first, then one role=group per name (its header is only visual: the group carries the name)
    this.list.replaceChildren(
      ...rows.filter((_, i) => !groupOf(i)),
      ...groups.map((g) => h('div', 'op-menu__group', { role: 'group', 'aria-label': g }, h('div', 'op-menu__group-label', { 'aria-hidden': 'true' }, g), ...rows.filter((_, i) => groupOf(i) === g))),
    );
    this.filter();
  }

  setItems(items: MenuEntry[]) {
    this.config.items = items;
    if (this.rendered) this.renderItems();
  }

  /** Turns the search field on or off. */
  setSearch(search: boolean) {
    this.config.search = search;
    if (!this.rendered) return;
    this.shell();
    this.renderItems();
  }

  private activate(row: HTMLElement) {
    const item = this.entries()[Number(row.dataset.i)] as MenuItem;
    if (!item || item.disabled) return;
    if (item.items) return this.openSub(row, true);
    if (item.checked !== undefined) item.checked = !item.checked;
    item.handler?.(item);
    this.root().emit('click', item);
    this.root().hide();
  }

  private root(): Menu {
    return this.parentMenu ? this.parentMenu.root() : this;
  }

  private openSub(row: HTMLElement, focus: boolean) {
    const item = this.entries()[Number(row.dataset.i)] as MenuItem;
    if (this.sub && this.subOwner === row && this.sub.isOpen()) return focus ? this.sub.focusFirst() : undefined;
    this.sub?.destroy();
    this.sub = new Menu({ items: item.items });
    this.sub.parentMenu = this;
    this.subOwner = row;
    this.sub.on('hide', () => row.setAttribute('aria-expanded', 'false'));
    row.setAttribute('aria-expanded', 'true');
    this.sub.showBy(row, 'right-start', focus);
  }

  isOpen(): boolean {
    return !!this.dd?.isOpen();
  }

  private focusFirst() {
    this.first()?.focus(); // never the search field on open: a phone keyboard would cover the menu
  }

  showBy(anchor: HTMLElement | Component, placement: Placement = 'bottom-start', focus = true) {
    this.open({ anchor, placement }, focus);
  }

  showAt(x: number, y: number) {
    this.open({ anchor: { x, y }, placement: 'bottom-start' }, true);
  }

  private open(cfg: { anchor: HTMLElement | Component | { x: number; y: number }; placement: Placement }, focus: boolean) {
    this.opener = document.activeElement;
    if (!this.dd) {
      this.dd = new Dropdown({ ...cfg, content: this.el, role: 'presentation', flip: true });
      this.dd.on('close', () => {
        this.sub?.hide();
        this.emit('hide');
      });
    } else {
      this.dd.setAnchor(cfg.anchor);
      this.dd.setPlacement(cfg.placement);
    }
    if (this.searchEl && this.config.search) {
      this.searchEl.value = '';
      this.filter();
    }
    this.dd.open();
    void stagger(Array.from(this.el.querySelectorAll(ITEM)), { dy: 4 }); // the rows settle one after the other
    if (focus) this.focusFirst();
    this.emit('show');
  }

  override hide() {
    if (!this.dd?.isOpen()) return;
    this.dd.close();
    // Closing a submenu returns to its parent item; closing the root returns to whatever opened it.
    const back = this.parentMenu ? this.parentMenu.subOwner : this.opener;
    if (back instanceof HTMLElement && back.isConnected) back.focus();
  }

  closeAll() {
    this.root().hide();
  }

  protected override onDestroy() {
    this.sub?.destroy();
    this.dd?.destroy();
  }
}
register('menu', Menu);
