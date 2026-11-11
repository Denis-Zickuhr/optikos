import { describe, it, expect, afterEach } from 'vitest';
import { create, Grid, Store, rowEditing } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const mk = (cfg = {}) => {
  const g = create<Grid>({
    type: 'grid', renderTo: document.body, store: new Store({ data: [{ id: 1, name: 'Ana', qty: 2, note: 'x' }, { id: 2, name: 'Bia', qty: 5, note: 'y' }] }),
    plugins: [rowEditing()],
    columns: [{ field: 'name', editor: { type: 'textfield', required: true } }, { field: 'qty', editor: 'numberfield' }, { field: 'note' }],
    ...cfg,
  } as any);
  return g;
};
const row = (g: Grid, i: number) => document.getElementById(`${g.id}-r${i}`)!;
const open = (g: Grid, i = 0) => row(g, i).querySelector('.op-grid__cell')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
const inputs = (g: Grid, i = 0) => Array.from(row(g, i).querySelectorAll<HTMLInputElement>('input'));
const type = (el: HTMLInputElement, v: string) => ((el.value = v), el.dispatchEvent(new Event('input', { bubbles: true })));
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));

describe('rowEditing', () => {
  it('opens every editor column of the row under a Save / Cancel bar, and Save writes the changes', () => {
    const g = mk();
    const edits: unknown[][] = [];
    g.on('edit', (...a: unknown[]) => edits.push(a));
    open(g);
    expect(inputs(g)).toHaveLength(2);
    expect(row(g, 0).querySelectorAll('.op-grid__rowbar button')).toHaveLength(2);
    expect(row(g, 0).children[2].classList.contains('is-editing')).toBe(false); // note has no editor
    type(inputs(g)[0], 'Anna');
    type(inputs(g)[1], '9');
    (row(g, 0).querySelector('.op-grid__rowbtn.is-primary') as HTMLElement).click();
    expect(inputs(g)).toHaveLength(0);
    expect(g.getStore().getAt(0)!.data).toMatchObject({ name: 'Anna', qty: 9 });
    expect(g.getStore().getAt(0)!.isDirty()).toBe(true);
    expect(edits[0][1]).toEqual({ name: 'Anna', qty: 9 });
    expect(edits[0][2]).toEqual({ name: 'Ana', qty: 2 });
  });

  it('an invalid field keeps the row open; Esc cancels and keeps the old values', () => {
    const g = mk();
    const cancelled: unknown[] = [];
    g.on('cancel-edit', (r: unknown) => cancelled.push(r));
    open(g, 1);
    type(inputs(g, 1)[0], '');
    (row(g, 1).querySelector('.op-grid__rowbtn.is-primary') as HTMLElement).click();
    expect(inputs(g, 1)).toHaveLength(2);
    expect(row(g, 1).querySelector('.is-invalid')).not.toBeNull();
    key(inputs(g, 1)[0], 'Escape');
    expect(inputs(g, 1)).toHaveLength(0);
    expect(g.getStore().getAt(1)!.get('name')).toBe('Bia');
    expect(cancelled).toHaveLength(1);
  });

  it('Enter saves, F2 starts from the keyboard, before-edit can refuse, and Tab wraps inside the row', () => {
    const g = mk();
    g.focusRow(0);
    const table = g.el.querySelector('[role=grid]')!;
    key(table, 'F2');
    expect(inputs(g)).toHaveLength(2);
    type(inputs(g)[1], '7');
    key(inputs(g)[1], 'Enter');
    expect(g.getStore().getAt(0)!.get('qty')).toBe(7);

    open(g);
    const buttons = row(g, 0).querySelectorAll<HTMLElement>('.op-grid__rowbtn');
    buttons[1].focus();
    key(buttons[1], 'Tab');
    expect(document.activeElement).toBe(inputs(g)[0]);
    key(inputs(g)[0], 'Escape');

    g.on('before-edit', () => false);
    open(g, 1);
    expect(inputs(g, 1)).toHaveLength(0);
  });

  it('opening another row saves the first one; a row not editable is left alone', () => {
    const g = mk();
    open(g);
    type(inputs(g)[0], 'Changed');
    open(g, 1);
    expect(g.getStore().getAt(0)!.get('name')).toBe('Changed');
    expect(inputs(g, 0)).toHaveLength(0);
    expect(inputs(g, 1)).toHaveLength(2);
    const g2 = mk({ columns: [{ field: 'name', editor: true, editable: () => false }] });
    open(g2);
    expect(row(g2, 0).querySelector('input')).toBeNull();
  });
});
