export type Child = Node | string | number | null | undefined | false;
export type Attrs = Record<string, string | number | boolean | null | undefined>;

/** Sets attributes; `null`, `undefined` and `false` remove, `true` sets an empty attribute. */
export function attr(el: Element, attrs: Attrs): void {
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) el.removeAttribute(k);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

/** Tiny element factory: `h('button', 'op-button', { type: 'button' }, 'Save')`. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', attrs?: Attrs, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (attrs) attr(el, attrs);
  for (const k of kids) if (k != null && k !== false) el.append(typeof k === 'number' ? String(k) : k);
  return el;
}

let seq = 0;
export const uid = (prefix = 'op'): string => `${prefix}-${++seq}`;
export const kebab = (s: string): string => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
export const px = (v: number | string): string => (typeof v === 'number' ? `${v}px` : v);
export const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max);
export const isEl = (v: unknown): v is HTMLElement => typeof HTMLElement !== 'undefined' && v instanceof HTMLElement;
