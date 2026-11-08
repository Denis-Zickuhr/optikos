import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
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
}
export type MenuEntry = MenuItem | '-';

export interface MenuConfig extends ComponentConfig {
  items?: MenuEntry[];
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

  protected override build() {
    return h('div', 'op-menu', { role: 'menu' });
  }

  protected override onRender() {
    this.renderItems();
    const rover = roving(this.el, { selector: ITEM, orientation: 'vertical' });
    this.own(() => rover.destroy());
    this.listen(this.el, 'click', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>(ITEM);
      if (row) this.activate(row);
    });
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>(ITEM);
      if (e.key === 'Tab') return this.closeAll();
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
    this.el.replaceChildren(
      ...this.entries().map((it, i) => {
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
        if (it.items) row.append(h('span', 'op-menu__arrow', {}, iconEl('chevron-right')));
        return row;
      }),
    );
  }

  setItems(items: MenuEntry[]) {
    this.config.items = items;
    if (this.rendered) this.renderItems();
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
    this.el.querySelector<HTMLElement>(`${ITEM}:not([aria-disabled=true])`)?.focus();
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
