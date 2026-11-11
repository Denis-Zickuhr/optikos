import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { FilterNode } from '../../../data/proxy';
import { TextField } from '../../fields/textfield/textfield';
import { addFooterGroup } from '../grid/footer';
import type { Grid, GridPlugin } from '../grid/grid';

addMessages('en', { qsSearch: 'Search…', qsLabel: 'Search the grid' });
addMessages('pt-BR', { qsSearch: 'Buscar…', qsLabel: 'Buscar na grid' });

export interface QuickSearchOptions {
  /** The record fields the text is looked for in (any of them matching keeps the row). */
  fields: string[];
  /** ms after the last key before filtering. Default 250. */
  delay?: number;
  placeholder?: string;
}

/**
 * A search box inside the grid, in the row with the pager: what is typed keeps the rows where any of `fields` contains
 * it. Other filters (a FilterBuilder) keep working beside it; a filter that replaces them clears the box.
 */
export function quickSearch(options: QuickSearchOptions): GridPlugin {
  return {
    init(grid: Grid) {
      const store = grid.getStore();
      let mine: FilterNode | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const box = new TextField({ placeholder: options.placeholder ?? t('qsSearch'), ariaLabel: t('qsLabel'), clearable: true, cls: 'op-quicksearch' });
      const group = h('div', 'op-quicksearch__group op-footer-group');
      box.mount(group);
      const apply = () => {
        const text = (box.getValue() ?? '').trim();
        const others = store.getFilters().filter((f) => f !== mine);
        mine = text ? { op: 'or', filters: options.fields.map((field) => ({ field, op: 'contains', value: text })) } : undefined;
        void store.filter(mine ? [...others, mine] : others);
      };
      box.on('change', () => {
        clearTimeout(timer);
        timer = setTimeout(apply, options.delay ?? 250);
      });
      const off = store.subscribe((c) => {
        if (c.type === 'filter' && mine && !store.getFilters().includes(mine)) {
          mine = undefined;
          box.setValue('', true);
        }
      });
      const leave = addFooterGroup(grid, group);
      return () => {
        clearTimeout(timer);
        off();
        leave();
        box.destroy();
      };
    },
  };
}
