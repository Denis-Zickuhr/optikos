import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { format } from '../../../data/format';
import { summarize, type Column } from '../../../data/column';
import type { Model } from '../../../data/model';
import { Menu } from '../../overlays/menu/menu';
import { MessageBox } from '../../overlays/messagebox/messagebox';
import { toast } from '../../overlays/toast/toast';
import { iconEl } from '../../base/icon/icon';
import type { Grid, GridPlugin } from '../grid/grid';

addMessages('en', { ctActions: 'Column actions: {col}', ctNone: 'No total', ctSum: 'Sum', ctAvg: 'Average', ctMin: 'Minimum', ctMax: 'Maximum', ctCount: 'Count', ctEarliest: 'Earliest', ctLatest: 'Latest', ctTotals: 'Totals', ctResult: '{op} of {col}: {value}', ctRows: '{n} rows' });
addMessages('pt-BR', { ctActions: 'Ações da coluna: {col}', ctNone: 'Sem total', ctSum: 'Soma', ctAvg: 'Média', ctMin: 'Mínimo', ctMax: 'Máximo', ctCount: 'Contagem', ctEarliest: 'Mais antiga', ctLatest: 'Mais recente', ctTotals: 'Totais', ctResult: '{op} de {col}: {value}', ctRows: '{n} linhas' });

/** An operation offered in the column menu besides the built-in ones. */
export interface TotalOperation {
  text: string;
  /** The column's values and the records of every filtered row. */
  run: (values: any[], recs: Model[]) => unknown;
}

export interface ColumnTotalsOptions {
  /** Your own operations (a median, a weighted mean...). Offered on every column. */
  operations?: TotalOperation[];
  /**
   * Where the answer goes: `'bar'` (default) keeps it in a bar under the grid; `'modal'` answers in a dialog and `'toast'` in a
   * notice, once, and nothing stays on the grid.
   */
  show?: 'bar' | 'modal' | 'toast';
  /** `bar` only: under the grid (default) or `'top'`, right under the header, above the rows (a row of the grid itself). */
  position?: 'bottom' | 'top';
}

type Kind = 'number' | 'date' | 'text';
const BUILT_IN = ['sum', 'avg', 'min', 'max', 'count'] as const;
const LABEL = { sum: 'ctSum', avg: 'ctAvg', min: 'ctMin', max: 'ctMax', count: 'ctCount' } as const;
const FOR: Record<Kind, readonly (typeof BUILT_IN)[number][]> = { number: BUILT_IN, date: ['min', 'max', 'count'], text: ['count'] };

const kindOf = (col: Column, recs: Model[]): Kind => {
  const v = recs.map((r) => r.data[col.field]).find((x) => x != null && x !== '');
  if (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) return 'date';
  return typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) ? 'number' : 'text';
};

/**
 * A button on every column header opens a menu of totals (sum, average, minimum, maximum, count, your own); the choice
 * shows in a bar under the grid, over every filtered row. A column's `summary` is where it starts and where it is kept.
 */
export function columnTotals(options: ColumnTotalsOptions = {}): GridPlugin {
  return {
    init(grid: Grid) {
      const bar = h('div', 'op-columntotals', { role: 'group', 'aria-label': t('ctTotals') });
      bar.hidden = true;
      const menu = new Menu({});
      const store = grid.getStore();
      const rows = () => store.getFiltered();
      const custom = options.operations ?? [];
      const active = (col: Column) => (typeof col.summary === 'function' ? custom.find((o) => o.run === col.summary)?.text : col.summary && t(LABEL[col.summary as keyof typeof LABEL]));

      const valueOf = (c: Column, recs: Model[]) => {
        const v = summarize(c, recs);
        return c.summaryRenderer ? c.summaryRenderer(v, c) : v == null ? '' : c.format && typeof c.summary !== 'function' && c.summary !== 'count' ? format(c.format, v) : String(v);
      };

      /** `modal` and `toast`: the answer for one choice, without touching the column. */
      function announce(col: Column, summary: Column['summary']) {
        const recs = rows();
        const once = { ...col, summary };
        const value = valueOf(once, recs);
        const text = t('ctResult', { op: active(once) ?? '', col: col.header ?? col.field, value: typeof value === 'string' ? value : value.textContent ?? '' });
        const detail = t('ctRows', { n: recs.length });
        if (options.show === 'toast') toast({ type: 'info', title: text, text: detail });
        else void MessageBox.alert(`${text}\n${detail}`, { title: t('ctTotals'), icon: 'info' });
      }

      function paintBar() {
        const cols = grid.getColumns();
        bar.hidden = (options.show ?? 'bar') !== 'bar' || !cols.some((c) => c.summary);
        if (bar.hidden) return;
        const recs = rows();
        const cell = (c?: Column) => {
          const el = h('div', 'op-columntotals__cell' + (c?.align ? ` op-columntotals__cell--${c.align}` : ''), top ? { role: 'gridcell' } : {});
          if (c?.summary) el.append(h('span', 'op-columntotals__op', {}, active(c) ?? ''), valueOf(c, recs));
          return el;
        };
        bar.replaceChildren(...(grid.config.checkboxSelection ? [cell()] : []), ...cols.map(cell), ...(grid.config.rowActions?.length ? [cell()] : []));
      }

      function open(col: Column, btn: HTMLElement) {
        const kind = kindOf(col, rows());
        const bar_ = options.show === undefined || options.show === 'bar';
        const pick = (summary: Column['summary']) => {
          if (!bar_) return announce(col, summary);
          col.summary = col.summary === summary ? undefined : summary;
          paintBar();
        };
        const checked = (summary: Column['summary']) => (bar_ ? col.summary === summary : undefined);
        menu.setItems([
          ...FOR[kind].map((op) => ({ text: kind === 'date' && op !== 'count' ? t(op === 'min' ? 'ctEarliest' : 'ctLatest') : t(LABEL[op]), checked: checked(op), handler: () => pick(op) })),
          ...custom.map((o) => ({ text: o.text, checked: checked(o.run), handler: () => pick(o.run) })),
          ...(bar_ ? ['-', { text: t('ctNone'), disabled: !col.summary, handler: () => pick(col.summary) }] : []),
        ]);
        menu.showBy(btn);
      }

      function paintHeader() {
        const cols = grid.getColumns();
        for (const cell of Array.from(grid.el.querySelectorAll<HTMLElement>('.op-grid__hcell[data-field]'))) {
          const col = cols.find((c) => c.field === cell.dataset.field);
          if (!col) continue;
          const btn = h('button', 'op-columntotals__btn', { type: 'button', 'aria-haspopup': 'menu', 'aria-label': t('ctActions', { col: col.header ?? col.field }) }, iconEl('more'));
          // the header cell sorts and drags: the button must not start either
          for (const ev of ['click', 'pointerdown', 'keydown']) btn.addEventListener(ev, (e) => e.stopPropagation());
          btn.addEventListener('click', () => open(col, btn));
          cell.append(btn);
        }
        paintBar();
      }

      const top = options.position === 'top';
      if (top) {
        bar.classList.add('op-columntotals--top');
        bar.setAttribute('role', 'row');
        grid.el.querySelector('.op-grid__header')!.after(bar);
      } else grid.el.querySelector('.op-grid__table')!.after(bar);
      const viewport = grid.el.querySelector<HTMLElement>('.op-grid__viewport')!;
      const follow = () => (bar.scrollLeft = viewport.scrollLeft);
      viewport.addEventListener('scroll', follow);
      const offs = [grid.on('header-paint', paintHeader), store.subscribe(paintBar)];
      paintHeader();
      return () => {
        offs.forEach((off) => off());
        viewport.removeEventListener('scroll', follow);
        menu.destroy();
        bar.remove();
      };
    },
  };
}
