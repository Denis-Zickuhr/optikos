import { parse, toHex, mix, ensure, readableOn, contrast, WHITE, BLACK, type RGB } from './color';

export interface Seeds {
  /** The brand color. Used as is for fills; text uses a shade of it that keeps 4.5:1. */
  primary: string;
  /** Tints the grays (backgrounds, borders, text). Default: a cool gray. */
  neutral?: string;
}

const hex = (c: RGB) => toHex(c);

function one(seed: RGB, neutral: RGB, dark: boolean): Record<string, string> {
  const surface = dark ? mix(neutral, BLACK, 0.86) : WHITE;
  const bg = dark ? mix(neutral, BLACK, 0.93) : mix(neutral, WHITE, 0.93);
  const surface2 = dark ? mix(neutral, BLACK, 0.8) : mix(neutral, WHITE, 0.96);
  const fg = ensure(dark ? mix(neutral, WHITE, 0.9) : mix(neutral, BLACK, 0.8), surface2, 9);
  const muted = ensure(dark ? mix(neutral, WHITE, 0.6) : mix(neutral, BLACK, 0.35), bg, 4.5);
  const border = dark ? mix(neutral, BLACK, 0.65) : mix(neutral, WHITE, 0.82);
  const strong = ensure(dark ? mix(neutral, WHITE, 0.4) : mix(neutral, WHITE, 0.55), surface, 3);
  const fill = dark && contrast(seed, surface) < 3 ? ensure(seed, surface, 3) : seed;
  const text = ensure(seed, surface2, 4.5);
  const on = readableOn(fill);
  const hover = mix(fill, dark ? WHITE : BLACK, 0.14);
  const soft = mix(surface, fill, dark ? 0.22 : 0.12);
  const nav = dark ? mix(neutral, BLACK, 0.92) : mix(neutral, BLACK, 0.82);
  const navFg = ensure(mix(neutral, WHITE, 0.85), nav, 7);
  const navActive = mix(nav, seed, 0.4);
  const bar = ensure(seed, navActive, 3);
  const head = dark ? mix(neutral, BLACK, 0.75) : mix(neutral, WHITE, 0.88);
  const out: Record<string, string> = {
    '--op-color-bg': hex(bg),
    '--op-color-surface': hex(surface),
    '--op-color-surface-2': hex(surface2),
    '--op-color-fg': hex(fg),
    '--op-color-fg-muted': hex(muted),
    '--op-color-border': hex(border),
    '--op-color-border-strong': hex(strong),
    '--op-color-hover': hex(mix(surface, neutral, dark ? 0.18 : 0.1)),
    '--op-color-selected': hex(soft),
    '--op-color-primary': hex(fill),
    '--op-color-primary-hover': hex(hover),
    '--op-color-primary-fg': hex(on),
    '--op-color-primary-soft': hex(soft),
    '--op-color-focus': hex(text),
    '--op-navmenu-bg': hex(nav),
    '--op-navmenu-fg': hex(navFg),
    '--op-navmenu-group-fg': hex(ensure(mix(neutral, WHITE, 0.55), nav, 4.5)),
    '--op-navmenu-item-hover-bg': hex(mix(nav, WHITE, 0.08)),
    '--op-navmenu-active-bg': hex(navActive),
    '--op-navmenu-active-fg': hex(ensure(WHITE, navActive, 7)),
    '--op-navmenu-active-bar': hex(bar),
    '--op-navmenu-badge-bg': hex(bar),
    '--op-navmenu-badge-fg': hex(readableOn(bar)),
    '--op-grid-header-bg': hex(head),
    '--op-grid-header-fg': hex(ensure(fg, head, 7)),
  };
  // only a brand whose color fails as text needs a separate text token
  if (contrast(fill, surface2) < 4.5) out['--op-color-primary-text'] = hex(text);
  return out;
}

/** Light and dark token sets from a few seeds, with the text pairs kept at 4.5:1 or better. */
export function fromSeeds(seeds: Seeds): { light: Record<string, string>; dark: Record<string, string> } {
  const primary = parse(seeds.primary);
  if (!primary) throw new Error(`Optikos: seeds.primary must be a hex color, got "${seeds.primary}"`);
  const neutral = parse(seeds.neutral ?? '#64748b') ?? [100, 116, 139];
  return { light: one(primary, neutral, false), dark: one(primary, neutral, true) };
}
