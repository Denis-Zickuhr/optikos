// Whole-row editing for the Grid, as a plugin: `plugins: [rowEditing()]` and `editor` on the columns to edit.
import { create } from '../../../core/registry';
import { focusables } from '../../../core/focus';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { Field } from '../../../core/field';
import type { Model } from '../../../data/model';
import type { Column } from '../../../data/column';
import type { Grid, GridPlugin } from '../grid/grid';
import { editorConfig } from '../cellediting/cellediting';

addMessages('en', { rowSave: 'Save', rowCancel: 'Cancel', rowEditing: 'Editing row' });
addMessages('pt-BR', { rowSave: 'Salvar', rowCancel: 'Cancelar', rowEditing: 'Editando linha' });

export interface RowEditingOptions {
  /** What starts editing with the pointer: a double click (default) or a single click. F2 and Enter always do. */
  trigger?: 'dblclick' | 'click';
}

interface Editing {
  index: number;
  record: Model;
  row: HTMLElement;
  bar: HTMLElement;
  fields: Array<{ col: Column; field: Field<any>; cell: HTMLElement; old: unknown }>;
}

/**
 * Edits every `editor` column of a row at once, under a bar with Save and Cancel. Enter saves, Esc cancels, Tab walks the
 * editors and the buttons and wraps; Save validates every field and keeps the row open while one is invalid.
 * Events on the grid: `before-edit(record)` (cancelable), `edit(record, values, old)` after the new values were written
 * (`record.set`, so it is marked modified; a remote store's app saves from here), `cancel-edit(record)`.
 * Use it instead of `cellEditing()`, not beside it.
 */
export function rowEditing(options: RowEditingOptions = {}): GridPlugin {
  let grid!: Grid;
  let editing: Editing | undefined;

  const editable = (c: Column, rec: Model) => !!c.editor && (c.editable?.(rec) ?? true);

  function stop(): Editing | undefined {
    const e = editing;
    editing = undefined;
    if (!e) return;
    for (const f of e.fields) {
      f.field.destroy();
      f.cell.classList.remove('is-editing');
    }
    e.bar.remove();
    e.row.classList.remove('is-row-editing');
    return e;
  }

  function save(): boolean {
    const e = editing;
    if (!e) return true;
    const bad = e.fields.filter((f) => !f.field.validate());
    if (bad.length) return (bad[0].field.focus(), false);
    stop();
    const values: Record<string, unknown> = {};
    const old: Record<string, unknown> = {};
    for (const f of e.fields) {
      const v = f.field.getValue();
      if (Object.is(v, f.old)) continue;
      values[f.col.field] = v;
      old[f.col.field] = f.old;
    }
    for (const k in values) e.record.set(k, values[k]);
    grid.refresh();
    if (Object.keys(values).length) grid.emit('edit', e.record, values, old);
    return true;
  }

  function cancel() {
    const e = stop();
    if (!e) return;
    grid.refresh();
    grid.emit('cancel-edit', e.record);
  }

  function start(index: number, focusField?: string): boolean {
    const rec = grid.getRowEntry(index)?.rec;
    if (!rec || editing?.index === index) return false;
    const cols = grid.getColumns().filter((c) => editable(c, rec));
    if (!cols.length || (editing && !save()) || grid.emit('before-edit', rec) === false) return false;
    const row = document.getElementById(`${grid.id}-r${index}`);
    if (!row) return false;
    const fields = cols.flatMap((col) => {
      const cell = grid.getCell(index, col.field);
      if (!cell) return [];
      const old = rec.get(col.field);
      const field = create<Field<any>>({ ...editorConfig(col, old), value: old, stableSize: false, ariaLabel: col.header ?? col.field, cls: 'op-grid__editor' });
      cell.classList.add('is-editing');
      cell.replaceChildren(field.el);
      field.notifyMount();
      return [{ col, field, cell, old }];
    });
    const button = (text: string, cls: string, run: () => void) => {
      const b = h('button', `op-grid__rowbtn ${cls}`, { type: 'button' }, text);
      b.addEventListener('click', run);
      return b;
    };
    const bar = h('div', 'op-grid__rowbar', { role: 'group', 'aria-label': t('rowEditing') }, button(t('rowSave'), 'is-primary', () => save()), button(t('rowCancel'), '', cancel));
    row.classList.add('is-row-editing');
    row.append(bar);
    editing = { index, record: rec, row, bar, fields };
    const first = fields.find((f) => f.col.field === focusField) ?? fields[0];
    first?.field.focus();
    first?.field.el.querySelector('input')?.select();
    return true;
  }

  return {
    init(g: Grid) {
      grid = g;
      const el = g.el;
      const table = el.querySelector<HTMLElement>('[role=grid]')!;
      const viewport = el.querySelector<HTMLElement>('.op-grid__viewport')!;
      const onPointer = (ev: Event) => {
        const cell = g.cellAt(ev.target);
        if (cell && !(editing && editing.row.contains(ev.target as Node))) start(cell.index, cell.column.field);
      };
      // capture: these run before the grid's own key handling (Enter would otherwise activate the row)
      const onKey = (ev: KeyboardEvent) => {
        const e = editing;
        if (e && e.row.contains(ev.target as Node)) {
          const stops = focusables(e.row);
          if (ev.key === 'Escape') cancel();
          else if (ev.key === 'Enter' && !ev.shiftKey && !(ev.target as HTMLElement).closest('textarea,button')) save() && table.focus();
          else if (ev.key === 'Tab' && stops.length) {
            const edge = ev.shiftKey ? stops[0] : stops[stops.length - 1];
            if (ev.target !== edge) return;
            (ev.shiftKey ? stops[stops.length - 1] : stops[0]).focus();
          } else return;
          ev.preventDefault();
          ev.stopPropagation();
        } else if (ev.target === table && (ev.key === 'F2' || ev.key === 'Enter') && g.getActive() >= 0 && start(g.getActive())) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      };
      // the pooled row element is reused when it scrolls out: the editors would be gone with it
      const onScroll = () => editing && editing.row.dataset.i !== String(editing.index) && cancel();
      el.addEventListener(options.trigger === 'click' ? 'click' : 'dblclick', onPointer);
      el.addEventListener('keydown', onKey, true);
      viewport.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        stop();
        el.removeEventListener(options.trigger === 'click' ? 'click' : 'dblclick', onPointer);
        el.removeEventListener('keydown', onKey, true);
        viewport.removeEventListener('scroll', onScroll);
      };
    },
  };
}
