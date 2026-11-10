# FieldSet  (type: 'fieldset')
Purpose:       Groups fields under a legend, optionally collapsible.
Anatomy:       `<fieldset class="op-fieldset">` > `<legend>` (`__legend`, with a button when collapsible) + `.op-fieldset__body` (items).
Config:        (Container) + `title`, `description` (a line under the legend; it describes the group), `variant: 'box'` (`'box'` framed, `'line'` a rule under the legend, `'plain'` just the legend), `columns` (a responsive grid; items take `colspan`, a number or `'full'`), `collapsible: false`, `collapsed: false`. Default layout `vbox`.
API:           `setTitle`, `setDescription`, `setVariant`, `collapse`, `expand`, `toggle`, `setDisabled` (cascades to the fields).
Events:        `collapse`, `expand`.
Keyboard/ARIA: native `<fieldset>`/`<legend>`; the legend button has `aria-expanded`.
Tokens:        `--op-fieldset-border/radius/padding/legend-fg`.
Sandbox cases: plain, collapsible, disabled, with a 2-column grid layout, the three variants with a description.
Out of scope:  —
