export type RGB = [number, number, number];

export function parse(css: string): RGB | undefined {
  const s = css.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)?.[1];
  if (hex) {
    const f = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)) as RGB;
  }
  // what getComputedStyle returns: rgb(1, 2, 3), rgb(1 2 3 / 1) or color(srgb 0.1 0.2 0.3)
  const fn = /^(rgba?|color)\(\s*(?:srgb\s+)?([^)]+)\)/i.exec(s);
  if (!fn) return undefined;
  const n = fn[2].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
  if (n.length < 3 || n.some(isNaN)) return undefined;
  return (fn[1] === 'color' ? n.map((v) => v * 255) : n) as RGB;
}

export const toHex = (c: RGB): string => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

/** `t` of `b` over `a` (0 = a, 1 = b), in sRGB. */
export const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;

const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const luminance = (c: RGB): number => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const WHITE: RGB = [255, 255, 255];
export const BLACK: RGB = [0, 0, 0];

/** Moves `c` toward black or white (whichever reaches it) until it has `min` contrast against `bg`. */
export function ensure(c: RGB, bg: RGB, min: number): RGB {
  if (contrast(c, bg) >= min) return c;
  const toward = luminance(bg) > 0.4 ? BLACK : WHITE;
  for (let t = 0.04; t <= 1; t += 0.04) {
    const m = mix(c, toward, t);
    if (contrast(m, bg) >= min) return m;
  }
  return toward;
}

/** Black or white, whichever reads better on `bg`. */
export const readableOn = (bg: RGB): RGB => (contrast(WHITE, bg) >= contrast(BLACK, bg) ? WHITE : BLACK);
