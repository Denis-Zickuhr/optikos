# Checkbox  (type: 'checkbox')
Purpose:       A boolean field (with an indeterminate state).
Anatomy:       Field > `label.op-checkbox` > `input[type=checkbox]` + `.op-checkbox__box` + `.op-checkbox__text` (`boxLabel`).
Config:        (Field) + `boxLabel`, `value: false`, `indeterminate: false`.
API:           (Field) + `setBoxLabel`, `setIndeterminate`, `toggle()`.
Events:        `change(boolean)`.
States:        `is-checked`, `is-indeterminate` (`aria-checked=mixed`).
Keyboard/ARIA: native `<input type=checkbox>` (Space toggles). `required` = it must be checked.
Tokens:        `--op-checkbox-size/radius/border/checked-bg/checked-fg`.
Sandbox cases: plain, with a field label, indeterminate, disabled, required and invalid.
Out of scope:  CheckboxGroup and Toggle (P1).
