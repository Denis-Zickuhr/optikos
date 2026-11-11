# MaskField  (type: 'maskfield')
Purpose:       A text field that formats what is typed into a pattern (phone, tax id, postal code, plate, IBAN). The core knows no country: the patterns belong to the app.
Anatomy:       Like `TextField` (`op-textfield`) + `op-maskfield`; the placeholder is the pattern (`___.___.___-__`).
Value:         The formatted text (`'123.456.789-00'`), or with `raw: true` only what went into the slots (`'12345678900'`). `setValue` accepts either form and normalizes it.
Config:        (TextField) + `mask: string | string[]`: `0` a digit, `A` a letter, `*` any character, `\` makes the next character a literal. A list picks the pattern by length: `['000.000.000-00', '00.000.000/0000-00']` is a CPF until the 12th digit, then a CNPJ. `raw`. An incomplete value is an error (`Complete the format ___.___`). A check digit or any other rule goes in `validators`. `stored: string`: a value the app holds but only shows masked (`'***.***.***-12'`) is displayed read-only; `getValue()` is `null` while untouched (keep what is saved) and counts as filled in for `required`; typing, Enter or Space replaces it, Esc on the empty replacement gives it back (`is-stored`).
API:           (TextField) + `setMask(mask)`. `isStored()`, `replaceStored()`, `keepStored()`.
Events:        `change(value)`, `enter`.
States:        The Field states.
Keyboard/ARIA: Typing, pasting and deleting reformat while the caret stays after the same typed character; `inputmode=numeric` when every slot is a digit.
Tokens:        Those of `TextField`.
Sandbox cases: `fields`: a tax id with two patterns, `raw`, a plate, a validator with a check digit.
Out of scope:  Number, currency and percent (`NumberField` with `format`), per-country preset files in the core, input masks that show placeholder characters inside the text.
