# Panel  (type: 'panel')
Purpose:       A container with a header (title, tools), a body with a layout and a footer; optionally collapsible.
Anatomy:       `.op-panel` > `.op-panel__header` (`__title`, `__tools`), `.op-panel__body` (items), `.op-panel__footer` (buttons).
               `tbar`/`bbar` are Toolbars inside the panel (above/below the body).
Config:        (Container) + `title`, `icon`, `collapsible: false`, `collapsed: false`, `closable: false`, `reloadable: false` (a ↻ tool that calls `onReload(panel)`; the loading mask shows until a returned Promise settles), `onReload`, `tbar`, `bbar`, `buttons`, `tools: [{icon, handler, label}]`, `bodyCls`, `closeAction: 'destroy'|'hide'` (destroy).
API:           `setTitle`, `setIcon`, `collapse()`, `expand()`, `toggle()`, `close()`, `reload(): Promise<boolean>`, `getBody()`, + Container (`add`, `remove`, `items`).
Events:        `before-collapse`/`before-expand`/`before-close`/`before-reload` (cancelable), `collapse`, `expand`, `close`, `reload`.
States:        `is-collapsed`, `is-loading` (through `loading`), `is-reloading` (the panel shows its loading mask and the ↻ turns).
Keyboard/ARIA: `role="region"` + `aria-labelledby` (the title). A collapsible header has a button with `aria-expanded`/`aria-controls`. Close = a button with a localized label.
Tokens:        `--op-panel-bg/fg/border/radius/shadow/header-bg/header-fg/header-border/header-padding/body-padding`.
Sandbox cases: plain, collapsible, with tbar/bbar/buttons, hbox/vbox/grid layouts inside, closable, loading.
Out of scope:  dragging/resizing a panel (only Window drags); tabs (Tabs).
