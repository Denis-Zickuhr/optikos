import { describe, it, expect, vi } from 'vitest';
import { Store, Model, RestProxy, MemoryProxy, format } from './index';

const rows = [
  { id: 1, name: 'Carol', age: 30 },
  { id: 2, name: 'alice', age: 25 },
  { id: 3, name: 'Bob', age: 41 },
  { id: 4, name: 'Dan', age: 25 },
];

describe('Model', () => {
  it('converts types, applies defaults and tracks changes', () => {
    const m = new Model<any>({ age: '5' }, { fields: { age: { type: 'number' }, ok: { type: 'boolean', default: true } } });
    expect(m.data).toEqual({ age: 5, ok: true });
    expect(m.phantom).toBe(true);
    m.set('age', 6);
    expect(m.isDirty()).toBe(true);
    expect(m.getChanges()).toEqual({ age: 6 });
    m.reject();
    expect(m.get('age')).toBe(5);
  });
});

describe('Store (local)', () => {
  it('sorts, toggles direction, and keeps nulls last', () => {
    const s = new Store({ data: rows });
    s.sort('name');
    expect(s.getData().map((r) => r.name)).toEqual(['alice', 'Bob', 'Carol', 'Dan']);
    s.sort('name');
    expect(s.getSorters()[0].dir).toBe('desc');
    s.sort('age', 'asc');
    expect(s.getAt(0)!.data.age).toBe(25);
    s.sort(null);
    expect(s.getAt(0)!.id).toBe(1);
  });

  it('filters by spec and predicate', () => {
    const s = new Store({ data: rows });
    s.filter({ field: 'name', op: 'contains', value: 'AL' });
    expect(s.count).toBe(1);
    s.filter([{ field: 'age', op: 'ge', value: 30 }]);
    expect(s.totalCount).toBe(2);
    s.filter((r) => r.data.id === 4);
    expect(s.getAt(0)!.data.name).toBe('Dan');
    s.clearFilter();
    expect(s.count).toBe(4);
  });

  it('pages locally and clamps the page', () => {
    const s = new Store({ data: rows, pageSize: 3 });
    expect(s.count).toBe(3);
    expect(s.pageCount).toBe(2);
    s.setPage(2);
    expect(s.getData()).toEqual([rows[3]]);
    s.setPage(99);
    expect(s.page).toBe(2);
    s.filter({ field: 'age', value: 25 });
    expect(s.page).toBe(1);
    expect(s.pageCount).toBe(1);
  });

  it('add/remove/update emit change and track modified/removed', () => {
    const s = new Store({ data: rows });
    const change = vi.fn();
    const unsub = s.subscribe(change);
    const [n] = s.add({ name: 'New' });
    expect(s.count).toBe(5);
    expect(n.phantom).toBe(true);
    s.getAt(0)!.set('name', 'X');
    s.remove(1);
    expect(s.getRemoved()).toHaveLength(1);
    expect(s.getModified()).toHaveLength(2);
    expect(change.mock.calls.map((c) => c[0].type)).toEqual(['add', 'update', 'remove']);
    unsub();
    s.add({ name: 'again' });
    expect(change).toHaveBeenCalledTimes(3);
  });
});

describe('Store (proxy)', () => {
  it('loads through a function proxy and forwards params', async () => {
    const fn = vi.fn(async (_p: any) => rows);
    const s = new Store({ proxy: fn });
    const loaded = vi.fn();
    s.on('load', loaded);
    await s.load({ query: 'a' });
    expect(fn.mock.calls[0][0]).toMatchObject({ query: 'a' });
    expect(s.count).toBe(4);
    expect(loaded).toHaveBeenCalled();
  });

  it('remote mode sends sort/filter/page to the proxy and reloads', async () => {
    const calls: any[] = [];
    const s = new Store({
      remote: true,
      pageSize: 2,
      proxy: async (p) => {
        calls.push(p);
        return { data: rows.slice(0, 2), total: 4 };
      },
    });
    await s.load();
    expect(s.totalCount).toBe(4);
    expect(s.pageCount).toBe(2);
    s.sort('name');
    s.setPage(2);
    await Promise.resolve();
    await new Promise((r) => setTimeout(r));
    expect(calls[calls.length - 1]).toMatchObject({ page: 2, pageSize: 2, sorters: [{ field: 'name', dir: 'asc' }] });
  });

  it('ignores stale responses and reports errors', async () => {
    let n = 0;
    const s = new Store({
      proxy: (_p, signal) =>
        new Promise<any[]>((res, rej) => {
          const id = ++n;
          setTimeout(() => (signal?.aborted ? rej(new Error('abort')) : res([{ id, name: String(id) }])), id === 1 ? 20 : 1);
        }),
    });
    const a = s.load();
    const b = s.load();
    await Promise.all([a, b]);
    expect(s.getAt(0)!.data.name).toBe('2');
    const err = new Store({ proxy: () => Promise.reject(new Error('boom')) });
    const onErr = vi.fn();
    err.on('load-error', onErr);
    await err.load();
    expect(onErr).toHaveBeenCalled();
    expect(err.loading).toBe(false);
  });

  it('sync writes creates, updates and deletes', async () => {
    const log: string[] = [];
    const s = new Store<any>({
      data: [{ id: 1, n: 'a' }, { id: 2, n: 'b' }],
      proxy: { read: () => [] as any[], create: async (d) => (log.push('create'), { id: 9 }), update: async () => void log.push('update'), destroy: async () => void log.push('destroy') },
    });
    s.getAt(0)!.set('n', 'z');
    s.remove(1);
    const [added] = s.add({ n: 'c' });
    await s.sync();
    expect(log).toEqual(['destroy', 'update', 'create']);
    expect(added.id).toBe(9);
    expect(s.getModified()).toHaveLength(0);
  });
});

describe('RestProxy', () => {
  it('builds the query and reads total from the header', async () => {
    const fetchMock = vi.fn(async (_u: any, _i?: any) => new Response(JSON.stringify([{ id: 1 }]), { headers: { 'X-Total-Count': '50' } }));
    const p = new RestProxy({ url: '/api/items', fetch: fetchMock as any });
    const res = await p.read({ page: 2, pageSize: 10, sorters: [{ field: 'a', dir: 'desc' }], filters: [{ field: 'b', op: 'gt', value: 3 }], query: 'x' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/items?page=2&pageSize=10&sort=a%3Adesc&b__gt=3&query=x');
    expect(res.total).toBe(50);
    await p.update({ id: 7 });
    expect((fetchMock.mock.calls[1] as any)[0]).toBe('/api/items/7');
    expect((fetchMock.mock.calls[1] as any)[1].method).toBe('PUT');
  });

  it('throws on non-ok', async () => {
    const p = new RestProxy({ url: '/x', fetch: (async () => new Response('', { status: 500 })) as any });
    await expect(p.read({})).rejects.toThrow(/500/);
  });
});

describe('MemoryProxy / format', () => {
  it('memory proxy reads copies', () => {
    expect(new MemoryProxy([1, 2]).read().total).toBe(2);
  });
  it('formats numbers, money, dates (local ISO dates) and bool', () => {
    expect(format('number', 1234.5)).toBe('1,234.5');
    expect(format('money', 10)).toBe('$10.00');
    expect(format('date', '2026-11-07')).toContain('7');
    expect(format('bool', true)).toBe('✓');
    expect(() => format('nope', 1)).toThrow();
  });
});

describe('Store filter tree', () => {
  const mk = () => new Store<any>({ data: [{ id: 1, n: 'Ana', age: 20, city: 'A' }, { id: 2, n: 'Bob', age: 30, city: null }, { id: 3, n: 'Cid', age: 40, city: 'C' }] });
  const ids = (s: Store) => s.getData().map((r) => r.id);
  it('supports the new operators', () => {
    const s = mk();
    s.filter({ field: 'age', op: 'between', value: [25, 40] });
    expect(ids(s)).toEqual([2, 3]);
    s.filter({ field: 'age', op: 'notBetween', value: [25, 40] });
    expect(ids(s)).toEqual([1]);
    s.filter({ field: 'city', op: 'empty' });
    expect(ids(s)).toEqual([2]);
    s.filter({ field: 'city', op: 'notEmpty' });
    expect(ids(s)).toEqual([1, 3]);
    s.filter({ field: 'n', op: 'endsWith', value: 'D' });
    expect(ids(s)).toEqual([3]);
    s.filter({ field: 'n', op: 'notContains', value: 'a' });
    expect(ids(s)).toEqual([2, 3]);
    s.filter({ field: 'id', op: 'nin', value: [1, 2] });
    expect(ids(s)).toEqual([3]);
  });
  it('combines AND/OR groups, nested', () => {
    const s = mk();
    s.filter({ op: 'or', filters: [{ field: 'n', value: 'Ana' }, { op: 'and', filters: [{ field: 'age', op: 'gt', value: 25 }, { field: 'city', op: 'notEmpty' }] }] });
    expect(ids(s)).toEqual([1, 3]);
    s.filter({ op: 'and', filters: [] });
    expect(ids(s)).toEqual([1, 2, 3]);
  });
  it('compares dates', () => {
    const s = new Store<any>({ data: [{ id: 1, d: '2024-01-10' }, { id: 2, d: '2024-03-01' }] });
    s.filter({ field: 'd', op: 'ge', value: new Date('2024-02-01') });
    expect(ids(s)).toEqual([2]);
  });
  it('filter() resolves after a remote reload', async () => {
    const calls: unknown[] = [];
    const s = new Store({ remote: true, proxy: (p) => (calls.push(p.filters), { data: [{ id: 1 }], total: 1 }) });
    await s.filter({ op: 'or', filters: [{ field: 'a', value: 1 }] });
    expect(calls).toHaveLength(1);
    expect(s.count).toBe(1);
  });
});
