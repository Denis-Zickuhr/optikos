import { describe, it, expect, afterEach } from 'vitest';
import { create, Form, FieldList, Menu, Window, NumberField, Store, setPermissionResolver, setPermissionMode, setLocale, setCurrency } from 'optikos';

afterEach(() => {
  document.body.innerHTML = '';
  setPermissionResolver(undefined);
  setPermissionMode('hide');
  setLocale('en');
});
const lookup = { store: () => new Store({ data: [] }), columns: [{ field: 'name' }], filters: [{ name: 'name' }] };

describe('a lookup that shows its text from the loaded record', () => {
  it('displayFrom fills the text of the value, in a form and inside a FieldList row', () => {
    const f = create<Form>({
      type: 'form',
      items: [
        { type: 'lookupfield', name: 'event', displayFrom: 'eventName', lookup },
        { type: 'fieldlist', name: 'rows', items: [{ type: 'lookupfield', name: 'event', displayFrom: 'eventName', lookup }] },
      ],
    } as any);
    document.body.append(f.el);
    f.load({ event: 7, eventName: 'Gala', rows: [{ event: 8, eventName: 'Final' }] });
    expect(f.getField('event')!.getDisplayText()).toBe('Gala');
    expect(f.getValues().event).toBe(7);
    expect((f.getField('rows') as FieldList).getRowFields(0)[0].getDisplayText()).toBe('Final');
    expect(f.isDirty()).toBe(false);
  });

  it('setValue takes { value, label } too', () => {
    const l = create<any>({ type: 'lookupfield', lookup });
    l.setValue({ value: 3, label: 'Three' });
    expect(l.getValue()).toBe(3);
    expect(l.getDisplayText()).toBe('Three');
  });
});

describe('Form.setErrors', () => {
  const make = () => {
    const f = create<Form>({
      type: 'form',
      items: [
        { type: 'textfield', name: 'slug' },
        { type: 'fieldlist', name: 'criteria', items: [{ type: 'textfield', name: 'name' }], value: [{ name: 'a' }, { name: 'b' }] },
      ],
    } as any);
    document.body.append(f.el);
    return f;
  };

  it('marks fields and list rows by dotted path and focuses the first', () => {
    const f = make();
    const bad = f.setErrors({ 'criteria.1.name': 'Taken', slug: 'In use', 'nope.x': '?' });
    expect(f.getField('slug')!.getError()).toBe('In use');
    expect((f.getField('criteria') as FieldList).getRowFields(1)[0].getError()).toBe('Taken');
    expect(bad).toEqual(['nope.x']);
    expect(f.el.classList.contains('is-invalid')).toBe(true);
    f.setErrors({});
    expect(f.getField('slug')!.getError()).toBe('');
  });
});

describe('permission', () => {
  it('hides, or disables, what the resolver denies', () => {
    setPermissionResolver((p) => p !== 'no');
    const a = create({ type: 'button', text: 'a', permission: 'no' });
    const b = create({ type: 'button', text: 'b', permission: 'yes' });
    expect(a.el.hidden).toBe(true);
    a.show();
    expect(a.el.hidden).toBe(true);
    expect(b.el.hidden).toBe(false);
    setPermissionMode('disable');
    const c = create({ type: 'button', text: 'c', permission: 'no' });
    c.setDisabled(false);
    expect(c.el.classList.contains('is-disabled')).toBe(true);
    const d = create({ type: 'button', text: 'd', permission: 'no', permissionMode: 'hide' });
    expect(d.el.hidden).toBe(true);
  });

  it('a Tabs leaves out the panel the user may not see', () => {
    setPermissionResolver((p) => p !== 'no');
    const t = create<any>({ type: 'tabs', renderTo: document.body, items: [{ type: 'container', title: 'A' }, { type: 'container', title: 'B', permission: 'no' }] });
    expect(Array.from(t.el.querySelectorAll('.op-tabs__tab')).map((x: any) => x.textContent)).toEqual(['A']);
  });

  it('filters menu items, and a Grid keeps only the actions and columns allowed', () => {
    setPermissionResolver((p) => p !== 'no');
    const m = create<Menu>({ type: 'menu', items: [{ text: 'ok' }, { text: 'gone', permission: 'no' }] });
    m.showAt?.(0, 0);
    const g = create<any>({ type: 'grid', data: [{ a: 1 }], columns: [{ field: 'a' }, { field: 'b', permission: 'no' }], rowActions: [{ text: 'del', permission: 'no', handler() {} }] });
    g.render();
    expect(g.config.columns).toHaveLength(1);
    expect(g.config.rowActions).toHaveLength(0);
    expect(document.body.textContent).not.toContain('gone');
  });
});

describe('NumberField formats and scale', () => {
  const num = (cfg: object) => create<NumberField>({ type: 'numberfield', ...cfg } as any);
  const type = (f: NumberField, text: string) => {
    const i = f.el.querySelector('input')!;
    i.value = text;
    i.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('one code shows R$ 1.234,56 and $1,234.56, with cents kept as an integer', () => {
    setLocale('pt-BR');
    const pt = num({ format: 'currency', scale: 100, value: 123456 });
    expect(pt.el.querySelector('input')!.value.replace(/\s/g, ' ')).toBe('R$ 1.234,56');
    type(pt, 'R$ 99,90');
    expect(pt.getValue()).toBe(9990);
    setLocale('en');
    setCurrency('USD');
    const en = num({ format: 'currency', scale: 100, value: 123456 });
    expect(en.el.querySelector('input')!.value).toBe('$1,234.56');
    type(en, '$2,000.5');
    expect(en.getValue()).toBe(200050);
    expect(num({ format: 'currency', locale: 'pt-BR', currency: 'BRL', value: 5 }).el.querySelector('input')!.value).toMatch(/5,00/);
  });

  it('percent stores the fraction', () => {
    const f = num({ format: 'percent', value: 0.15 });
    expect(f.el.querySelector('input')!.value).toBe('15%');
    type(f, '12,5%'.replace(',', '.'));
    expect(f.getValue()).toBe(0.125);
  });
});

describe('Window confirmDiscard', () => {
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const press = (text: string) => Array.from(document.querySelectorAll<HTMLButtonElement>('.op-messagebox button')).find((b) => b.textContent!.includes(text))!.click();

  it('closes at once when nothing changed, asks when a field did, and keeps or discards', async () => {
    const clean = create<Window>({ type: 'window', confirmDiscard: true, items: [{ type: 'textfield', name: 'x' }] });
    clean.show();
    clean.close();
    expect(clean.destroyed).toBe(true);

    const w = create<Window>({ type: 'window', confirmDiscard: true, items: [{ type: 'textfield', name: 'x' }] });
    w.show();
    (w.query((c) => (c.config as any).name === 'x')[0] as any).setValue('typed');
    w.close();
    await tick();
    expect(w.destroyed).toBe(false);
    press('Keep editing');
    await tick();
    expect(w.destroyed).toBe(false);
    w.close();
    await tick();
    press('Discard');
    await tick();
    expect(w.destroyed).toBe(true);
  });
});
