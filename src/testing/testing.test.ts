import { describe, it, expect, afterEach } from 'vitest';
import { create, Form, Grid, Store, LookupField, registerLookup } from 'optikos';
import { fill, submit, errors, clickRow, loaded, pickLookup, text, type as typeInto } from 'optikos/testing';

afterEach(() => (document.body.innerHTML = ''));

describe('optikos/testing', () => {
  const mkForm = () =>
    create<Form>({
      type: 'form', renderTo: document.body,
      items: [
        { type: 'textfield', name: 'name', required: true },
        { type: 'numberfield', name: 'age' },
        { type: 'textfield', name: 'address.city' },
        { type: 'checkbox', name: 'ok' },
      ],
    } as any);

  it('fill types into text fields and sets the rest; submit returns the values or null', async () => {
    const f = mkForm();
    expect(await submit(f)).toBeNull();
    expect(errors(f)).toEqual({ name: 'This field is required' });
    const values = await submit(f, { name: 'Ada', age: 36, address: { city: 'London' }, ok: true });
    expect(values).toEqual({ name: 'Ada', age: 36, address: { city: 'London' }, ok: true });
    expect(() => fill(f, { nope: 1 })).toThrow(/no field "nope"/);
  });

  it('typeInto goes through input events (parsing runs)', () => {
    const f = mkForm();
    typeInto(f.getField('age')!, '12');
    expect(f.getField('age')!.getValue()).toBe(12);
  });

  it('clickRow selects by index or predicate; loaded waits for a remote store', async () => {
    const store = new Store<{ id: number; n: string }>({ proxy: async () => [{ id: 1, n: 'a' }, { id: 2, n: 'b' }], autoLoad: true });
    await loaded(store);
    const g = create<Grid>({ type: 'grid', store, columns: [{ field: 'n' }], renderTo: document.body });
    expect(clickRow(g, (r) => r.get('n') === 'b').id).toBe(2);
    expect(g.getSelection().map((r) => r.id)).toEqual([2]);
    expect(() => clickRow(g, 9)).toThrow();
    expect(text(g)).toContain('a');
  });

  it('pickLookup opens the window, picks a row and returns the value', async () => {
    registerLookup('people', { store: () => new Store({ data: [{ id: 7, name: 'Ana' }, { id: 8, name: 'Bia' }] }), columns: [{ field: 'name' }], filters: [{ type: 'textfield', name: 'name' }] });
    const l = create<LookupField>({ type: 'lookupfield', lookup: 'people', renderTo: document.body });
    expect(await pickLookup(l, 1)).toBe(8);
    expect(l.getDisplayText()).toBe('Bia');
  });
});
