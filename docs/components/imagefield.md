# ImageField  (type: 'imagefield')
Purpose:       Picks one or more images to upload: click or drop, with a preview, instead of a bare file input. The component only holds the files; sending them is up to the app.
Anatomy:       `.op-imagefield` (Field) > `.op-imagefield__zone` (a `button`: icon + hint, the drop target) and `.op-imagefield__list` > `__item` (`__img`, `__name`, `__remove` button). A hidden `input[type=file]` opens the browser's picker.
Config:        (Field) + `accept: 'image/*'` (the `accept` of the input; also checked on dropped files), `maxSize` (bytes; no limit by default), `multiple: false`, `maxFiles` (with `multiple`; no limit by default), `placeholder` (the hint in the zone).
               The value is `File | string | null` (a string is the URL of an image already saved); with `multiple`, an array of them.
API:           (Field) `getValue/setValue/clear`, `add(files)` (the same checks as a drop), `remove(index)`, `open()` (opens the picker). Object URLs used by the previews are revoked when an image goes away and on `destroy`.
Events:        `change(value)` (Field), `reject(file, reason)` with `reason` `'type' | 'size' | 'count'`: the file is skipped and the field shows the matching message as its error.
States:        `is-dragover` (a file over the zone), `is-disabled`, `is-readonly` (previews only, no zone), `is-invalid`. Without `multiple`, a new image replaces the old one.
Keyboard/ARIA: the zone is a real `button` (Enter/Space opens the picker); each remove button is named `Remove <file name>`. The previews are decorative (`alt=""`): the file name is written beside each; the list is `role=list`.
Tokens:        `--op-imagefield-zone-bg`, `--op-imagefield-zone-border`, `--op-imagefield-zone-hover-bg`, `--op-imagefield-thumb-size`, `--op-imagefield-radius`.
Sandbox cases: single, multiple with a limit, size limit, an image already saved (URL), disabled/read-only, inside a Form (required, `getValues`).
Out of scope:  uploading (progress, retries), cropping or resizing, camera capture, reordering.
