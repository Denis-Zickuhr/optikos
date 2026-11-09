# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/). Until 1.0, minor versions may contain breaking changes.

## [Unreleased]

### Added

- `addMessages(lang, messages)` (from `optikos` and `optikos/core`): adds translation keys to a locale without overwriting
  keys the app already set.

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
