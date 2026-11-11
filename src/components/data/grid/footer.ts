import type { Grid } from './grid';

/**
 * The row under a grid where the pager and the plugins' icon buttons sit side by side. Each plugin adds its own group;
 * the last one out gives the pager back.
 */
export function addFooterGroup(grid: Grid, group: HTMLElement): () => void {
  let row = grid.el.querySelector<HTMLElement>('.op-grid__footer');
  if (!row) {
    row = Object.assign(document.createElement('div'), { className: 'op-grid__footer' });
    const pager = grid.el.querySelector<HTMLElement>('.op-grid__pager');
    if (pager) {
      pager.before(row);
      row.append(pager);
    } else grid.el.querySelector('.op-grid__table')!.after(row);
  }
  row.append(group);
  const mine = row;
  return () => {
    group.remove();
    if (mine.querySelector('.op-footer-group')) return;
    const pager = mine.querySelector<HTMLElement>('.op-grid__pager');
    if (pager) mine.before(pager);
    mine.remove();
  };
}
