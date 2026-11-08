const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((e) => !e.hidden && !e.closest('[hidden],[inert]'));
}

/** Keeps Tab inside `root`. Returns the release function. */
export function trapFocus(root: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const list = focusables(root);
    if (!list.length) return e.preventDefault();
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !root.contains(active))) (e.preventDefault(), last.focus());
    else if (!e.shiftKey && (active === last || !root.contains(active))) (e.preventDefault(), first.focus());
  };
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}

export interface RovingOptions {
  /** Selector of the items inside the container. */
  selector: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Wrap around at the ends. Default true. */
  loop?: boolean;
  /** Called when an arrow/Home/End key moves focus to an item. */
  onMove?: (item: HTMLElement) => void;
}

/** Roving tabindex: one item is the Tab stop, arrows/Home/End move focus. Returns `{ sync, destroy }`. */
export function roving(container: HTMLElement, o: RovingOptions) {
  const { orientation = 'horizontal', loop = true } = o;
  const items = () => Array.from(container.querySelectorAll<HTMLElement>(o.selector)).filter((e) => e.getAttribute('aria-disabled') !== 'true' && !e.hidden);
  const stop = (target?: HTMLElement) => {
    const list = items();
    const t = target && list.includes(target) ? target : (list.find((e) => e.tabIndex === 0) ?? list[0]);
    for (const e of Array.from(container.querySelectorAll<HTMLElement>(o.selector))) e.tabIndex = e === t ? 0 : -1;
  };
  const onKey = (e: KeyboardEvent) => {
    const list = items();
    const i = list.indexOf((e.target as HTMLElement).closest<HTMLElement>(o.selector)!);
    if (i < 0) return;
    const prev = orientation === 'vertical' ? 'ArrowUp' : orientation === 'horizontal' ? 'ArrowLeft' : null;
    const next = orientation === 'vertical' ? 'ArrowDown' : orientation === 'horizontal' ? 'ArrowRight' : null;
    const isPrev = e.key === prev || (orientation === 'both' && (e.key === 'ArrowUp' || e.key === 'ArrowLeft'));
    const isNext = e.key === next || (orientation === 'both' && (e.key === 'ArrowDown' || e.key === 'ArrowRight'));
    let j = -1;
    if (isPrev) j = i > 0 ? i - 1 : loop ? list.length - 1 : 0;
    else if (isNext) j = i < list.length - 1 ? i + 1 : loop ? 0 : i;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = list.length - 1;
    if (j < 0) return;
    e.preventDefault();
    stop(list[j]);
    list[j].focus();
    o.onMove?.(list[j]);
  };
  const onFocus = (e: FocusEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(o.selector);
    if (item) stop(item);
  };
  container.addEventListener('keydown', onKey);
  container.addEventListener('focusin', onFocus);
  stop();
  return {
    /** Re-evaluates the tab stop (after items change). Pass the item that should be the stop. */
    sync: stop,
    destroy() {
      container.removeEventListener('keydown', onKey);
      container.removeEventListener('focusin', onFocus);
    },
  };
}
