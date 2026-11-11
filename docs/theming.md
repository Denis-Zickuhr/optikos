# Theming

Everything visual comes from a custom property. Three layers, all in `@layer optikos`:

| Layer | Example | Who changes it |
|---|---|---|
| Primitives | `--op-blue-600` | almost nobody (the raw palette) |
| Semantic | `--op-color-primary`, `--op-radius`, `--op-space-3`, `--op-font-size` | themes |
| Component | `--op-button-bg`, `--op-grid-row-height` | themes and instances |

Each component uses its own token and falls back to the semantic one: `background: var(--op-button-bg, var(--op-color-surface))`.

`--op-color-primary-text` is the primary color **as text** (selected chips, the primary badge...). It is not set by default (components fall back to `--op-color-primary`); a theme whose primary only works as a fill sets it (a yellow or gold primary, for example, sets it to the text color or a deeper shade).

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

Included themes: `light` (the default, in `optikos.css`), `dark.css` and `compact.css` (density: smaller controls and spacing). Combine them: `data-op-theme="dark compact"`.

The default look is sober and made for back-office work: steel blue on cool gray, small radii, hairline borders, flat
surfaces, a navy sidebar (`--op-navmenu-*`), 2.375rem controls, 2.75rem rows and 15px text, for long sessions in grids
and forms. `dark` is the same look at night: deep slate surfaces, a darker sidebar, the same shape and density.

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

## 4. A theme from two colors

```ts
const brand = defineTheme({
  seeds: { primary: '#D9A441', neutral: '#2A1C12' },
  font: { family: "'Brand Sans', system-ui, sans-serif" },
  fonts: [{ family: 'Brand Sans', url: '/fonts/brand.woff2', weight: '400 700' }],
}, 'brand');
brand.apply();                 // light: data-op-theme="brand"
setTheme('brand dark');        // dark: the seeds also made the night look
await loadFonts(brand.fonts);  // optional: fetch the files now instead of on first use
```

`seeds.primary` is used as is for fills; text that carries the brand uses a shade of it that keeps 4.5:1
(`--op-color-primary-text`, set only when the color fails as text, as a gold does). `neutral` tints the grays: backgrounds,
borders, text. The seeds also make the navmenu and grid header colors. Tokens you give next to `seeds` win in the light set.
`fonts` become `@font-face` rules (outside the layer) so a tenant's font ships with its theme; the family itself is
`font: { family }`.

`checkContrast(el?)` returns the text pairs under 4.5:1 (`fg` on `surface`, `fg-muted`, primary and its text, status
colors, navmenu, grid header) and prints them in dev; `theme.apply()` runs it on localhost. Chart and avatar colors are
`--op-chart-1…8` (the first is the primary unless the theme sets it).

## Density

`--op-control-height`, `--op-control-padding-x`, `--op-row-height` and the `--op-space-*` scale define the density; the `compact` theme only redefines them.

## Rules for component authors

- CSS uses tokens only. Literal values go in a `:root { --op-x-size: 1.5rem }` block at the top of the file; the `themes/css.test.ts` test fails on a stray color/size.
- Everything inside `@layer optikos`.
- Declare theme-dependent tokens where they are used (`var(--op-x, var(--op-color-…))`), never in a `:root` with `var()` (it would not re-evaluate inside `data-op-theme`).
- Text must keep a 4.5:1 contrast in every theme: the browser test `site/a11y.browser.test.ts` runs axe on every example in every theme.

## Going further: a complete look

A theme can change **colors, shape, density and typography**, not just the palette, so the same app looks like another
product: set the semantic and component tokens first (`--op-panel-header-bg`, `--op-grid-header-bg`, `--op-button-radius`...),
then write scoped rules (`[data-op-theme~='x'] .op-button { … }`) only for what a token cannot reach (uppercase, an offset
shadow, an underlined field). In popups (menu, window, dropdown) the `data-op-theme` attribute sits on the floating element
itself, so prefer tokens to descendant selectors.
