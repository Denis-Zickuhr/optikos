# Slider  (type: 'slider')
Purpose:       Enters a number (or a range) by dragging a knob along a track: volume, price, rating, size. Faster than typing when the value is approximate.
Anatomy:       `.op-slider` (Field) > `.op-slider__track` > `__fill` (the filled part), `__marks`, and 1 or 2 `__knob[role=slider]` with a `__bubble` (the value, above it, while dragging or focused). An optional `.op-slider__scale` (min and max).
Config:        (Field) + `min: 0`, `max: 100`, `step: 1`, `value` (a number; with `range`, `[min, max]`), `range: false`, `marks: false | true | [{ value, label }]` (`true` = one mark per step, up to 20),
               `showValue: 'drag'` (`'drag' | 'always' | 'never'`: when the value bubble shows), `format: (v) => string` (the value text, e.g. `v => v + '%'`), `showScale: false` (shows the limits below).
API:           (Field) `getValue/setValue`, `setMin(n)`, `setMax(n)`, `setStep(n)`, `setRange(bool)`, `getPercent()`; the value always stays between `min` and `max`, in multiples of `step`; in `range` mode the knobs never cross.
Events:        `change(value)` on every user move (continuous), `slide-start`, `slide-end(value)` on release; with `debounce`, `settled(value)` only when the user stops dragging (and on release); plus the Field ones (`focus`, `blur`, `invalid`...).
States:        `is-dragging`, `is-disabled`, `is-readonly`. Stretch: while the knob moves it stretches by `stretch.amount` (12 %) in the direction of the movement and relaxes on release (motion module; off with `motion.disable()`); nothing transitions while dragging (the knob follows the pointer).
Keyboard/ARIA: WAI-ARIA APG "Slider" and "Multi-Thumb Slider" patterns. Each knob is `role=slider` with `aria-valuemin/max/now/valuetext` and `aria-orientation=horizontal`. ←/↓ and →/↑ ± one step; Page Up/Down ± 10 steps; Home/End go to the limit (in a range: the knob's own limit). A click/tap on the track moves the nearest knob.
Tokens:        `--op-slider-track-height`, `--op-slider-knob-size`, `--op-slider-track-bg`, `--op-slider-fill-bg`, `--op-slider-knob-bg`, `--op-slider-knob-border`, `--op-slider-bubble-bg/fg`.
Sandbox cases: plain, with marks and labels, a price range, format (%), bubble always visible, disabled/read-only, decimal step, inside a Form.
Out of scope:  vertical orientation, a logarithmic scale, more than two knobs.
