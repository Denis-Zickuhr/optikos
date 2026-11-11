// Optional reactive layer. Components only know setters; this module calls them from signals.
// Nothing in `core` or `components` imports this file.
import type { Component } from '../core/component';

type Sub = () => void;
let running: Effect | undefined;

interface Effect {
  run(): void;
  deps: Set<Set<Effect>>;
}

export interface Signal<T> {
  (): T;
  set(value: T): void;
  update(fn: (v: T) => T): void;
}

export function signal<T>(initial: T): Signal<T> {
  let value = initial;
  const subs = new Set<Effect>();
  const read = (() => {
    if (running) {
      subs.add(running);
      running.deps.add(subs);
    }
    return value;
  }) as Signal<T>;
  read.set = (v) => {
    if (Object.is(v, value)) return;
    value = v;
    for (const e of [...subs]) e.run();
  };
  read.update = (fn) => read.set(fn(value));
  return read;
}

/** Runs `fn` now and again whenever a signal it read changes. Returns the dispose function. */
export function effect(fn: () => void | Sub): () => void {
  let cleanup: void | Sub;
  const e: Effect = {
    deps: new Set(),
    run() {
      for (const d of e.deps) d.delete(e);
      e.deps.clear();
      cleanup?.();
      const prev = running;
      running = e;
      try {
        cleanup = fn();
      } finally {
        running = prev;
      }
    },
  };
  e.run();
  return () => {
    for (const d of e.deps) d.delete(e);
    e.deps.clear();
    cleanup?.();
  };
}

/** A read-only signal derived from others. */
export function computed<T>(fn: () => T): () => T {
  const s = signal<T>(undefined as T);
  effect(() => s.set(fn()));
  return s;
}

/** Wraps a Store (or anything with `subscribe`) so reading it inside an effect/computed re-runs that effect on every change. Call it once, outside effects. */
export function fromStore<S extends { subscribe(fn: () => void): () => void }>(store: S): () => S {
  const tick = signal(0);
  store.subscribe(() => tick.update((n) => n + 1));
  return () => (tick(), store);
}

/**
 * `bind(button, { text: () => `Count: ${n()}`, disabled: isBusy })` → `button.setText(...)`, `button.setDisabled(...)`
 * re-run when the sources change, and are disposed with the component. A source that is a writable signal on `value`
 * is two-way: the field's `change` event writes back.
 */
export function bind(cmp: Component<any>, map: Record<string, () => unknown>): void {
  for (const key in map) {
    const setter = `set${key[0].toUpperCase()}${key.slice(1)}`;
    const fn = (cmp as unknown as Record<string, unknown>)[setter];
    if (typeof fn !== 'function') throw new Error(`Optikos bind: ${cmp.constructor.name} has no ${setter}()`);
    const src = map[key];
    cmp.own(effect(() => void fn.call(cmp, src())));
    const write = (src as { set?: (v: unknown) => void }).set;
    if (key === 'value' && write) cmp.own(cmp.on('change', (v) => write(v)));
  }
}

export { viewModel, bindVM, bindForm, type ViewModel, type ViewModelConfig } from './viewmodel';
