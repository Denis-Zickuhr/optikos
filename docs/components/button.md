# Button  (type: 'button')
Purpose:       Runs an action (click), with text and/or an icon, in visual variants.
Anatomy:       `<button class="op-button op-button--{variant} op-stable">` (a one-cell grid) > `.op-button__face` (`.op-button__icon`, `.op-button__text`) and `.op-button__busy` (`.op-button__spinner`, `.op-button__busy-text`).
               Both faces share the same cell (`grid-area: 1 / 1`); the inactive one is `visibility: hidden` (with `stableSize: false`, `display: none`), which also hides it from screen readers.
Config:        `text`, `icon`, `iconPos: 'left'|'right'` (left), `variant: 'default'|'primary'|'danger'|'ghost'` (default),
               `htmlType: 'button'|'submit'|'reset'` (button), `handler(btn, ev)`, `toggle: false`, `pressed: false`, `loading: false | string`, `loadingText` (default: `text`), `disabled`,
               `stableSize: true` — the width is the larger of the normal and the loading face, so it does not change when loading starts or ends. `false`: the button fits the active face.
               Changing the content (`setText` with a longer text) can change the width; `stableSize` is about states, not new content.
API:           `setText`, `setIcon`, `setVariant`, `setLoading`, `setLoadingText`, `setStableSize`, `setPressed`, `setDisabled`, `click()`.
Events:        `click(ev)` (cancelable: a handler/listener that returns `false` prevents the native submit), `toggle(pressed)`.
States:        `is-disabled`, `is-loading` (blocks clicks; `aria-busy` and `aria-disabled`, and the loading text is the accessible name), `is-pressed` (toggle, `aria-pressed`), visible focus.
Keyboard/ARIA: native Enter/Space (it is a `<button>`); icon-only needs `ariaLabel` (console warning in dev); `aria-pressed` on toggles.
Tokens:        `--op-button-bg/fg/border/radius/padding-x/padding-y/gap/font-weight`, `--op-button-{hover,active}-bg`, per variant (`--op-button-primary-bg`...), `--op-button-primary-shadow`.
Sandbox cases: variants, text only/icon only/both, disabled, loading, `stableSize` true vs false side by side with a loading toggle, toggle, submit inside a form, per-component theme.
Out of scope:  built-in menu and split (SplitButton is P1); button groups (use Toolbar).
