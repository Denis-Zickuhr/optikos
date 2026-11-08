import { describe, it, expect, vi } from 'vitest';
import { create, TextField, validators } from 'optikos';

const make = (cfg: object = {}) => create<TextField>({ type: 'textfield', name: 'n', label: 'Name', ...cfg });
const type = (f: TextField, text: string) => {
  const i = f.getInput();
  i.value = text;
  i.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('TextField', () => {
  it('shows label/placeholder/attrs and tracks typed value', () => {
    const f = make({ placeholder: 'Your name', maxLength: 5, inputType: 'email', value: 'a' });
    const input = f.getInput() as HTMLInputElement;
    expect(input.placeholder).toBe('Your name');
    expect(input.maxLength).toBe(5);
    expect(input.type).toBe('email');
    expect(input.value).toBe('a');
    const change = vi.fn();
    f.on('change', change);
    type(f, 'abc');
    expect(f.getValue()).toBe('abc');
    expect(change).toHaveBeenCalledWith('abc', 'a');
    expect(f.el.classList.contains('has-value')).toBe(true);
  });

  it('setters and states', () => {
    const f = make();
    f.setPlaceholder('x');
    f.setDisabled(true);
    f.setReadonly(true);
    f.setValue('hello');
    const input = f.getInput() as HTMLInputElement;
    expect(input.placeholder).toBe('x');
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe('hello');
  });

  it('emits enter and clears with Esc / clear button when clearable', () => {
    const f = make({ clearable: true, value: 'abc' });
    const enter = vi.fn();
    f.on('enter', enter);
    const input = f.getInput();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(enter).toHaveBeenCalledWith('abc');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(f.getValue()).toBe('');
    f.setValue('zz');
    (f.el.querySelector('.op-textfield__clear') as HTMLElement).click();
    expect(f.getValue()).toBe('');
  });

  it('validates required, minLength, pattern and custom validators', () => {
    const f = make({ required: true, minLength: 3, pattern: '^[a-z]+$', validators: [validators.maxLength(5)] });
    expect(f.validate()).toBe(false);
    type(f, 'ab');
    expect(f.getError()).toMatch(/at least 3/);
    type(f, 'ab1');
    expect(f.getError()).toBe('Invalid format');
    type(f, 'abcdefg');
    expect(f.getError()).toMatch(/at most 5/);
    type(f, 'abcd');
    expect(f.getError()).toBe('');
  });

  it('label is bound, error is announced via aria', () => {
    const f = make({ required: true });
    f.validate();
    const input = f.getInput();
    expect(f.el.querySelector('label')!.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(f.el.querySelector('[role=alert]')?.textContent).toBe('This field is required');
  });

  it('destroy removes it from the DOM and drops listeners', () => {
    const f = make();
    f.mount();
    const input = f.getInput();
    f.destroy();
    expect(document.body.contains(f.el)).toBe(false);
    expect(() => type(f, 'x')).not.toThrow();
    expect(input.isConnected).toBe(false);
  });
});
