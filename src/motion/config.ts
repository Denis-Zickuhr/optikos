/** Global motion settings: one object, one switch. Defaults are the numbers of the 20 motion rules. */
export interface MotionConfig {
  enabled: boolean;
  /** When true (default) a user who asked the OS for reduced motion gets none. */
  respectReducedMotion: boolean;
  ease: { out: string; in: string; inOut: string };
  /** Milliseconds. */
  duration: { dropdown: number; popover: number; modal: number; press: number; pulse: number; reveal: number; swap: number; move: number; enter: number };
  /** The dropdown duration is clamped into this range (rule 2). */
  dropdownRange: [number, number];
  /** Exit duration = enter duration × this (rule 15). */
  exitRatio: number;
  stagger: { step: number; max: number };
  press: { scale: number };
  popover: { scale: number };
  stretch: { amount: number };
  arc: { bend: number };
  /** Blur in px used by crossfades (rule 18). */
  blur: number;
  rubber: { resistance: number; settle: number };
  /** Rule 13: easings that overshoot are refused unless this is true. */
  allowBounce: boolean;
  originFromTrigger: boolean;
}

export const DEFAULTS: MotionConfig = {
  enabled: true,
  respectReducedMotion: true,
  ease: { out: 'cubic-bezier(0, 0, 0.2, 1)', in: 'cubic-bezier(0.4, 0, 1, 1)', inOut: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  duration: { dropdown: 200, popover: 200, modal: 240, press: 100, pulse: 450, reveal: 350, swap: 220, move: 450, enter: 250 },
  dropdownRange: [150, 250],
  exitRatio: 0.8,
  stagger: { step: 30, max: 12 },
  press: { scale: 0.97 },
  popover: { scale: 0.95 },
  stretch: { amount: 0.12 },
  arc: { bend: 0.25 },
  blur: 4,
  rubber: { resistance: 0.55, settle: 320 },
  allowBounce: false,
  originFromTrigger: true,
};

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };

/** A `cubic-bezier` whose control points leave [0, 1] on the y axis overshoots (bounces); springs always do. */
export function isBouncy(easing: string): boolean {
  if (/spring|elastic|bounce/i.test(easing)) return true;
  const m = /cubic-bezier\(([^)]+)\)/i.exec(easing);
  if (!m) return false;
  const [, y1, , y2] = m[1].split(',').map(Number);
  return y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1;
}

type Listener = (c: Readonly<MotionConfig>) => void;
let current: MotionConfig = structuredClone(DEFAULTS);
const listeners = new Set<Listener>();

const merge = (base: any, patch: any): any => {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k in patch) out[k] = patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k]) && base[k] ? merge(base[k], patch[k]) : patch[k];
  return out;
};

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Writes the settings that CSS needs as custom properties on <html>, and the `op-motion-off` class. */
function apply(): void {
  if (typeof document === 'undefined') return;
  const c = current;
  const on = motion.isOn();
  const s = document.documentElement.style;
  const set = (k: string, v: string | number) => s.setProperty(`--op-motion-${k}`, String(v));
  set('ease-out', c.ease.out);
  set('ease-in', c.ease.in);
  set('ease-in-out', c.ease.inOut);
  set('press-scale', on ? c.press.scale : 1);
  set('press-duration', `${on ? c.duration.press : 0}ms`);
  set('popover-scale', on ? c.popover.scale : 1);
  set('dropdown-duration', `${on ? motion.dropdownMs() : 0}ms`);
  set('exit-ratio', c.exitRatio);
  set('stagger-step', `${on ? c.stagger.step : 0}ms`);
  set('blur', `${c.blur}px`);
  document.documentElement.classList.toggle('op-motion-off', !on);
}

export const motion = {
  get(): Readonly<MotionConfig> {
    return current;
  },
  /**
   * Changes the settings (deep merge). Easings that bounce are refused while `allowBounce` is false; the rest of the patch
   * still applies. Returns what was refused.
   */
  set(patch: DeepPartial<MotionConfig>): { rejected: string[] } {
    const rejected: string[] = [];
    const next = merge(current, patch) as MotionConfig;
    for (const k of Object.keys(next.ease) as Array<keyof MotionConfig['ease']>) {
      if (!next.allowBounce && isBouncy(next.ease[k])) {
        rejected.push(`ease.${k}: "${next.ease[k]}" bounces (set allowBounce: true to use it)`);
        next.ease[k] = current.ease[k];
      }
    }
    current = next;
    apply();
    listeners.forEach((fn) => fn(current));
    return { rejected };
  },
  reset(): void {
    current = structuredClone(DEFAULTS);
    apply();
    listeners.forEach((fn) => fn(current));
  },
  enable(): void {
    motion.set({ enabled: true });
  },
  disable(): void {
    motion.set({ enabled: false });
  },
  /** Motion is switched on and the user did not ask for reduced motion (unless `respectReducedMotion` is off). */
  isOn(): boolean {
    return current.enabled && !(current.respectReducedMotion && reduced());
  },
  /** The dropdown duration, clamped into `dropdownRange`. */
  dropdownMs(): number {
    const [lo, hi] = current.dropdownRange;
    return Math.max(lo, Math.min(hi, current.duration.dropdown));
  },
  /** Duration for a kind of motion in a phase: exits are `exitRatio` times shorter (rule 15). */
  ms(kind: keyof MotionConfig['duration'], phase: 'enter' | 'exit' = 'enter'): number {
    const base = kind === 'dropdown' ? motion.dropdownMs() : current.duration[kind];
    return phase === 'exit' ? Math.round(base * current.exitRatio) : base;
  },
  /** Easing for a phase: entrances ease-out, exits ease-in, movement ease-in-out. */
  easing(phase: 'enter' | 'exit' | 'move'): string {
    return phase === 'enter' ? current.ease.out : phase === 'exit' ? current.ease.in : current.ease.inOut;
  },
  /** Subscribe to changes; returns the unsubscribe function. */
  on(fn: Listener): () => void {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
};
apply();
