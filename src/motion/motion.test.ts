import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { motion, DEFAULTS, isBouncy, popIn, popOut, stagger, staggerDelay, staggerDetails, pulse, enter, exit, arcPoints, moveArc, rubberBand, knobStretch, dragKnob, swap, reveal, wipeColor, layoutId } from 'optikos/motion';
import { create, Dropdown, Menu, Window, Button } from 'optikos';

interface Call { el: Element; frames: any[]; opts: any }
let calls: Call[] = [];
let proto: any;
const finished = () => Promise.resolve();
beforeEach(() => {
  calls = [];
  proto = HTMLElement.prototype as any;
  proto.animate = function (frames: any[], opts: any) {
    calls.push({ el: this, frames, opts });
    return { finished: finished(), cancel() {} };
  };
  motion.reset();
  motion.enable();
});
afterEach(() => {
  delete proto.animate;
  motion.reset();
  motion.disable(); // back to the test suite's default
  document.body.innerHTML = '';
});
const box = () => document.body.appendChild(document.createElement('div'));
const rectOf = (el: HTMLElement, left: number, top: number, w = 40, h = 40) =>
  (el.getBoundingClientRect = () => ({ left, top, width: w, height: h, right: left + w, bottom: top + h, x: left, y: top, toJSON() {} }) as DOMRect);

describe('motion config: defaults are the numbers of the rules', () => {
  it('has the documented defaults', () => {
    const c = motion.get();
    expect(c.enabled).toBe(true);
    expect(c.duration.dropdown).toBe(200);
    expect(c.dropdownRange).toEqual([150, 250]);
    expect(c.stagger.step).toBe(30);
    expect(c.press.scale).toBe(0.97);
    expect(c.popover.scale).toBe(0.95);
    expect(c.stretch.amount).toBe(0.12);
    expect(c.exitRatio).toBe(0.8);
    expect(c.allowBounce).toBe(false);
    expect(c.originFromTrigger).toBe(true);
    expect(c.ease.out).toBe('cubic-bezier(0, 0, 0.2, 1)');
    expect(DEFAULTS.respectReducedMotion).toBe(true);
  });

  it('rule 2: the dropdown duration is clamped into 150–250 ms; the range itself is configurable', () => {
    motion.set({ duration: { dropdown: 500 } });
    expect(motion.dropdownMs()).toBe(250);
    motion.set({ duration: { dropdown: 50 } });
    expect(motion.dropdownMs()).toBe(150);
    motion.set({ dropdownRange: [100, 400], duration: { dropdown: 350 } });
    expect(motion.dropdownMs()).toBe(350);
  });

  it('rule 15: exits last exitRatio × the entrance (20 % shorter); durations/easings follow the phase', () => {
    expect(motion.ms('modal')).toBe(240);
    expect(motion.ms('modal', 'exit')).toBe(192);
    expect(motion.ms('dropdown', 'exit')).toBe(160);
    motion.set({ exitRatio: 0.5 });
    expect(motion.ms('popover', 'exit')).toBe(100);
    expect(motion.easing('enter')).toBe(motion.get().ease.out);
    expect(motion.easing('exit')).toBe(motion.get().ease.in);
    expect(motion.easing('move')).toBe(motion.get().ease.inOut);
  });

  it('rule 13: easings that overshoot are refused (the rest of the patch still applies); allowBounce lifts it', () => {
    expect(isBouncy('cubic-bezier(0.3, 1.6, 0.3, 1)')).toBe(true);
    expect(isBouncy('cubic-bezier(0.4, 0, 0.2, 1)')).toBe(false);
    expect(isBouncy('spring(1, 80, 10, 0)')).toBe(true);
    const r = motion.set({ ease: { out: 'cubic-bezier(0.3, 1.6, 0.3, 1)', inOut: 'ease-in-out' }, press: { scale: 0.9 } });
    expect(r.rejected).toHaveLength(1);
    expect(motion.get().ease.out).toBe(DEFAULTS.ease.out);
    expect(motion.get().ease.inOut).toBe('ease-in-out');
    expect(motion.get().press.scale).toBe(0.9);
    expect(motion.set({ allowBounce: true, ease: { out: 'cubic-bezier(0.3, 1.6, 0.3, 1)' } }).rejected).toEqual([]);
    expect(motion.get().ease.out).toBe('cubic-bezier(0.3, 1.6, 0.3, 1)');
  });

  it('global toggle: writes CSS tokens (neutral when off), the html class, notifies subscribers; reset restores', () => {
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--op-motion-press-scale')).toBe('0.97');
    expect(root.style.getPropertyValue('--op-motion-popover-scale')).toBe('0.95');
    expect(root.style.getPropertyValue('--op-motion-dropdown-duration')).toBe('200ms');
    expect(root.classList.contains('op-motion-off')).toBe(false);
    const seen = vi.fn();
    const off = motion.on(seen);
    motion.disable();
    expect(motion.isOn()).toBe(false);
    expect(root.style.getPropertyValue('--op-motion-press-scale')).toBe('1');
    expect(root.style.getPropertyValue('--op-motion-dropdown-duration')).toBe('0ms');
    expect(root.classList.contains('op-motion-off')).toBe(true);
    expect(seen).toHaveBeenCalled();
    off();
    motion.enable();
    motion.set({ press: { scale: 0.9 } });
    expect(root.style.getPropertyValue('--op-motion-press-scale')).toBe('0.9');
    motion.reset();
    expect(root.style.getPropertyValue('--op-motion-press-scale')).toBe('0.97');
  });

  it('respectReducedMotion: the OS preference switches it off unless you opt out', () => {
    const mm = vi.fn(() => ({ matches: true }));
    (globalThis as any).matchMedia = mm;
    expect(motion.isOn()).toBe(false);
    motion.set({ respectReducedMotion: false });
    expect(motion.isOn()).toBe(true);
    delete (globalThis as any).matchMedia;
  });
});

describe('popovers, menus and modals', () => {
  it('rules 1, 10, 11: popIn fades and scales from 0.95, ease-out, growing out of the trigger', () => {
    const el = box();
    const trigger = box();
    rectOf(el, 100, 100, 200, 100);
    rectOf(trigger, 120, 60, 40, 40); // above the popover, near its left
    void popIn(el, trigger);
    const c = calls[0];
    expect(c.frames[0]).toEqual({ opacity: 0, transform: 'scale(0.95)' });
    expect(c.frames[1]).toEqual({ opacity: 1, transform: 'scale(1)' });
    expect(c.opts.duration).toBe(200);
    expect(c.opts.easing).toBe(motion.get().ease.out);
    expect(el.style.transformOrigin).toBe('40px 0px'); // trigger centre (140,80) relative to the box, clamped inside it
    motion.set({ originFromTrigger: false, popover: { scale: 0.9 } });
    const other = box();
    void popIn(other, trigger);
    expect(calls[1].frames[0].transform).toBe('scale(0.9)');
    expect(other.style.transformOrigin).toBe('');
  });

  it('rules 12, 15: popOut goes back toward the trigger, 20 % faster, ease-in, and stays until the caller hides it', () => {
    const el = box();
    rectOf(el, 0, 0, 100, 100);
    const trigger = box();
    rectOf(trigger, 40, 200, 20, 20);
    void popOut(el, trigger, 'dropdown');
    expect(calls[0].frames[1]).toEqual({ opacity: 0, transform: 'scale(0.95)' });
    expect(calls[0].opts.duration).toBe(160);
    expect(calls[0].opts.easing).toBe(motion.get().ease.in);
    expect(calls[0].opts.fill).toBe('forwards');
    expect(el.style.transformOrigin).toBe('50px 100px');
    void popOut(box(), undefined, 'modal');
    expect(calls[1].opts.duration).toBe(192);
  });

  it('with motion off (or no animate) nothing animates and the helpers return null', () => {
    motion.disable();
    expect(popIn(box())).toBeNull();
    expect(popOut(box())).toBeNull();
    expect(stagger([box()])).toBeNull();
    expect(pulse(box())).toBeNull();
    expect(moveArc(box(), { x: 5, y: 5 })).toBeNull();
    expect(calls).toHaveLength(0);
    motion.enable();
    proto.animate = undefined; // a browser without the Web Animations API
    expect(popIn(box())).toBeNull();
  });

  it('Dropdown opens with popIn and closes by shrinking first, hiding only when the animation ended; reopening cancels the pending hide', async () => {
    const trigger = box();
    const dd = create<Dropdown>({ type: 'dropdown', anchor: trigger, content: document.createElement('div') } as any);
    dd.open();
    expect(calls.some((c) => c.el === dd.el && c.frames[0].transform === 'scale(0.95)')).toBe(true);
    let release!: () => void;
    proto.animate = function (frames: any[], opts: any) {
      calls.push({ el: this, frames, opts });
      return { finished: new Promise<void>((r) => (release = r)), cancel() {} };
    };
    dd.close();
    expect(dd.el.hidden).toBe(false); // still shrinking
    dd.open(); // reopened before the end
    release();
    await Promise.resolve();
    await Promise.resolve();
    expect(dd.el.hidden).toBe(false);
    dd.close();
    release();
    await new Promise((r) => setTimeout(r));
    expect(dd.el.hidden).toBe(true);
    dd.destroy();
  });

  it('Window grows out of its opener and, on close, leaves the DOM only after shrinking (page usable at once)', async () => {
    const opener = box();
    opener.tabIndex = 0;
    opener.focus();
    const w = create<Window>({ type: 'window', title: 'x', items: [{ type: 'label', text: 'hi' }] } as any);
    w.show();
    expect(calls.some((c) => c.el === w.el && c.opts.duration === 240)).toBe(true);
    expect(calls.some((c) => (c.el as HTMLElement).classList.contains('op-window-backdrop'))).toBe(true);
    w.hide();
    expect(calls.some((c) => c.el === w.el && c.opts.duration === 192)).toBe(true);
    expect(document.querySelector('[inert]')).toBeNull(); // released at once
    await new Promise((r) => setTimeout(r));
    expect(document.querySelector('.op-window')).toBeNull();
    w.destroy();
  });

  it('Menu rows are staggered 30 ms apart when it opens', () => {
    const anchor = box();
    const m = create<Menu>({ type: 'menu', items: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] } as any);
    m.showBy(anchor);
    const rows = calls.filter((c) => (c.el as HTMLElement).classList.contains('op-menu__item'));
    expect(rows.map((c) => c.opts.delay)).toEqual([0, 30, 60]);
    m.hide();
    m.destroy();
  });

  it('Button.pulse() rings the button (rule 8)', () => {
    const b = create<Button>({ type: 'button', text: 'Save' } as any);
    document.body.append(b.el);
    b.pulse();
    const c = calls.find((x) => x.el === b.el)!;
    expect(c.frames[0].boxShadow).toContain('color-mix');
    expect(c.opts.duration).toBe(450);
  });
});

describe('lists and details', () => {
  it('rule 3: stagger delays are 30 ms apart and stop growing after stagger.max; options override', () => {
    const els = Array.from({ length: 15 }, box);
    void stagger(els);
    expect(calls.map((c) => c.opts.delay)).toEqual([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 360, 360]);
    expect(calls[0].opts.easing).toBe(motion.get().ease.out);
    expect(staggerDelay(2)).toBe(60);
    expect(staggerDelay(5, { step: 50, max: 3 })).toBe(150);
    calls = [];
    motion.set({ stagger: { step: 100 } });
    void stagger(els.slice(0, 3));
    expect(calls.map((c) => c.opts.delay)).toEqual([0, 100, 200]);
  });

  it('rule 6: details settle in order, one step apart across the selectors', () => {
    const card = box();
    card.innerHTML = '<h3 class="t"></h3><p class="x"></p><p class="x"></p><button class="b"></button>';
    void staggerDetails(card, ['.t', '.x', '.b']);
    expect(calls.map((c) => [(c.el as HTMLElement).className, c.opts.delay])).toEqual([['t', 0], ['x', 30], ['x', 60], ['b', 90]]);
  });

  it('rule 1/15: enter() rises ease-out; exit() is 20 % shorter and ease-in', () => {
    void enter(box());
    void exit(box());
    expect(calls[0].opts.duration).toBe(250);
    expect(calls[0].opts.easing).toBe(motion.get().ease.out);
    expect(calls[1].opts.duration).toBe(200);
    expect(calls[1].opts.easing).toBe(motion.get().ease.in);
  });

  it('DataView staggers on load but not on a field update', () => {
    const v = create<any>({ type: 'dataview', data: [{ id: 1 }, { id: 2 }, { id: 3 }], renderer: (r: any) => `#${r.data.id}` });
    document.body.append(v.el);
    const first = calls.filter((c) => (c.el as HTMLElement).classList.contains('op-dataview__item'));
    expect(first.map((c) => c.opts.delay)).toEqual([0, 30, 60]);
    calls = [];
    v.getStore().getAt(0).set('x', 1);
    expect(calls).toHaveLength(0);
    v.destroy();
  });
});

describe('arcs, knobs, rubber bands', () => {
  it('rule 7: arcPoints bows away from the straight line and keeps the ends', () => {
    const pts = arcPoints(0, 0, 100, 0, 0.25, 10);
    expect(pts).toHaveLength(11);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[10].x).toBeCloseTo(100);
    expect(pts[10].y).toBeCloseTo(0);
    expect(Math.abs(pts[5].y)).toBeGreaterThan(10); // the middle is off the line
    const flat = arcPoints(0, 0, 100, 0, 0, 10);
    expect(flat.every((p) => Math.abs(p.y) < 1e-9)).toBe(true);
  });

  it('rules 7, 9: moveArc translates along the arc with ease-in-out and ends on the target', () => {
    const el = box();
    rectOf(el, 0, 0, 20, 20);
    const a = moveArc(el, { x: 210, y: 10 }, { bend: 0.3 });
    expect(a).not.toBeNull();
    const c = calls[0];
    expect(c.frames).toHaveLength(17);
    expect(c.frames[0].transform).toBe('translate(0px, 0px)');
    expect(c.frames[16].transform).toBe('translate(200px, 0px)');
    expect(c.opts.easing).toBe(motion.get().ease.inOut);
    expect(c.opts.duration).toBe(450);
    expect(c.opts.fill).toBe('forwards');
  });

  it('rule 19: rubberBand resists more the further you pull and never exceeds the limit; symmetric', () => {
    const a = rubberBand(20, 100);
    const b = rubberBand(200, 100);
    const c = rubberBand(2000, 100);
    expect(a).toBeLessThan(20);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeLessThan(100);
    expect(c).toBeGreaterThan(b);
    expect(rubberBand(-200, 100)).toBe(-b);
    expect(rubberBand(0, 100)).toBe(0);
  });

  it('rule 5/14: knobStretch scales 12 % from the trailing edge with no transition while held; release relaxes', () => {
    const k = box();
    const s = knobStretch(k);
    s.move(5);
    expect(k.style.transform).toBe('scaleX(1.12)');
    expect(k.style.transformOrigin).toBe('left center');
    expect(k.style.transition).toBe('none');
    s.move(-3);
    expect(k.style.transformOrigin).toBe('right center');
    s.release();
    expect(k.style.transform).toBe('');
    expect(calls.at(-1)!.frames[0].transform).toBe('scaleX(1.12)');
    motion.set({ stretch: { amount: 0.3 } });
    s.move(1);
    expect(k.style.transform).toBe('scaleX(1.3)');
  });

  it('dragKnob: value from the pointer, snapped, clamped, stretching while it moves', () => {
    const track = box();
    const knob = box();
    rectOf(track, 0, 0, 200, 10);
    const changes: number[] = [];
    const d = dragKnob(knob, track, { min: 0, max: 10, step: 1, onChange: (v) => changes.push(v) });
    const ev = (type: string, x: number) => knob.dispatchEvent(new MouseEvent(type, { clientX: x, bubbles: true }));
    ev('pointerdown', 0);
    ev('pointermove', 100);
    ev('pointermove', 400);
    expect(changes).toEqual([5, 10]);
    expect(d.getValue()).toBe(10);
    expect(knob.style.left).toBe('100%');
    expect(knob.style.transform).toBe('scaleX(1.12)');
    ev('pointerup', 400);
    expect(knob.style.transform).toBe('');
    d.dispose();
  });
});

describe('swap, masks and layoutId', () => {
  it('rules 16, 18: swap keeps old and new together while both fade with blur; ends with only the new content', async () => {
    const host = box();
    host.textContent = 'old';
    const p = swap(host, 'new');
    // during the transition both exist
    expect(host.textContent).toContain('old');
    expect(host.textContent).toContain('new');
    const [a, b] = calls;
    expect(a.frames[0]).toEqual({ opacity: 1, filter: 'blur(0px)' });
    expect(a.frames[1]).toEqual({ opacity: 0, filter: 'blur(4px)' });
    expect(b.frames[0]).toEqual({ opacity: 0, filter: 'blur(4px)' });
    expect(b.frames[1]).toEqual({ opacity: 1, filter: 'blur(0px)' });
    expect(a.opts.duration).toBe(220);
    expect(a.opts.easing).toBe(b.opts.easing);
    await p;
    expect(host.textContent).toBe('new');
    motion.set({ blur: 8 });
    host.textContent = 'x';
    void swap(host, 'y');
    expect(calls.at(-2)!.frames[1].filter).toBe('blur(8px)');
    motion.disable();
    host.textContent = 'a';
    await swap(host, 'b');
    expect(host.textContent).toBe('b');
  });

  it('rule 17: reveal wipes with clip-path; wipeColor wipes a colour through a mask layer and then commits it', async () => {
    const el = box();
    void reveal(el, 'left');
    expect(calls[0].frames[0].clipPath).toBe('inset(0 100% 0 0)');
    expect(calls[0].frames[1].clipPath).toBe('inset(0 0 0 0)');
    void reveal(el, 'center');
    expect(calls[1].frames[0].clipPath).toBe('inset(0 50% 0 50%)');
    const target = box();
    const p = wipeColor(target, 'rgb(1, 2, 3)', 'right');
    expect(target.querySelector('span')).not.toBeNull();
    expect(calls.at(-1)!.frames[0].clipPath).toBe('inset(0 0 0 100%)');
    await p;
    expect(target.style.background).toContain('rgb(1, 2, 3)');
    expect(target.querySelector('span')).toBeNull();
  });

  it('rule 20: layoutId flies a shared element from its old rectangle to the new one (arc, ease-in-out); only once', () => {
    const a = box();
    rectOf(a, 10, 20, 100, 50);
    layoutId.snapshot('photo-1', a);
    expect(layoutId.has('photo-1')).toBe(true);
    const b = box();
    rectOf(b, 300, 200, 400, 200);
    const anim = layoutId.mount('photo-1', b);
    expect(anim).not.toBeNull();
    const c = calls.at(-1)!;
    expect(c.el).toBe(b);
    expect(c.frames[0].transform).toBe('translate(-290px, -180px) scale(0.25, 0.25)');
    expect(c.frames.at(-1)!.transform).toContain('scale(1, 1)');
    expect(c.opts.easing).toBe(motion.get().ease.inOut);
    expect(b.style.transformOrigin).toBe('0 0');
    expect(layoutId.has('photo-1')).toBe(false);
    expect(layoutId.mount('photo-1', b)).toBeNull();
    layoutId.release('nothing');
  });
});
