# Select  (type: 'select')
Purpose:       Picks one option from a closed list, without typing free text.
Anatomy:       Like ComboBox, but the `input[role=combobox]` is `readonly` and shows the label; a click anywhere opens it.
Config:        (ComboBox without filtering) `options`/`store`, `valueField`, `displayField`, `placeholder`, `clearable: false`.
API/Events:    As in ComboBox. Typing letters jumps to the option that starts with them (typeahead, 600 ms buffer).
States:        `is-open`, `has-value`, invalid/readonly/disabled (Field).
Keyboard/ARIA: `role=combobox` + `aria-haspopup=listbox`; ↑↓ open/move, Enter/Space pick, Esc closes, letters do typeahead.
Tokens:        those of ComboBox.
Sandbox cases: strings, {value,label}, disabled, a disabled option, clearable, preselected, typeahead.
Out of scope:  multiple selection (TagField), the native mobile `<select>`.
