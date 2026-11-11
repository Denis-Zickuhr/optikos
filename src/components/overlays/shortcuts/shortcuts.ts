import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { isDev } from '../../../core/dev';
import { Window } from '../window/window';

addMessages('en', { shortcuts: 'Keyboard shortcuts', shortcutsGlobal: 'Everywhere', shortcutsEmpty: 'No shortcuts registered' });
addMessages('pt-BR', { shortcuts: 'Atalhos de teclado', shortcutsGlobal: 'Em qualquer tela', shortcutsEmpty: 'Nenhum atalho registrado' });

export interface Shortcut {
  /** `mod+s` (Ctrl, or ⌘ on a Mac), `shift+?`, `alt+n`, `g`. Several keys in a row are not supported. */
  keys: string;
  title: string;
  handler: (e: KeyboardEvent) => void | false;
  /** The screen it belongs to (`setScope`). Default `global`: active on every screen. */
  scope?: string;
  /** Heading in the help panel. Default: the scope. */
  group?: string;
  /** Checked on every press: the shortcut only runs while this returns true. */
  when?: () => boolean;
  /** A shortcut without Ctrl/⌘/Alt is ignored while typing in a field, unless this is true. */
  inInputs?: boolean;
}

const isMac = () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
const normalize = (keys: string) => {
  const p = keys.toLowerCase().split('+').map((x) => x.trim());
  const key = p.pop();
  return [...p.sort(), key].join('+');
};

function matches(e: KeyboardEvent, keys: string): boolean {
  const parts = keys.toLowerCase().split('+');
  const key = parts.pop()!;
  const has = (m: string) => parts.includes(m);
  const mac = isMac();
  // a symbol such as `?` already carries its Shift
  const symbol = key.length === 1 && !/[a-z0-9]/.test(key);
  return e.key.toLowerCase() === key && e.ctrlKey === (has('ctrl') || (has('mod') && !mac)) && e.metaKey === (has('meta') || (has('mod') && mac)) && e.altKey === has('alt') && (symbol || e.shiftKey === has('shift'));
}

/** How a combination reads on this keyboard: `⌘S`, `Ctrl+S`. */
export function formatKeys(keys: string): string {
  const mac = isMac();
  const names: Record<string, string> = mac ? { mod: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' } : { mod: 'Ctrl', ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' };
  return keys.split('+').map((p) => names[p.toLowerCase()] ?? (p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1))).join(mac ? '' : '+');
}

const entries: Shortcut[] = [];
let scope: string | undefined;
let listening = false;
let helpWin: Window | undefined;

const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

function onKey(e: KeyboardEvent) {
  if (e.defaultPrevented || e.isComposing) return;
  const modified = e.ctrlKey || e.metaKey || e.altKey;
  // the active screen's shortcuts come before the global ones with the same keys
  const hit = [...entries].sort((a, b) => Number((b.scope ?? 'global') === scope) - Number((a.scope ?? 'global') === scope)).find((s) => ((s.scope ?? 'global') === 'global' || s.scope === scope) && matches(e, s.keys) && (modified || s.inInputs || !typing(e.target)) && (s.when?.() ?? true));
  if (hit && hit.handler(e) !== false) e.preventDefault();
}

export const shortcuts = {
  /** Adds shortcuts; returns the function that removes them. The same keys twice in one scope warn in dev, and the newest wins. */
  register(list: Shortcut | Shortcut[]): () => void {
    const add = Array.isArray(list) ? list : [list];
    if (!listening && typeof document !== 'undefined') {
      listening = true;
      document.addEventListener('keydown', onKey);
      shortcuts.register({ keys: 'shift+?', title: t('shortcuts'), handler: () => shortcuts.help() });
    }
    for (const s of add) {
      const same = entries.findIndex((x) => (x.scope ?? 'global') === (s.scope ?? 'global') && normalize(x.keys) === normalize(s.keys));
      if (same >= 0) {
        if (isDev()) console.warn(`Optikos: shortcut ${s.keys} is already taken in scope "${s.scope ?? 'global'}" by "${entries[same].title}"; "${s.title}" replaces it`);
        entries.splice(same, 1);
      }
      entries.push(s);
    }
    return () => {
      for (const s of add) {
        const i = entries.indexOf(s);
        if (i >= 0) entries.splice(i, 1);
      }
    };
  },

  /** The screen whose shortcuts are active besides the global ones (`undefined`: only global). */
  setScope(name: string | undefined): void {
    scope = name;
  },
  getScope: (): string | undefined => scope,

  /** What is active now: the global shortcuts and the current scope's. */
  list: (): Shortcut[] => entries.filter((s) => (s.scope ?? 'global') === 'global' || s.scope === scope),

  /** Opens (or closes) the help panel, grouped. `?` does it from anywhere but a text field. */
  help(): void {
    if (helpWin) return void helpWin.close();
    const groups = new Map<string, Shortcut[]>();
    for (const s of shortcuts.list()) {
      const g = s.group ?? ((s.scope ?? 'global') === 'global' ? t('shortcutsGlobal') : s.scope!);
      groups.set(g, [...(groups.get(g) ?? []), s]);
    }
    const body = h('div', 'op-shortcuts');
    for (const [g, list] of groups) body.append(h('h3', 'op-shortcuts__group', {}, g), ...list.map((s) => h('div', 'op-shortcuts__row', {}, h('span', '', {}, s.title), h('kbd', 'op-shortcuts__kbd', {}, formatKeys(s.keys)))));
    if (!groups.size) body.append(t('shortcutsEmpty'));
    const win = (helpWin = new Window({ title: t('shortcuts'), closable: true, width: 420 }));
    win.on('destroy', () => (helpWin = undefined));
    win.show();
    win.getBody().replaceChildren(body);
  },
};
