# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/). Until 1.0, minor versions may contain breaking changes.

## [Unreleased]

### Added

- `addMessages(lang, messages)` (from `optikos` and `optikos/core`): adds translation keys to a locale without overwriting
  keys the app already set.

- `Grid<T>`: the record type flows from a typed `Store<T>` to `getSelection()`, `getStore()`, bulk and row actions and
  column renderers; `Column.field` autocompletes the record's keys. `new Grid({ store })` infers it. Untyped grids keep
  working as before (the default is `any`).

- Documentation in English with a Portuguese translation (`docs/pt-BR/`); the docs site has a language picker
  (English/Português) that also switches the components' own messages, and the MCP server takes a `lang` argument.

- `defineTheme`: a plain value sets the group's own token (`radius: '0.75rem'` → `--op-radius`).
- Docs site redesigned as a showcase: a landing page with a live form and measured sizes, recipes (complete small
  screens whose shown code is the code that runs), a gallery of the demos (published with the site) and tabbed
  component pages.

- Grid plugins (`plugins: [...]`) and the first one, `cellEditing()`: double click or F2 to edit a cell, Enter to save,
  Tab to the next editable cell; editors come from `Column.editor`. New Grid helpers for plugins: `cellAt`, `getCell`,
  `getColumns`, `getActive`.

- `Tree` component: expand/collapse, single or multiple selection, tri-state cascading checkboxes, children loaded on
  demand, filter, and the WAI-ARIA tree keyboard.

- `Toggle` (an on/off switch, `role="switch"`) and the `ui.toggle()` shortcut.

- `CheckboxGroup` (several choices; the value is the list of checked values) and `ui.checkGroup()`.

- `Badge` (status label or count in six tones) and `Chip` (selectable filter or removable tag).

### Changed

- Grid: `role="grid"` (with focus, `aria-activedescendant`, row and column counts) moved from the root element to an inner
  `.op-grid__table`, because the root also holds the bulk bar and the pager. Code that read those attributes from
  `grid.el` should query `grid.el.querySelector('[role=grid]')`; `grid.focus()` keeps working.
- Accessibility fixes found by automated axe checks in every theme: Button keeps its name while loading (and is
  `aria-disabled`), Stepper steps keep their names on phones, DateField/DateRangeField follow the date picker combobox
  pattern, an unnamed Dropdown dialog is named by its anchor, and contrast fixes in the light (`fg-muted`), `dark`
  (primary), `soft`, `brutal`, `brand` and `brand night` themes and in Chat bubbles.
- Each component now ships its own `en`/`pt-BR` messages, so the core is 2.2 kB (gzip) smaller and every standalone component about 0.5 kB smaller.
  Custom locales passed to `setLocale({...})` keep working; missing keys still fall back to English.

### Fixed

- `ariaLabel` on a field without a visible label now names its input (it used to land on the wrapper).
- Grid: the row-actions column header has a (visually hidden) name.

- `ui.grid(2, ...)` keeps the column count numeric, so the grid collapses to one column on narrow containers like
  `layout: { type: 'grid', columns: 2 }` does.
- `ui.*` containers accept declarative configs among their items (`ui.form([{ type: 'fieldset', ... }, ui.text(...)])`)
  without a type error.

- Store: sorting text is 13× faster (100k records: 5.4 s → 0.41 s). The comparison reuses one `Intl.Collator` instead of
  building one per `localeCompare` call; the order is unchanged.

## [0.1.0] - 2026-11-08

First public release.

### Added

- Core: `Component`, `Container`, `Field`, the `create`/`register` registry, layouts (`fit`, `hbox`, `vbox`, `border`,
  `grid`, `card`, responsive below a container width), validators, i18n (`en`, `pt-BR`), focus and positioning utilities,
  list virtualization.
- Data: `Store` with local or remote sorting, filter trees (AND/OR) and paging; `Model`; memory, function and REST proxies; formatters.
- Components: button, icon, label; container, panel, viewport, fieldset, toolbar, spacer; textfield, textarea,
  numberfield, secretfield, checkbox, radiogroup, select, combobox, suggestfield, lookupfield, datefield, daterangefield,
  slider, listbox; form (with tabs) and stepform; grid, table, dataview, pagination, filterbuilder, searchgrid,
  viewmanager; calendar; window, MessageBox, toast, menu, dropdown, tooltip, widget, commandpalette; tabs, breadcrumb,
  navmenu, stepper; spinner and loading masks; chat.
- `optikos/bind`: `signal`, `computed`, `effect`, `bind`, `fromStore`.
- `optikos/motion`: animation helpers on the Web Animations API with one global setting and a kill switch.
- `optikos/ui`: `ui.*` shortcuts and enums.
- Themes: design tokens in `@layer optikos`, `defineTheme()`/`setTheme()`, and the ready-made themes `dark`, `compact`,
  `corporate`, `soft`, `brutal`, `terminal`, `editorial` and `brand`.
- Per-component entry points (`optikos/components/<name>`) and stylesheets (`optikos/css/<name>.css`).

[0.1.0]: https://github.com/Denis-Zickuhr/optikos/releases/tag/v0.1.0
