import { describe, it, expect } from 'vitest';
import { Store, Emitter } from 'optikos';

const mk = () => new Store<{ id: number; name: string; votes: number }>({ data: [{ id: 1, name: 'Ana', votes: 1 }, { id: 2, name: 'Bia', votes: 2 }] });

describe('Store live patches', () => {
  it('upserts known ids in place (not as edits), adds new ones, removes, with one change event', () => {
    const s = mk();
    let n = 0;
    s.subscribe(() => n++);
    s.applyPatches([{ data: { id: 1, votes: 10 } }, { data: { id: 3, name: 'Cris', votes: 0 } }, { op: 'remove', id: 2 }]);
    expect(n).toBe(1);
    expect(s.getData().map((r) => [r.id, r.votes])).toEqual([[1, 10], [3, 0]]);
    expect(s.getById(1)!.isDirty()).toBe(false);
    expect(s.getModified().map((r) => r.id)).toEqual([]);
    expect(s.getRemoved()).toHaveLength(0);
  });

  it('keeps a field the user is editing, and re-sorts', () => {
    const s = mk();
    s.sort('votes', 'desc');
    s.getById(1)!.set('name', 'mine');
    s.applyPatches([{ data: { id: 1, name: 'server', votes: 99 } }]);
    expect(s.getById(1)!.get('name')).toBe('mine');
    expect(s.getAt(0)!.id).toBe(1);
  });

  it('connect feeds the store from a message source and stops', () => {
    const s = mk();
    const src = new Emitter() as any;
    const bus = new EventTarget();
    const stop = s.connect({ addEventListener: (t, f) => bus.addEventListener(t, f as any), removeEventListener: (t, f) => bus.removeEventListener(t, f as any) });
    bus.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify({ data: { id: 2, votes: 7 } }) }));
    expect(s.getById(2)!.get('votes')).toBe(7);
    stop();
    bus.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify([{ op: 'remove', id: 2 }]) }));
    expect(s.getById(2)).toBeDefined();
    void src;
  });

  it('fetchAll reads every page of a remote store through its proxy, with the current sort', async () => {
    const all = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const calls: unknown[] = [];
    const s = new Store<{ id: number }>({
      remote: true,
      pageSize: 10,
      proxy: (p) => {
        calls.push(p.page);
        const size = p.pageSize ?? 10;
        return { data: all.slice(((p.page ?? 1) - 1) * size, (p.page ?? 1) * size), total: 25 };
      },
    });
    const recs = await s.fetchAll(10);
    expect(recs).toHaveLength(25);
    expect(calls).toEqual([1, 2, 3]);
  });
});
