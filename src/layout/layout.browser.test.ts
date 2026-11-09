// Real browser: the responsive layouts measure the container with a real ResizeObserver, and CSS really lays things out.
import { describe, it, expect, afterEach } from 'vitest';
import { create, Container, Grid, Widget, Store } from 'optikos';

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const host = (width: number, height = 400) => {
  const el = document.body.appendChild(document.createElement('div'));
  el.style.cssText = `width:${width}px;height:${height}px`;
  return el;
};
afterEach(() => {
  document.body.innerHTML = '';
});

describe('border layout (browser)', () => {
  const make = (renderTo: HTMLElement) =>
    create<Container>({
      type: 'container', renderTo, height: 400, layout: { type: 'border' },
      items: [
        { type: 'container', region: 'west', width: 200 },
        { type: 'container', region: 'center' },
        { type: 'container', region: 'east', width: 120 },
      ],
    } as never);

  it('wide: west | center | east side by side, with the asked widths', async () => {
    const c = make(host(1000));
    await frame();
    const [w, ctr, e] = ['west', 'center', 'east'].map((r) => c.el.querySelector<HTMLElement>(`[data-region="${r}"]`)!.getBoundingClientRect());
    expect(c.el.classList.contains('is-narrow')).toBe(false);
    expect(Math.round(w.width)).toBe(200);
    expect(Math.round(e.width)).toBe(120);
    expect(w.right).toBeLessThanOrEqual(ctr.left + 1);
    expect(ctr.right).toBeLessThanOrEqual(e.left + 1);
  });

  it('narrow: measured below 768px, the sides become closed drawers and the center takes the width', async () => {
    const h = host(500);
    const c = make(h);
    await frame();
    expect(c.el.classList.contains('is-narrow')).toBe(true);
    const center = c.el.querySelector<HTMLElement>('[data-region="center"]')!.getBoundingClientRect();
    expect(Math.round(center.width)).toBe(500);
    h.style.width = '1000px';
    await frame();
    expect(c.el.classList.contains('is-narrow')).toBe(false);
  });
});

describe('Grid virtualization (browser)', () => {
  it('10 000 rows keep only a window of row nodes, the row height comes from the token, and scrolling renders the end', async () => {
    const data = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: `Person ${i + 1}` }));
    const g = create<Grid>({ type: 'grid', renderTo: host(600, 300), height: 300, store: new Store({ data }), columns: [{ field: 'id', header: '#', width: 80 }, { field: 'name', header: 'Name', flex: 1 }] } as never);
    await frame();
    const rows = () => g.el.querySelectorAll('.op-grid__body-row');
    expect(rows().length).toBeGreaterThan(3);
    expect(rows().length).toBeLessThan(60);
    const row = rows()[0] as HTMLElement;
    const probe = g.el.appendChild(document.createElement('div'));
    probe.style.cssText = 'position:absolute;height:var(--op-grid-row-height, var(--op-row-height))';
    const token = probe.getBoundingClientRect().height;
    probe.remove();
    expect(token).toBeGreaterThan(20);
    expect(Math.abs(row.getBoundingClientRect().height - token)).toBeLessThan(1);
    const scroller = g.el.querySelector<HTMLElement>('.op-grid__viewport')!;
    scroller.scrollTop = scroller.scrollHeight;
    scroller.dispatchEvent(new Event('scroll'));
    await frame();
    expect(g.el.textContent).toContain('Person 10000');
    expect(rows().length).toBeLessThan(60);
  });
});

describe('Widget drag (browser)', () => {
  it('dragging the header with the pointer moves the widget', async () => {
    const w = create<Widget>({ type: 'widget', title: 'Notes', side: 'right', draggable: true, items: [{ type: 'label', text: 'hello' }] } as never);
    w.open();
    await frame();
    const head = w.el.querySelector<HTMLElement>('.op-panel__header')!;
    const before = w.el.getBoundingClientRect();
    const r = head.getBoundingClientRect();
    const at = (type: string, x: number, y: number) => head.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, button: 0, buttons: 1, isPrimary: true }));
    at('pointerdown', r.left + 20, r.top + 10);
    for (let i = 1; i <= 5; i++) at('pointermove', r.left + 20 - i * 30, r.top + 10 + i * 20);
    at('pointerup', r.left + 20 - 150, r.top + 110);
    await frame();
    const after = w.el.getBoundingClientRect();
    expect(Math.round(before.left - after.left)).toBeGreaterThan(100);
    w.destroy();
  });
});
