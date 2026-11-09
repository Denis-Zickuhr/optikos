# Checkbox  (type: 'checkbox')
Propósito:     Campo booleano (e estado indeterminado).
Anatomia:      Field > `label.op-checkbox` > `input[type=checkbox]` + `.op-checkbox__box` + `.op-checkbox__text` (`boxLabel`).
Config:        (Field) + `boxLabel`, `value: false`, `indeterminate: false`.
API:           (Field) + `setBoxLabel`, `setIndeterminate`, `toggle()`.
Eventos:       `change(boolean)`.
Estados:       `is-checked`, `is-indeterminate` (`aria-checked=mixed`).
Teclado/ARIA:  `<input type=checkbox>` nativo (Space alterna). `required` = precisa estar marcado.
Tokens:        `--op-checkbox-size/radius/border/checked-bg/checked-fg`.
Casos sandbox: simples, com label de campo, indeterminate, disabled, required inválido.
Fora do escopo: CheckboxGroup e Toggle (P1).
