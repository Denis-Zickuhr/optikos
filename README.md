# Optikos

[![npm](https://img.shields.io/npm/v/optikos)](https://www.npmjs.com/package/optikos)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Denis-Zickuhr/optikos/blob/main/LICENSE)

Declarative UI components in plain TypeScript: describe screens, forms, grids and windows as configuration objects,
with no runtime dependencies.

- **Fast**: no virtual DOM. Setters update only the part of the DOM that changed, and grids and long lists are virtualized.
- **Light**: zero runtime dependencies. Each component can be imported on its own, and its size is checked on every build.
- **Complete**: fields, pickers, data grid, filter builder, windows, menus, tabs, command palette, chat and more.
- **Themeable**: every color, space, radius, font and shadow is a CSS custom property, and all styles live in `@layer optikos`.
- **Accessible**: keyboard support, focus management and ARIA are part of each component's spec.
- **Extensible**: your own components, layouts and themes use the same public API as the built-in ones.

## Install

```sh
npm i optikos
```

## Quick start

```ts
import { create, toast, type Form } from 'optikos';
import 'optikos/optikos.css';
import 'optikos/themes/dark.css';

document.documentElement.setAttribute('data-op-theme', 'dark');

const form = create<Form>({
  type: 'form',
  items: [
    { type: 'textfield', name: 'name', label: 'Name', required: true },
    { type: 'textfield', name: 'email', label: 'Email', inputType: 'email' },
    { type: 'select', name: 'plan', label: 'Plan', options: ['Free', 'Pro'] },
  ],
});

create({
  type: 'panel',
  title: 'New customer',
  renderTo: document.body,
  items: [form],
  buttons: [{ text: 'Save', variant: 'primary', handler: () => form.isValid() && toast(`Saved ${form.getValues().name}`) }],
});
```

`create()` builds a component tree from a config. Each `type` is a registered component class, so you can also write
`new TextField({ ... })`, or use the `ui` shortcuts:

```ts
import { ui } from 'optikos';

const signup = ui.form([
  ui.text('name', 'Name', { required: true }),
  ui.email('email', 'Email'),
  ui.row(ui.date('from', 'From'), ui.date('to', 'To')),
  ui.primary('Sign up', () => signup.submit()),
]);
```

### Data grid

```ts
import { create, Store } from 'optikos';

const orders = new Store({
  data: [
    { id: 1, customer: 'Ada Lovelace', total: 120 },
    { id: 2, customer: 'Alan Turing', total: 80 },
  ],
});

create({
  type: 'grid',
  store: orders,
  height: 320,
  paging: true,
  renderTo: document.body,
  columns: [
    { field: 'id', header: '#', width: 60, sortable: true },
    { field: 'customer', header: 'Customer', flex: 1, sortable: true },
    { field: 'total', header: 'Total', format: 'money', align: 'right' },
  ],
});

orders.filter({ field: 'customer', op: 'contains', value: 'ada' });
```

A `Store` can also load from a function or a REST endpoint, with remote sorting, filtering and paging.

### Reactive bindings (optional)

Components only have setters. `optikos/bind` adds signals on top and calls those setters for you:

```ts
import { create, type Button } from 'optikos';
import { signal, bind } from 'optikos/bind';

const clicks = signal(0);
const button = create<Button>({ type: 'button', text: 'Click me', renderTo: document.body, handler: () => clicks.update((n) => n + 1) });
bind(button, { text: () => `Clicked ${clicks()} times` });
```

## Imports

| Import | What you get |
|---|---|
| `optikos` | everything: core, data, themes, motion, `ui`, and every component registered |
| `optikos/core` | `Component`, `Container`, `Field`, `create`, `register`, layouts, validators, i18n (no components) |
| `optikos/components/<name>` | one component, which registers its `type` (e.g. `optikos/components/grid`) |
| `optikos/data` | `Store`, `Model`, proxies, formatters |
| `optikos/bind` | `signal`, `computed`, `effect`, `bind`, `fromStore` |
| `optikos/motion` | animation helpers and the global motion settings |
| `optikos/ui` | the `ui.*` shortcuts and enums (`Variant`, `Direction`, `Op`...) |
| `optikos/optikos.css` | all styles: tokens, layouts and every component |
| `optikos/css/<name>.css` | one stylesheet (`base.css` holds the tokens; `core.css`, `field.css` and `layout.css` are shared) |
| `optikos/themes/<theme>.css` | a ready-made theme |

Components register themselves when their module is imported, so the package is marked as having side effects.
Importing from `optikos` therefore includes every component. To ship less, import the core and only the components you use:

```ts
import { create } from 'optikos/core';
import 'optikos/components/button';
import 'optikos/components/textfield';

create({ type: 'textfield', label: 'Search', renderTo: document.body });
```

## Components

| Category | Components (`type`) |
|---|---|
| Base | `button`, `icon`, `label` |
| Layout | `container`, `panel`, `viewport`, `fieldset`, `toolbar`, `spacer`, plus the layouts `fit`, `hbox`, `vbox`, `border`, `grid`, `card` |
| Fields | `textfield`, `textarea`, `numberfield`, `secretfield`, `checkbox`, `radiogroup`, `select`, `combobox`, `suggestfield`, `lookupfield`, `datefield`, `daterangefield`, `slider`, `listbox` |
| Forms | `form` (validation, `load`/`getValues`, tabs), `stepform` (multi-step wizard) |
| Data | `grid` (virtualized, sorting, selection, paging, column menu, bulk actions), `table`, `dataview`, `pagination`, `filterbuilder`, `searchgrid`, `viewmanager` (saved views) |
| Dates | `calendar` (single date or range) |
| Overlays | `window`, `MessageBox` (alert/confirm/prompt), `toast()`, `menu`, `dropdown`, `tooltip`, `widget`, `commandpalette` |
| Navigation | `tabs`, `breadcrumb`, `navmenu`, `stepper` |
| Feedback | `spinner`, plus `loading: true` on any component |
| Chat | `chat` (messages, typing indicator, streaming replies, suggestions) |

## Themes and tokens

All styles are in `@layer optikos`, so any CSS you write outside a layer wins without `!important`.
A theme is a value of `data-op-theme`, on `<html>` or on any element to scope it. Themes can be combined: `data-op-theme="dark compact"`.

Ready-made themes: `light` (default, included in `optikos.css`), `dark`, `compact` (density), `corporate`, `soft`,
`brutal`, `terminal`, `editorial` and `brand`. Each one is a file in `optikos/themes/<theme>.css`.

Write a theme in CSS:

```css
@layer optikos {
  [data-op-theme~='ocean'] { --op-color-primary: #0e7490; --op-radius: 0.125rem; }
}
```

or in TypeScript, with typed keys:

```ts
import { defineTheme, setTheme } from 'optikos';

const brand = defineTheme({
  color: { primary: '#7c3aed', primarySoft: '#f5f3ff' },
  button: { radius: '62.5rem' },
}, 'brand');

brand.inject();         // installs the CSS without activating it
setTheme('dark brand'); // sets data-op-theme on <html> (or on any element: setTheme(names, el))
```

Components also accept per-instance tokens: `{ type: 'button', theme: { radius: '0' } }`.

## Browser support

Current evergreen browsers. The JavaScript targets ES2022, and the CSS uses cascade layers, `:has()`, `color-mix()`,
`inert` and `dvh` units, which works in Chrome/Edge 111+, Firefox 121+ and Safari 16.2+. No polyfills are included.

## Documentation and demos

- [Docs site](https://denis-zickuhr.github.io/optikos/): every component with live, editable examples, its spec sheet,
  the guides and the design tokens.
- [Docs sources (Portuguese)](https://github.com/Denis-Zickuhr/optikos/tree/main/docs): one spec sheet per component in
  [`docs/components`](https://github.com/Denis-Zickuhr/optikos/tree/main/docs/components), plus guides on
  [theming](https://github.com/Denis-Zickuhr/optikos/blob/main/docs/theming.md),
  [motion](https://github.com/Denis-Zickuhr/optikos/blob/main/docs/motion.md),
  [`ui` shortcuts](https://github.com/Denis-Zickuhr/optikos/blob/main/docs/ui.md) and
  [architecture](https://github.com/Denis-Zickuhr/optikos/blob/main/docs/architecture.md).
- [Demos](https://github.com/Denis-Zickuhr/optikos/tree/main/demos): CRM, admin dashboard, ERP, chat, photo gallery,
  shop, event landing page, workbench, motion lab and customization. Run them with `npm run dev`.

## Contributing / Development

```sh
npm install
npm run dev               # dev server: index of sandboxes and demos at /dev/
npm run sandbox -- fields # one sandbox category
npm run demo -- crm       # one demo
npm run site              # living docs, with live reload
npm run check             # generate index, typecheck, tests, build with size budgets
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the project rules in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE) © Denis Zickuhr. The built-in icons come from Lucide and Feather; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
