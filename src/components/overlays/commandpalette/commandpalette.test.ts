import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, CommandPalette, type Command } from 'optikos';

const cleanup: CommandPalette[] = [];
const mk = (cfg: object = {}) => {
  const p = create<CommandPalette>({ type: 'commandpalette', ...cfg } as any);
  cleanup.push(p);
  return p;
};
afterEach(() => {
  cleanup.splice(0).forEach((p) => p.destroy());
  document.body.innerHTML = '';
});
const key = (el: EventTarget, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const input = () => document.querySelector('.op-palette__input') as HTMLInputElement;
const type = (v: string) => {
  input().value = v;
  input().dispatchEvent(new Event('input', { bubbles: true }));
};
const titles = () => Array.from(document.querySelectorAll('.op-palette__item .op-palette__title')).map((t) => t.textContent);
const wait = () => new Promise((r) => setTimeout(r, 0));

const cmds = (run: (id: string) => void = () => {}): Command[] => [
  { id: 'new', title: 'New customer', category: 'Customers', icon: 'plus', shortcut: 'N', keywords: ['create', 'add'], handler: () => run('new') },
  { id: 'find', title: 'Find customer', category: 'Customers', handler: () => run('find') },
  { id: 'dark', title: 'Switch to dark theme', category: 'Appearance', handler: () => run('dark') },
  { id: 'home', title: 'Go to dashboard', category: 'Navigation', description: 'The overview page', handler: () => run('home') },
  { id: 'off', title: 'Disabled thing', category: 'Navigation', disabled: true, handler: () => run('off') },
  { id: 'secret', title: 'Hidden thing', hidden: () => true, handler: () => run('secret') },
];

describe('CommandPalette', () => {
  it('opens with Ctrl+K (toggle), lists commands grouped by category in the given order, hides hidden ones', () => {
    const p = mk({ commands: cmds(), categories: ['Navigation', 'Customers'] });
    expect(p.isOpen()).toBe(false);
    key(document, 'k', { ctrlKey: true });
    expect(p.isOpen()).toBe(true);
    expect(document.querySelector('.op-layer .op-palette[role=dialog]')).not.toBeNull();
    expect(Array.from(document.querySelectorAll('.op-palette__group')).map((g) => g.textContent)).toEqual(['Navigation', 'Customers', 'Appearance']);
    expect(titles()).toEqual(['Go to dashboard', 'Disabled thing', 'New customer', 'Find customer', 'Switch to dark theme']);
    key(document, 'k', { ctrlKey: true });
    expect(p.isOpen()).toBe(false);
    expect(document.querySelector('.op-palette')).toBeNull();
  });

  it('hotkey: false turns the global key off; custom hotkey works', () => {
    const off = mk({ commands: cmds(), hotkey: false });
    key(document, 'k', { ctrlKey: true });
    expect(off.isOpen()).toBe(false);
    off.destroy();
    const alt = mk({ commands: cmds(), hotkey: 'ctrl+shift+p' });
    key(document, 'p', { ctrlKey: true, shiftKey: true });
    expect(alt.isOpen()).toBe(true);
  });

  it('search ranks title starts first, finds keywords/description/category, requires every word, highlights', () => {
    const p = mk({ commands: cmds() });
    p.open();
    type('cust');
    expect(titles()).toEqual(['New customer', 'Find customer']); // word starts, in list order
    expect(document.querySelector('.op-palette__item mark')!.textContent).toBe('cust');
    type('create'); // a keyword
    expect(titles()).toEqual(['New customer']);
    type('overview'); // description
    expect(titles()).toEqual(['Go to dashboard']);
    type('appear'); // category
    expect(titles()).toEqual(['Switch to dark theme']);
    type('new zzz');
    expect(titles()).toEqual([]);
    expect(document.querySelector('.op-palette__empty')!.textContent).toBe('No matching commands');
    type('gdb'); // letters in order
    expect(titles()).toEqual(['Go to dashboard']);
    type('dg'); // two letters never match "by letters in order"
    expect(titles()).toEqual([]);
    type('dash');
    expect(document.querySelector('.op-palette__cat')!.textContent).toBe('Navigation'); // category shown while searching
  });

  it('category chips filter, one at a time; "All" clears', () => {
    const p = mk({ commands: cmds() });
    p.open();
    const chips = () => Array.from(document.querySelectorAll<HTMLElement>('.op-palette__chip'));
    expect(chips().map((c) => c.textContent)).toEqual(['All', 'Customers', 'Appearance', 'Navigation']);
    chips()[1].click();
    expect(titles()).toEqual(['New customer', 'Find customer']);
    expect(chips()[1].getAttribute('aria-pressed')).toBe('true');
    chips()[0].click();
    expect(titles()).toHaveLength(5);
  });

  it('keyboard: arrows wrap, Enter closes then runs the active command, Esc closes and focus returns', async () => {
    const run = vi.fn();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const p = mk({ commands: cmds(run) });
    p.open();
    expect(input().getAttribute('aria-activedescendant')).toBe(document.querySelector('.op-palette__item.is-active')!.id);
    key(input(), 'ArrowUp'); // wraps to the last
    expect(document.querySelector('.op-palette__item.is-active .op-palette__title')!.textContent).toBe('Disabled thing');
    key(input(), 'ArrowDown');
    key(input(), 'Enter');
    await wait();
    expect(run).toHaveBeenCalledWith('new');
    expect(p.isOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
    p.open();
    key(input(), 'Escape');
    expect(p.isOpen()).toBe(false);
  });

  it('click runs a command; a disabled one does nothing; a failing handler becomes an error event', async () => {
    const run = vi.fn();
    const err = vi.fn();
    const p = mk({ commands: [...cmds(run), { id: 'bad', title: 'Explode', handler: () => Promise.reject(new Error('boom')) }] });
    p.on('error', err);
    p.open();
    const item = (name: string) => Array.from(document.querySelectorAll<HTMLElement>('.op-palette__item')).find((i) => i.textContent!.includes(name))!;
    item('Disabled').click();
    expect(p.isOpen()).toBe(true);
    expect(run).not.toHaveBeenCalled();
    item('Explode').click();
    await wait();
    expect(err.mock.calls[0][0].message).toBe('boom');
    expect(p.isOpen()).toBe(false);
  });

  it('children open a second level (breadcrumb); Backspace/Esc go back', async () => {
    const run = vi.fn();
    const p = mk({ commands: [{ id: 'theme', title: 'Switch theme…', children: async () => [{ id: 'l', title: 'Light', handler: () => run('light') }, { id: 'd', title: 'Dark', handler: () => run('dark') }] }, ...cmds()] });
    p.open();
    (Array.from(document.querySelectorAll<HTMLElement>('.op-palette__item')).find((i) => i.textContent!.includes('Switch theme'))!).click();
    await wait();
    expect(titles()).toEqual(['Light', 'Dark']);
    expect(document.querySelector<HTMLElement>('.op-palette__crumb')!.hidden).toBe(false);
    key(input(), 'Backspace');
    expect(titles()).toContain('Switch theme…');
    (Array.from(document.querySelectorAll<HTMLElement>('.op-palette__item')).find((i) => i.textContent!.includes('Switch theme'))!).click();
    await wait();
    key(input(), 'Escape'); // back, not close
    expect(p.isOpen()).toBe(true);
    (Array.from(document.querySelectorAll<HTMLElement>('.op-palette__item')).find((i) => i.textContent!.includes('Switch theme'))!).click();
    await wait();
    key(input(), 'ArrowDown');
    key(input(), 'Enter');
    await wait();
    expect(run).toHaveBeenCalledWith('dark');
    expect(p.isOpen()).toBe(false);
  });

  it('register() adds commands (and returns an unregister), setCommands replaces, run(id) works while closed', async () => {
    const run = vi.fn();
    const p = mk({ commands: [] });
    const off = p.register({ id: 'x', title: 'Extra', handler: () => run('x') });
    p.open();
    expect(titles()).toEqual(['Extra']);
    off();
    expect(titles()).toEqual([]);
    p.setCommands(cmds(run));
    p.close();
    await p.run('home');
    expect(run).toHaveBeenCalledWith('home');
  });

  it('is modal (page inert while open), announces counts, and cleans up on destroy', () => {
    const page = document.createElement('main');
    document.body.append(page);
    const p = mk({ commands: cmds() });
    p.open();
    expect(page.hasAttribute('inert')).toBe(true);
    expect(document.querySelector('.op-palette [aria-live]')!.textContent).toContain('5');
    p.close();
    expect(page.hasAttribute('inert')).toBe(false);
    p.open();
    p.destroy();
    expect(document.querySelector('.op-palette')).toBeNull();
    expect(page.hasAttribute('inert')).toBe(false);
    key(document, 'k', { ctrlKey: true });
    expect(document.querySelector('.op-palette')).toBeNull();
  });
});
