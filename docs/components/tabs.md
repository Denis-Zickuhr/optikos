# Tabs  (type: 'tabs')
Purpose:       Switches between panels, one visible at a time.
Anatomy:       `.op-tabs` > `.op-tabs__bar[role=tablist]` > `.op-tabs__tab[role=tab]` (+ close button) ; `.op-tabs__panels` (a Container with the `card` layout) > `[role=tabpanel]` panels.
Config:        `items` (each: `title`, `icon`, `closable`, `disabled` + the panel config), `active: 0|id`, `position: 'top'|'left'` (top), `lazy: true` (a panel's DOM is only built when it is activated), `closable` (default for the items).
API:           `setActive(indexOrId)`, `getActive()`, `add(tab)`, `closeTab(indexOrId)`, `setTitle(tab, text)`, `setTabState(tab, { errors?, dirty? })` (error badge and changed dot in the header; used by `Form`).
Events:        `before-change(next, prev)` (cancelable), `change(tab, index)`, `before-close(tab)` (cancelable), `close(tab)`.
Keyboard/ARIA: APG pattern: ←→ (↑↓ when left) move and activate, Home/End, Delete closes a closable tab; only the active tab is in the Tab order; `aria-selected`, `aria-controls`/`aria-labelledby`. A tab added after render becomes the active one.
Tokens:        `--op-tabs-bar-bg/tab-fg/tab-active-fg/tab-active-border/tab-padding-x`.
Sandbox cases: plain, closable, icons, lazy, side tabs, dynamic add, a disabled tab.
Out of scope:  drag to reorder, overflow with tab scrolling (P1).
