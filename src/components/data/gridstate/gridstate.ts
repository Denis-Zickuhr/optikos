// Remembers a grid per user, as a plugin: `plugins: [persistState('grid-lots')]`.
import { loadState, saveState } from '../../../core/state';
import type { Grid, GridPlugin, ColumnState } from '../grid/grid';
import type { FilterNode, Sorter } from '../../../data/proxy';

export interface GridState {
  columns?: ColumnState[];
  sorters?: Sorter[];
  filters?: FilterNode[];
  page?: number;
  pageSize?: number;
}

export interface PersistOptions {
  /** What to keep. All on by default. */
  columns?: boolean;
  sort?: boolean;
  filters?: boolean;
  page?: boolean;
  /** ms to wait after a change before saving. Default 300. */
  delay?: number;
}

/**
 * Keeps widths, order and visibility of the columns, the sort, the filters, the page size and the page under `key`
 * (`setStateStorage` decides where: the browser by default) and puts them back when the grid is created.
 */
export function persistState(key: string, o: PersistOptions = {}): GridPlugin {
  return {
    init(grid: Grid) {
      const store = grid.getStore();
      let restoring = true;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let dead = false;
      const snapshot = (): GridState => ({
        ...(o.columns !== false && { columns: grid.getColumnState() }),
        ...(o.sort !== false && { sorters: store.getSorters() }),
        ...(o.filters !== false && { filters: store.getFilters() }),
        ...(o.page !== false && { page: store.page }),
        pageSize: store.pageSize,
      });
      const save = () => {
        if (restoring) return;
        clearTimeout(timer);
        timer = setTimeout(() => void saveState(key, snapshot()), o.delay ?? 300);
      };
      void loadState<GridState>(key).then(async (s) => {
        if (dead) return;
        if (s) {
          if (s.columns && o.columns !== false) grid.setColumnState(s.columns);
          if (s.pageSize && s.pageSize !== store.pageSize && o.page !== false) store.setPageSize(s.pageSize);
          if (s.sorters?.[0] && o.sort !== false) store.sort(s.sorters[0].field, s.sorters[0].dir);
          if (s.filters?.length && o.filters !== false) await store.filter(s.filters);
          if (s.page && o.page !== false) store.setPage(s.page);
        }
        restoring = false;
      });
      const offs = [grid.on('columns-change', save), store.subscribe((c) => ['sort', 'filter', 'page'].includes(c.type) && save())];
      return () => {
        dead = true;
        clearTimeout(timer);
        offs.forEach((off) => off());
      };
    },
  };
}
