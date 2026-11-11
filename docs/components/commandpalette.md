# CommandPalette  (type: 'commandpalette')
Purpose:       A command window opened with a shortcut (Ctrl/⌘+K): the user types and runs any action the app registered (navigate, switch theme, create a record...). Fast for people who know the app.
Anatomy:       `body > .op-layer` > `.op-palette-backdrop` > `.op-palette[role=dialog]` > `__search` (input `role=combobox`) + `__filters` ("All" chip + one per category) +
               `__list[role=listbox]` with `__group` (category title) and `__item[role=option]` (icon, title with `<mark>`, description, `<kbd>` shortcut) + `__empty`; a footer with keyboard hints.
Config:        `commands: Command[]`, `hotkey: 'mod+k'` (`mod` = Ctrl on Windows/Linux, ⌘ on Mac; `false` turns it off), `placeholder`, `emptyText`, `maxResults: 50`,
               `categories: string[]` (group order; the rest come after), `filters: true` (category chips). A command takes `permission` (left out while `setPermissionResolver` denies it).
Command:       `{ id, title, category?, icon?, description?, keywords?: string[], shortcut?: string (display only), disabled?, hidden?: () => boolean, handler(ctx) }`.
               `children: Command[] | () => Command[] | Promise<Command[]>` opens a second level ("Switch theme… → light/dark/..."); Backspace in the empty field goes back. The `handler` runs **after** the palette has closed (so it can open a modal window).
API:           `open()`, `close()`, `toggle()`, `isOpen()`, `setCommands(list)`, `register(cmd | cmds)` (returns the function that unregisters), `run(id)`, `getCommands()`.
Events:        `before-open` (cancelable), `open`, `close`, `run(command)`, `error(err)` (a failing handler does not break the palette).
Search:        Without typing: every command, grouped by category. While typing: ranked by text (start of the title > start of a word > substring > letters in order, only with 3+ letters so it does not match everything), also in `keywords`,
               `category` and `description`; best first, without groups. Category chips filter (one at a time; "All" clears).
States:        `is-open`; item `is-active` (highlighted), `is-disabled`.
Keyboard/ARIA: Ctrl/⌘+K opens/closes from anywhere (even with the focus in a field); ↑↓ move (wrapping), Home/End, Enter runs, Esc closes (or goes back a level), Tab/Shift+Tab go through the chips,
               Backspace in the empty field leaves a submenu. Modal with trapped focus; `aria-activedescendant` points at the active item; `aria-live` announces "N results". Focus returns to the opener.
Tokens:        `--op-palette-width`, `--op-palette-top`, `--op-palette-max-height`, `--op-palette-bg`, `--op-palette-item-active-bg`, `--op-palette-group-fg`, `--op-palette-radius`.
Sandbox cases: 30 commands in 4 categories, a submenu ("Switch theme…"), disabled and hidden commands, displayed shortcut, an async handler that fails, hotkey off + a button that opens it.
Out of scope:  history/"recent", commands with typed arguments (`:goto 12`), searching remote data (use a `SuggestField`/`LookupField`).
