// Dev-only floating frame for demos: a small pill that expands into the breadcrumb and a "Go to…" menu.
// Injected by scripts/dev.mjs (never imported by the demos themselves, which only use the public API).
import { create } from 'optikos';
import { mountNav, installShortcuts } from './nav';
import { THEMES, initialState, applyThemeState, type DevTheme } from './themes';

const key = 'optikos-dev-frame';
const read = () => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (v: string) => {
  try {
    localStorage.setItem(key, v);
  } catch { /* ignore */ }
};

const style = document.createElement('style');
style.textContent = `
.dev-frame{position:fixed;inset-block-end:.75rem;inset-inline-start:.75rem;z-index:999;display:flex;align-items:center;gap:.25rem;padding:.25rem;
  background:var(--op-color-surface);border:1px solid var(--op-color-border-strong);border-radius:var(--op-radius-pill);box-shadow:var(--op-shadow);font-family:var(--op-font-family)}
.dev-frame__body{display:flex;align-items:center;gap:.25rem;padding-inline-end:.5rem}
.dev-frame.is-collapsed .dev-frame__body{display:none}
.dev-frame .op-button{border-radius:var(--op-radius-pill)}
.dev-frame__theme{inline-size:9rem}
.dev-frame__theme .op-textfield__input{border-color:transparent;border-radius:var(--op-radius-pill);background:var(--op-color-surface-2);padding-inline-start:var(--op-space-4);cursor:pointer}
.dev-frame__theme .op-textfield__input:hover{background:var(--op-color-hover)}
.dev-frame__theme .op-picker__trigger{inset-inline-end:var(--op-space-2)}
`;
document.head.append(style);

const frame = document.createElement('div');
frame.className = 'dev-frame';
const body = document.createElement('div');
body.className = 'dev-frame__body';
const toggle = create({ type: 'button', icon: 'menu', variant: 'ghost', ariaLabel: 'Dev navigation', tooltip: 'Dev navigation' });
frame.append(toggle.el, body);
document.body.append(frame);
mountNav(body);
const state = initialState();
// the same Select the library ships, shaped like the rest of the pill
const pick = create({ type: 'select', cls: 'dev-frame__theme', ariaLabel: 'Theme', options: [...THEMES], value: state.theme, stableSize: false, listeners: { change: (v: string) => v && applyThemeState({ ...state, theme: v as DevTheme }) } } as never);
body.append(pick.el);
applyThemeState(state);
installShortcuts();

const open = new URLSearchParams(location.search).get('frame') === 'open' || read() === 'open';
const apply = (isOpen: boolean) => {
  frame.classList.toggle('is-collapsed', !isOpen);
  toggle.el.setAttribute('aria-expanded', String(isOpen));
};
apply(open);
toggle.on('click', () => {
  const next = frame.classList.contains('is-collapsed');
  apply(next);
  write(next ? 'open' : 'closed');
});
