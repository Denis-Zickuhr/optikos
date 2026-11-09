import { describe, it, expect, vi } from 'vitest';
import { create, CheckboxGroup, Form } from 'optikos';

const opts = ['Email', 'SMS', { value: 'push', label: 'Push', disabled: true }];

describe('CheckboxGroup', () => {
  it('value is the checked values in option order; change, dirty, group labelled by the field label', () => {
    const g = create<CheckboxGroup>({ type: 'checkboxgroup', label: 'Channels', options: opts, value: ['SMS'], renderTo: document.body } as never);
    const inputs = [...g.el.querySelectorAll<HTMLInputElement>('input')];
    const group = g.el.querySelector('[role=group]')!;
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe('Channels');
    expect(inputs.map((i) => i.checked)).toEqual([false, true, false]);
    expect(inputs[2].disabled).toBe(true);
    const change = vi.fn();
    g.on('change', change);
    inputs[0].click();
    expect(g.getValue()).toEqual(['Email', 'SMS']);
    expect(change).toHaveBeenCalledWith(['Email', 'SMS'], ['SMS']);
    expect(g.isDirty()).toBe(true);
    expect(inputs[0].closest('label')!.classList.contains('is-checked')).toBe(true);
    expect(g.getDisplayText()).toBe('Email, SMS');
    g.setValue([]);
    expect(inputs.every((i) => !i.checked)).toBe(true);
    g.destroy();
  });

  it('required means at least one; works in a form', () => {
    const form = create<Form>({ type: 'form', renderTo: document.body, items: [{ type: 'checkboxgroup', name: 'days', label: 'Days', required: true, options: ['Mon', 'Tue'] }] });
    expect(form.validate()).toBe(false);
    form.setValues({ days: ['Tue'] });
    expect(form.validate()).toBe(true);
    expect(form.getValues()).toEqual({ days: ['Tue'] });
    form.destroy();
  });
});
