import { describe, it, expect, afterEach, vi } from 'vitest';
import { shortcuts, formatKeys } from 'optikos';

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
};
let offs: Array<() => void> = [];
afterEach(() => {
  offs.forEach((o) => o());
  offs = [];
  shortcuts.setScope(undefined);
  document.body.innerHTML = '';
});
const reg = (s: Parameters<typeof shortcuts.register>[0]) => offs.push(shortcuts.register(s));

describe('shortcuts', () => {
  it('runs a global shortcut, prevents the default, and stops after unregister', () => {
    const fn = vi.fn();
    const off = shortcuts.register({ keys: 'ctrl+s', title: 'Save', handler: fn });
    const e = press('s', { ctrlKey: true });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
    off();
    press('s', { ctrlKey: true });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('a scope is active only when set, and its shortcut beats a global one with the same keys', () => {
    const [g, s] = [vi.fn(), vi.fn()];
    reg({ keys: 'alt+n', title: 'New', handler: g });
    reg({ keys: 'alt+n', title: 'New lot', scope: 'lots', handler: s });
    press('n', { altKey: true });
    expect([g.mock.calls.length, s.mock.calls.length]).toEqual([1, 0]);
    shortcuts.setScope('lots');
    press('n', { altKey: true });
    expect([g.mock.calls.length, s.mock.calls.length]).toEqual([1, 1]);
  });

  it('a plain key is ignored while typing, a modified one is not; when() gates it', () => {
    const [a, b] = [vi.fn(), vi.fn()];
    reg({ keys: 'g', title: 'Go', handler: a });
    reg({ keys: 'ctrl+g', title: 'Go too', handler: b });
    const input = document.body.appendChild(document.createElement('input'));
    press('g', {}, input);
    press('g', { ctrlKey: true }, input);
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([0, 1]);
    let on = false;
    const c = vi.fn();
    reg({ keys: 'x', title: 'X', handler: c, when: () => on });
    press('x');
    on = true;
    press('x');
    expect(c).toHaveBeenCalledTimes(1);
  });

  it('the same keys twice in one scope: the newest wins (and dev warns)', () => {
    (globalThis as any).__OPTIKOS_DEV__ = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const [a, b] = [vi.fn(), vi.fn()];
    reg({ keys: 'ctrl+d', title: 'One', handler: a });
    reg({ keys: 'ctrl+d', title: 'Two', handler: b });
    press('d', { ctrlKey: true });
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([0, 1]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already taken'));
    warn.mockRestore();
    delete (globalThis as any).__OPTIKOS_DEV__;
  });

  it('? opens a help panel grouped by scope, and closes it again', () => {
    reg({ keys: 'ctrl+s', title: 'Save', handler: () => {} });
    reg({ keys: 'alt+n', title: 'New lot', scope: 'lots', handler: () => {} });
    shortcuts.setScope('lots');
    press('?', { shiftKey: true });
    const panel = document.querySelector('.op-shortcuts')!;
    expect(panel.textContent).toContain('Save');
    expect(panel.textContent).toContain('New lot');
    expect(panel.querySelectorAll('h3').length).toBe(2);
    press('?', { shiftKey: true });
    expect(document.querySelector('.op-shortcuts')).toBeNull();
  });

  it('formatKeys reads for the platform', () => {
    expect(formatKeys('mod+shift+k')).toMatch(/^(Ctrl\+Shift\+K|⌘⇧K)$/);
  });
});
