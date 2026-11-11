import { isDev } from '../core/dev';
import { parse, contrast, type RGB } from './color';

export interface ContrastIssue {
  /** The pair, as the tokens that make it (`--op-color-fg on --op-color-surface`). */
  pair: string;
  ratio: number;
  min: number;
}

// [text token, background token, minimum]: the pairs a theme most often gets wrong
const PAIRS: Array<[string, string, number]> = [
  ['--op-color-fg', '--op-color-surface', 4.5],
  ['--op-color-fg', '--op-color-bg', 4.5],
  ['--op-color-fg-muted', '--op-color-surface', 4.5],
  ['--op-color-fg-muted', '--op-color-surface-2', 4.5],
  ['--op-color-primary-fg', '--op-color-primary', 4.5],
  ['--op-color-primary-text', '--op-color-surface', 4.5],
  ['--op-color-danger', '--op-color-surface', 4.5],
  ['--op-color-success', '--op-color-surface', 4.5],
  ['--op-color-warning', '--op-color-surface', 4.5],
  ['--op-navmenu-fg', '--op-navmenu-bg', 4.5],
  ['--op-navmenu-active-fg', '--op-navmenu-active-bg', 4.5],
  ['--op-grid-header-fg', '--op-grid-header-bg', 4.5],
];

/**
 * Checks the theme in effect on `el` (default `<html>`) for text pairs under 4.5:1 and returns them.
 * A pair whose token is not set is skipped. `warn` (default: in dev) also prints each to the console.
 */
export function checkContrast(el: HTMLElement = document.documentElement, o: { warn?: boolean; resolve?: (token: string) => RGB | undefined } = {}): ContrastIssue[] {
  // a probe element lets the browser resolve `var()` chains and `color-mix()` to a plain color
  const probe = o.resolve ? undefined : el.appendChild(document.createElement('span'));
  const resolve =
    o.resolve ??
    ((token: string) => {
      probe!.style.color = '';
      probe!.style.color = `var(${token})`;
      return parse(getComputedStyle(probe!).color);
    });
  const issues: ContrastIssue[] = [];
  for (const [fg, bg, min] of PAIRS) {
    const [a, b] = [resolve(fg), resolve(bg)];
    if (!a || !b) continue;
    const ratio = Math.round(contrast(a, b) * 100) / 100;
    if (ratio < min) issues.push({ pair: `${fg} on ${bg}`, ratio, min });
  }
  probe?.remove();
  if (o.warn ?? isDev()) for (const i of issues) console.warn(`Optikos: low contrast ${i.ratio}:1 (needs ${i.min}:1) — ${i.pair}`);
  return issues;
}
