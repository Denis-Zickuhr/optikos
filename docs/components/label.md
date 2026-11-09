# Label  (type: 'label')
Purpose:       Static text (section titles, captions, text in a toolbar).
Anatomy:       `<span class="op-label">`.
Config:        `text`, `for` (a field id; becomes `<label for>`), `variant: 'default'|'muted'|'title'` (default).
API:           `setText`, `setVariant`.
Events:        —
Tokens:        `--op-label-fg`, `--op-label-muted-fg`, `--op-label-title-size/weight`.
Sandbox cases: variants, tied to a field.
Out of scope:  inner HTML (it uses `textContent`; whoever needs HTML writes a custom Component).
