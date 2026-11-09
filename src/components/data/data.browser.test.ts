// Real browser: inline editing with real pointer and keyboard events.
import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { create, Store, Grid, cellEditing } from 'optikos';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Grid cellEditing (browser)', () => {
  it('double click, type, Tab to the next cell, Enter: the store has the new values and the focus is back on the grid', async () => {
    const store = new Store({ data: [{ id: 1, name: 'Ada', city: 'Lisbon' }, { id: 2, name: 'Alan', city: 'Porto' }] });
    const g = create<Grid>({ type: 'grid', renderTo: document.body, height: 240, store, plugins: [cellEditing()], columns: [{ field: 'id' }, { field: 'name', editor: true }, { field: 'city', editor: true }] } as never);
    await userEvent.dblClick(g.getCell(0, 'name')!);
    await userEvent.keyboard('{Control>}a{/Control}Grace');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement?.closest('.op-grid__cell')).toBe(g.getCell(0, 'city'));
    await userEvent.keyboard('{Control>}a{/Control}Recife{Enter}');
    expect(store.getAt(0)!.data).toMatchObject({ name: 'Grace', city: 'Recife' });
    expect(document.activeElement?.getAttribute('role')).toBe('grid');
    expect(g.getCell(0, 'city')!.textContent).toBe('Recife');
  });
});
