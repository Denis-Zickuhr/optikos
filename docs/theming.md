# Theming

Everything visual comes from a custom property. Three layers, all in `@layer optikos`:

| Layer | Example | Who changes it |
|---|---|---|
| Primitives | `--op-blue-600` | almost nobody (the raw palette) |
| Semantic | `--op-color-primary`, `--op-radius`, `--op-space-3`, `--op-font-size` | themes |
| Component | `--op-button-bg`, `--op-grid-row-height` | themes and instances |

Each component uses its own token and falls back to the semantic one: `background: var(--op-button-bg, var(--op-color-surface))`.

## 1. Global, scoped and per component

```html
<link rel="stylesheet" href="optikos/optikos.css" />
<link rel="stylesheet" href="optikos/themes/dark.css" />     <!-- optional -->
<html data-op-theme="dark compact">                          <!-- a list: themes combine -->
<section data-op-theme="light">…</section>                   <!-- scope: only this subtree -->
```

```ts
create({ type: 'button', theme: { radius: '0', primaryBg: '#16a34a' } }); // --op-button-radius, --op-button-primary-bg (this instance only)
```

Included themes: `light` (the default, in `optikos.css`), `dark.css`, `compact.css` (density: smaller controls and spacing). Combine them: `data-op-theme="dark compact"`.

Windows, menus, dropdowns and toasts live in `body > .op-layer`; they copy the `data-op-theme` of the element that opened them, so a dark scope stays dark in its popups.

## 2. A theme in CSS (no JS)

```css
@layer optikos {
  [data-op-theme~='ocean'] { --op-color-primary: #0e7490; --op-radius: 0.125rem; }
}
```

See `demos/customization/ocean.css`. CSS **outside** `@layer` wins over the library's without `!important`.

## 3. A theme in TypeScript

```ts
import { defineTheme, setTheme } from 'optikos';

const brand = defineTheme({
  color: { primary: '#7c3aed', primarySoft: '#f5f3ff' },   // --op-color-primary, --op-color-primary-soft
  button: { radius: '62.5rem', fontWeight: 700 },          // --op-button-radius, --op-button-font-weight
}, 'brand');

brand.apply();          // injects the CSS and turns it on in <html> (keeps the other themes: "dark brand")
brand.inject();         // only injects it (to offer it in a picker); then setTheme('brand')
setTheme('dark brand'); // sets the themes of any element: setTheme(names, el)
```

camelCase keys become kebab-case. Numbers have no unit (`radius: 0`); write units as strings (`'4px'`).
To produce the `.css` at build time: `npm run theme -- my-theme.ts my-theme.css` (the file does `export default defineTheme(...)`), or the kai command **Theme to CSS**.

## Density

`--op-control-height`, `--op-control-padding-x`, `--op-row-height` and the `--op-space-*` scale define the density; the `compact` theme only redefines them.

## Rules for component authors

- CSS uses tokens only. Literal values go in a `:root { --op-x-size: 1.5rem }` block at the top of the file; the `themes/css.test.ts` test fails on a stray color/size.
- Everything inside `@layer optikos`.
- Declare theme-dependent tokens where they are used (`var(--op-x, var(--op-color-…))`), never in a `:root` with `var()` (it would not re-evaluate inside `data-op-theme`).
- Text must keep a 4.5:1 contrast in every theme: the browser test `site/a11y.browser.test.ts` runs axe on every example in every theme.

## Ready-made themes (complete looks)

Besides `light` (default), `dark` and `compact` (density), six themes change **colors, shape, density and typography** (not just the palette), so the same app looks like another product. Each one is a file in `optikos/themes/<name>.css`; turn it on with `data-op-theme="<name>"` (and combine with `compact` if you want).

| Theme | What it looks like |
|---|---|
| `corporate` | sober and orderly, for back-office work: steel blue on cool gray, small radii, hairline borders, flat, a navy sidebar (`--op-navmenu-*`), 2.375rem controls, 2.75rem rows, 15px text; made for long sessions in grids and forms |
| `brutal` | 3px black borders, no radius, hard offset shadows, loud yellow (as a fill, never as text), uppercase labels; buttons "lift" on hover and "sink" on click |
| `soft` | light and airy: large radii, pill buttons, pastel violet, diffuse shadows, borderless fields (a soft fill), tall rows |
| `terminal` | phosphor green on black, monospace, no radius, dense, a glowing focus, titles with `>` |
| `brand` | luxury/jewelry, **light and for daily use**: champagne and ivory, onyx text, antique gold, high-contrast serif, hairlines, spaced capitals, onyx title bands with gold text, a gold-leaf primary button. `data-op-theme="brand night"` gives the dark (onyx) version |
| `editorial` | warm paper, serif type, ink rules instead of boxes, underline-only fields, small-caps buttons, oxblood accent |

They show how far a theme goes with tokens and scoped rules (`[data-op-theme~='x'] .op-button { … }`). For themes like these, use component tokens (`--op-panel-header-bg`, `--op-grid-header-bg`, `--op-button-radius`...) before writing a rule; write a rule only for what a token cannot reach (uppercase, offset shadow, underlined field). In popups (menu, window, dropdown) the `data-op-theme` attribute sits on the floating element itself, so prefer tokens to descendant selectors.
In development, the sandbox bar and the demo frame have a picker with all of them (`?theme=brutal` works too).
