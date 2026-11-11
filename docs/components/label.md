# Label  (type: 'label')
Purpose:       Static text (section titles, captions, text in a toolbar).
Anatomy:       `<span class="op-label">`.
Config:        `text`, `for` (a field id; becomes `<label for>`), `variant: 'default'|'muted'|'title'` (default). `tag: 'span'|'div'|'p'|'h1'…'h6'` (span; `label` with `for`) makes it a heading or a paragraph; `icon`, or `src` + `alt` (an image, e.g. a logo, sized by `--op-label-image-size`), before the text.
API:           `setText`, `setVariant`. `setIcon`, `setImage(src, alt?)`.
Events:        —
Tokens:        `--op-label-fg`, `--op-label-muted-fg`, `--op-label-title-size/weight`. `--op-label-image-size`.
Sandbox cases: variants, tied to a field.
Out of scope:  inner HTML (it uses `textContent`; whoever needs HTML writes a custom Component).
