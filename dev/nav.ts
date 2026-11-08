// Navigation shared by the sandbox bar, the demo frame and the index: breadcrumb + "Go to…" menu + shortcuts.
import { create, Breadcrumb, Button, Menu, type BreadcrumbItem, type MenuEntry } from 'optikos';

export interface DevPage {
  kind: 'sandbox' | 'demo';
  name: string;
  href: string;
  sections: string[];
  description: string;
}

export const INDEX = '/dev/';

export async function loadPages(): Promise<DevPage[]> {
  try {
    return await (await fetch('/.dev/pages.json')).json();
  } catch {
    return [];
  }
}

/** Optikos › Sandbox › fields   (each part but the last is a link). */
export function crumbs(current?: { kind: 'sandbox' | 'demo'; name: string }): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ text: 'Optikos', icon: 'home', href: INDEX }];
  if (!current) return [{ text: 'Optikos', icon: 'home' }];
  items.push({ text: current.kind === 'sandbox' ? 'Sandbox' : 'Demos', href: `${INDEX}#${current.kind === 'sandbox' ? 'sandboxes' : 'demos'}` });
  items.push({ text: current.name });
  return items;
}

/** The page the browser is on, from its URL: /sandbox/fields/ → { kind: 'sandbox', name: 'fields' }. */
export function currentPage(): { kind: 'sandbox' | 'demo'; name: string } | undefined {
  const m = /^\/(sandbox|demos)\/([^/]+)/.exec(location.pathname);
  return m ? { kind: m[1] === 'sandbox' ? 'sandbox' : 'demo', name: m[2] } : undefined;
}

/** Mounts the breadcrumb and a "Go to…" button into `host`. */
export function mountNav(host: HTMLElement) {
  const here = currentPage();
  const breadcrumb = create<Breadcrumb>({ type: 'breadcrumb', items: crumbs(here), renderTo: host });
  const goto = create<Button>({
    type: 'button', text: 'Go to…', icon: 'chevron-down', iconPos: 'right', variant: 'ghost', renderTo: host,
    handler: async () => {
      const pages = await loadPages();
      const entry = (p: DevPage): MenuEntry => ({ text: p.name, disabled: here?.kind === p.kind && here.name === p.name, handler: () => (location.href = p.href) });
      const menu = create<Menu>({
        type: 'menu',
        items: [
          { text: 'Index', icon: 'home', handler: () => (location.href = INDEX) },
          '-',
          ...pages.filter((p) => p.kind === 'sandbox').map(entry),
          '-',
          ...pages.filter((p) => p.kind === 'demo').map((p) => ({ ...(entry(p) as object), text: `${p.name} (demo)` }) as MenuEntry),
        ],
      });
      menu.on('hide', () => setTimeout(() => menu.destroy()));
      menu.showBy(goto);
    },
  });
  return { breadcrumb, goto };
}

let installed = false;
/** `g` then `i` (or Alt+↑) jumps to the index, unless you are typing in a field. */
export function installShortcuts() {
  if (installed) return;
  installed = true;
  let armed = false;
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.altKey && e.key === 'ArrowUp') return void (location.href = INDEX);
    if (e.ctrlKey || e.metaKey || e.altKey || t.closest('input,textarea,select,[contenteditable],[role=combobox]')) return;
    if (armed && e.key === 'i') location.href = INDEX;
    armed = e.key === 'g';
    if (armed) setTimeout(() => (armed = false), 1000);
  });
}
