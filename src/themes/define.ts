import { kebab } from '../core/dom';

type Values = Record<string, string | number | undefined>;
type ColorToken = 'bg' | 'surface' | 'surface-2' | 'fg' | 'fg-muted' | 'border' | 'border-strong' | 'hover' | 'selected' | 'primary' | 'primary-hover' | 'primary-fg' | 'primary-soft' | 'danger' | 'danger-hover' | 'danger-fg' | 'danger-soft' | 'success' | 'success-soft' | 'warning' | 'warning-soft' | 'info' | 'info-soft' | 'focus' | 'overlay';

export interface ThemeDefinition {
  /** Semantic colors: `{ primary: '#06f' }` → `--op-color-primary`. camelCase keys are kebab-cased. */
  color?: Partial<Record<ColorToken | string, string>>;
  font?: Values;
  space?: Values;
  radius?: Values;
  shadow?: Values;
  control?: Values;
  /** Any other key is a component scope: `{ button: { radius: 0 } }` → `--op-button-radius`. */
  [group: string]: Values | undefined;
}

export interface Theme {
  name: string;
  /** CSS text, scoped to `[data-op-theme~="name"]`, inside `@layer optikos`. */
  css: string;
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
  for (const group in def) {
    const values = def[group];
    for (const key in values) lines.push(`    --op-${kebab(group)}-${kebab(key)}: ${values[key as keyof typeof values]};`);
  }
  const css = `@layer optikos {\n  [data-op-theme~='${name}'] {\n${lines.join('\n')}\n  }\n}\n`;
  return {
    name,
    css,
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
    },
  };
}

/** Activates themes on an element (default `<html>`): `setTheme('dark compact')` or `setTheme(['dark', 'custom'])`. */
export function setTheme(names: string | string[], el: HTMLElement = document.documentElement): void {
  el.setAttribute('data-op-theme', Array.isArray(names) ? names.join(' ') : names);
}
