// Row grouping with totals for the Grid, as a plugin: `plugins: [grouping({ field: 'event' })]`.
import { format } from '../../../data/format';
import type { Model } from '../../../data/model';
import { summarize } from '../../../data/column';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';
import { groupingControls, type GroupChoice, type GroupingControl } from './controls';
import type { Grid, GridPlugin, RowEntry } from '../grid/grid';

addMessages('en', { groupTotal: 'Total', groupCount: '{n}', groupToggle: 'Toggle group' });
addMessages('pt-BR', { groupTotal: 'Total', groupCount: '{n}', groupToggle: 'Alternar grupo' });

export { summarize };
export type { GroupChoice, GroupingControl };

export interface GroupingOptions {
  /** Record field to group by. */
  field?: string;
  /** Or any function of the record (a year, a range): its result is the group. */
  by?: (rec: Model) => unknown;
  /** Text of a group header (before the count). Default: the key. */
  label?: (key: unknown, recs: Model[]) => string;
  /** Total rows of the columns that have a `summary`: `group` (under each group), `grand` (at the end) or `both`. Default `group`. */
  summary?: 'group' | 'grand' | 'both';
  /** Start with every group closed. */
  collapsed?: boolean;
  /** Icon buttons inside the grid, beside the pager: expand all, collapse all and, with `choices`, a "Group by" menu. `false` leaves one out. */
  controls?: boolean | { expand?: boolean; collapse?: boolean; by?: boolean };
  /** The ways to group offered by the controls' menu (a field or a function each). */
  choices?: GroupChoice[];
}

export interface Grouping extends GridPlugin {
  expandAll(): void;
  collapseAll(): void;
  /** Changes what to group by; `null` shows the plain list. */
  setGroupBy(by: string | ((rec: Model) => unknown) | null): void;
  /** Opens or closes one group by its key. */
  toggle(key: unknown, open?: boolean): void;
  /** The in-grid controls: show or hide one. */
  setControlVisible(control: GroupingControl, visible: boolean): void;
  setControlDisabled(control: GroupingControl, disabled: boolean): void;
}

/**
 * Groups the rows of the current page (a remote store groups what it loaded, not the whole set) under a header with
 * its count; the header toggles by click, Enter/Space, → and ←. Sorting works inside each group. Group headers and total
 * rows are virtual rows like any other. Fires `group-toggle(key, open)` on the grid.
 */
export function grouping(options: GroupingOptions = {}): Grouping {
  let grid!: Grid;
  let by = options.by ?? (options.field ? (r: Model) => r.data[options.field!] : undefined);
  const closed = new Set<string>();
  let all = !!options.collapsed;
  let keys: unknown[] = [];
  let off: Array<() => void> = [];
  let controls: ReturnType<typeof groupingControls> | undefined;

  const where = options.summary ?? 'group';

  /** The cells of the user columns in a row (the checkbox and action cells are not). */
  const userCells = (cells: HTMLElement[]) => cells.filter((c) => !c.classList.contains('op-grid__selcell') && !c.classList.contains('op-grid__actcell'));

  function totals(label: string, recs: Model[], cls: string): RowEntry {
    return {
      cls: `op-grid__row--total ${cls}`,
      paint(cells, row) {
        row.setAttribute('aria-label', label);
        const cols = grid.getColumns();
        userCells(cells).forEach((cell, n) => {
          const col = cols[n];
          if (!col) return;
          const out = col.summary ? ((v) => (col.summaryRenderer ? col.summaryRenderer(v, col) : v == null ? '' : col.format ? format(col.format, v) : String(v)))(summarize(col, recs)) : n === 0 ? label : '';
          cell.replaceChildren(out);
          cell.classList.toggle('op-grid__cell--right', col.align === 'right');
        });
      },
    };
  }

  function build() {
    const store = grid.getStore();
    const recs = store.getRange();
    if (!by) return grid.setRowLayout(undefined);
    const groups = new Map<unknown, Model[]>();
    for (const r of recs) {
      const k = by(r);
      groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    keys = [...groups.keys()];
    if (all) {
      for (const k of keys) closed.add(String(k));
      all = false;
    }
    const rows: RowEntry[] = [];
    const hasSummary = grid.getColumns().some((c) => c.summary);
    for (const [key, list] of groups) {
      const open = !closed.has(String(key));
      rows.push({
        level: 1,
        expanded: open,
        cls: 'op-grid__row--group',
        paint(cells, row) {
          const [label] = userCells(cells);
          label.classList.add('is-group-label');
          label.replaceChildren(
            h('span', 'op-grid__twist', { 'aria-hidden': 'true' }, iconEl('chevron-down')),
            h('span', 'op-grid__group-name', {}, options.label ? options.label(key, list) : String(key ?? '—')),
            h('span', 'op-grid__group-count', {}, t('groupCount', { n: list.length })),
          );
          row.dataset.group = String(key);
        },
      });
      if (!open) continue;
      for (const rec of list) rows.push({ rec, level: 2, cls: 'is-grouped' });
      if (hasSummary && where !== 'grand') rows.push(totals(t('groupTotal'), list, 'is-group-total'));
    }
    if (hasSummary && where !== 'group') rows.push(totals(t('groupTotal'), recs, 'is-grand-total'));
    grid.setRowLayout(rows);
  }

  function toggle(key: unknown, open?: boolean) {
    const id = String(key);
    const to = open ?? closed.has(id);
    if (to === !closed.has(id)) return;
    if (to) closed.delete(id);
    else closed.add(id);
    build();
    grid.emit('group-toggle', key, to);
  }

  const keyOfRow = (el: Element | null) => {
    const row = el?.closest<HTMLElement>('.op-grid__row--group');
    return row ? keys.find((k) => String(k) === row.dataset.group) : undefined;
  };

  const plugin: Grouping = {
    init(g) {
      grid = g;
      const el = g.el;
      const table = el.querySelector<HTMLElement>('[role=grid]')!;
      const onClick = (e: Event) => {
        const k = keyOfRow(e.target as Element);
        if (k !== undefined || (e.target as Element).closest('.op-grid__row--group')) toggle(k);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.target !== table) return;
        const active = grid.getRowEntry(grid.getActive());
        if (!active || active.rec || active.level !== 1) return;
        const k = keyOfRow(document.getElementById(`${grid.id}-r${grid.getActive()}`));
        const open = active.expanded;
        if (e.key === 'Enter' || e.key === ' ') toggle(k);
        else if (e.key === 'ArrowRight' && !open) toggle(k, true);
        else if (e.key === 'ArrowLeft' && open) toggle(k, false);
        else return;
        e.preventDefault();
        e.stopPropagation();
      };
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey, true);
      off = [store(g), () => el.removeEventListener('click', onClick), () => el.removeEventListener('keydown', onKey, true), () => grid.setRowLayout(undefined)];
      build();
      if (options.controls) {
        const c = options.controls === true ? {} : options.controls;
        controls = groupingControls(g, plugin, { ...c, choices: options.choices ?? [], current: options.field });
        off.push(controls.destroy);
      }
      return () => off.forEach((f) => f());
    },
    expandAll() {
      closed.clear();
      build();
    },
    collapseAll() {
      for (const k of keys) closed.add(String(k));
      build();
    },
    toggle,
    setControlVisible: (c, visible) => controls?.set(c, visible),
    setControlDisabled: (c, disabled) => controls?.disable(c, disabled),
    setGroupBy(next) {
      by = next === null ? undefined : typeof next === 'string' ? (r: Model) => r.data[next] : next;
      closed.clear();
      build();
    },
  };
  return plugin;

  function store(g: Grid) {
    return g.getStore().subscribe((c) => queueMicrotask(() => !g.destroyed && build()));
  }
}
