import { describe, it, expect, vi } from 'vitest';
import { create, Form, Model } from 'optikos';

const make = (cfg: object = {}) =>
  create<Form>({
    type: 'form',
    items: [
      { type: 'textfield', name: 'name', label: 'Name', required: true },
      { type: 'textfield', name: 'address.city', label: 'City' },
      { type: 'container', items: [{ type: 'textfield', name: 'email' }] },
    ],
    ...cfg,
  });

describe('Form', () => {
  it('finds nested fields and reads nested values', () => {
    const f = make();
    expect(f.getFields()).toHaveLength(3);
    f.getField('name')!.setValue('Ann');
    f.getField('address.city')!.setValue('Rome');
    expect(f.getValues()).toEqual({ name: 'Ann', address: { city: 'Rome' }, email: '' });
  });

  it('load fills fields (nested), marks clean and clears errors; Model accepted', () => {
    const f = make();
    f.validate();
    f.load({ name: 'Bob', address: { city: 'Oslo' } });
    expect(f.getField('name')!.getValue()).toBe('Bob');
    expect(f.getField('address.city')!.getValue()).toBe('Oslo');
    expect(f.isDirty()).toBe(false);
    expect(f.getField('name')!.getError()).toBe('');
    f.load(new Model({ id: 1, name: 'Cy' }));
    expect(f.getField('name')!.getValue()).toBe('Cy');
  });

  it('tracks dirty, dirtyOnly values, reset and updateRecord', () => {
    const f = make();
    const model = new Model({ id: 1, name: 'A', address: { city: 'X' }, email: 'e' });
    f.load(model);
    f.getField('address.city')!.setValue('Y');
    expect(f.isDirty()).toBe(true);
    expect(f.getValues({ dirtyOnly: true })).toEqual({ address: { city: 'Y' } });
    f.updateRecord(model);
    expect(model.get('address')).toEqual({ city: 'Y' });
    expect(model.isDirty()).toBe(true);
    f.reset();
    expect(f.isDirty()).toBe(false);
    expect(f.getField('address.city')!.getValue()).toBe('X');
  });

  it('validate marks errors, focuses first invalid and emits invalid', () => {
    const f = make();
    f.mount();
    const invalid = vi.fn();
    f.on('invalid', invalid);
    expect(f.validate()).toBe(false);
    expect(document.activeElement).toBe((f.getField('name') as any).getInput());
    expect(invalid).toHaveBeenCalled();
    expect(f.el.classList.contains('is-invalid')).toBe(true);
    f.destroy();
  });

  it('submit: before-submit can cancel, invalid blocks, valid emits values', () => {
    const f = make();
    const submit = vi.fn();
    f.on('submit', submit);
    expect(f.submit()).toBe(false);
    f.getField('name')!.setValue('Z');
    const off = f.on('before-submit', () => false);
    expect(f.submit()).toBe(false);
    off();
    expect(f.submit()).toBe(true);
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Z' }));
  });

  it('Enter in a field and native submit both submit', () => {
    const f = make();
    f.mount();
    f.getField('name')!.setValue('Z');
    const submit = vi.fn();
    f.on('submit', submit);
    (f.getField('email') as any).getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(submit).toHaveBeenCalledTimes(1);
    f.el.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(submit).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('labelPos, readonly and disabled propagate', () => {
    const f = make({ labelPos: 'left', readonly: true });
    f.el;
    expect(f.getField('name')!.el.classList.contains('op-field--label-left')).toBe(true);
    f.setDisabled(true);
    expect(f.getFields().every((x) => x.el.classList.contains('is-disabled'))).toBe(true);
    expect(f.getFields().every((x) => x.el.classList.contains('is-readonly'))).toBe(true);
  });
});
