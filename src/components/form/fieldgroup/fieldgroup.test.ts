import { describe, it, expect, vi } from 'vitest';
import { create, Form, FieldGroup, TextField } from 'optikos';

const phone = (extra: object = {}) => ({
  type: 'fieldgroup', label: 'Phone', help: 'We only call about orders', ...extra,
  items: [
    { type: 'select', name: 'phone.country', label: 'Country code', options: ['+351', '+55'], value: '+351', width: 110 },
    { type: 'textfield', name: 'phone.number', label: 'Number', required: true, pattern: '^[0-9 ]+$' },
  ],
});

describe('FieldGroup', () => {
  it('one role=group named by its label and described by its help; the fields keep their names and (hidden) labels', () => {
    const f = create<Form>({ type: 'form', items: [phone()] } as any);
    const g = f.items[0] as FieldGroup;
    expect(g.el.getAttribute('role')).toBe('group');
    expect(document.getElementById(g.el.getAttribute('aria-labelledby')!)?.textContent ?? g.el.querySelector(`#${g.el.getAttribute('aria-labelledby')}`)!.textContent).toBe('Phone');
    expect(g.el.querySelector(`#${g.el.getAttribute('aria-describedby')}`)!.textContent).toBe('We only call about orders');
    expect(g.el.classList.contains('is-required')).toBe(true); // a field inside is required
    expect(g.getFields().map((x) => x.name)).toEqual(['phone.country', 'phone.number']);
    expect(f.getValues()).toEqual({ phone: { country: '+351', number: '' } });
    expect(g.getBody().querySelectorAll('.op-field__label')[1].textContent).toBe('Number');
    expect(['none', '0 0 auto']).toContain(g.getFields()[0].el.style.flex); // it set a width: it keeps it
    expect(g.getFields()[1].el.style.flex).toBe('');
  });

  it('shows the first error of its fields in its own error line, and clears it', () => {
    const f = create<Form>({ type: 'form', items: [phone()] } as any);
    const g = f.items[0] as FieldGroup;
    const invalid = vi.fn();
    g.on('invalid', invalid);
    expect(f.validate()).toBe(false);
    const err = g.el.querySelector(':scope > .op-field__error')!;
    expect(err.textContent).toBe('This field is required');
    expect(g.el.classList.contains('is-invalid')).toBe(true);
    expect(g.el.getAttribute('aria-describedby')).toContain(err.id);
    expect(invalid).toHaveBeenCalledWith('This field is required');
    (f.getField('phone.number') as TextField).setValue('912 345 678');
    f.validate();
    expect(err.textContent).toBe('');
    expect(g.getError()).toBe('');
  });

  it('follows the form label position; inner fields always stack their labels', () => {
    const f = create<Form>({ type: 'form', labelPos: 'left', items: [phone(), { type: 'textfield', name: 'x', label: 'X' }] } as any);
    f.render();
    const g = f.items[0] as FieldGroup;
    expect(g.el.classList.contains('op-field--label-left')).toBe(true);
    expect(g.getFields()[1].el.classList.contains('op-field--label-left')).toBe(false);
    expect(f.getField('x')!.el.classList.contains('op-field--label-left')).toBe(true);
    g.setLabel('Mobile');
    expect(g.el.querySelector(':scope > .op-field__label')!.textContent).toBe('Mobile');
  });
});
