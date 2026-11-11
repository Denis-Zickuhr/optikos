# Carousel  (type: 'carousel')
Purpose:       Shows one item (or a few) at a time from a row you page through: images, cards, quotes, anything that is a component.
Anatomy:       `.op-carousel` (Container, `role=region`, `aria-roledescription=carousel`) > `__viewport` > `__track` (the scroll-snap row; the items are its children, each a `role=group` slide), `__prev` / `__next` buttons, `__dots` (one button per page) and, with `autoplay`, a `__toggle` (pause / play).
Config:        (Container: `items`, `defaults`, `defaultType`) + `perView: 1` (items shown together), `gap: 0`, `loop: false` (past the last goes to the first), `autoplay: 0` (ms between slides; 0 = off), `dots: true`, `arrows: true`, `active: 0`.
API:           (Container: `add/insert/remove/getItems`) `getActive()`, `setActive(i)` / `goTo(i)`, `next()`, `prev()`, `play()`, `pause()`. It moves one item at a time; the last position is the one where the last item sits at the end (`items - perView`), and there is one dot per position.
Events:        `change(index, old)` once the carousel settles on another item; `before-change(index)` can cancel a move made through the API or the controls.
States:        `is-playing`, `is-first` / `is-last` (the arrow is disabled, unless `loop`). Autoplay stops for good once the user interacts (a click, a key, a swipe) and while the pointer or focus is inside; it never runs with `prefers-reduced-motion`.
Keyboard/ARIA: WAI-ARIA APG "Carousel". ←/→ go to the previous / next, Home/End to the ends (with focus on the viewport or a control). Each slide is `role=group`, `aria-roledescription=slide` and `aria-label="3 of 8"`; the dots are buttons with `aria-current`. Swipe, trackpad and touch scrolling work natively (scroll snap). Slides out of view are `inert` so Tab does not reach them.
Tokens:        `--op-carousel-gap`, `--op-carousel-radius`, `--op-carousel-arrow-bg/fg`, `--op-carousel-dot-size`, `--op-carousel-dot-bg`, `--op-carousel-dot-active-bg`.
Sandbox cases: images (with ImageCanvas), cards with `perView: 3`, loop, autoplay, add/remove at runtime, one item only.
Out of scope:  vertical orientation, fade or 3D transitions, thumbnails, variable-width items.
