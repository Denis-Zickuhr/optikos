import { motion } from './config';

const ok = (el: Element): boolean => motion.isOn() && typeof (el as HTMLElement).animate === 'function';
const done = (a: Animation): Promise<void> => a.finished.then(() => undefined, () => undefined);

type Pt = { x: number; y: number };
const centerOf = (to: Element | Pt): Pt => {
  if ('getBoundingClientRect' in to) {
    const r = to.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return to;
};

/**
 * Points of a quadratic curve from (x0,y0) to (x1,y1) that bows sideways by `bend` × the distance: the path of a thing that
 * is thrown, not slid (rule 7). `steps + 1` points, the first and last are the ends.
 */
export function arcPoints(x0: number, y0: number, x1: number, y1: number, bend: number, steps = 16): Pt[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy) || 1;
  const cx = x0 + dx / 2 - (dy / d) * bend * d;
  const cy = y0 + dy / 2 + (dx / d) * bend * d;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
  });
}

/** Moves an element to a target along an arc, ease-in-out (rules 7 and 9). The element ends at the target; `Animation.cancel()` undoes it. */
export function moveArc(el: HTMLElement, to: Element | Pt, o: { bend?: number; duration?: number } = {}): Animation | null {
  if (!ok(el)) return null;
  const a = centerOf(el);
  const b = centerOf(to);
  const frames = arcPoints(0, 0, b.x - a.x, b.y - a.y, o.bend ?? motion.get().arc.bend).map((p) => ({ transform: `translate(${p.x}px, ${p.y}px)` }));
  return el.animate(frames, { duration: o.duration ?? motion.get().duration.move, easing: motion.easing('move'), fill: 'forwards' });
}

/** Resistance past a limit: the further you pull, the less it moves (never more than `limit`). Pure, for your own drags (rule 19). */
export function rubberBand(distance: number, limit: number, resistance = motion.get().rubber.resistance): number {
  const d = Math.abs(distance);
  return Math.sign(distance) * limit * (1 - 1 / ((d * resistance) / limit + 1));
}

/**
 * Rubber-band overscroll for a scrollable element, only when you push past its start or end (rule 19): the content follows the
 * finger with growing resistance and eases back (no bounce) when you let go. Returns the function that removes it.
 */
export function rubberScroll(scroller: HTMLElement, axis: 'y' | 'x' = 'y'): () => void {
  let pull = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = () => (axis === 'y' ? scroller.clientHeight : scroller.clientWidth) * 0.3 || 80;
  const paint = () => (scroller.style.transform = pull ? `translate${axis.toUpperCase()}(${rubberBand(pull, limit())}px)` : '');
  const settle = () => {
    const from = scroller.style.transform || `translate${axis.toUpperCase()}(0px)`;
    pull = 0;
    scroller.style.transform = '';
    if (ok(scroller)) scroller.animate([{ transform: from }, { transform: 'none' }], { duration: motion.get().rubber.settle, easing: motion.easing('enter') });
  };
  const atStart = () => (axis === 'y' ? scroller.scrollTop <= 0 : scroller.scrollLeft <= 0);
  const atEnd = () => (axis === 'y' ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 : scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1);
  const wheel = (e: WheelEvent) => {
    if (!motion.isOn()) return;
    const d = axis === 'y' ? e.deltaY : e.deltaX;
    // only past an end (or while already pulled): ordinary scrolling is left alone
    if (!((atStart() && d < 0) || (atEnd() && d > 0) || pull !== 0)) return;
    e.preventDefault();
    pull -= d;
    if (atStart() && !atEnd()) pull = Math.max(0, pull);
    if (atEnd() && !atStart()) pull = Math.min(0, pull);
    paint();
    clearTimeout(timer);
    timer = setTimeout(settle, 120);
  };
  let y0: number | null = null;
  const start = (e: TouchEvent) => (y0 = axis === 'y' ? e.touches[0].clientY : e.touches[0].clientX);
  const move = (e: TouchEvent) => {
    if (y0 == null || !motion.isOn()) return;
    const d = (axis === 'y' ? e.touches[0].clientY : e.touches[0].clientX) - y0;
    if ((atStart() && d > 0) || (atEnd() && d < 0)) {
      e.preventDefault();
      pull = d;
      paint();
    }
  };
  const end = () => (pull ? settle() : undefined, (y0 = null));
  scroller.addEventListener('wheel', wheel, { passive: false });
  scroller.addEventListener('touchstart', start, { passive: true });
  scroller.addEventListener('touchmove', move, { passive: false });
  scroller.addEventListener('touchend', end);
  return () => {
    clearTimeout(timer);
    scroller.removeEventListener('wheel', wheel);
    scroller.removeEventListener('touchstart', start);
    scroller.removeEventListener('touchmove', move);
    scroller.removeEventListener('touchend', end);
  };
}

/**
 * A knob that stretches `stretch.amount` (12 %) along its travel while it moves, from the side it is moving away from, and
 * relaxes when released. While held nothing tweens (rule 14): the stretch follows the pointer directly.
 */
export function knobStretch(knob: HTMLElement, axis: 'x' | 'y' = 'x') {
  let last = 0;
  return {
    /** Call with the movement since the last call (px, signed). */
    move(delta: number) {
      if (!motion.isOn() || !delta) return;
      const s = 1 + motion.get().stretch.amount;
      knob.style.transition = 'none';
      knob.style.transformOrigin = axis === 'x' ? (delta > 0 ? 'left center' : 'right center') : delta > 0 ? 'center top' : 'center bottom';
      knob.style.transform = axis === 'x' ? `scaleX(${s})` : `scaleY(${s})`;
      last = delta;
    },
    release() {
      if (!last && !knob.style.transform) return;
      last = 0;
      const from = knob.style.transform;
      knob.style.transform = '';
      knob.style.transition = '';
      if (ok(knob) && from) knob.animate([{ transform: from }, { transform: 'none' }], { duration: motion.ms('press', 'exit') * 2, easing: motion.easing('enter') });
    },
  };
}

/** Makes `knob` draggable along `track`: value from `min` to `max` in `step`s, the knob positioned in %, stretching as it moves. */
export function dragKnob(knob: HTMLElement, track: HTMLElement, o: { min?: number; max?: number; step?: number; value?: number; axis?: 'x' | 'y'; onChange?: (v: number) => void } = {}) {
  const { min = 0, max = 100, step = 1, axis = 'x' } = o;
  const stretch = knobStretch(knob, axis);
  let value = o.value ?? min;
  const place = () => (knob.style[axis === 'x' ? 'left' : 'top'] = `${((value - min) / (max - min)) * 100}%`);
  const set = (v: number, emit = true) => {
    const q = Math.max(min, Math.min(max, Math.round((v - min) / step) * step + min));
    if (q === value) return;
    value = q;
    place();
    if (emit) o.onChange?.(value);
  };
  const at = (e: PointerEvent) => {
    const r = track.getBoundingClientRect();
    const ratio = axis === 'x' ? (e.clientX - r.left) / (r.width || 1) : (e.clientY - r.top) / (r.height || 1);
    return min + Math.max(0, Math.min(1, ratio)) * (max - min);
  };
  let prev = 0;
  const down = (e: PointerEvent) => {
    e.preventDefault();
    prev = axis === 'x' ? e.clientX : e.clientY;
    knob.setPointerCapture?.(e.pointerId);
    const move = (m: PointerEvent) => {
      const p = axis === 'x' ? m.clientX : m.clientY;
      stretch.move(p - prev);
      prev = p;
      set(at(m));
    };
    const up = () => {
      knob.removeEventListener('pointermove', move);
      knob.removeEventListener('pointerup', up);
      knob.removeEventListener('pointercancel', up);
      stretch.release();
    };
    knob.addEventListener('pointermove', move);
    knob.addEventListener('pointerup', up);
    knob.addEventListener('pointercancel', up);
  };
  knob.addEventListener('pointerdown', down);
  place();
  return {
    getValue: () => value,
    setValue: (v: number) => set(v, false),
    dispose: () => knob.removeEventListener('pointerdown', down),
  };
}

/**
 * Replaces the content of `host` with `next` letting the old and the new coexist for the whole transition: the old fades out
 * while the new fades in, both softly blurred (rules 16 and 18). No flash, no empty frame in between.
 */
export function swap(host: HTMLElement, next: Node | string): Promise<void> {
  const node = typeof next === 'string' ? document.createTextNode(next) : next;
  if (!ok(host)) {
    host.replaceChildren(node);
    return Promise.resolve();
  }
  const { swap: dur } = motion.get().duration;
  const b = motion.get().blur;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const old = document.createElement('span');
  old.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none';
  old.append(...Array.from(host.childNodes));
  const fresh = document.createElement('span');
  fresh.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;max-inline-size:100%';
  fresh.append(node);
  host.replaceChildren(old, fresh);
  const opts = { duration: dur, easing: motion.easing('move'), fill: 'both' as const };
  const a = old.animate([{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: `blur(${b}px)` }], opts);
  const c = fresh.animate([{ opacity: 0, filter: `blur(${b}px)` }, { opacity: 1, filter: 'blur(0px)' }], opts);
  return Promise.all([done(a), done(c)]).then(() => {
    host.replaceChildren(...Array.from(fresh.childNodes));
  });
}

type From = 'left' | 'right' | 'top' | 'bottom' | 'center';
const hidden = (from: From) => ({ left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)', top: 'inset(0 0 100% 0)', bottom: 'inset(100% 0 0 0)', center: 'inset(0 50% 0 50%)' })[from];

/** Reveals an element through a mask that wipes across it (rule 17). */
export function reveal(el: HTMLElement, from: From = 'left'): Promise<void> | null {
  if (!ok(el)) return null;
  return done(el.animate([{ clipPath: hidden(from) }, { clipPath: 'inset(0 0 0 0)' }], { duration: motion.get().duration.reveal, easing: motion.easing('enter'), fill: 'backwards' }));
}

/** Changes an element's background by wiping the new color across it through a mask, instead of fading (rule 17). */
export function wipeColor(el: HTMLElement, color: string, from: From = 'left'): Promise<void> {
  if (!ok(el)) {
    el.style.background = color;
    return Promise.resolve();
  }
  el.style.isolation = 'isolate';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const layer = document.createElement('span');
  layer.style.cssText = `position:absolute;inset:0;z-index:-1;border-radius:inherit;background:${color};pointer-events:none`;
  el.prepend(layer);
  const a = layer.animate([{ clipPath: hidden(from) }, { clipPath: 'inset(0 0 0 0)' }], { duration: motion.get().duration.reveal, easing: motion.easing('move'), fill: 'both' });
  return done(a).then(() => {
    el.style.background = color;
    layer.remove();
  });
}

const rects = new Map<string, DOMRect>();

/**
 * Shared-element transitions by identity (rule 20, "layoutId"): `snapshot` the element where it is, show the next screen, and
 * `mount` the element that has the same id there: it flies from the old rectangle to the new one along an arc, ease-in-out.
 */
export const layoutId = {
  snapshot(id: string, el: Element): void {
    rects.set(id, el.getBoundingClientRect());
  },
  has: (id: string) => rects.has(id),
  release(id: string): void {
    rects.delete(id);
  },
  mount(id: string, el: HTMLElement): Animation | null {
    const from = rects.get(id);
    rects.delete(id);
    if (!from || !ok(el)) return null;
    const to = el.getBoundingClientRect();
    const sx = from.width / (to.width || 1);
    const sy = from.height / (to.height || 1);
    const pts = arcPoints(from.left - to.left, from.top - to.top, 0, 0, motion.get().arc.bend);
    const frames = pts.map((p, i) => {
      const t = i / (pts.length - 1);
      return { transform: `translate(${p.x}px, ${p.y}px) scale(${sx + (1 - sx) * t}, ${sy + (1 - sy) * t})` };
    });
    el.style.transformOrigin = '0 0';
    return el.animate(frames, { duration: motion.get().duration.move, easing: motion.easing('move'), fill: 'backwards' });
  },
  /** `snapshot` + `mount` in one go, for when the new element already exists. */
  transition(id: string, from: Element, to: HTMLElement): Animation | null {
    layoutId.snapshot(id, from);
    return layoutId.mount(id, to);
  },
};
