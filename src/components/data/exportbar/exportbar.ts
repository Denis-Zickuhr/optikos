import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { Button } from '../../base/button/button';
import { registerIcons } from '../../base/icon/icon';
import { exportGrid, printGrid } from '../gridexport/gridexport';
import { addFooterGroup } from '../grid/footer';
import type { Grid, GridPlugin } from '../grid/grid';

addMessages('en', { ebCsv: 'Export CSV', ebXlsx: 'Export Excel', ebPage: 'Export this page (CSV)', ebPrint: 'Print', ebActions: 'Export and print' });
addMessages('pt-BR', { ebCsv: 'Exportar CSV', ebXlsx: 'Exportar Excel', ebPage: 'Exportar esta página (CSV)', ebPrint: 'Imprimir', ebActions: 'Exportar e imprimir' });

registerIcons({
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
});

export type ExportBarAction = 'csv' | 'xlsx' | 'page' | 'print';

export interface ExportBarOptions {
  /** Each button: `false` leaves it out. `csv`, `xlsx` and `print` default to true; `page` (CSV of the page on screen) to true on a paged grid. */
  csv?: boolean;
  xlsx?: boolean;
  page?: boolean;
  print?: boolean;
  /** File name without extension. Default `export`. */
  filename?: string;
  /** A heading above the printed table. */
  title?: string;
  /** Show the text beside the icons. Default false (icons with a tooltip). */
  labels?: boolean;
}

export interface ExportBar extends GridPlugin {
  setVisible(action: ExportBarAction, visible: boolean): void;
  setDisabled(action: ExportBarAction, disabled: boolean): void;
}

const ICON = { csv: 'download', xlsx: 'table', page: 'file', print: 'printer' } as const;
const TEXT = { csv: 'ebCsv', xlsx: 'ebXlsx', page: 'ebPage', print: 'ebPrint' } as const;
const SHORT = { csv: 'CSV', xlsx: 'Excel', page: '1', print: '' } as const;

/**
 * Export and print buttons inside the grid, in a row with the pager: `plugins: [exportBar({ print: false })]`. They run
 * `exportGrid` and `printGrid`, which still work on their own from your own buttons.
 */
export function exportBar(options: ExportBarOptions = {}): ExportBar {
  const buttons = new Map<ExportBarAction, Button>();
  let cleanup = () => {};
  return {
    init(grid: Grid) {
      const name = options.filename ?? 'export';
      const run: Record<ExportBarAction, () => Promise<unknown>> = {
        csv: () => exportGrid(grid, { filename: name }),
        xlsx: () => exportGrid(grid, { format: 'xlsx', filename: name }),
        page: () => exportGrid(grid, { scope: 'page', filename: name }),
        print: () => printGrid(grid, { title: options.title }),
      };
      const group = h('div', 'op-exportbar op-footer-group', { role: 'group', 'aria-label': t('ebActions') });
      for (const action of Object.keys(run) as ExportBarAction[]) {
        const on = options[action] ?? (action !== 'page' || !!grid.config.paging);
        const label = t(TEXT[action]);
        const btn = new Button({
          icon: ICON[action], variant: 'ghost', ariaLabel: label, tooltip: label, hidden: !on,
          text: options.labels ? (action === 'page' ? t('ebPage') : action === 'print' ? t('ebPrint') : SHORT[action]) : undefined,
          handler: async () => {
            btn.setDisabled(true);
            try {
              await run[action]();
            } finally {
              btn.setDisabled(false);
            }
          },
        });
        btn.mount(group);
        buttons.set(action, btn);
      }
      const leave = addFooterGroup(grid, group);
      cleanup = () => {
        leave();
        buttons.forEach((b) => b.destroy());
        buttons.clear();
      };
      return () => cleanup();
    },
    setVisible: (action, visible) => buttons.get(action)?.[visible ? 'show' : 'hide'](),
    setDisabled: (action, disabled) => buttons.get(action)?.setDisabled(disabled),
  };
}
