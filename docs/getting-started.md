# Getting started

## Install

```sh
npm i optikos
```

Optikos has no runtime dependencies and works with any bundler (Vite, esbuild, webpack...) or straight from a CDN that serves ES modules.

## Your first screen

```ts
import { create, toast, type Form } from 'optikos';
import 'optikos/optikos.css';

const form = create<Form>({
  type: 'form',
  items: [
    { type: 'textfield', name: 'name', label: 'Name', required: true },
    { type: 'textfield', name: 'email', label: 'Email', inputType: 'email' },
    { type: 'select', name: 'plan', label: 'Plan', options: ['Free', 'Pro'] },
  ],
});

create({
  type: 'panel', title: 'New customer', renderTo: document.body, items: [form],
  buttons: [{ text: 'Save', variant: 'primary', handler: () => form.isValid() && toast(`Saved ${form.getValues().name}`) }],
});
```

`create()` builds a tree of components from a config. Each `type` is a registered component class, so the same screen
can be written with classes (`new TextField({...})`) or with the short `ui` helpers (`ui.text('name', 'Name')`).

## Pick a look

```ts
import 'optikos/themes/dark.css';
document.documentElement.setAttribute('data-op-theme', 'dark');
```

Ready-made themes: `light` (default), `dark` and `compact` (density).
Themes combine (`"dark compact"`) and can be scoped to any element. Your own theme takes a few lines with `defineTheme`
(see the **Theming** guide).

## Import only what you use

`import ... from 'optikos'` registers every component. For a smaller bundle, import the core and the components you need:

```ts
import { create } from 'optikos/core';
import 'optikos/components/button';
import 'optikos/components/grid';
```

## Where to next

- **Components**: every component with live examples and its spec sheet (config, API, events, keyboard, tokens).
- **Recipes**: complete small screens to copy (sign-up, orders list, settings, checkout...).
- **Demos**: whole apps built with the public API only.
- Guides: **Theming**, **Short writing (ui and enums)**, **Motion**, **Performance**.
