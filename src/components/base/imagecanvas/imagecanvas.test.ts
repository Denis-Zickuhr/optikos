import { describe, it, expect, vi } from 'vitest';
import { create, ImageCanvas } from 'optikos';

const make = (cfg: object = {}) => create<ImageCanvas>({ type: 'imagecanvas', src: 'a.png', alt: 'A cat', renderTo: document.body, ...cfg } as never);

describe('ImageCanvas', () => {
  it('loads: loading mask until load, error message on error, alt on the stage', () => {
    const c = make();
    const img = c.el.querySelector('img')!;
    const load = vi.fn();
    const error = vi.fn();
    c.on('load', load);
    c.on('error', error);
    expect(c.el.classList.contains('is-loading')).toBe(true);
    expect(c.el.querySelector('.op-imagecanvas__stage')!.getAttribute('aria-label')).toBe('A cat');
    img.dispatchEvent(new Event('load'));
    expect(c.el.classList.contains('is-loading')).toBe(false);
    expect(load).toHaveBeenCalled();
    c.setSrc('b.png');
    img.dispatchEvent(new Event('error'));
    expect(c.el.classList.contains('is-error')).toBe(true);
    expect(c.el.querySelector('.op-imagecanvas__status')!.textContent).toMatch(/could not/);
    expect(error).toHaveBeenCalled();
    c.destroy();
  });

  it('zooms between 1 and maxZoom, by API, keys and tools, and resets', () => {
    const c = make({ maxZoom: 3 });
    const zoom = vi.fn();
    c.on('zoom', zoom);
    c.zoomTo(2);
    expect(c.getZoom()).toBe(2);
    expect(c.el.classList.contains('is-zoomed')).toBe(true);
    c.zoomTo(10);
    expect(c.getZoom()).toBe(3);
    const stage = c.el.querySelector('.op-imagecanvas__stage')!;
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));
    expect(c.getZoom()).toBe(1);
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    expect(c.getZoom()).toBe(1.25);
    c.el.querySelectorAll<HTMLButtonElement>('.op-imagecanvas__tool')[0].click();
    expect(c.getZoom()).toBe(1);
    expect(zoom).toHaveBeenCalledTimes(5);
    c.destroy();
  });

  it('zoomable: false has no tools and ignores zoom keys; setFit and setSrc work', () => {
    const c = make({ zoomable: false });
    expect(c.el.querySelector('.op-imagecanvas__tools')).toBeNull();
    c.el.querySelector('.op-imagecanvas__stage')!.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    expect(c.getZoom()).toBe(1);
    c.setFit('cover');
    expect(c.el.querySelector('img')!.style.objectFit).toBe('cover');
    c.setSrc('z.png');
    expect(c.el.querySelector('img')!.getAttribute('src')).toBe('z.png');
    c.destroy();
  });
});
