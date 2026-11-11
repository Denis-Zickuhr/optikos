import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h, px } from '../../../core/dom';
import { gate } from '../../../core/permission';
import { iconEl } from '../../base/icon/icon';
import { Menu, type MenuEntry } from '../../overlays/menu/menu';

export interface NavItem {
  id: string;
  text: string;
  icon?: string;
  badge?: string | number;
  items?: NavItem[];
  disabled?: boolean;
  hidden?: boolean;
  /** Hidden (or disabled) while `setPermissionResolver` denies it. */
  permission?: string;
  /** Groups: start open. */
  expanded?: boolean;
  data?: unknown;
}

export interface NavMenuConfig extends ComponentConfig {
  items?: NavItem[];
  /** id of the active leaf. */
  active?: string;
  /** Rail: icons only. */
  collapsed?: boolean;
  /** Width (px or CSS) the parent container takes while collapsed, and gives back on expand: the sidebar follows the rail. */
  railWidth?: number | string;
  /** Opening a group closes the others at its level. */
  accordion?: boolean;
}

/** Sidebar tree: groups that open and close, one active leaf, badges, rail mode, filter and the APG tree keyboard model. */
export class NavMenu extends Component<NavMenuConfig> {
  protected override baseCls = 'op-navmenu';
  protected override tag = 'nav' as const;
  private items: NavItem[] = [];
  private open = new Set<string>();
  private active?: string;
  private query = '';
  private focusId?: string;
  private root!: HTMLElement;
  /** Rail mode: the floating menu of a group, and the group it belongs to. */
  private flyout?: Menu;
  private flyoutOf?: string;
  private hoverTimer?: () => void;
  private parentWidth?: string;

  protected override onRender() {
    const c = this.config;
    this.items = gate(c.items) ?? [];
    this.active = c.active;
    const seed = (list: NavItem[]) => list.forEach((i) => (i.expanded && this.open.add(i.id), i.items && seed(i.items)));
    seed(this.items);
    if (this.active) this.openParents(this.active);
    this.root = h('ul', 'op-navmenu__tree', { role: 'tree', 'aria-label': c.ariaLabel ?? null });
    this.el.append(this.root);
    this.fit();
    this.listen(this.root, 'click', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.op-navmenu__item');
      if (row) this.activate(row.dataset.id!);
    });
    this.listen(this.root, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    // rail: hovering a group's icon opens its menu (after a short pause, so passing over the rail does not)
    this.listen(this.root, 'pointerover', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.op-navmenu__item.is-group');
      this.hoverTimer?.();
      if (!this.config.collapsed || !row || row.dataset.id === this.flyoutOf) return;
      this.hoverTimer = this.later(() => this.openFlyout(row.dataset.id!, false), 200);
    });
    this.listen(this.root, 'pointerleave', () => this.hoverTimer?.());
    this.own(() => this.flyout?.destroy());
    this.listen(this.root, 'focusin', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.op-navmenu__item');
      if (row) this.focusId = row.dataset.id;
    });
    this.paint();
  }

  // ---- model -----------------------------------------------------------------------------------

  getItem(id: string, list = this.items): NavItem | undefined {
    for (const i of list) {
      if (i.id === id) return i;
      const hit = i.items && this.getItem(id, i.items);
      if (hit) return hit;
    }
  }
  private parentsOf(id: string, list = this.items, trail: NavItem[] = []): NavItem[] | undefined {
    for (const i of list) {
      if (i.id === id) return trail;
      const hit = i.items && this.parentsOf(id, i.items, [...trail, i]);
      if (hit) return hit;
    }
  }
  private openParents(id: string) {
    for (const p of this.parentsOf(id) ?? []) this.open.add(p.id);
  }
  private matches(i: NavItem, q: string): boolean {
    return i.text.toLowerCase().includes(q) || !!i.items?.some((c) => this.matches(c, q));
  }
  /** Visible = not hidden, matches the filter, and a group has at least one visible child. */
  private visible(i: NavItem): boolean {
    if (i.hidden) return false;
    if (this.query && !this.matches(i, this.query)) return false;
    return !i.items || i.items.some((c) => this.visible(c));
  }
  private isOpen(i: NavItem): boolean {
    if (this.config.collapsed) return false; // rail: a group's children live in its floating menu
    return this.query ? true : this.open.has(i.id);
  }

  // ---- rendering -------------------------------------------------------------------------------

  private paint() {
    this.el.classList.toggle('is-rail', !!this.config.collapsed);
    this.root.replaceChildren(...this.items.filter((i) => this.visible(i)).map((i) => this.node(i, 1)));
    const f = this.focusId && this.root.querySelector<HTMLElement>(`[data-id="${CSS.escape(this.focusId)}"]`);
    const first = f || this.root.querySelector<HTMLElement>('.op-navmenu__item.is-active') || this.root.querySelector<HTMLElement>('.op-navmenu__item');
    this.root.querySelectorAll<HTMLElement>('.op-navmenu__item').forEach((r) => (r.tabIndex = r === first ? 0 : -1));
  }

  private node(i: NavItem, level: number): HTMLElement {
    const group = !!i.items;
    const open = group && this.isOpen(i);
    const rail = !!this.config.collapsed;
    const li = h('li', 'op-navmenu__node', { role: 'none' });
    const holdsActive = group && !!this.active && !!this.parentsOf(this.active)?.some((p) => p.id === i.id);
    const flying = rail && group;
    const row = h('div', `op-navmenu__item${group ? ' is-group' : ''}${open ? ' is-expanded' : ''}${i.id === this.active ? ' is-active' : ''}${holdsActive && rail ? ' has-active' : ''}${i.disabled ? ' is-disabled' : ''}`, {
      role: 'treeitem', 'data-id': i.id, 'aria-level': level, 'aria-expanded': group ? String(flying ? this.flyoutOf === i.id : open) : null, 'aria-current': i.id === this.active ? 'page' : null,
      'aria-haspopup': flying ? 'menu' : null, 'aria-disabled': i.disabled ? 'true' : null, title: rail ? i.text : null, tabindex: -1,
    });
    row.style.setProperty('--_level', String(level - 1));
    // in the rail a group shows its icon (or its initial) and opens a floating menu
    row.append(h('span', 'op-navmenu__icon', {}, i.icon ? iconEl(i.icon) : flying ? i.text.charAt(0).toUpperCase() : ''), h('span', 'op-navmenu__text', {}, i.text));
    if (i.badge != null && i.badge !== '') row.append(h('span', 'op-navmenu__badge', {}, String(i.badge)));
    if (group) row.append(h('span', 'op-navmenu__chevron', { 'aria-hidden': 'true' }, iconEl('chevron-down')));
    li.append(row);
    if (group && open) li.append(h('ul', 'op-navmenu__group', { role: 'group' }, ...i.items!.filter((c) => this.visible(c)).map((c) => this.node(c, level + 1))));
    return li;
  }

  // ---- behavior --------------------------------------------------------------------------------

  private activate(id: string) {
    const i = this.getItem(id);
    if (!i || i.disabled) return;
    if (i.items && this.config.collapsed) return this.openFlyout(id, true);
    if (i.items) return this.toggle(id);
    this.select(id);
  }

  private select(id: string) {
    const i = this.getItem(id);
    if (!i || i.disabled || this.emit('before-select', i) === false) return;
    this.setActive(id);
    this.emit('select', i);
  }

  /** Marks a leaf as the active page (and opens its parents). Does not emit `select`. */
  setActive(id: string | undefined) {
    this.active = id;
    this.config.active = id;
    if (id) {
      this.openParents(id);
      this.focusId = id;
    }
    if (this.rendered) this.paint();
  }
  getActive(): NavItem | undefined {
    return this.active ? this.getItem(this.active) : undefined;
  }

  expand(id: string) {
    const i = this.getItem(id);
    if (!i?.items || this.open.has(id)) return;
    if (this.config.accordion) for (const sib of this.siblings(id)) this.open.delete(sib.id);
    this.open.add(id);
    this.rendered && this.paint();
    this.emit('expand', i);
  }
  collapse(id: string) {
    const i = this.getItem(id);
    if (!i?.items || !this.open.delete(id)) return;
    this.rendered && this.paint();
    this.emit('collapse', i);
  }
  toggle(id: string) {
    if (this.open.has(id)) this.collapse(id);
    else this.expand(id);
  }
  private siblings(id: string): NavItem[] {
    const parents = this.parentsOf(id) ?? [];
    const list = parents.length ? parents[parents.length - 1].items! : this.items;
    return list.filter((x) => x.id !== id && x.items);
  }
  expandAll() {
    const walk = (l: NavItem[]) => l.forEach((i) => i.items && (this.open.add(i.id), walk(i.items)));
    walk(this.items);
    this.rendered && this.paint();
  }
  collapseAll() {
    this.open.clear();
    if (this.active) this.openParents(this.active);
    this.rendered && this.paint();
  }

  setItems(items: NavItem[]) {
    this.items = gate(items) ?? [];
    this.config.items = items;
    if (this.rendered) this.paint();
  }
  /** Changes an item in place (a badge, a label, disabled...). */
  updateItem(id: string, patch: Partial<NavItem>) {
    const i = this.getItem(id);
    if (!i) return;
    Object.assign(i, patch);
    if (this.rendered) this.paint();
  }
  /** Rail mode: a group's children in a Menu beside its icon (title as the header, badges kept). */
  private openFlyout(id: string, focus: boolean) {
    const group = this.getItem(id);
    const row = this.root.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
    if (!group?.items || !row) return;
    const entries = (list: NavItem[], top: boolean): MenuEntry[] =>
      list.filter((c) => this.visible(c)).map((c) => ({
        text: c.text, icon: c.icon, badge: c.badge, disabled: c.disabled, group: top ? group.text : undefined,
        items: c.items ? entries(c.items, false) : undefined,
        handler: c.items ? undefined : () => this.select(c.id),
      }));
    if (!this.flyout) {
      this.flyout = new Menu({ cls: 'op-navmenu__flyout' });
      this.flyout.on('hide', () => {
        const was = this.flyoutOf;
        this.flyoutOf = undefined;
        if (was) this.root.querySelector(`[data-id="${CSS.escape(was)}"]`)?.setAttribute('aria-expanded', 'false');
      });
      // ← closes it (the Menu only does that for submenus) and gives the focus back to the icon
      this.listen(this.flyout.el, 'keydown', (e: KeyboardEvent) => e.key === 'ArrowLeft' && !(e.target as HTMLElement).closest('.op-menu__item[aria-expanded="true"]') && this.flyout!.hide());
    }
    this.flyout.hide();
    this.flyoutOf = id;
    this.flyout.setItems(entries(group.items, true));
    row.setAttribute('aria-expanded', 'true');
    this.flyout.showBy(row, 'right-start', focus);
  }

  setCollapsed(collapsed: boolean) {
    this.config.collapsed = collapsed;
    if (!collapsed) this.flyout?.hide();
    if (this.rendered) (this.fit(), this.paint());
  }

  private fit() {
    const box = this.parent?.el;
    const rail = this.config.railWidth;
    if (!box || rail == null) return;
    if (this.config.collapsed) {
      this.parentWidth ??= box.style.inlineSize;
      box.style.inlineSize = px(rail);
    } else if (this.parentWidth !== undefined) {
      box.style.inlineSize = this.parentWidth;
      this.parentWidth = undefined;
    }
  }
  /** Hides what does not match and opens the groups that have a match; empty text clears the filter. */
  filter(text: string) {
    this.query = text.trim().toLowerCase();
    if (this.rendered) this.paint();
  }

  // ---- keyboard (APG tree) ---------------------------------------------------------------------

  private rows(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>('.op-navmenu__item'));
  }
  private focusRow(row?: HTMLElement) {
    if (!row) return;
    this.rows().forEach((r) => (r.tabIndex = r === row ? 0 : -1));
    row.focus();
  }

  private onKey(e: KeyboardEvent) {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.op-navmenu__item');
    if (!row) return;
    const rows = this.rows();
    const i = rows.indexOf(row);
    const item = this.getItem(row.dataset.id!)!;
    const open = row.getAttribute('aria-expanded') === 'true';
    switch (e.key) {
      case 'ArrowDown': this.focusRow(rows[i + 1]); break;
      case 'ArrowUp': this.focusRow(rows[i - 1]); break;
      case 'Home': this.focusRow(rows[0]); break;
      case 'End': this.focusRow(rows[rows.length - 1]); break;
      case 'ArrowRight':
        if (item.items && this.config.collapsed) this.openFlyout(item.id, true);
        else if (item.items && !open) this.expand(item.id);
        else if (item.items) this.focusRow(rows[i + 1]);
        break;
      case 'ArrowLeft':
        if (item.items && open) this.collapse(item.id);
        else {
          const parent = this.parentsOf(item.id)?.pop();
          if (parent) this.focusRow(this.root.querySelector<HTMLElement>(`[data-id="${CSS.escape(parent.id)}"]`) ?? undefined);
        }
        break;
      case 'Enter':
      case ' ': this.activate(item.id); break;
      default: return;
    }
    e.preventDefault();
    if (this.flyout?.el.contains(document.activeElement)) return; // the focus went to the rail's floating menu: leave it there
    this.focusId = (document.activeElement as HTMLElement | null)?.dataset?.id ?? item.id;
    // a repaint (expand/collapse/select) rebuilt the rows: put the focus back on the one the user is on
    const again = this.root.querySelector<HTMLElement>(`[data-id="${CSS.escape(this.focusId)}"]`);
    if (again && document.activeElement !== again) this.focusRow(again);
  }
}
register('navmenu', NavMenu);
