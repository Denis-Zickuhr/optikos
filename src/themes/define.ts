import { kebab } from '../core/dom';
import { isDev } from '../core/dev';
import { fromSeeds, type Seeds } from './seeds';
import { checkContrast } from './contrast';

type Values = Record<string, string | number | undefined>;
type ColorToken = 'bg' | 'surface' | 'surface-2' | 'fg' | 'fg-muted' | 'border' | 'border-strong' | 'hover' | 'selected' | 'primary' | 'primary-hover' | 'primary-fg' | 'primary-soft' | 'danger' | 'danger-hover' | 'danger-fg' | 'danger-soft' | 'success' | 'success-soft' | 'warning' | 'warning-soft' | 'info' | 'info-soft' | 'focus' | 'overlay';

export interface FontSpec {
  family: string;
  /** URL of the file (woff2 is enough for every current browser). */
  url: string;
  /** A weight or a range (`'400 700'` for a variable font). Default `400`. */
  weight?: string | number;
  style?: 'normal' | 'italic';
  /** Default `swap`. */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface ThemeDefinition {
  /**
   * A few brand colors in, a whole theme out: light under `name`, and dark under `name` + `dark` (`data-op-theme="name dark"`).
   * Text pairs are kept at 4.5:1; navmenu and grid header colors come with it. Tokens you also give win.
   */
  seeds?: Seeds;
  /** `@font-face` rules, so the font ships with the theme (a white-label tenant brings its own). Set the family with `font: { family }`. */
  fonts?: FontSpec[];
  /** Semantic colors: `{ primary: '#06f' }` → `--op-color-primary`. camelCase keys are kebab-cased. */
  color?: Partial<Record<ColorToken | string, string>>;
  font?: Values;
  space?: Values;
  /** `radius: '0.5rem'` sets `--op-radius`; `radius: { sm, lg, pill }` sets `--op-radius-sm`...; `radius: { base: '0.5rem', sm: '0.25rem' }` sets both. */
  radius?: Values | string | number;
  shadow?: Values;
  control?: Values;
  /** Any other key is a component scope: `{ button: { radius: 0 } }` → `--op-button-radius`. A plain value, or the key `base`, sets the group's own token (`{ radius: 0 }` or `{ radius: { base: 0, sm: 2 } }` → `--op-radius`). */
  [group: string]: Values | string | number | Seeds | FontSpec[] | undefined;
}

export interface Theme {
  name: string;
  /** CSS text, scoped to `[data-op-theme~="name"]`, inside `@layer optikos`. */
  css: string;
  /** The fonts the theme declared, for `loadFonts`. */
  fonts: FontSpec[];
  /** Injects the CSS once without activating it (e.g. to offer it in a theme picker). */
  inject(): void;
  /** Injects the CSS and activates the theme on `el` (default: `<html>`), keeping other themes (`"dark custom"`). */
  apply(el?: HTMLElement): void;
}

/**
 * Typed, proprietary theme format. Produces the same custom properties a hand-written CSS theme would.
 * Numbers are emitted unitless; write units as strings (`'4px'`).
 */
export function defineTheme(def: ThemeDefinition, name = 'custom'): Theme {
  const lines: string[] = [];
  const seeded = def.seeds && fromSeeds(def.seeds);
  const own = (m?: Record<string, string>) => Object.entries(m ?? {}).map(([k, v]) => `    ${k}: ${v};`);
  for (const group in def) {
    const values = def[group] as Values | string | number | undefined;
    if (values == null || group === 'seeds' || group === 'fonts') continue;
    if (typeof values !== 'object') lines.push(`    --op-${kebab(group)}: ${values};`);
    else for (const key in values) lines.push(`    --op-${kebab(group)}${key === 'base' ? '' : `-${kebab(key)}`}: ${values[key]};`);
  }
  const scope = `[data-op-theme~='${name}']`;
  const faces = (def.fonts ?? []).map((f) => `@font-face {\n  font-family: '${f.family}';\n  src: url('${f.url}');\n  font-weight: ${f.weight ?? 400};\n  font-style: ${f.style ?? 'normal'};\n  font-display: ${f.display ?? 'swap'};\n}\n`);
  // seeds first, so what the definition sets itself wins; the dark set has the higher specificity of two attributes
  const css = `${faces.join('')}@layer optikos {\n  ${scope} {\n${[...own(seeded?.light), ...lines].join('\n')}\n  }\n${seeded ? `  ${scope}[data-op-theme~='dark'] {\n${own(seeded.dark).join('\n')}\n  }\n` : ''}}\n`;
  return {
    name,
    css,
    fonts: def.fonts ?? [],
    inject() {
      const id = `op-theme-${name}`;
      let style = document.getElementById(id);
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        document.head.appendChild(style);
      }
      style.textContent = css;
    },
    apply(el = document.documentElement) {
      this.inject();
      const names = new Set((el.getAttribute('data-op-theme') ?? '').split(/\s+/).filter(Boolean));
      names.add(name);
      el.setAttribute('data-op-theme', [...names].join(' '));
      // in dev, text pairs under 4.5:1 are printed once the styles took effect
      if (isDev()) requestAnimationFrame(() => checkContrast(el));
    },
  };
}

/** Activates themes on an element (default `<html>`): `setTheme('dark compact')` or `setTheme(['dark', 'custom'])`. */
export function setTheme(names: string | string[], el: HTMLElement = document.documentElement): void {
  el.setAttribute('data-op-theme', Array.isArray(names) ? names.join(' ') : names);
}

/** Loads the fonts of a theme now (and resolves when they are ready), so the first paint does not flash the fallback. */
export async function loadFonts(fonts: FontSpec[]): Promise<void> {
  await Promise.all(
    fonts.map(async (f) => {
      const face = new FontFace(f.family, `url('${f.url}')`, { weight: String(f.weight ?? 400), style: f.style ?? 'normal', display: f.display ?? 'swap' });
      document.fonts.add(await face.load());
    }),
  );
}
