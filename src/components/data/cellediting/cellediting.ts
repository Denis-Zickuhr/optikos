// Inline cell editing for the Grid, as a plugin: `plugins: [cellEditing()]` and `editor` on the columns to edit.
// Editors are regular fields created by type (`create({ type })`), so this module imports none of them: with
// per-component imports, import the field types your columns use (`optikos/components/select`...).
import { create } from '../../../core/registry';
import type { Field } from '../../../core/field';
import type { Model } from '../../../data/model';
import type { Column } from '../../../data/column';
import type { Grid, GridPlugin, GridCell } from '../grid/grid';

export interface CellEditingOptions {
  /** What starts editing with the pointer: a double click (default) or a single click. F2 and Enter always do. */
  trigger?: 'dblclick' | 'click';
}

interface Editing { cell: GridCell; field: Field<any>; old: unknown }

/** The field config for a column's editor: from `editor`, else from the type of the current value. */
export function editorConfig(col: Column, value: unknown): Record<string, any> {
  const e = col.editor;
  if (e && typeof e === 'object') return { ...e };
  if (typeof e === 'string') return { type: e };
  return { type: typeof value === 'number' ? 'numberfield' : typeof value === 'boolean' ? 'checkbox' : 'textfield' };
}

/**
 * Inline editing plugin. Events on the grid: `before-edit(record, field)` (cancelable), `edit(record, field, value, old)`
 * after a valid value was written to the record (`record.set`, so it is marked modified), `edit-cancel(record, field)`.
 */
export function cellEditing(options: CellEditingOptions = {}): GridPlugin {
  let grid!: Grid;
  let editing: Editing | undefined;

  const editable = (c: Column, rec: Model) => !!c.editor && (c.editable?.(rec) ?? true);
  const editableCols = (rec: Model) => grid.getColumns().filter((c) => editable(c, rec));

  function start(cell: GridCell): boolean {
    if (!editable(cell.column, cell.record) || grid.emit('before-edit', cell.record, cell.column.field) === false) return false;
    finish(true);
    const old = cell.record.get(cell.column.field);
    const field = create<Field<any>>({ ...editorConfig(cell.column, old), value: old, stableSize: false, ariaLabel: cell.column.header ?? cell.column.field, cls: 'op-grid__editor' });
    cell.el.classList.add('is-editing');
    cell.el.replaceChildren(field.el);
    field.notifyMount();
    editing = { cell, field, old };
    field.focus();
    field.el.querySelector('input')?.select();
    return true;
  }

  /** Commits (or cancels) the current edit. A commit that fails validation keeps the editor open. */
  function finish(commit: boolean): boolean {
    const e = editing;
    if (!e) return true;
    if (commit && !e.field.validate()) return false;
    editing = undefined;
    const value = e.field.getValue();
    e.field.destroy();
    e.cell.el.classList.remove('is-editing');
    const { record, column } = e.cell;
    if (commit && !Object.is(value, e.old)) {
      record.set(column.field, value); // the store re-renders the row
      grid.emit('edit', record, column.field, value, e.old);
    } else {
      grid.refresh(); // puts the cell content back
      if (!commit) grid.emit('edit-cancel', record, column.field);
    }
    return true;
  }

  /** The next (or previous) editable cell after the current one, row by row. */
  function step(dir: 1 | -1): GridCell | undefined {
    if (!editing) return;
    const store = grid.getStore();
    let i = editing.cell.index;
    let cols = editableCols(editing.cell.record);
    let c = cols.indexOf(editing.cell.column) + dir;
    for (let guard = 0; guard < 500; guard++) {
      if (c >= 0 && c < cols.length) {
        grid.scrollToRow(i);
        const el = grid.getCell(i, cols[c].field);
        const rec = store.getAt(i)!;
        return el ? { index: i, record: rec, column: cols[c], el } : undefined;
      }
      i += dir;
      const rec = store.getAt(i);
      if (!rec) return;
      cols = editableCols(rec);
      c = dir > 0 ? 0 : cols.length - 1;
    }
  }

  return {
    init(g: Grid) {
      grid = g;
      const el = g.el;
      const table = el.querySelector<HTMLElement>('[role=grid]')!;
      const onPointer = (ev: Event) => {
        const cell = g.cellAt(ev.target);
        if (cell && !(editing && cell.el === editing.cell.el)) start(cell);
      };
      // capture: these run before the grid's own key handling (Enter would otherwise activate the row)
      const onKey = (ev: KeyboardEvent) => {
        if (editing && editing.cell.el.contains(ev.target as Node)) {
          if (ev.key === 'Escape') finish(false);
          else if (ev.key === 'Enter' && !ev.shiftKey) finish(true) && table.focus();
          else if (ev.key === 'Tab') {
            const next = step(ev.shiftKey ? -1 : 1);
            if (!finish(true)) return void ev.preventDefault();
            if (next) start({ ...next, el: grid.getCell(next.index, next.column.field) ?? next.el });
            else table.focus();
          } else return;
          ev.preventDefault();
          ev.stopPropagation();
        } else if (ev.target === table && (ev.key === 'F2' || ev.key === 'Enter') && g.getActive() >= 0) {
          const rec = g.getStore().getAt(g.getActive())!;
          const col = editableCols(rec)[0];
          const cellEl = col && g.getCell(g.getActive(), col.field);
          if (cellEl && start({ index: g.getActive(), record: rec, column: col, el: cellEl })) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
      };
      // leaving the cell commits, unless the focus went into the editor's own popup (a select list, a calendar)
      const onFocusOut = (ev: FocusEvent) => {
        if (!editing || !editing.cell.el.contains(ev.target as Node)) return;
        const to = ev.relatedTarget as HTMLElement | null;
        if (to && (editing.cell.el.contains(to) || to.closest('.op-layer'))) return;
        finish(true);
      };
      const viewport = el.querySelector<HTMLElement>('.op-grid__viewport')!;
      const onScroll = () => editing && finish(true);
      el.addEventListener(options.trigger === 'click' ? 'click' : 'dblclick', onPointer);
      el.addEventListener('keydown', onKey, true);
      el.addEventListener('focusout', onFocusOut);
      viewport.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        editing?.field.destroy();
        editing = undefined;
        el.removeEventListener(options.trigger === 'click' ? 'click' : 'dblclick', onPointer);
        el.removeEventListener('keydown', onKey, true);
        el.removeEventListener('focusout', onFocusOut);
        viewport.removeEventListener('scroll', onScroll);
      };
    },
  };
}
