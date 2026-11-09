# FieldSet  (type: 'fieldset')
Purpose:       Groups fields under a legend, optionally collapsible.
Anatomy:       `<fieldset class="op-fieldset">` > `<legend>` (`__legend`, with a button when collapsible) + `.op-fieldset__body` (items).
Config:        (Container) + `title`, `collapsible: false`, `collapsed: false`. Default layout `vbox`.
API:           `setTitle`, `collapse`, `expand`, `toggle`, `setDisabled` (cascades to the fields).
Events:        `collapse`, `expand`.
Keyboard/ARIA: native `<fieldset>`/`<legend>`; the legend button has `aria-expanded`.
Tokens:        `--op-fieldset-border/radius/padding/legend-fg`.
Sandbox cases: plain, collapsible, disabled, with a 2-column grid layout.
Out of scope:  —
