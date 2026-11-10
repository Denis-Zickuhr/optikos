# InputGroup  (type: 'inputgroup')
Purpose:       Joins text or buttons to a field's input box: a currency (`R$`), a unit (`kg`), a domain (`https://` … `.com`), a "Copy" or "Search" button. The field keeps its own label, help, error, name and value.
Anatomy:       `.op-inputgroup` (no box of its own) > the field, whose control becomes `.op-inputgroup__row` > `.op-inputgroup__affix` (text, a `span`) or `.op-inputgroup__btn` (a `button`) + the field's input box + the same on the other side. The inner corners square off so the row reads as one control.
Config:        (Container) + `prefix`, `suffix`: a text, or a button `{ icon, text, ariaLabel, handler(field) }`. `items`: one field (any: TextField, NumberField, Select, DateField...).
API:           `setPrefix(affix)`, `setSuffix(affix)`, `getField()`.
Events:        — (the field's own events; a button calls its `handler`).
States:        `has-prefix`, `has-suffix` (on the field).
Keyboard/ARIA: Text affixes describe the input (they are added to its `aria-describedby`, so "R$" is read with the price). Affix buttons are real buttons in the Tab order, named by `ariaLabel` or their text.
Tokens:        `--op-inputgroup-affix-bg`, `--op-inputgroup-affix-fg`.
Sandbox cases: a price with `R$`, a website with `https://` and `.com`, a read-only token with a Copy button, a search with a "Go" button, a Select with a unit.
Out of scope:  several prefixes, dropdown buttons (put a Menu in the handler), masks.
