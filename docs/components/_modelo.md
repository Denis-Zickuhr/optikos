# Spec sheet template

Copy this file to `<name>.md` (and its translation to `docs/pt-BR/components/<name>.md`). Every section is required
(write "—" when it does not apply). The sheet comes **before** the code; if the implementation changes, update the
sheet (both languages) in the same commit.

```md
# <Name>  (type: '<type>')
Purpose:       one sentence
Anatomy:       DOM parts and classes (op-x, op-x__part)
Config:        props + defaults
API:           public methods (every mutable config has a setter)
Events:        name, payload, whether it can be canceled (before-*)
States:        disabled, focus, invalid, loading...
Keyboard/ARIA: keys and roles
Tokens:        own --op-<x>-* tokens
Sandbox cases: what to show
Out of scope:  what we will not do
```

Conventions that apply to every sheet (do not repeat them): the common `Component` config (`id`, `cls`, `style`,
`hidden`, `width`, `height`, `flex`, `tooltip`, `theme`, `loading`, `stableSize`, `listeners`, `renderTo`), the common
methods (`show/hide`, `setDisabled`, `focus`, `destroy`, `on/off/once/emit`) and the `destroy` event.
