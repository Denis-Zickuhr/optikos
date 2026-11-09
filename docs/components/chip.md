# Chip  (type: 'chip')
Purpose:       A compact token: a filter the user toggles, a tag they remove, a suggestion they click.
Anatomy:       `span.op-chip` (`is-selected`, `is-disabled`) > `button.op-chip__main` (icon + `.op-chip__text`) and, when `removable`, `button.op-chip__remove` (×).
Config:        `text`, `icon`, `selectable: false` (click toggles it), `selected: false`, `removable: false`, `disabled`, `handler(chip)`.
API:           `setText`, `setSelected(on, notify?)`, `isSelected()`, `setDisabled`, `focus()` (the main button).
Events:        `click(chip)`, `change(selected)` (selectable), `remove(chip)` (the × or Delete/Backspace; the app removes the chip).
States:        `is-selected`, `is-disabled`.
Keyboard/ARIA: real buttons: Tab, Enter/Space. A selectable chip is a toggle button (`aria-pressed`). The × is a separate button named "Remove <text>" (localized); Delete or Backspace on the chip also removes it.
Tokens:        `--op-chip-fg/bg/border/radius/height`, `--op-chip-hover-border`, `--op-chip-selected-fg/bg/border`.
Sandbox cases: `base`: filter chips (selectable), removable tags, with icons, disabled.
Out of scope:  a chip input that turns typed text into chips (TagField, P1), drag to reorder, avatars.
