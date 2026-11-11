// A Grid whose first column is a tree, as a plugin: `plugins: [treeGrid()]` over flat records that point at their parent.
import type { Model } from '../../../data/model';
import { h } from '../../../core/dom';
import { iconEl } from '../../base/icon/icon';
import type { Grid, GridPlugin, RowEntry } from '../grid/grid';
import { t, addMessages } from '../../../core/i18n';

addMessages('en', { treeExpand: 'Expand', treeCollapse: 'Collapse', treeLoading: 'Loading' });
addMessages('pt-BR', { treeExpand: 'Expandir', treeCollapse: 'Recolher', treeLoading: 'Carregando' });

export interface TreeGridOptions {
  /** Column that shows the indentation and the expander. Default: the first one. */
  treeColumn?: string;
  /** Field that holds the parent's id (`null` or missing: a root). Default `parentId`. */
  parentField?: string;
  /** Loads the children of a node the first time it opens: resolves with their rows (the plugin sets `parentField` and adds them to the store). Without it every node is already in the store. */
  load?: (node: Model) => Promise<Array<Record<string, any>>> | Array<Record<string, any>>;
  /** With `load`: the field that says a node has no children (default `leaf`), so it gets no expander. */
  leafField?: string;
  /** Start with every node open. */
  expanded?: boolean;
}

export interface TreeGrid extends GridPlugin {
  expand(id: string | number): void;
  collapse(id: string | number): void;
  expandAll(): void;
  collapseAll(): void;
}

/** Nested data (`{ id, name, children: [...] }`) → the flat rows the plugin wants, each with its `parentId`. */
export function flattenTree<T extends Record<string, any>>(nodes: T[], o: { children?: string; parentField?: string } = {}, parent: unknown = null): Array<Record<string, any>> {
  const kids = o.children ?? 'children';
  const pf = o.parentField ?? 'parentId';
  return nodes.flatMap(({ [kids]: sub, ...rest }) => [{ ...rest, [pf]: parent }, ...flattenTree(sub ?? [], o, (rest as Record<string, any>).id)]);
}

/**
 * Indents each record under its parent with an expander; ←/→ close/open and walk to the parent/first child (ARIA treegrid),
 * click on the chevron toggles. The rest of the columns are ordinary: format, renderer, sort (siblings), resize, lock.
 * A record whose parent is filtered out (or not on the page) shows as a root. Events on the grid: `expand-node(record)`,
 * `collapse-node(record)`, `load-error(record, error)`.
 */
export function treeGrid(options: TreeGridOptions = {}): TreeGrid {
  let grid!: Grid;
  const pf = options.parentField ?? 'parentId';
  const leaf = options.leafField ?? 'leaf';
  const open = new Set<string | number>();
  const loaded = new Set<string | number>();
  const loading = new Set<string | number>();
  let kids = new Map<unknown, Model[]>();
  let all = !!options.expanded;

  const expandable = (r: Model) => (kids.get(r.id)?.length ?? 0) > 0 || (!!options.load && r.get(leaf) !== true && !loaded.has(r.id));

  function build() {
    const recs = grid.getStore().getRange();
    const ids = new Set(recs.map((r) => r.id));
    kids = new Map();
    const roots: Model[] = [];
    for (const r of recs) {
      const p = r.get(pf);
      if (p == null || !ids.has(p)) roots.push(r);
      else kids.set(p, [...(kids.get(p) ?? []), r]);
    }
    if (all) {
      recs.forEach((r) => open.add(r.id));
      all = false;
    }
    const rows: RowEntry[] = [];
    const walk = (list: Model[], depth: number) => {
      for (const rec of list) {
        const can = expandable(rec);
        const isOpen = can && open.has(rec.id);
        rows.push({
          rec,
          level: depth + 1,
          expanded: can ? isOpen : undefined,
          paint(cells, row) {
            const cols = grid.getColumns();
            const n = Math.max(0, cols.findIndex((c) => c.field === (options.treeColumn ?? cols[0]?.field)));
            const cell = cells.filter((c) => !c.classList.contains('op-grid__selcell') && !c.classList.contains('op-grid__actcell'))[n];
            if (!cell) return;
            cell.style.setProperty('--_depth', String(depth));
            const lead = can
              ? h('span', `op-grid__expander${loading.has(rec.id) ? ' is-loading' : ''}`, { 'data-id': String(rec.id), role: 'img', 'aria-label': t(loading.has(rec.id) ? 'treeLoading' : isOpen ? 'treeCollapse' : 'treeExpand') }, iconEl(loading.has(rec.id) ? 'clock' : 'chevron-down'))
              : h('span', 'op-grid__expander is-leaf', { 'aria-hidden': 'true' });
            cell.prepend(lead);
            row.dataset.node = String(rec.id);
          },
        });
        if (can && isOpen) walk(kids.get(rec.id) ?? [], depth + 1);
      }
    };
    walk(roots, 0);
    grid.setRowLayout(rows);
  }

  const find = (id: string | number) => grid.getStore().getById(id);

  async function expand(id: string | number) {
    const rec = find(id);
    if (!rec || !expandable(rec) || open.has(id)) return;
    open.add(id);
    if (options.load && !loaded.has(id) && !(kids.get(id)?.length)) {
      loading.add(id);
      build();
      try {
        const rows = await options.load(rec);
        loaded.add(id);
        loading.delete(id);
        grid.getStore().add(rows.map((r) => ({ ...r, [pf]: id })));
      } catch (err) {
        loading.delete(id);
        open.delete(id);
        build();
        return void grid.emit('load-error', rec, err);
      }
    }
    loaded.add(id);
    build();
    grid.emit('expand-node', rec);
  }

  function collapse(id: string | number) {
    const rec = find(id);
    if (!rec || !open.delete(id)) return;
    build();
    grid.emit('collapse-node', rec);
  }

  return {
    init(g) {
      grid = g;
      const el = g.el;
      const table = el.querySelector<HTMLElement>('[role=grid]')!;
      table.setAttribute('role', 'treegrid');
      el.classList.add('op-grid--tree');
      const idOf = (node: Element) => {
        const v = node.closest<HTMLElement>('[data-node]')?.dataset.node;
        return grid.getStore().getFiltered().find((r) => String(r.id) === v)?.id;
      };
      const onClick = (e: Event) => {
        const x = (e.target as Element).closest<HTMLElement>('.op-grid__expander:not(.is-leaf)');
        const id = x && idOf(x);
        if (id != null) {
          e.stopPropagation();
          open.has(id) ? collapse(id) : void expand(id);
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.target !== table || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
        const i = grid.getActive();
        const entry = grid.getRowEntry(i);
        if (!entry?.rec) return;
        const id = entry.rec.id;
        if (e.key === 'ArrowRight') {
          if (entry.expanded === false) void expand(id);
          else if (entry.expanded && grid.getRowEntry(i + 1)) grid.focusRow(i + 1);
          else return;
        } else if (entry.expanded) collapse(id);
        else {
          let j = i - 1;
          while (j >= 0 && (grid.getRowEntry(j)?.level ?? 0) >= (entry.level ?? 1)) j--;
          if (j < 0) return;
          grid.focusRow(j);
        }
        e.preventDefault();
        e.stopPropagation();
      };
      el.addEventListener('click', onClick, true);
      el.addEventListener('keydown', onKey, true);
      const off = g.getStore().subscribe(() => queueMicrotask(() => !g.destroyed && build()));
      build();
      return () => {
        off();
        el.removeEventListener('click', onClick, true);
        el.removeEventListener('keydown', onKey, true);
        el.classList.remove('op-grid--tree');
        table.setAttribute('role', 'grid');
        grid.setRowLayout(undefined);
      };
    },
    expand: (id) => void expand(id),
    collapse,
    expandAll() {
      all = true;
      build();
    },
    collapseAll() {
      open.clear();
      build();
    },
  };
}
