import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Carousel } from 'optikos';

const slides = (n: number) => Array.from({ length: n }, (_, i) => ({ type: 'label', text: `S${i + 1}` }));
const make = (cfg: object = {}) => create<Carousel>({ type: 'carousel', items: slides(4), renderTo: document.body, ...cfg } as never);

afterEach(() => vi.useRealTimers());

describe('Carousel', () => {
  it('labels the region and each slide, and only the visible slide is reachable', () => {
    const c = make();
    expect(c.el.getAttribute('role')).toBe('region');
    expect(c.el.getAttribute('aria-roledescription')).toBe('carousel');
    const s = [...c.el.querySelectorAll('.op-carousel__track > *')];
    expect(s[1].getAttribute('aria-label')).toBe('2 of 4');
    expect(s.map((x) => x.hasAttribute('inert'))).toEqual([false, true, true, true]);
    expect(c.el.querySelectorAll('.op-carousel__dot').length).toBe(4);
    c.destroy();
  });

  it('moves with next/prev/goTo, emits change, and can be vetoed', () => {
    const c = make();
    const change = vi.fn();
    c.on('change', change);
    c.next();
    expect(c.getActive()).toBe(1);
    expect(change).toHaveBeenCalledWith(1, 0);
    expect(c.el.querySelectorAll('.op-carousel__dot')[1].getAttribute('aria-current')).toBe('true');
    c.on('before-change', () => false);
    c.goTo(3);
    expect(c.getActive()).toBe(1);
    c.destroy();
  });

  it('stops at the ends, or wraps with loop', () => {
    const c = make();
    const prev = c.el.querySelector<HTMLButtonElement>('.op-carousel__prev')!;
    const next = c.el.querySelector<HTMLButtonElement>('.op-carousel__next')!;
    expect(prev.disabled).toBe(true);
    c.goTo(3);
    expect(next.disabled).toBe(true);
    c.next();
    expect(c.getActive()).toBe(3);
    const l = make({ loop: true });
    l.prev();
    expect(l.getActive()).toBe(3);
    l.next();
    expect(l.getActive()).toBe(0);
    c.destroy();
    l.destroy();
  });

  it('perView shows several at once; the last position is items - perView', () => {
    const c = make({ perView: 3 });
    expect(c.el.querySelectorAll('.op-carousel__dot').length).toBe(2);
    c.goTo(9);
    expect(c.getActive()).toBe(1);
    expect([...c.el.querySelectorAll('.op-carousel__track > *')].map((x) => x.hasAttribute('inert'))).toEqual([true, false, false, false]);
    c.destroy();
  });

  it('follows add/remove and hides the controls with a single item', () => {
    const c = make({ items: slides(1) });
    expect(c.el.querySelector<HTMLElement>('.op-carousel__next')!.hidden).toBe(true);
    c.add({ type: 'label', text: 'S2' });
    expect(c.el.querySelector<HTMLElement>('.op-carousel__next')!.hidden).toBe(false);
    expect(c.el.querySelector('.op-carousel__track > :last-child')!.getAttribute('aria-label')).toBe('2 of 2');
    c.destroy();
  });

  it('keys work on the controls, not inside a slide', () => {
    const c = make({ items: [{ type: 'textfield', name: 'x' }, ...slides(2)] });
    c.el.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(c.getActive()).toBe(0);
    c.el.querySelector('.op-carousel__track')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(c.getActive()).toBe(1);
    c.el.querySelector('.op-carousel__track')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(c.getActive()).toBe(2);
    c.destroy();
  });

  it('autoplay advances, wraps, and stops for good after a click on the controls', () => {
    vi.useFakeTimers();
    const c = make({ autoplay: 1000, items: slides(3) });
    expect(c.isPlaying()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(c.getActive()).toBe(1);
    vi.advanceTimersByTime(2000);
    expect(c.getActive()).toBe(0);
    c.el.querySelector<HTMLButtonElement>('.op-carousel__next')!.click();
    expect(c.isPlaying()).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(c.getActive()).toBe(1);
    c.play();
    expect(c.isPlaying()).toBe(true);
    c.destroy();
    vi.advanceTimersByTime(5000);
  });
});
