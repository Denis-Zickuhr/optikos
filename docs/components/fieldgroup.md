# FieldGroup  (type: 'fieldgroup')
Purpose:       Several inputs read as one field: one label, one help line and one error line over a row of fields (a phone = country code + number, a date of birth = day + month + year, an address line = street + number). Each input keeps its own name and value.
Anatomy:       `.op-field.op-fieldgroup[role=group]` > `.op-field__label` (names the group) + `.op-field__control` > `.op-fieldgroup__body` (the fields, in a row) + `.op-field__help` + `.op-field__error`. Inside, each field's own label is visually hidden (still its accessible name) and its own help and error lines are not shown.
Config:        (Container) + `label`, `help`, `required` (the `*` marker; also shown when any field inside is required), `labelPos: 'top' | 'left'` (default: the form's), `stackBelow` (px: under that width the row becomes a column). Default layout `hbox`; each field grows equally unless it sets `flex` or `width`.
API:           `setLabel(text)`, `setHelp(text)`, `getFields()`, `getError()` (the first error inside), + Container.
Events:        `invalid(message)` and `valid` when the group's error line changes.
States:        `is-invalid`, `is-required`, `op-field--label-left`.
Keyboard/ARIA: `role=group` named by its label and described by its help and error; Tab moves through the inputs; a click on the label focuses the first one. Each input is still named by its own (hidden) label, so a screen reader says "Phone, group — Country code".
Tokens:        `--op-fieldgroup-gap`.
Sandbox cases: phone (select + text), date of birth (three numbers), address line, required and with an error, label on the left in a form with `labelWidth`, stacked on narrow screens.
Out of scope:  a single value for the whole group (each input keeps its name: use `name: 'phone.number'` to nest), masks.
