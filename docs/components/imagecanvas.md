# ImageCanvas  (type: 'imagecanvas')
Purpose:       Shows an image that fills its box, with zoom and pan to look at details: a product photo, a scan, a map.
Anatomy:       `.op-imagecanvas` > `__stage` (clips; focusable) > `__img`; `__tools` (zoom out, zoom in, reset) and `__status` (the load error text). It is a plain `<img>` moved with a CSS transform, not a `<canvas>`.
Config:        `src`, `alt: ''`, `fit: 'contain'` (`'contain' | 'cover'`: how the image fills the box at zoom 1), `zoomable: true`, `maxZoom: 8`, `showTools: true`, `ratio` (CSS `aspect-ratio` of the box, e.g. `'16 / 9'`; otherwise use `height`).
API:           `setSrc(url)`, `setAlt(text)`, `setFit(fit)`, `zoomTo(level)`, `zoomBy(factor)`, `reset()`, `getZoom()`. The zoom stays between 1 and `maxZoom`, and the image cannot be dragged out of the box.
Events:        `load`, `error`, `zoom(level)`.
States:        `is-loading` (the mask, until the image loads), `is-error` (a message instead of the image), `is-zoomed` (the stage shows a grab cursor), `is-dragging`.
Keyboard/ARIA: the stage is focusable with `role=img` + the alt text. `+` / `-` zoom, `0` resets, the arrows pan while zoomed. Wheel (with Ctrl or Meta, so the page still scrolls), double click (zoom in / reset), drag to pan, two-finger pinch. The tools are real buttons with labels.
Tokens:        `--op-imagecanvas-bg`, `--op-imagecanvas-radius`, `--op-imagecanvas-tools-bg`, `--op-imagecanvas-tools-fg`.
Sandbox cases: contain and cover, zoom with the tools and the wheel, a broken URL, `zoomable: false`, inside a Carousel.
Out of scope:  drawing or annotations, rotation, cropping, multiple images (use a Carousel), a thumbnail strip.
