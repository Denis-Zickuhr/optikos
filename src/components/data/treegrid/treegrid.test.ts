import { describe, it, expect, afterEach } from 'vitest';
import { create, Grid, Store, treeGrid, flattenTree } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const tick = () => new Promise((r) => setTimeout(r, 0));
const nested = [
  { id: 1, name: 'Events', children: [{ id: 2, name: 'Gala', children: [{ id: 3, name: 'Doors' }] }, { id: 4, name: 'Final' }] },
  { id: 5, name: 'Staff' },
];
const mk = (opts = {}, data: Record<string, any>[] = flattenTree(nested)) => {
  const plugin = treeGrid(opts);
  const g = create<Grid>({ type: 'grid', renderTo: document.body, store: new Store({ data }), plugins: [plugin], selection: 'multi', columns: [{ field: 'name', header: 'Name' }, { field: 'id', header: '#' }] } as any);
  return { g, plugin };
};
const lines = (g: Grid) => Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__body-row')).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i)).map((r) => `${r.getAttribute('aria-level')}${r.getAttribute('aria-expanded') ? (r.getAttribute('aria-expanded') === 'true' ? '-' : '+') : ' '}${r.children[0].textContent}`);
const table = (g: Grid) => g.el.querySelector('[role=grid],[role=treegrid]')!;
const key = (g: Grid, k: string) => table(g).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('treeGrid', () => {
  it('flattenTree gives each node its parentId; roots show closed, with aria-level and aria-expanded', () => {
    expect(flattenTree(nested).map((r) => [r.id, r.parentId])).toEqual([[1, null], [2, 1], [3, 2], [4, 1], [5, null]]);
    const { g } = mk();
    expect(table(g).getAttribute('role')).toBe('treegrid');
    expect(lines(g)).toEqual(['1+Events', '1 Staff']);
  });

  it('click on the chevron opens, ← and → walk and open/close, expandAll / collapseAll', async () => {
    const { g, plugin } = mk();
    const ev: string[] = [];
    g.on('expand-node', (r: any) => ev.push(`+${r.id}`));
    g.on('collapse-node', (r: any) => ev.push(`-${r.id}`));
    (g.el.querySelector('.op-grid__expander') as HTMLElement).click();
    await tick();
    expect(lines(g)).toEqual(['1-Events', '2+Gala', '2 Final', '1 Staff']);
    g.focusRow(0);
    key(g, 'ArrowRight');
    expect(g.getActive()).toBe(1);
    key(g, 'ArrowRight');
    await tick();
    expect(lines(g)).toEqual(['1-Events', '2-Gala', '3 Doors', '2 Final', '1 Staff']);
    key(g, 'ArrowRight');
    expect(g.getActive()).toBe(2);
    key(g, 'ArrowLeft');
    expect(g.getActive()).toBe(1);
    key(g, 'ArrowLeft');
    expect(lines(g)).toHaveLength(4);
    key(g, 'ArrowLeft');
    expect(g.getActive()).toBe(0);
    expect(ev).toEqual(['+1', '+2', '-2']);
    plugin.collapseAll();
    expect(lines(g)).toHaveLength(2);
    plugin.expandAll();
    expect(lines(g)).toHaveLength(5);
  });

  it('keeps siblings in sort order, shows a child whose parent is filtered out as a root, and selects nodes', async () => {
    const { g, plugin } = mk({ expanded: true });
    g.getStore().sort('name', 'desc');
    await tick();
    expect(lines(g).map((l) => l.slice(2))).toEqual(['Staff', 'Events', 'Gala', 'Doors', 'Final']);
    g.select(2);
    expect(g.getSelection().map((r) => r.id)).toEqual([2]);
    await g.getStore().filter({ field: 'name', op: 'eq', value: 'Doors' });
    await tick();
    expect(lines(g)).toEqual(['1 Doors']);
    plugin.expandAll();
  });

  it('loads children on demand, shows the loading state and reports a failure', async () => {
    let fail = false;
    const calls: number[] = [];
    const { g } = mk({
      load: async (n: any) => {
        calls.push(n.id);
        if (fail) throw new Error('down');
        return [{ id: n.id * 10, name: `child of ${n.id}`, leaf: true }];
      },
    }, [{ id: 1, name: 'Remote', parentId: null }, { id: 2, name: 'Broken', parentId: null }]);
    const errors: unknown[] = [];
    g.on('load-error', (r: any) => errors.push(r.id));
    (g.el.querySelector('.op-grid__expander') as HTMLElement).click();
    expect(g.el.querySelector('.op-grid__expander.is-loading')).not.toBeNull();
    await tick();
    await tick();
    expect(lines(g)).toEqual(['1-Remote', '2 child of 1', '1+Broken']);
    expect(g.el.querySelectorAll('.is-leaf')).toHaveLength(1);
    fail = true;
    (g.el.querySelectorAll('.op-grid__expander')[2] as HTMLElement).click();
    await tick();
    await tick();
    expect(errors).toEqual([2]);
    expect(lines(g)[2]).toBe('1+Broken');
    expect(calls).toEqual([1, 2]);
  });

  it('destroy gives the plain grid back', () => {
    const { g } = mk();
    g.destroy();
    expect(document.querySelector('.op-grid--tree')).toBeNull();
  });
});
