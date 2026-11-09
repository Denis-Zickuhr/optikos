import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Tree, type TreeNode } from 'optikos';

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const tick = () => new Promise((r) => setTimeout(r, 0));
const made: Tree[] = [];
afterEach(() => made.splice(0).forEach((t) => t.destroy()));
const items = (): TreeNode[] => [
  { id: 'docs', text: 'Docs', expanded: true, children: [{ id: 'a', text: 'Alpha' }, { id: 'b', text: 'Beta', children: [{ id: 'b1', text: 'Beta one' }, { id: 'b2', text: 'Beta two' }] }] },
  { id: 'x', text: 'Extra', disabled: true },
];
const mk = (cfg: object = {}) => {
  const t = create<Tree>({ type: 'tree', items: items(), ariaLabel: 'Files', renderTo: document.body, ...cfg } as never);
  made.push(t);
  return t;
};
const row = (t: Tree, id: string) => t.el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const visible = (t: Tree) => [...t.el.querySelectorAll<HTMLElement>('.op-tree__item')].map((r) => r.dataset.id);

describe('Tree', () => {
  it('renders the APG tree roles, levels and expanded states; only one row is in the Tab order', () => {
    const t = mk();
    expect(t.el.querySelector('[role=tree]')!.getAttribute('aria-label')).toBe('Files');
    expect(visible(t)).toEqual(['docs', 'a', 'b', 'x']);
    expect(row(t, 'b').getAttribute('aria-level')).toBe('2');
    expect(row(t, 'b').getAttribute('aria-expanded')).toBe('false');
    expect(row(t, 'a').hasAttribute('aria-expanded')).toBe(false);
    expect([...t.el.querySelectorAll('[tabindex="0"]')].length).toBe(1);
  });

  it('keyboard: arrows move, Right opens / goes in, Left closes / goes up, Enter selects and activates', () => {
    const t = mk();
    const activate = vi.fn();
    t.on('activate', activate);
    row(t, 'docs').focus();
    key(row(t, 'docs'), 'ArrowDown');
    key(document.activeElement!, 'ArrowDown');
    expect((document.activeElement as HTMLElement).dataset.id).toBe('b');
    key(document.activeElement!, 'ArrowRight');
    expect(visible(t)).toContain('b1');
    key(document.activeElement!, 'ArrowRight');
    expect((document.activeElement as HTMLElement).dataset.id).toBe('b1');
    key(document.activeElement!, 'ArrowLeft');
    expect((document.activeElement as HTMLElement).dataset.id).toBe('b');
    key(document.activeElement!, 'Enter');
    expect(t.getSelection().map((n) => n.id)).toEqual(['b']);
    expect(activate).toHaveBeenCalledWith(t.getNode('b'));
    expect(row(t, 'b').getAttribute('aria-selected')).toBe('true');
  });

  it('multi selection with Ctrl/⌘+click; disabled nodes cannot be selected', () => {
    const t = mk({ selection: 'multi' });
    row(t, 'a').click();
    row(t, 'b').dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    row(t, 'x').click();
    expect(t.getSelection().map((n) => n.id)).toEqual(['a', 'b']);
    expect(t.el.querySelector('[role=tree]')!.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('tri-state checkboxes cascade down and roll up as "mixed"', () => {
    const t = mk({ checkboxes: true });
    t.setChecked('b1', true);
    expect(t.checkState(t.getNode('b')!)).toBe('mixed');
    expect(row(t, 'docs').getAttribute('aria-checked')).toBe('mixed');
    t.setChecked('b', true);
    expect(t.getChecked().map((n) => n.id)).toEqual(['b', 'b1', 'b2']);
    t.toggleChecked('docs');
    expect(t.checkState(t.getNode('docs')!)).toBe(true);
    key(row(t, 'docs'), ' ');
    expect(t.getChecked()).toEqual([]);
  });

  it('loads children on demand, shows the busy state, and reports errors', async () => {
    let fail = false;
    const load = vi.fn(async (n: TreeNode) => (fail ? Promise.reject(new Error('down')) : [{ id: `${n.id}-1`, text: 'Child', leaf: true }]));
    const t = mk({ items: [{ id: 'r', text: 'Remote' }, { id: 's', text: 'Second' }], load });
    const onErr = vi.fn();
    t.on('error', onErr);
    expect(row(t, 'r').getAttribute('aria-expanded')).toBe('false');
    const p = t.expand('r');
    expect(row(t, 'r').getAttribute('aria-busy')).toBe('true');
    await p;
    expect(visible(t)).toEqual(['r', 'r-1', 's']);
    expect(load).toHaveBeenCalledTimes(1);
    fail = true;
    await t.expand('s');
    expect(onErr).toHaveBeenCalled();
    expect(row(t, 's').getAttribute('aria-expanded')).toBe('false');
    await tick();
  });

  it('filter shows matches with their ancestors, opened; empty clears', () => {
    const t = mk();
    t.filter('two');
    expect(visible(t)).toEqual(['docs', 'b', 'b2']);
    t.filter('');
    expect(visible(t)).toEqual(['docs', 'a', 'b', 'x']);
    t.filter('zzz');
    expect(t.el.querySelector('.op-tree__empty')).not.toBeNull();
  });
});
