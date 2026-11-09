# RadioGroup  (type: 'radiogroup')
Purpose:       One choice among a few visible options. A "radio" is an option of the group (there is no standalone radio component).
Anatomy:       Field > `div.op-radiogroup[role=radiogroup]` > `label.op-radio` > `input[type=radio]` + `.op-radio__dot` + `.op-radio__text`.
Config:        (Field) + `options: (string|{value,label,disabled?})[]`, `direction: 'vertical'|'horizontal'` (vertical).
API:           (Field) + `setOptions`.
Events:        `change(value)`.
Keyboard/ARIA: Native inputs sharing a `name` (arrows move and select, Tab enters/leaves the group); the group is labelled by the field label (`aria-labelledby`).
Tokens:        `--op-radio-size/border/checked-bg/gap`.
Sandbox cases: vertical, horizontal, a disabled option, required and invalid, initial value.
Out of scope:  options with free HTML.
