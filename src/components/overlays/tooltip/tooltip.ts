import { h } from '../../../core/dom';
import { toLayer } from '../../../core/layer';
import { place } from '../../../core/position';

// Tooltips are plain attributes: any element (or Component with `tooltip`) carries `data-op-tip`,
// and one delegated set of listeners shows a single shared tooltip element.
let delay = 400;
let el: HTMLElement | undefined;
let target: HTMLElement | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let installed = false;

const tipOf = (n: EventTarget | null) => (n instanceof Element ? n.closest<HTMLElement>('[data-op-tip]') : null);

function show(t: HTMLElement) {
  const text = t.dataset.opTip;
  if (!text) return;
  el ??= h('div', 'op-tooltip', { role: 'tooltip', id: 'op-tooltip' });
  el.textContent = text;
  toLayer(el, t);
  target = t;
  t.setAttribute('aria-describedby', 'op-tooltip');
  place(el, t, { placement: 'top', offset: 6 });
}

function hide() {
  clearTimeout(timer);
  if (target) target.removeAttribute('aria-describedby');
  target = undefined;
  el?.remove();
}

function schedule(t: HTMLElement, ms: number) {
  clearTimeout(timer);
  if (target === t) return;
  hide();
  timer = setTimeout(() => show(t), ms);
}

function install() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('pointerover', (e: Event) => {
    if ((e as PointerEvent).pointerType === 'touch') return;
    const t = tipOf(e.target);
    if (t) schedule(t, delay);
  });
  document.addEventListener('pointerout', (e: Event) => {
    const t = tipOf(e.target);
    if (t && !t.contains((e as PointerEvent).relatedTarget as Node)) hide();
  });
  document.addEventListener('focusin', (e: Event) => {
    const t = tipOf(e.target);
    let visible = true;
    try {
      visible = !!t?.matches(':focus-visible');
    } catch { /* engine without :focus-visible */ }
    if (t && visible) schedule(t, 0);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('keydown', (e: KeyboardEvent) => e.key === 'Escape' && hide(), true);
  document.addEventListener('scroll', hide, true);
}
install();

export const Tooltip = {
  /** Default delay (ms) before a hover tooltip shows. */
  configure(o: { delay?: number }) {
    if (o.delay != null) delay = o.delay;
  },
  show,
  hide,
};

/** Gives any element a tooltip (same as the `tooltip` config on components). */
export function attachTooltip(target: HTMLElement, text: string): void {
  target.dataset.opTip = text;
}
