import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Dial, Form } from 'optikos';

const cleanup: Array<{ destroy(): void }> = [];
const mk = (cfg: object = {}): any => {
  const d = create<Dial>({ type: 'dial', label: 'Age', ...cfg } as any) as any;
  document.body.append(d.el);
  d.notifyMount();
  cleanup.push(d);
  return d;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const face = (d: any) => d.el.querySelector('.op-dial__face') as HTMLElement;
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const rect = (el: HTMLElement, w = 200, hgt = 60) => (el.getBoundingClientRect = () => ({ left: 0, top: 0, width: w, height: hgt, right: w, bottom: hgt, x: 0, y: 0, toJSON() {} }) as DOMRect);
/** A pointer event at (x, y) with a chosen timeStamp (ms), so drags have a known speed. */
const ptr = (el: EventTarget, type: string, x: number, t: number, y = 30) => {
  const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0 });
  Object.defineProperty(e, 'timeStamp', { value: t });
  el.dispatchEvent(e);
};
const digits = (d: any) => Array.from(d.el.querySelectorAll('.op-dial__reel')).map((r: any) => r.style.getPropertyValue('--d'));

describe('Dial', () => {
  it('is an ARIA slider and shows the value in the readout (one reel per digit)', () => {
    const d = mk({ min: 0, max: 120, value: 30, format: (v: number) => `${v} years` });
    const f = face(d);
    expect(f.getAttribute('role')).toBe('slider');
    expect(f.tabIndex).toBe(0);
    expect(f.getAttribute('aria-valuemin')).toBe('0');
    expect(f.getAttribute('aria-valuemax')).toBe('120');
    expect(f.getAttribute('aria-valuenow')).toBe('30');
    expect(f.getAttribute('aria-valuetext')).toBe('30 years');
    expect(f.getAttribute('aria-labelledby')).toBe(d.el.querySelector('.op-field__label')!.id);
    expect(digits(d)).toEqual(['3', '0']);
    expect(d.el.querySelector('.op-dial__readout')!.getAttribute('aria-hidden')).toBe('true');
    expect(d.getDisplayText()).toBe('30 years');
  });

  it('keeps the value on a step inside the range, and starts at min', () => {
    expect(mk({ step: 5, value: 33.3 }).getValue()).toBe(35);
    expect(mk({ max: 10, value: 999 }).getValue()).toBe(10);
    expect(mk({ min: 18, max: 99 }).getValue()).toBe(18);
    expect(mk({ min: 0, max: 1, step: 0.1, value: 0.3 }).getValue()).toBe(0.3);
  });

  it('snap points fall on multiples (decades by default) and get the labels', () => {
    const d = mk({ min: 1923, max: 1980, value: 1950 });
    const majors = Array.from(d.el.querySelectorAll('.op-dial__tick.is-major')) as HTMLElement[];
    expect(majors.map((t) => t.textContent)).toEqual(['1930', '1940', '1950', '1960', '1970', '1980']);
    expect(d.el.querySelectorAll('.op-dial__tick')).toHaveLength(58);
    expect(d.el.querySelector('.op-dial__tick.is-current')!.textContent).toBe('1950');
    expect(mk({ max: 20, snap: [0, 7] }).el.querySelectorAll('.is-major')).toHaveLength(2);
    expect(mk({ max: 20, snap: false }).el.querySelectorAll('.is-major')).toHaveLength(0);
    expect(mk({ max: 20, labels: 'none' }).el.querySelectorAll('.op-dial__tick-label')).toHaveLength(0);
    expect(mk({ max: 20, labels: 'all' }).el.querySelectorAll('.op-dial__tick-label')).toHaveLength(21);
  });

  it('a list: the value is the item, ARIA uses its position and label', () => {
    const d = mk({ options: ['Jan', 'Feb', { value: 3, label: 'Mar' }] });
    expect(d.getValue()).toBe('Jan');
    expect(d.el.classList.contains('op-dial--list')).toBe(true);
    d.setValue(3);
    const f = face(d);
    expect(f.getAttribute('aria-valuemin')).toBe('0');
    expect(f.getAttribute('aria-valuemax')).toBe('2');
    expect(f.getAttribute('aria-valuenow')).toBe('2');
    expect(f.getAttribute('aria-valuetext')).toBe('Mar');
    expect(d.el.querySelector('.op-dial__readout')!.textContent).toBe('Mar');
    expect(d.el.querySelectorAll('.op-dial__tick-label')).toHaveLength(3); // every item is a snap point
  });

  it('keyboard: arrows step, Page jumps between snap points, Home/End go to the limits', () => {
    const d = mk({ min: 0, max: 120, value: 34 });
    const f = face(d);
    const changed = vi.fn();
    const ended = vi.fn();
    d.on('change', changed);
    d.on('slide-end', ended);
    key(f, 'ArrowRight');
    expect(d.getValue()).toBe(35);
    key(f, 'PageUp');
    expect(d.getValue()).toBe(40);
    key(f, 'PageUp');
    expect(d.getValue()).toBe(50);
    key(f, 'PageDown');
    expect(d.getValue()).toBe(40);
    key(f, 'ArrowLeft');
    key(f, 'PageDown');
    expect(d.getValue()).toBe(30);
    key(f, 'End');
    expect(d.getValue()).toBe(120);
    key(f, 'ArrowRight');
    expect(d.getValue()).toBe(120);
    key(f, 'Home');
    expect(d.getValue()).toBe(0);
    expect(changed).toHaveBeenCalledTimes(8);
    expect(ended).toHaveBeenLastCalledWith(0);
  });

  it('the readout rolls the digits it already has, and rebuilds when the shape changes', () => {
    const d = mk({ value: 31 });
    const first = d.el.querySelector('.op-dial__digit');
    d.next();
    expect(digits(d)).toEqual(['3', '2']);
    expect(d.el.querySelector('.op-dial__digit')).toBe(first);
    d.setValue(100);
    expect(digits(d)).toEqual(['1', '0', '0']);
  });

  it('a click on the ruler goes to the tick under the pointer', () => {
    const d = mk({ max: 120, value: 50 });
    const f = face(d);
    rect(f);
    ptr(f, 'pointerdown', 124, 0); // 24 px right of the center = 2 ticks (12 px apart without layout)
    ptr(f, 'pointerup', 124, 50);
    expect(d.getValue()).toBe(52);
  });

  it('dragging changes the value as ticks cross the needle; a slow drag rests on the nearest step', () => {
    const d = mk({ max: 120, value: 34 });
    const f = face(d);
    const changed = vi.fn();
    d.on('change', changed);
    ptr(f, 'pointerdown', 100, 0);
    expect(d.el.classList.contains('is-dragging')).toBe(true);
    ptr(f, 'pointermove', 76, 400); // 24 px to the left: the ruler moves on 2 ticks
    expect(d.getValue()).toBe(36);
    ptr(f, 'pointermove', 70, 800);
    ptr(f, 'pointerup', 70, 1200);
    expect(d.el.classList.contains('is-dragging')).toBe(false);
    expect(d.getValue()).toBe(37); // 30 px = 2.5 ticks → the nearest step
    expect(changed.mock.calls.map((c) => c[0])).toEqual([36, 37]);
  });

  it('a flick glides on to the next snap point in its direction', () => {
    const d = mk({ max: 120, value: 34 });
    const f = face(d);
    ptr(f, 'pointerdown', 100, 0);
    ptr(f, 'pointermove', 80, 50);
    ptr(f, 'pointermove', 60, 100);
    ptr(f, 'pointerup', 60, 100);
    expect(d.getValue()).toBe(50);
    // the other way
    ptr(f, 'pointerdown', 100, 1000);
    ptr(f, 'pointermove', 120, 1050);
    ptr(f, 'pointermove', 140, 1100);
    ptr(f, 'pointerup', 140, 1100);
    expect(d.getValue()).toBe(40);
  });

  it('circle: the angle around the face picks the item (12 months = a clock)', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = mk({ options: months, shape: 'circle' });
    expect(d.el.classList.contains('op-dial--circle')).toBe(true);
    const f = face(d);
    rect(f, 200, 200);
    ptr(f, 'pointerdown', 200, 0, 100); // 3 o'clock
    ptr(f, 'pointerup', 200, 50, 100);
    expect(d.getValue()).toBe('Apr');
    ptr(f, 'pointerdown', 100, 100, 200); // 6 o'clock
    ptr(f, 'pointerup', 100, 150, 200);
    expect(d.getValue()).toBe('Jul');
    // the hand turns the short way: Dec → Jan is +30°, not -330°
    d.setValue('Dec');
    const before = parseFloat(/rotate\((-?[\d.]+)deg/.exec(d.el.querySelector('.op-dial__needle').style.transform)![1]);
    d.setValue('Jan');
    const after = parseFloat(/rotate\((-?[\d.]+)deg/.exec(d.el.querySelector('.op-dial__needle').style.transform)![1]);
    expect(after - before).toBe(30);
  });

  it('setters rebuild the scale and keep the value valid', () => {
    const d = mk({ max: 120, value: 80 });
    d.setMax(50);
    expect(d.getValue()).toBe(50);
    expect(d.el.querySelectorAll('.op-dial__tick')).toHaveLength(51);
    d.setStep(10);
    expect(d.el.querySelectorAll('.op-dial__tick')).toHaveLength(6);
    d.setOptions(['S', 'M', 'L']);
    expect(d.getValue()).toBe('S');
    d.setShape('circle');
    expect(d.el.classList.contains('op-dial--circle')).toBe(true);
    d.setFormat((v: string) => `Size ${v}`);
    expect(face(d).getAttribute('aria-valuetext')).toBe('Size S');
    d.setOptions(undefined);
    d.setStep(1);
    d.setMin(5);
    expect(d.getValue()).toBe(5);
    d.nextSnap();
    expect(d.getValue()).toBe(10);
    d.prev(2);
    expect(d.getValue()).toBe(8);
  });

  it('disabled and read-only ignore keys and pointers', () => {
    const d = mk({ value: 10, disabled: true });
    key(face(d), 'ArrowRight');
    expect(d.getValue()).toBe(10);
    expect(face(d).tabIndex).toBe(-1);
    const r = mk({ value: 10, readonly: true });
    rect(face(r));
    ptr(face(r), 'pointerdown', 150, 0);
    ptr(face(r), 'pointerup', 150, 10);
    key(face(r), 'End');
    expect(r.getValue()).toBe(10);
    expect(face(r).getAttribute('aria-readonly')).toBe('true');
  });

  it('works inside a Form', () => {
    const form = create<Form>({ type: 'form', items: [{ type: 'dial', name: 'age', label: 'Age', max: 120, value: 42 }] } as any);
    document.body.append(form.el);
    cleanup.push(form);
    expect(form.getValues()).toEqual({ age: 42 });
    form.setValues({ age: 7 });
    expect(form.getValues()).toEqual({ age: 7 });
  });
});
