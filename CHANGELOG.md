# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/). Until 1.0, minor versions may contain breaking changes.

## [Unreleased]

## [0.3.0] - 2026-11-10

### Added

- NavMenu in rail mode (`collapsed`): a group shows its icon (or initial) and opens a floating Menu beside it with its
  title and children (badges included), by click, hover, → or Enter; the icon lights up when the active page is inside.
  `MenuItem.badge`.
- StepForm: a step check per step, `validate(values, form, signal)`, that may ask the server. It runs when leaving the
  step forward and on Finish, with Next/Finish loading; it returns `true`, a message for the step (an alert line above
  it) or `{ field: message }`. A second click does nothing and going back aborts it.

### Changed

- StepForm: `goTo`, `next` and `back` return `Promise<boolean>` (they wait for the step checks on the way; without any,
  the step still changes at once).

## [0.2.0] - 2026-11-10

### Added

- Form utils: `showIf`/`enableIf` on any item of a form (a field hidden by its rule does not validate and is left out
  of `getValues`), `Form.focusField(field)`, the form-level `dirty-change` event, and two components: `FormErrors`
  (`type: 'formerrors'`, an error summary whose links reveal and focus each field) and `FormActions`
  (`type: 'formactions'`, Cancel / Save with an "Unsaved changes" status, `requireChanges`, `sticky`).

- `FieldList` component (`type: 'fieldlist'`): a repeating block of fields (add, remove, reorder rows, by mouse or
  keyboard); it is one form field whose value is an array of row objects, with `min`/`max`, and validating the form
  validates every row.

- Compound fields: `FieldGroup` (`type: 'fieldgroup'`): several inputs under one label, one help line and one error
  line (`role=group`); and `InputGroup` (`type: 'inputgroup'`): text (`R$`, `.com`) or buttons joined to any field's box,
  the text read as part of the input's description.

- Form layouts: `columns` on Form, FieldSet and FormSection (a responsive grid), `colspan: 'full'`, `labelWidth` (left
  labels in a column), FieldSet `variant` (`box`, `line`, `plain`) and `description`, and the `FormSection` component
  (`type: 'formsection'`): title and description beside the fields, stacked when the section is narrow.

- Reload buttons: `reloadable` on Panel (so Window and Widget too) and on Tabs adds a ↻ that calls `onReload(panel)`; a
  returned Promise shows the loading mask until it settles. `Panel.reload()`, `Tabs.reloadTab()`, `before-reload`/`reload`
  events; R reloads a focused reloadable tab. New `refresh` icon.

- Widget: `resizable` (the inner edge while docked, a corner grip once moved; a focusable splitter with arrow keys) and
  the `resize({ width, height })` event.

- `CodeViewer` component (`type: 'codeviewer'`): read-only code with syntax colors (ts/js, json, css, html, sh), line
  numbers that a selection never copies, marked lines, `startLine`, wrap or scroll, and a copy button. The docs site
  uses it for every code block, which also fixes the code fences of the guides (they were styled as inline code).

- Menu: `group` on items (named `role=group` sections, ungrouped first) and `search: true` (a search field that filters
  the items; a search that matches a group name shows the whole group). FilterBuilder fields take a `group` too, like
  `Column.group`: the `pick` menu is grouped and searchable past 6 fields, and the field select uses `<optgroup>`s.

- `Dial` component (`type: 'dial'`, `ui.dial`): picks one value from a range (an age, a year) or a list (the months) on
  a flat ruler that slides under a fixed needle, with a large readout whose digits roll like an odometer. Snap points
  (decades by default) get the labels, Page Up/Down jump between them, and a flick glides on to the nearest one ahead.
  `shape: 'circle'` turns it into a clock face.

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

- No automatic focus on fields: on a phone it pops up the keyboard over the page. Window, Widget, `MessageBox.prompt`
  and StepForm (on a new step) now focus the dialog, widget or step panel itself; `autoFocus: true` focuses the first
  field as before. A Menu with `search` and the Grid's column menu open on their first item (typing a letter goes to
  the search field), and LookupField's search window opens on the dialog. Focus that answers an explicit action stays:
  adding a row, editing a cell, a failed validation jumping to the field.
- MessageBox (`alert`, `confirm`, `prompt`) no longer dims the page: it is still modal, over a clear backdrop. Pass
  `mask: true` to dim it. Window has the same `mask` option (default `true`) and `setMask`.
- **Themes (breaking):** the package now ships only `light` (default), `dark` and `compact`. The default look is the
  former `corporate` theme (steel blue on cool gray, small radii, hairline borders, a navy sidebar, 2.375rem controls,
  2.75rem rows, 15px text) and `dark` is its night version. `optikos/themes/{corporate,brutal,soft,terminal,editorial,brand}.css`
  were removed, and `ThemeName` keeps only `Light` and `Dark`. Grid headers and panel title bars now use the strong
  border, the selected Grid row shows a primary bar (`--op-grid-selected-bar`, `--op-grid-selected-bar-width`), the
  primary button has a subtle inner shadow (`--op-button-primary-shadow`) and the tab bar sits on `surface-2`; new
  tokens `--op-grid-header-border` and `--op-panel-header-border`.
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

- Floating elements (menus, dropdowns) taller than the room on both sides of their anchor are capped to the larger side
  and scroll, instead of running off the window (long menus in big themes).

- Tabs: each panel has `tabindex="0"` (WAI-ARIA tabs pattern), so a panel with nothing focusable inside, or one that
  scrolls, can be reached with the keyboard.

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

[Unreleased]: https://github.com/Denis-Zickuhr/optikos/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Denis-Zickuhr/optikos/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Denis-Zickuhr/optikos/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Denis-Zickuhr/optikos/releases/tag/v0.1.0
