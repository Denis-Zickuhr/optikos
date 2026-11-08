import { motion } from './config';

/** True when this element can be animated now (motion is on and the browser has the Web Animations API). */
const can = (el: Element | undefined): el is HTMLElement => !!el && motion.isOn() && typeof (el as HTMLElement).animate === 'function';
const settled = (a: Animation[]): Promise<void> => Promise.all(a.map((x) => x.finished.catch(() => undefined))).then(() => undefined);

type Trigger = Element | { x: number; y: number } | undefined;

/** `transform-origin` that puts the popover's growth point at the trigger (rules 11 and 12). */
export function originFor(trigger: Trigger, el: HTMLElement): string | undefined {
  if (!trigger || !motion.get().originFromTrigger) return undefined;
  const r = el.getBoundingClientRect();
  const t = 'getBoundingClientRect' in trigger ? trigger.getBoundingClientRect() : { left: trigger.x, top: trigger.y, width: 0, height: 0 };
  const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));
  return `${clamp(t.left + t.width / 2 - r.left, r.width)}px ${clamp(t.top + t.height / 2 - r.top, r.height)}px`;
}

type Kind = 'dropdown' | 'popover' | 'modal';

/**
 * A floating element appears: fades in and scales up from `popover.scale` (0.95), growing out of the trigger, ease-out.
 * Resolves when it finished; `null` when nothing was animated (motion off, no Web Animations).
 */
export function popIn(el: HTMLElement, trigger?: Trigger, kind: Kind = 'dropdown'): Promise<void> | null {
  if (!can(el)) return null;
  const o = originFor(trigger, el);
  if (o) el.style.transformOrigin = o;
  const s = motion.get().popover.scale;
  return settled([el.animate([{ opacity: 0, transform: `scale(${s})` }, { opacity: 1, transform: 'scale(1)' }], { duration: motion.ms(kind), easing: motion.easing('enter'), fill: 'backwards' })]);
}

/** The inverse: shrinks back toward the trigger, `exitRatio` (80 %) as long as the entrance, ease-in. The caller hides the element when it resolves. */
export function popOut(el: HTMLElement, trigger?: Trigger, kind: Kind = 'dropdown'): Promise<void> | null {
  if (!can(el)) return null;
  const o = originFor(trigger, el);
  if (o) el.style.transformOrigin = o;
  const s = motion.get().popover.scale;
  return settled([el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: `scale(${s})` }], { duration: motion.ms(kind, 'exit'), easing: motion.easing('exit'), fill: 'forwards' })]);
}

export interface StaggerOptions {
  /** Delay between consecutive items (ms). Default `stagger.step` (30). */
  step?: number;
  /** After this many items the delay stops growing. Default `stagger.max` (12). */
  max?: number;
  /** Start offset in px (rises from below). Default 6. */
  dy?: number;
}

/** The delay (ms) of the item at `index` in a staggered group. */
export const staggerDelay = (index: number, o: StaggerOptions = {}): number => Math.min(index, o.max ?? motion.get().stagger.max) * (o.step ?? motion.get().stagger.step);

/** Items of a list enter one after the other, 30 ms apart (rule 3), each ease-out. */
export function stagger(els: ArrayLike<Element>, o: StaggerOptions = {}): Promise<void> | null {
  const list = Array.from(els);
  if (!list.length || !can(list[0])) return null;
  return settled(list.map((el, i) => (el as HTMLElement).animate([{ opacity: 0, transform: `translateY(${o.dy ?? 6}px)` }, { opacity: 1, transform: 'none' }], { duration: motion.ms('enter'), easing: motion.easing('enter'), delay: staggerDelay(i, o), fill: 'backwards' })));
}

/** The parts of a card settle in order: every match of the first selector, then the second... one stagger step apart (rule 6). */
export function staggerDetails(root: ParentNode, selectors: string[], o: StaggerOptions = {}): Promise<void> | null {
  const els = selectors.flatMap((s) => Array.from(root.querySelectorAll(s)));
  return stagger(els, o);
}

/** A subtle ring and a tiny swell to confirm that something worked (rule 8). */
export function pulse(el: HTMLElement, color = 'var(--op-color-success)'): Promise<void> | null {
  if (!can(el)) return null;
  return settled([
    el.animate(
      [
        { boxShadow: `0 0 0 0 color-mix(in srgb, ${color} 55%, transparent)`, transform: 'scale(1)' },
        { transform: 'scale(1.03)', offset: 0.35 },
        { boxShadow: `0 0 0 0.6rem color-mix(in srgb, ${color} 0%, transparent)`, transform: 'scale(1)' },
      ],
      { duration: motion.get().duration.pulse, easing: motion.easing('enter') },
    ),
  ]);
}

/** A plain entrance: fade in while rising a little, ease-out (rule 1). */
export function enter(el: HTMLElement, o: { dy?: number; delay?: number } = {}): Promise<void> | null {
  if (!can(el)) return null;
  return settled([el.animate([{ opacity: 0, transform: `translateY(${o.dy ?? 8}px)` }, { opacity: 1, transform: 'none' }], { duration: motion.ms('enter'), easing: motion.easing('enter'), delay: o.delay ?? 0, fill: 'backwards' })]);
}

/** The same motion going out: shorter by `exitRatio`, ease-in (rules 1 and 15). */
export function exit(el: HTMLElement, o: { dy?: number } = {}): Promise<void> | null {
  if (!can(el)) return null;
  return settled([el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${o.dy ?? 8}px)` }], { duration: motion.ms('enter', 'exit'), easing: motion.easing('exit'), fill: 'forwards' })]);
}
