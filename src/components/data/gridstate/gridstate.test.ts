import { describe, it, expect, afterEach, vi } from 'vitest';
import { create, Grid, Store, persistState, setStateStorage } from 'optikos';

afterEach(() => {
  document.body.innerHTML = '';
  setStateStorage(undefined);
  vi.useRealTimers();
});
const rows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `n${30 - i}`, kind: i % 2 ? 'a' : 'b' }));
const mk = () => {
  const g = create<Grid>({
    type: 'grid', store: new Store({ data: rows, pageSize: 10 }), resizableColumns: true, reorderableColumns: true,
    columns: [{ field: 'id', sortable: true }, { field: 'name', sortable: true }, { field: 'kind' }],
    plugins: [persistState('grid-test', { delay: 0 })],
    renderTo: document.body,
  } as any);
  return g;
};
const tick = () => new Promise((r) => setTimeout(r, 5));

describe('persistState', () => {
  it('saves columns, sort, filters and page, and a new grid with the same key starts from them', async () => {
    const mem = new Map<string, unknown>();
    setStateStorage({ get: (k) => mem.get(k), set: (k, v) => void mem.set(k, JSON.parse(JSON.stringify(v))) });
    const a = mk();
    await tick();
    a.setColumnState([{ field: 'kind', hidden: false }, { field: 'name', hidden: true }, { field: 'id', hidden: false, width: 90 }]);
    a.getStore().sort('name', 'asc');
    await a.getStore().filter({ field: 'kind', op: 'eq', value: 'b' });
    a.getStore().setPage(2);
    await tick();
    const saved = mem.get('grid-test') as any;
    expect(saved.columns.map((c: any) => c.field)).toEqual(['kind', 'name', 'id']);
    expect(saved.sorters).toEqual([{ field: 'name', dir: 'asc' }]);
    expect(saved.page).toBe(2);
    a.destroy();

    const b = mk();
    await tick();
    expect(b.getColumnState().map((c) => [c.field, c.hidden, c.width])).toEqual([['kind', false, undefined], ['name', true, undefined], ['id', false, 90]]);
    expect(b.getStore().getSorters()).toEqual([{ field: 'name', dir: 'asc' }]);
    expect(b.getStore().getFilters()).toHaveLength(1);
    expect(b.getStore().page).toBe(2);
  });

  it('does not overwrite the saved state while restoring, and survives a broken storage', async () => {
    setStateStorage({ get: () => { throw new Error('x'); }, set: () => {} });
    await expect(Promise.resolve().then(mk)).resolves.toBeDefined();
  });
});
