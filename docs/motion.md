# Motion (animation and micro-interactions)

A set of animation utilities, tokens and behaviors, **all configurable**, with a **global switch**. The defaults come from 20 motion design rules; with everything on and nothing changed, the default numbers are the rules' numbers.

```ts
import { motion } from 'optikos';
motion.disable();                       // turns everything off (animations become instant)
motion.enable();
motion.set({ duration: { dropdown: 180 }, press: { scale: 0.95 } });   // change only what you need
motion.reset();                         // back to the defaults
motion.set({ ease: { out: 'cubic-bezier(.3,1.6,.3,1)' } });           // refused: it "bounces" (rule 13)
```

`motion.isOn()` is `enabled` **and** (when `respectReducedMotion`, default `true`) the user did not ask for `prefers-reduced-motion`. When off, components do not animate and the CSS tokens are neutral (`--op-motion-press-scale: 1`...).
Without `Element.animate` (tests, old browsers) everything is instant: no logic waits for an animation to end.

## Configuration (defaults)

| Key | Default | Rule |
|---|---|---|
| `enabled` / `respectReducedMotion` | `true` / `true` | global switch |
| `ease.out` / `ease.in` / `ease.inOut` | `cubic-bezier(0,0,.2,1)` / `cubic-bezier(.4,0,1,1)` / `cubic-bezier(.4,0,.2,1)` | 1, 9 |
| `duration.dropdown` + `dropdownRange` | `200` ms, range `[150, 250]` (the value is **clamped** to it) | 2 |
| `stagger.step` / `stagger.max` | `30` ms / `12` items (no staggering after that) | 3, 6 |
| `press.scale` | `0.97` | 4 |
| `stretch.amount` | `0.12` (12 %) | 5 |
| `arc.bend` | `0.25` (the curve, as a fraction of the distance) | 7 |
| `duration.pulse` | `450` ms | 8 |
| `popover.scale` / `duration.popover` / `duration.modal` | `0.95` / `200` / `240` | 10 |
| `originFromTrigger` | `true` | 11, 12 |
| `allowBounce` | `false` (curves with overshoot are refused) | 13 |
| `exitRatio` | `0.8` (the exit is 20 % shorter) | 15 |
| `duration.swap` / `blur` | `220` ms / `4` px | 16, 18 |
| `duration.reveal` | `350` ms | 17 |
| `rubber.resistance` / `rubber.settle` | `0.55` / `320` ms | 19 |
| `duration.move` | `450` ms | 7, 9, 20 |

CSS tokens written on the root: `--op-motion-ease-out/in/in-out`, `--op-motion-press-scale`, `--op-motion-press-duration`, `--op-motion-popover-scale`, `--op-motion-dropdown-duration`, `--op-motion-exit-ratio`, `--op-motion-stagger-step`, `--op-motion-blur`.

Size: the module (`optikos/motion`) is ~4 kB gzip; the components that animate (Dropdown/Menu/Window/Toast/DataView/Button) only import the small part (`popIn`, `popOut`, `stagger`, `pulse`, `enter`) and the configuration, ~2 kB. `rubberScroll`, `dragKnob`, `moveArc`, `swap`, `reveal`, `wipeColor` and `layoutId` only ship to whoever uses them.
Tests: the vitest setup calls `motion.disable()`; the motion tests turn it on and fake `Element.animate`.

## The 20 rules → what exists

| # | Rule | Where |
|---|---|---|
| 1 | Entrances use ease-out | `ease.out` is the curve of every entrance (`enter()`, `popIn`, `stagger`) |
| 2 | Dropdowns take 150–250 ms | `Dropdown`, `Menu`, `Select`... use `popIn`; the duration is clamped to `dropdownRange` |
| 3 | 30 ms stagger in lists | `stagger(els)`; `Menu` and `DataView` already stagger (up to `stagger.max`) |
| 4 | 0.97 scale on press | CSS: `.op-button`, `.op-dataview__item` and any `[data-op-press]` |
| 5 | The knob stretches 12 % | `dragKnob(knob, track)` |
| 6 | Staggered details | `staggerDetails(root, ['.title', '.text', '.chip'])` |
| 7 | Movement on an arc | `moveArc(el, target)` |
| 8 | Success pulse | `pulse(el)`; `Button.pulse()`; the `success` toast pulses |
| 9 | Ease-in-out across the screen | `ease.inOut` in `moveArc`, `layoutId` |
| 10 | Popovers start at 0.95 | `popIn` (`popover.scale`) in Dropdown, Window and MessageBox |
| 11 | Enter from the trigger | `transform-origin` computed from the trigger (`originFromTrigger`) |
| 12 | Leave towards the trigger | `popOut` with the same origin |
| 13 | No bounce | `motion.set` refuses curves with overshoot (`allowBounce: false`) |
| 14 | No tween on "hold" | CSS: while pressed, only `transform` transitions |
| 15 | Exits 20 % shorter | `exitRatio` in `popOut` and when a Window closes |
| 16 | Overlapping states | `swap(host, next)`: the old and the new coexist during the transition |
| 17 | Masks | `reveal(el)` (clip-path) and `wipeColor(el, color)` |
| 18 | Crossfade + blur | `swap(host, newNode)` (icons: `swap(el, iconEl('heart'))`) |
| 19 | Rubber band only at the limits | `rubberScroll(scroller)`, `rubberBand(x, limit)` |
| 20 | layoutId | `layoutId.snapshot(id, el)` + `layoutId.mount(id, newEl)` (FLIP) |

Demo: `demos/motion` (one card per rule, a live settings panel and the global switch).
