import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect, bind, fromStore } from 'optikos/bind';
import { create, Button, TextField, Store } from 'optikos';

describe('signals', () => {
  it('effect re-runs on change, tracks dynamic deps, cleans up and disposes', () => {
    const a = signal(1);
    const b = signal(10);
    const useB = signal(false);
    const seen: number[] = [];
    const cleanup = vi.fn();
    const stop = effect(() => {
      seen.push(useB() ? b() : a());
      return cleanup;
    });
    a.set(2);
    b.set(11); // not read yet
    useB.set(true);
    b.set(12);
    a.set(3); // no longer read
    expect(seen).toEqual([1, 2, 11, 12]);
    expect(cleanup).toHaveBeenCalledTimes(3);
    stop();
    b.set(99);
    expect(seen.length).toBe(4);
  });

  it('ignores equal writes; update and computed work', () => {
    const n = signal(2);
    const double = computed(() => n() * 2);
    const run = vi.fn();
    effect(() => run(double()));
    n.set(2);
    n.update((x) => x + 1);
    expect(double()).toBe(6);
    expect(run.mock.calls.map((c) => c[0])).toEqual([4, 6]);
  });
});

describe('bind', () => {
  it('drives setters, follows signals and is released on destroy', () => {
    const label = signal('Save');
    const busy = signal(false);
    const b = create<Button>({ type: 'button', text: 'x' });
    bind(b, { text: label, disabled: busy, loading: () => busy() });
    expect(b.el.querySelector('.op-button__text')!.textContent).toBe('Save');
    label.set('Saving…');
    busy.set(true);
    expect(b.el.querySelector('.op-button__text')!.textContent).toBe('Saving…');
    expect((b.el as HTMLButtonElement).disabled).toBe(true);
    b.destroy();
    label.set('after');
    expect(b.el.querySelector('.op-button__text')!.textContent).toBe('Saving…');
  });

  it('value is two-way on fields', () => {
    const name = signal('Ada');
    const f = create<TextField>({ type: 'textfield' });
    bind(f, { value: name });
    expect(f.getInput().value).toBe('Ada');
    f.getInput().value = 'Bob';
    f.getInput().dispatchEvent(new Event('input'));
    expect(name()).toBe('Bob');
    name.set('Cy');
    expect(f.getInput().value).toBe('Cy');
  });

  it('rejects keys without a setter; stores are observable through fromStore', () => {
    const b = create<Button>({ type: 'button' });
    expect(() => bind(b, { nope: () => 1 })).toThrow(/no setNope/);
    const store = new Store({ data: [{ a: 1 }] });
    const rows = fromStore(store);
    const count = computed(() => rows().count);
    const btn = create<Button>({ type: 'button' });
    bind(btn, { text: () => `${count()} rows` });
    store.add({ a: 2 });
    expect(btn.el.querySelector('.op-button__text')!.textContent).toBe('2 rows');
  });
});
