# Chart  (type: 'chart')
Purpose:       Bar, line, area, pie, donut and sparkline charts in SVG, fed by data or by a `Store` (the same one as a grid), colored by the theme.
Anatomy:       `op-chart` > `op-chart__plot` (`op-chart__svg` + `op-chart__tip`) + `op-chart__legend` (buttons `op-chart__key`) + a visually hidden `<table>` with the same data for screen readers. Marks: `op-chart__bar`, `__line`, `__area`, `__dot`, `__slice`; one transparent `op-chart__hit` band per category takes the pointer.
Config:        `kind: 'bar'|'line'|'area'|'pie'|'donut'|'sparkline'` (bar), `x` (field with the category or slice name), `series: (field | { field, label?, color? })[]` (a pie and a donut draw the first), `data` or `store` (any change of the store repaints once, even for a burst of live patches), `stacked` (bar and area), `legend` (default: more than one series, or a pie), `format` (a registered format such as `money` or a function; default `number`), `title` (accessible name and table caption), `height` (240; sparkline 36).
API:           `setData(rows)`, `setStore(store)`, `setKind(kind)`, `setSeries(series)`.
Events:        `point(record, index)` when the tooltip lands on a category or a slice.
States:        Empty (shows the `empty` text), a series hidden through its legend key (`aria-pressed`, `is-off`).
Keyboard/ARIA: The chart is one tab stop (`role=img`, named by `title`): ←/→ (↑/↓) walk the categories or slices and show the tooltip, Home/End jump, Esc hides it. The legend keys are buttons. The data is also in a table for assistive technology.
Tokens:        `--op-chart-1`…`--op-chart-8` (the series colors, in the theme: they follow dark mode and white-label), `--op-chart-line-width`, `--op-chart-font-size`, `--op-chart-area-opacity`, `--op-chart-grid`, `--op-chart-fg`, `--op-chart-tip-width`.
Sandbox cases: `data`: every kind, stacked, a store with live patches, dark theme.
Out of scope:  Zoom and brush, horizontal bars, dual axes, annotations, export as an image (use the browser), 3D.
