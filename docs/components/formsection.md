# FormSection  (type: 'formsection')
Purpose:       A titled part of a long form in the "settings page" style: the title and a description in a column on the left, the fields on the right; stacked (title above) when the section is narrow.
Anatomy:       `<section class="op-formsection" aria-labelledby>` > `.op-formsection__aside` (`h3.__title`, `p.__desc`) + `.op-formsection__body` (items). The side-by-side switch is a container query on the section's own width, not the window's.
Config:        (Container) + `title`, `description`, `aside: true` (`false` = always stacked), `columns` (a responsive grid for the fields; items take `colspan`, a number or `'full'`), `divider: true` (a rule between consecutive sections). Default layout `vbox`.
API:           `setTitle(text)`, `setDescription(text)`, `setAside(bool)`, + Container (`add`, `remove`, `items`).
Events:        —
States:        `op-formsection--stacked` (when `aside: false`).
Keyboard/ARIA: `<section>` named by its title (`aria-labelledby`) and described by the description (`aria-describedby`): a landmark-free region that screen readers announce when entering the fields. No keys of its own.
Tokens:        `--op-formsection-aside-width` (the left column), `--op-formsection-gap`, `--op-formsection-divider`. It goes side by side from 40rem of its own width (a container query: the breakpoint cannot be a token).
Sandbox cases: a settings page with three sections (profile, notifications, danger zone), `aside: false`, `columns: 2` with `colspan: 'full'`, inside a Form with `labelWidth`.
Out of scope:  navigation between sections (a table of contents), sticky section titles, collapsing (use a collapsible FieldSet).
