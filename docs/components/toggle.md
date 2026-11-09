# Toggle  (type: 'toggle')
Purpose:       An on/off switch for a setting that takes effect right away (notifications, dark mode). A Checkbox with a switch's look and role.
Anatomy:       Like Checkbox: Field > `label.op-checkbox__label` > `input[type=checkbox][role=switch]` + `.op-checkbox__box` (the track; its `::after` is the knob) + `.op-checkbox__text` (`boxLabel`); root `op-toggle`.
Config:        (Field) + `boxLabel`, `value: false`. Same as Checkbox, without `indeterminate` (a switch has no third state).
API:           (Field) + `setBoxLabel`, `toggle()`. Shortcut: `ui.toggle(name, boxLabel?, cfg?)`.
Events:        `change(boolean)`.
States:        `is-checked` (on), `is-disabled`, `is-readonly`.
Keyboard/ARIA: native checkbox input with `role="switch"` and `aria-checked`: Space toggles; the label toggles on click. Its CSS builds on the Checkbox CSS (`optikos/css/checkbox.css` + `toggle.css`).
Tokens:        `--op-toggle-width`, `--op-toggle-height`, `--op-toggle-knob-inset`, `--op-toggle-track-bg`, `--op-toggle-on-bg`, `--op-toggle-knob-bg`.
Sandbox cases: `fields`: on, off, disabled, read-only, inside a form.
Out of scope:  text inside the track ("on/off"), a loading state while saving (use `loading` on the form or the field).
