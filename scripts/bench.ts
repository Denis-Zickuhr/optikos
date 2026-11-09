// Benchmark cases, run in a real Chromium by scripts/bench.mjs (`npm run bench`). Each case returns milliseconds.
import { create, Store, type Grid, type Form } from '../src/index';
import { motion } from '../src/motion/config';

motion.disable();

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Person ${(i * 7919) % n}`, city: ['Lisbon', 'Recife', 'Porto', 'Natal'][i % 4], total: (i * 37) % 1000 }));
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const host = () => {
  document.body.innerHTML = '';
  const el = document.body.appendChild(document.createElement('div'));
  el.style.cssText = 'width:900px;height:600px';
  return el;
};
const columns = [{ field: 'id', header: '#', width: 80, sortable: true }, { field: 'name', header: 'Name', flex: 1, sortable: true }, { field: 'city', header: 'City' }, { field: 'total', header: 'Total', format: 'money', align: 'right' }];

const DATA = rows(100_000);

export const cases: Record<string, () => Promise<number>> = {
  'Store: load 100k records': async () => {
    const t = performance.now();
    new Store({ data: DATA });
    return performance.now() - t;
  },
  'Store: sort 100k by text': async () => {
    const s = new Store({ data: DATA });
    const t = performance.now();
    await s.sort('name', 'asc');
    return performance.now() - t;
  },
  'Store: filter 100k (contains)': async () => {
    const s = new Store({ data: DATA });
    const t = performance.now();
    await s.filter({ field: 'name', op: 'contains', value: '99' });
    return performance.now() - t;
  },
  'Grid: mount 100k rows, first paint': async () => {
    const store = new Store({ data: DATA });
    const el = host();
    const t = performance.now();
    create<Grid>({ type: 'grid', renderTo: el, height: 600, store, columns } as never);
    await frame();
    return performance.now() - t;
  },
  'Grid: scroll jump across 100k rows (per frame)': async () => {
    const el = host();
    const g = create<Grid>({ type: 'grid', renderTo: el, height: 600, store: new Store({ data: DATA }), columns } as never);
    await frame();
    const vp = g.el.querySelector<HTMLElement>('.op-grid__viewport')!;
    const t = performance.now();
    for (let i = 1; i <= 100; i++) {
      vp.scrollTop = (vp.scrollHeight * i) / 100;
      vp.dispatchEvent(new Event('scroll'));
      await new Promise(requestAnimationFrame);
    }
    return (performance.now() - t) / 100;
  },
  'Form: create, render and destroy 1000 fields': async () => {
    const el = host();
    const t = performance.now();
    const f = create<Form>({ type: 'form', renderTo: el, items: Array.from({ length: 1000 }, (_, i) => ({ type: i % 3 ? 'textfield' : 'numberfield', name: `f${i}`, label: `Field ${i}`, required: i % 2 === 0 })) } as never);
    await frame();
    f.destroy();
    return performance.now() - t;
  },
  'Form: validate 1000 fields (all marked)': async () => {
    const el = host();
    const f = create<Form>({ type: 'form', renderTo: el, items: Array.from({ length: 1000 }, (_, i) => ({ type: 'textfield', name: `f${i}`, label: `Field ${i}`, required: true, minLength: 3 })) } as never);
    const t = performance.now();
    f.validate();
    return performance.now() - t;
  },
};

(window as unknown as { __bench: (runs: number) => Promise<Record<string, number[]>> }).__bench = async (runs) => {
  const out: Record<string, number[]> = {};
  for (const [name, fn] of Object.entries(cases)) {
    await fn(); // warm-up
    out[name] = [];
    for (let i = 0; i < runs; i++) out[name].push(await fn());
  }
  return out;
};
