# CheckboxGroup  (type: 'checkboxgroup')
Purpose:       Several choices among a few visible options (notification channels, days of the week). The value is the list of checked values.
Anatomy:       Field > `div.op-checkboxgroup__options[role=group]` > one `label.op-checkbox` per option (`input[type=checkbox]` + `.op-checkbox__box` + `.op-checkbox__text`); each option reuses the Checkbox look.
Config:        (Field) + `options: (string|{value,label,disabled?})[]`, `direction: 'vertical'|'horizontal'` (vertical), `value: (string|number)[]` (default `[]`).
API:           (Field) + `setOptions(options)`, `getDisplayText()` (the checked labels, comma-separated). Shortcut: `ui.checkGroup(name, label, options, cfg?)`.
Events:        `change(values, old)` — the values in option order, not in click order.
States:        an option label gets `is-checked`; `required` means at least one checked.
Keyboard/ARIA: native checkboxes (Tab moves between them, Space toggles); the group is `role=group`, labelled by the field label (`aria-labelledby`). Its CSS builds on the Checkbox CSS (`checkbox.css` + `checkboxgroup.css`).
Tokens:        `--op-checkboxgroup-gap`, plus the Checkbox tokens.
Sandbox cases: `fields`: vertical, horizontal, a disabled option, required and invalid, inside a form.
Out of scope:  "select all" / limits on how many (min/max: write a validator), options with free HTML.
