import { describe, it, expect, afterEach } from 'vitest';
import { create, Chart, Store } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const data = [{ m: 'Jan', a: 10, b: 5 }, { m: 'Feb', a: 20, b: 8 }, { m: 'Mar', a: 15, b: 12 }];
const mk = (cfg: object = {}) => create<Chart>({ type: 'chart', x: 'm', series: ['a', 'b'], data, renderTo: document.body, ...cfg } as any);
const q = (c: Chart, sel: string) => Array.from(c.el.querySelectorAll(sel));

describe('Chart', () => {
  it('draws one bar per category and series, a legend, and a table for screen readers', () => {
    const c = mk({ title: 'Sales' });
    expect(q(c, '.op-chart__bar')).toHaveLength(6);
    expect(q(c, '.op-chart__key').map((k) => k.textContent)).toEqual(['a', 'b']);
    expect(c.el.querySelector('svg')!.getAttribute('aria-label')).toBe('Sales');
    expect(q(c, 'table tbody tr')).toHaveLength(3);
    expect(c.el.querySelector('table caption')!.textContent).toBe('Sales');
  });

  it('stacks bars, and the legend hides a series', () => {
    const c = mk({ stacked: true });
    const bars = q(c, '.op-chart__bar');
    expect(bars).toHaveLength(6);
    (q(c, '.op-chart__key')[1] as HTMLElement).click();
    expect(q(c, '.op-chart__bar')).toHaveLength(3);
    expect(q(c, '.op-chart__key')[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('line and area draw a path per series; sparkline has no axes or legend', () => {
    expect(q(mk({ kind: 'line' }), '.op-chart__line')).toHaveLength(2);
    expect(q(mk({ kind: 'area', stacked: true }), '.op-chart__area')).toHaveLength(2);
    const sp = mk({ kind: 'sparkline', series: ['a'] });
    expect(q(sp, '.op-chart__tick')).toHaveLength(0);
    expect((sp.el.querySelector('.op-chart__legend') as HTMLElement).hidden).toBe(true);
  });

  it('pie and donut draw a slice per record, with the total in the middle of a donut', () => {
    const p = mk({ kind: 'pie', series: ['a'] });
    expect(q(p, '.op-chart__slice')).toHaveLength(3);
    expect(q(p, '.op-chart__key').map((k) => k.textContent)).toEqual(['Jan', 'Feb', 'Mar']);
    expect(q(mk({ kind: 'donut', series: ['a'] }), '.op-chart__total')[0].textContent).toBe('45');
  });

  it('arrow keys walk the points and the tooltip says what is there', () => {
    const c = mk({ format: (v: number) => `#${v}` });
    const svg = c.el.querySelector('svg')!;
    const key = (k: string) => svg.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    const tip = c.el.querySelector('.op-chart__tip') as HTMLElement;
    key('ArrowRight');
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toContain('Jan');
    key('ArrowRight');
    expect(tip.textContent).toContain('Feb');
    expect(tip.textContent).toContain('#20');
    key('Escape');
    expect(tip.hidden).toBe(true);
  });

  it('repaints once for a burst of store patches', async () => {
    const store = new Store({ data: data.map((d) => ({ ...d })) });
    const c = mk({ data: undefined, store });
    await Promise.resolve();
    store.add({ m: 'Apr', a: 1, b: 1 });
    store.add({ m: 'May', a: 1, b: 1 });
    await Promise.resolve();
    expect(q(c, '.op-chart__bar')).toHaveLength(2 * 5);
  });

  it('shows the empty text without data', () => {
    expect(mk({ data: [] }).el.querySelector('.op-chart__empty')!.textContent).toBe('No data');
  });
});
