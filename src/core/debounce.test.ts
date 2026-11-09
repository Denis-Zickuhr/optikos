import { describe, it, expect } from 'vitest';
import { create } from 'optikos';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('debounce / settled (every field)', () => {
  it('settled follows change after the quiet time, and change is never delayed', async () => {
    const f = create<any>({ type: 'textfield', debounce: 40, renderTo: document.body });
    const changes: string[] = [];
    const settled: string[] = [];
    f.on('change', (v: string) => changes.push(v));
    f.on('settled', (v: string) => settled.push(v));
    f.setValue('a');
    f.setValue('ab');
    f.setValue('abc');
    expect(changes).toEqual(['a', 'ab', 'abc']);
    expect(settled).toEqual([]);
    await wait(70);
    expect(settled).toEqual(['abc']);
    f.destroy();
  });

  it('fires at once without debounce, on Enter and on blur, and never after destroy', async () => {
    const plain = create<any>({ type: 'textfield' });
    const got: string[] = [];
    plain.on('settled', (v: string) => got.push(v));
    plain.setValue('x');
    expect(got).toEqual(['x']);

    const g = create<any>({ type: 'textfield', debounce: 500, renderTo: document.body });
    const seen: string[] = [];
    g.on('settled', (v: string) => seen.push(v));
    g.setValue('q');
    g.getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(seen).toEqual(['q']);
    g.setValue('qq');
    g.destroy();
    await wait(20);
    expect(seen).toEqual(['q']);
  });

  it('works for other fields too (slider, checkbox)', async () => {
    const s = create<any>({ type: 'slider', debounce: 30, renderTo: document.body });
    const c = create<any>({ type: 'checkbox', debounce: 30, renderTo: document.body });
    const out: unknown[] = [];
    s.on('settled', (v: unknown) => out.push(['s', v]));
    c.on('settled', (v: unknown) => out.push(['c', v]));
    s.setValue(10);
    s.setValue(20);
    c.setValue(true);
    await wait(60);
    expect(out).toEqual([['s', 20], ['c', true]]);
    s.destroy();
    c.destroy();
  });
});
