export type Handler = (...args: any[]) => unknown;

/** Minimal observer. A handler that returns `false` makes `emit` return `false` (used by `before-*` events). */
export class Emitter {
  private handlers = new Map<string, Handler[]>();

  /** Subscribes; returns the unsubscribe function. */
  on(name: string, fn: Handler): () => void {
    const list = this.handlers.get(name);
    if (list) list.push(fn);
    else this.handlers.set(name, [fn]);
    return () => this.off(name, fn);
  }

  once(name: string, fn: Handler): () => void {
    const off = this.on(name, (...a) => {
      off();
      return fn(...a);
    });
    return off;
  }

  off(name: string, fn?: Handler): void {
    if (!fn) this.handlers.delete(name);
    else {
      const list = this.handlers.get(name);
      if (list) this.handlers.set(name, list.filter((f) => f !== fn));
    }
  }

  /** Returns `false` if any handler returned `false` (the event was cancelled). */
  emit(name: string, ...args: unknown[]): boolean {
    let ok = true;
    for (const fn of this.handlers.get(name) ?? []) if (fn(...args) === false) ok = false;
    return ok;
  }

  clearListeners(): void {
    this.handlers.clear();
  }
}
