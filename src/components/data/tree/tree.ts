import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

addMessages('en', { treeLoading: 'Loading…', treeEmpty: 'Nothing here' });
addMessages('pt-BR', { treeLoading: 'Carregando…', treeEmpty: 'Nada aqui' });

export interface TreeNode {
  id: string;
  text: string;
  icon?: string;
  children?: TreeNode[];
  /** No children and nothing to load: no expand arrow. Default: true when there are no `children` and no `load`. */
  leaf?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  /** With `checkboxes`: the node's own state (a parent's state comes from its children). */
  checked?: boolean;
  data?: unknown;
}
export type CheckState = boolean | 'mixed';

export interface TreeConfig extends ComponentConfig {
  items?: TreeNode[];
  /** `single` (default), `multi` (Ctrl/⌘ + click or Space toggle) or `none`. */
  selection?: 'single' | 'multi' | 'none';
  /** A tri-state checkbox per node: checking a parent checks its whole branch; a parent shows "mixed" when partly checked. */
  checkboxes?: boolean;
  /** Children on demand: called the first time a node without `children` (and not `leaf`) is expanded. */
  load?: (node: TreeNode) => Promise<TreeNode[]> | TreeNode[];
  emptyText?: string;
}

/** A hierarchy: expand/collapse, single or multiple selection, tri-state checkboxes, children loaded on demand, filter, APG tree keyboard. */
export class Tree extends Component<TreeConfig> {
  protected override baseCls = 'op-tree';
  private items: TreeNode[] = [];
  private open = new Set<string>();
  private selected = new Set<string>();
  private loading = new Set<string>();
  private query = '';
  private focusId?: string;
  private root!: HTMLElement;

  protected override onRender() {
    const c = this.config;
    this.items = c.items ?? [];
    const seed = (list: TreeNode[]) => list.forEach((n) => (n.expanded && this.open.add(n.id), n.children && seed(n.children)));
    seed(this.items);
    this.root = h('ul', 'op-tree__root', { role: 'tree', 'aria-label': c.ariaLabel ?? null, 'aria-multiselectable': c.selection === 'multi' ? 'true' : null });
    this.el.removeAttribute('aria-label');
    this.el.append(this.root);
    this.listen(this.root, 'click', (e: MouseEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.op-tree__item');
      if (!row) return;
      const id = row.dataset.id!;
      this.focusId = id;
      if ((e.target as HTMLElement).closest('.op-tree__toggle')) return this.toggle(id);
      if ((e.target as HTMLElement).closest('.op-tree__check')) return this.toggleChecked(id);
      this.pick(id, e.ctrlKey || e.metaKey);
    });
    this.listen(this.root, 'dblclick', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('.op-tree__item');
      const n = row && this.getNode(row.dataset.id!);
      if (n && !n.disabled) this.emit('activate', n);
    });
    this.listen(this.root, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.paint();
  }

  // ---- model -----------------------------------------------------------------------------------

  getNode(id: string, list = this.items): TreeNode | undefined {
    for (const n of list) {
      if (n.id === id) return n;
      const hit = n.children && this.getNode(id, n.children);
      if (hit) return hit;
    }
  }
  /** The ancestors of a node, from the root down. */
  getPath(id: string, list = this.items, trail: TreeNode[] = []): TreeNode[] | undefined {
    for (const n of list) {
      if (n.id === id) return trail;
      const hit = n.children && this.getPath(id, n.children, [...trail, n]);
      if (hit) return hit;
    }
  }
  private isLeaf(n: TreeNode) {
    return n.leaf ?? (!n.children && !this.config.load);
  }
  private matches(n: TreeNode, q: string): boolean {
    return n.text.toLowerCase().includes(q) || !!n.children?.some((c) => this.matches(c, q));
  }
  private walk(list: TreeNode[], fn: (n: TreeNode) => void) {
    for (const n of list) {
      fn(n);
      if (n.children) this.walk(n.children, fn);
    }
  }

  // ---- rendering -------------------------------------------------------------------------------

  private paint() {
    const shown = this.items.filter((n) => !this.query || this.matches(n, this.query));
    this.root.replaceChildren(...shown.map((n) => this.node(n, 1)));
    if (!shown.length) this.root.append(h('li', 'op-tree__empty', { role: 'none' }, this.config.emptyText ?? t('treeEmpty')));
    const rows = this.rows();
    const focus = rows.find((r) => r.dataset.id === this.focusId) ?? rows.find((r) => r.getAttribute('aria-selected') === 'true') ?? rows[0];
    rows.forEach((r) => (r.tabIndex = r === focus ? 0 : -1));
  }

  private node(n: TreeNode, level: number): HTMLElement {
    const leaf = this.isLeaf(n);
    const open = !leaf && (this.query ? true : this.open.has(n.id));
    const busy = this.loading.has(n.id);
    const sel = this.selected.has(n.id);
    const mode = this.config.selection ?? 'single';
    const state = this.checkState(n);
    const li = h('li', 'op-tree__node', { role: 'none' });
    const row = h('div', `op-tree__item${sel ? ' is-selected' : ''}${n.disabled ? ' is-disabled' : ''}${open ? ' is-expanded' : ''}${busy ? ' is-loading' : ''}`, {
      role: 'treeitem', 'data-id': n.id, 'aria-level': level, tabindex: -1,
      'aria-expanded': leaf ? null : String(open), 'aria-selected': mode === 'none' ? null : String(sel),
      'aria-checked': this.config.checkboxes ? String(state) : null, 'aria-disabled': n.disabled ? 'true' : null, 'aria-busy': busy ? 'true' : null,
    });
    row.style.setProperty('--_level', String(level - 1));
    row.append(h('span', 'op-tree__toggle', { 'aria-hidden': 'true' }, leaf ? '' : busy ? h('span', 'op-spinner op-tree__spinner') : iconEl('chevron-right')));
    if (this.config.checkboxes) row.append(h('span', `op-tree__check${state === true ? ' is-checked' : state === 'mixed' ? ' is-mixed' : ''}`, { 'aria-hidden': 'true' }, state === 'mixed' ? iconEl('minus') : state ? iconEl('check') : ''));
    if (n.icon) row.append(h('span', 'op-tree__icon', {}, iconEl(n.icon)));
    row.append(h('span', 'op-tree__text', {}, n.text));
    li.append(row);
    if (open && n.children?.length) {
      const kids = n.children.filter((c) => !this.query || this.matches(c, this.query));
      li.append(h('ul', 'op-tree__group', { role: 'group' }, ...kids.map((c) => this.node(c, level + 1))));
    }
    return li;
  }

  // ---- expand / load ---------------------------------------------------------------------------

  async expand(id: string): Promise<void> {
    const n = this.getNode(id);
    if (!n || this.isLeaf(n) || this.open.has(id) || this.loading.has(id)) return;
    if (!n.children && this.config.load) {
      this.loading.add(id);
      this.rendered && this.paint();
      try {
        n.children = await this.config.load(n);
        if (this.config.checkboxes && this.checkState(n) === true) n.children.forEach((c) => this.setBranch(c, true)); // a checked parent checks what it loads
        this.emit('load', n, n.children);
      } catch (err) {
        this.loading.delete(id);
        this.rendered && this.paint();
        this.emit('error', err, n);
        return;
      }
      this.loading.delete(id);
    }
    this.open.add(id);
    this.rendered && this.paint();
    this.emit('expand', n);
  }
  collapse(id: string) {
    const n = this.getNode(id);
    if (!n || !this.open.delete(id)) return;
    this.rendered && this.paint();
    this.emit('collapse', n);
  }
  toggle(id: string) {
    if (this.open.has(id)) this.collapse(id);
    else void this.expand(id);
  }
  /** Opens every node that already has its children (it does not load). */
  expandAll() {
    this.walk(this.items, (n) => n.children?.length && this.open.add(n.id));
    this.rendered && this.paint();
  }
  collapseAll() {
    this.open.clear();
    this.rendered && this.paint();
  }

  // ---- selection -------------------------------------------------------------------------------

  private pick(id: string, add: boolean) {
    const n = this.getNode(id);
    const mode = this.config.selection ?? 'single';
    if (!n || n.disabled || mode === 'none') return;
    if (mode === 'multi' && add) {
      if (!this.selected.delete(id)) this.selected.add(id);
    } else {
      this.selected.clear();
      this.selected.add(id);
    }
    this.rendered && this.paint();
    this.emit('select', this.getSelection());
  }
  /** Selects a node (opening its parents); `add` keeps the current selection in multi mode. */
  select(id: string, opts: { add?: boolean } = {}) {
    for (const p of this.getPath(id) ?? []) this.open.add(p.id);
    this.focusId = id;
    this.pick(id, !!opts.add);
  }
  getSelection(): TreeNode[] {
    return [...this.selected].map((id) => this.getNode(id)).filter((n): n is TreeNode => !!n);
  }
  deselectAll() {
    this.selected.clear();
    this.rendered && this.paint();
    this.emit('select', []);
  }

  // ---- checkboxes ------------------------------------------------------------------------------

  /** A node's state: its own `checked`, or for a parent with children, all / none / "mixed" of them. */
  checkState(n: TreeNode): CheckState {
    if (!n.children?.length) return !!n.checked;
    const states = n.children.map((c) => this.checkState(c));
    return states.every((s) => s === true) ? true : states.some((s) => s !== false) ? 'mixed' : false;
  }
  private setBranch(n: TreeNode, on: boolean) {
    n.checked = on;
    n.children?.forEach((c) => this.setBranch(c, on));
  }
  setChecked(id: string, on: boolean) {
    const n = this.getNode(id);
    if (!n || n.disabled) return;
    this.setBranch(n, on);
    this.rendered && this.paint();
    this.emit('check', this.getChecked(), n);
  }
  toggleChecked(id: string) {
    const n = this.getNode(id);
    if (n) this.setChecked(id, this.checkState(n) !== true);
  }
  /** Every checked node (a fully checked parent and its children all count). */
  getChecked(): TreeNode[] {
    const out: TreeNode[] = [];
    this.walk(this.items, (n) => this.checkState(n) === true && out.push(n));
    return out;
  }

  // ---- data ------------------------------------------------------------------------------------

  setItems(items: TreeNode[]) {
    this.items = items;
    this.config.items = items;
    this.selected.clear();
    this.rendered && this.paint();
  }
  /** Shows only what matches (and its ancestors, opened); empty text clears the filter. */
  filter(text: string) {
    this.query = text.trim().toLowerCase();
    this.rendered && this.paint();
  }

  // ---- keyboard (APG tree) ---------------------------------------------------------------------

  private rows(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>('.op-tree__item'));
  }
  private focusRow(row?: HTMLElement) {
    if (!row) return;
    this.rows().forEach((r) => (r.tabIndex = r === row ? 0 : -1));
    this.focusId = row.dataset.id;
    row.focus();
  }

  private onKey(e: KeyboardEvent) {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.op-tree__item');
    if (!row) return;
    const rows = this.rows();
    const i = rows.indexOf(row);
    const n = this.getNode(row.dataset.id!)!;
    const open = row.getAttribute('aria-expanded') === 'true';
    const closed = row.getAttribute('aria-expanded') === 'false';
    switch (e.key) {
      case 'ArrowDown': this.focusRow(rows[i + 1]); break;
      case 'ArrowUp': this.focusRow(rows[i - 1]); break;
      case 'Home': this.focusRow(rows[0]); break;
      case 'End': this.focusRow(rows[rows.length - 1]); break;
      case 'ArrowRight':
        if (closed) void this.expand(n.id);
        else if (open) this.focusRow(rows[i + 1]);
        break;
      case 'ArrowLeft':
        if (open) this.collapse(n.id);
        else {
          const parent = this.getPath(n.id)?.pop();
          if (parent) this.focusRow(rows.find((r) => r.dataset.id === parent.id));
        }
        break;
      case ' ':
        if (this.config.checkboxes) this.toggleChecked(n.id);
        else this.pick(n.id, this.config.selection === 'multi');
        break;
      case 'Enter':
        this.pick(n.id, false);
        if (!n.disabled) this.emit('activate', n);
        break;
      default: return;
    }
    e.preventDefault();
    // a repaint rebuilt the rows: put the focus back where the user is
    const again = this.root.querySelector<HTMLElement>(`[data-id="${CSS.escape(this.focusId ?? n.id)}"]`);
    if (again && document.activeElement !== again) this.focusRow(again);
  }
}
register('tree', Tree);
