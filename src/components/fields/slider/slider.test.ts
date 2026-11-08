import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Slider, Form } from 'optikos';

const cleanup: Array<{ destroy(): void }> = [];
const mk = (cfg: object = {}): any => {
  const s = create<Slider>({ type: 'slider', label: 'Volume', ...cfg } as any) as any;
  document.body.append(s.el);
  s.notifyMount();
  cleanup.push(s);
  return s;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const knobs = (s: any) => Array.from(s.el.querySelectorAll('.op-slider__knob')) as HTMLElement[];
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const rect = (el: HTMLElement, left = 0, width = 200) => (el.getBoundingClientRect = () => ({ left, width, right: left + width, top: 0, bottom: 10, height: 10, x: left, y: 0, toJSON() {} }) as DOMRect);
const ptr = (el: EventTarget, type: string, x: number) => el.dispatchEvent(new MouseEvent(type, { clientX: x, bubbles: true, cancelable: true, button: 0 }));

describe('Slider', () => {
  it('has ARIA slider semantics and shows the value position, text and fill', () => {
    const s = mk({ value: 30, min: 0, max: 60, format: (v: number) => `${v} dB` });
    const k = knobs(s)[0];
    expect(k.getAttribute('role')).toBe('slider');
    expect(k.getAttribute('aria-valuemin')).toBe('0');
    expect(k.getAttribute('aria-valuemax')).toBe('60');
    expect(k.getAttribute('aria-valuenow')).toBe('30');
    expect(k.getAttribute('aria-valuetext')).toBe('30 dB');
    expect(k.style.left).toBe('50%');
    expect((s.el.querySelector('.op-slider__fill') as HTMLElement).style.width).toBe('50%');
    expect(s.getPercent()).toBe(50);
    expect(k.getAttribute('aria-labelledby')).toBe(s.el.querySelector('.op-field__label')!.id);
  });

  it('keyboard: arrows move by a step, Page by ten steps, Home/End to the limits; never outside min/max', () => {
    const s = mk({ value: 50, step: 5 });
    const k = knobs(s)[0];
    const changed = vi.fn();
    s.on('change', changed);
    key(k, 'ArrowRight');
    expect(s.getValue()).toBe(55);
    key(k, 'ArrowLeft');
    key(k, 'ArrowLeft');
    expect(s.getValue()).toBe(45);
    key(k, 'PageUp');
    expect(s.getValue()).toBe(95);
    key(k, 'PageUp');
    expect(s.getValue()).toBe(100);
    key(k, 'Home');
    expect(s.getValue()).toBe(0);
    key(k, 'ArrowDown');
    expect(s.getValue()).toBe(0);
    key(k, 'End');
    expect(s.getValue()).toBe(100);
    expect(changed).toHaveBeenCalled();
    expect(k.getAttribute('aria-valuenow')).toBe('100');
  });

  it('dragging the knob follows the pointer (snapped to the step), fires slide-start / change / slide-end, and is released', () => {
    const s = mk({ value: 0, step: 10 });
    rect(s.el.querySelector('.op-slider__track'));
    const k = knobs(s)[0];
    const start = vi.fn();
    const end = vi.fn();
    const changed = vi.fn();
    s.on('slide-start', start);
    s.on('slide-end', end);
    s.on('change', changed);
    ptr(k, 'pointerdown', 0);
    expect(start).toHaveBeenCalledTimes(1);
    expect(s.el.classList.contains('is-dragging')).toBe(true);
    ptr(k, 'pointermove', 96); // 48 % → snaps to 50
    expect(s.getValue()).toBe(50);
    ptr(k, 'pointermove', 400); // far right: clamped to max
    expect(s.getValue()).toBe(100);
    ptr(k, 'pointerup', 400);
    expect(end).toHaveBeenCalledWith(100);
    expect(s.el.classList.contains('is-dragging')).toBe(false);
    ptr(k, 'pointermove', 20);
    expect(s.getValue()).toBe(100); // no longer following
    expect(changed).toHaveBeenCalled();
  });

  it('clicking the track moves the knob there', () => {
    const s = mk({ value: 0 });
    rect(s.el.querySelector('.op-slider__track'));
    ptr(s.el.querySelector('.op-slider__track')!, 'pointerdown', 150);
    expect(s.getValue()).toBe(75);
    ptr(knobs(s)[0], 'pointerup', 150);
  });

  it('range: two knobs, [low, high]; they never cross; the nearest knob takes a click', () => {
    const s = mk({ range: true, value: [20, 80] });
    expect(knobs(s)).toHaveLength(2);
    expect(s.getValue()).toEqual([20, 80]);
    expect((s.el.querySelector('.op-slider__fill') as HTMLElement).style.left).toBe('20%');
    expect((s.el.querySelector('.op-slider__fill') as HTMLElement).style.width).toBe('60%');
    key(knobs(s)[0], 'End'); // stops at the other knob
    expect(s.getValue()).toEqual([80, 80]);
    key(knobs(s)[1], 'Home');
    expect(s.getValue()).toEqual([80, 80]);
    s.setValue([10, 30]);
    rect(s.el.querySelector('.op-slider__track'));
    ptr(s.el.querySelector('.op-slider__track')!, 'pointerdown', 160); // 80 % is nearer to the high knob (30)
    ptr(knobs(s)[1], 'pointerup', 160);
    expect(s.getValue()).toEqual([10, 80]);
    expect(knobs(s)[1].getAttribute('aria-valuemin')).toBe('10');
  });

  it('decimal steps do not leave float noise; setMin/setMax/setStep clamp the value; setRange converts', () => {
    const s = mk({ min: 0, max: 1, step: 0.1, value: 0.3 });
    key(knobs(s)[0], 'ArrowRight');
    expect(s.getValue()).toBe(0.4);
    s.setMax(0.2);
    expect(s.getValue()).toBe(0.2);
    s.setMax(1);
    s.setRange(true);
    expect(knobs(s)).toHaveLength(2);
    expect(Array.isArray(s.getValue())).toBe(true);
    s.setRange(false);
    expect(typeof s.getValue()).toBe('number');
  });

  it('marks and the scale render; showValue changes when the bubble shows', () => {
    const s = mk({ marks: [{ value: 0, label: 'Low' }, { value: 50, label: 'Mid' }, { value: 100, label: 'High' }], showScale: true, showValue: 'always' });
    expect(Array.from(s.el.querySelectorAll('.op-slider__mark-label')).map((x: any) => x.textContent)).toEqual(['Low', 'Mid', 'High']);
    expect(s.el.querySelector('.op-slider__scale')!.textContent).toBe('0100');
    expect(s.el.classList.contains('has-bubble-always')).toBe(true);
    expect(mk({ marks: true, step: 25 }).el.querySelectorAll('.op-slider__mark')).toHaveLength(5);
  });

  it('disabled and readonly ignore keys and pointers; the value works inside a Form (getValues, dirty, reset)', () => {
    const d = mk({ value: 10, disabled: true });
    key(knobs(d)[0], 'End');
    expect(d.getValue()).toBe(10);
    expect(knobs(d)[0].getAttribute('aria-disabled')).toBe('true');
    const r = mk({ value: 10, readonly: true });
    key(knobs(r)[0], 'End');
    expect(r.getValue()).toBe(10);
    const form = create<Form>({ type: 'form', items: [{ type: 'slider', name: 'volume', value: 20 }, { type: 'slider', name: 'price', range: true, value: [10, 90] }] } as any);
    document.body.append(form.el);
    cleanup.push(form);
    form.getField('volume')!.setValue(70);
    expect(form.getValues()).toEqual({ volume: 70, price: [10, 90] });
    expect(form.isDirty()).toBe(true);
    form.reset();
    expect(form.getValues().volume).toBe(20);
  });
});
