import { describe, it, expect, vi } from 'vitest';
import { create, Panel } from 'optikos';

const make = (cfg: object = {}) => create<Panel>({ type: 'panel', title: 'Hello', items: [{ type: 'label', text: 'body' }], ...cfg });

describe('Panel', () => {
  it('renders title, body items and a labelled region', () => {
    const p = make({ icon: 'user' });
    const region = p.el;
    expect(region.getAttribute('role')).toBe('region');
    const title = region.querySelector('.op-panel__title')!;
    expect(region.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.textContent).toBe('Hello');
    expect(region.querySelector('.op-panel__body')?.textContent).toBe('body');
    p.setTitle('Other');
    expect(title.textContent).toBe('Other');
  });

  it('hides the header when there is nothing to show', () => {
    const p = make({ title: undefined });
    expect((p.el.querySelector('.op-panel__header') as HTMLElement).hidden).toBe(true);
  });

  it('collapses and expands with cancelable events and aria-expanded', () => {
    const p = make({ collapsible: true });
    const body = p.el.querySelector('.op-panel__body') as HTMLElement;
    const btn = p.el.querySelector('.op-panel__tool') as HTMLButtonElement;
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const before = vi.fn(() => false);
    const off = p.on('before-collapse', before);
    p.collapse();
    expect(body.hidden).toBe(false);
    off();
    p.on('collapse', vi.fn());
    btn.click();
    expect(body.hidden).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    p.toggle();
    expect(body.hidden).toBe(false);
  });

  it('close destroys (or hides) and emits events', () => {
    const p = make({ closable: true });
    p.mount();
    const closed = vi.fn();
    p.on('close', closed);
    (p.el.querySelector('.op-panel__tool') as HTMLButtonElement).click();
    expect(p.destroyed).toBe(true);
    expect(closed).toHaveBeenCalled();
    const h = make({ closable: true, closeAction: 'hide' });
    h.close();
    expect(h.destroyed).toBe(false);
    expect(h.el.hidden).toBe(true);
  });

  it('builds tbar, bbar and footer buttons with handlers', () => {
    const handler = vi.fn();
    const p = make({ tbar: [{ type: 'button', text: 'T' }], bbar: ['->', { type: 'label', text: 'status' }], buttons: [{ text: 'OK', handler }] });
    expect(p.el.querySelector('.op-panel__tbar')?.textContent).toContain('T');
    expect(p.el.querySelector('.op-panel__bbar')?.textContent).toContain('status');
    (p.el.querySelector('.op-panel__footer button') as HTMLButtonElement).click();
    expect(handler).toHaveBeenCalled();
  });

  it('destroy cascades to children and toolbars', () => {
    const p = make({ tbar: [{ type: 'button', text: 'T' }] });
    p.mount();
    const kids = [...p.items];
    p.destroy();
    expect(kids.every((k) => k.destroyed)).toBe(true);
    expect(document.querySelector('.op-panel')).toBeNull();
  });
});
