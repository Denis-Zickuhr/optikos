# Image  (type: 'image')
Purpose:       A picture in a box that keeps its aspect ratio while loading and shows a fallback when the file is missing (logos, photos in cards and tables).
Anatomy:       `op-image` (`--cover|--contain`, `--rounded`, `has-image`) > `op-image__fallback` (an icon) + `op-image__img` (lazy, async decoding).
Config:        `src`, `alt` (empty = decorative), `ratio` (`'16/9'`, `'1'`: the box holds it, so the page does not jump), `fit: 'cover'|'contain'` (cover), `fallback` (an icon name, or a second URL tried once; default the `image` icon), `eager` (default is lazy), `rounded`.
API:           `setSrc`, `setAlt`, `setRatio`.
Events:        `error` when the file (and the fallback URL) failed.
States:        Loading / loaded (`has-image`) / failed (the fallback shows).
Keyboard/ARIA: A real `<img>` with `alt`.
Tokens:        `--op-image-bg`, `--op-image-radius`, `--op-image-icon-size`.
Sandbox cases: `base`: ratios, fit, a missing file with an icon and with a second URL.
Out of scope:  Zoom and pan (`imagecanvas`), responsive `srcset`, cropping.
