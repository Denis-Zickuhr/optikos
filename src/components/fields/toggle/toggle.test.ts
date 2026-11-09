import { describe, it, expect, vi } from 'vitest';
import { create, Toggle, Form } from 'optikos';

describe('Toggle', () => {
  it('is a switch: role, checked state, change event, value in a form', () => {
    const form = create<Form>({ type: 'form', renderTo: document.body, items: [{ type: 'toggle', name: 'mail', boxLabel: 'Email me', value: true }] });
    const t = form.getField('mail') as Toggle;
    const input = t.el.querySelector('input')!;
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.getAttribute('aria-checked')).toBe('true');
    expect(t.el.classList.contains('is-checked')).toBe(true);
    const change = vi.fn();
    t.on('change', change);
    input.click();
    expect(t.getValue()).toBe(false);
    expect(input.getAttribute('aria-checked')).toBe('false');
    expect(change).toHaveBeenCalledWith(false, true);
    expect(form.getValues()).toEqual({ mail: false });
    form.destroy();
  });

  it('has no third state and respects readonly/disabled', () => {
    const t = create<Toggle>({ type: 'toggle', boxLabel: 'Dark mode', indeterminate: true, readonly: true, renderTo: document.body } as never);
    const input = t.el.querySelector('input')!;
    expect(input.getAttribute('aria-checked')).toBe('false');
    input.click();
    expect(t.getValue()).toBe(false);
    t.setDisabled(true);
    expect(input.disabled).toBe(true);
    t.destroy();
  });
});
