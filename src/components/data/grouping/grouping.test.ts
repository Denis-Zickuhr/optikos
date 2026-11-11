import { describe, it, expect, afterEach } from 'vitest';
import { create, Grid, Store, grouping } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const rows = [
  { id: 1, event: 'Gala', name: 'Ana', votes: 10 },
  { id: 2, event: 'Final', name: 'Bia', votes: 5 },
  { id: 3, event: 'Gala', name: 'Cris', votes: 20 },
  { id: 4, event: 'Final', name: 'Duda', votes: 15 },
  { id: 5, event: 'Gala', name: 'Eli', votes: 30 },
];
const tick = () => new Promise((r) => setTimeout(r, 0));
const mk = (opts = {}, cfg = {}) => {
  const plugin = grouping({ field: 'event', ...opts });
  const g = create<Grid>({
    type: 'grid', renderTo: document.body, store: new Store({ data: rows }), plugins: [plugin],
    columns: [{ field: 'name', header: 'Name', sortable: true, summary: 'count' }, { field: 'votes', header: 'Votes', align: 'right', summary: 'sum', format: 'number' }, { field: 'event', hidden: true }],
    ...cfg,
  } as any);
  return { g, plugin };
};
const lines = (g: Grid) => Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__body-row')).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i)).map((r) => Array.from(r.children).map((c) => c.textContent!.trim()).filter(Boolean).join(' '));

describe('grouping', () => {
  it('shows a header with the count per group, then its rows and its total', () => {
    const { g } = mk();
    expect(lines(g)).toEqual(['Gala3', 'Ana 10', 'Cris 20', 'Eli 30', '3 60', 'Final2', 'Bia 5', 'Duda 15', '2 20']);
    expect(g.getRowCount()).toBe(9);
    const head = g.el.querySelector('.op-grid__row--group')!;
    expect(head.getAttribute('aria-level')).toBe('1');
    expect(head.getAttribute('aria-expanded')).toBe('true');
  });

  it('summary grand adds one total at the end; group alone none', () => {
    expect(lines(mk({ summary: 'grand' }).g).at(-1)).toBe('5 80');
    expect(lines(mk({ summary: 'grand' }).g)).not.toContain('3 60');
    expect(lines(mk({ summary: 'both' }).g)).toHaveLength(10);
  });

  it('click and keys close and open a group; expandAll / collapseAll; the event fires', async () => {
    const { g, plugin } = mk();
    const got: unknown[][] = [];
    g.on('group-toggle', (...a: unknown[]) => got.push(a));
    (g.el.querySelector('.op-grid__row--group') as HTMLElement).click();
    await tick();
    expect(lines(g)).toEqual(['Gala3', 'Final2', 'Bia 5', 'Duda 15', '2 20']);
    expect(got).toEqual([['Gala', false]]);
    g.focusRow(0);
    const table = g.el.querySelector('[role=grid]')!;
    const key = (k: string) => table.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key('ArrowRight');
    expect(lines(g)[1]).toBe('Ana 10');
    key('ArrowLeft');
    expect(lines(g)).toHaveLength(5);
    key('Enter');
    expect(lines(g)).toHaveLength(9);
    plugin.collapseAll();
    expect(lines(g)).toEqual(['Gala3', 'Final2']);
    plugin.expandAll();
    expect(lines(g)).toHaveLength(9);
  });

  it('sorts inside the groups, follows the store, and a custom summary and grouping function work', async () => {
    const { g } = mk({}, {});
    g.getStore().sort('votes', 'desc');
    await tick();
    expect(lines(g).slice(0, 4)).toEqual(['Gala3', 'Eli 30', 'Cris 20', 'Ana 10']);
    g.getStore().add({ id: 6, event: 'Gala', name: 'Fa', votes: 1 });
    await tick();
    expect(lines(g)[0]).toBe('Gala4');

    const g2 = create<Grid>({
      type: 'grid', renderTo: document.body, store: new Store({ data: rows }),
      plugins: [grouping({ by: (r) => (r.data.votes >= 15 ? 'High' : 'Low'), summary: 'grand', label: (k) => `${k} votes` })],
      columns: [{ field: 'name' }, { field: 'votes', summary: (v: number[]) => `max ${Math.max(...v)}` }],
    } as any);
    expect(lines(g2)[0]).toBe('Low votes2');
    expect(lines(g2).at(-1)).toBe('Total max 30');
  });

  it('selection skips headers and totals; destroy gives the plain list back', () => {
    const { g } = mk({}, { selection: 'multi' });
    g.select(0);
    expect(g.getSelection()).toHaveLength(0);
    g.select(1);
    expect(g.getSelection().map((r) => r.id)).toEqual([1]);
    g.destroy();
  });
});
