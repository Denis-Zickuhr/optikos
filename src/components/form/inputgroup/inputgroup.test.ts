import { describe, it, expect, vi } from 'vitest';
import { create, Form, InputGroup } from 'optikos';

describe('InputGroup', () => {
  it('joins text around the field box; the text describes the input (also after the help or error changes)', () => {
    const g = create<InputGroup>({ type: 'inputgroup', prefix: 'https://', suffix: '.com', items: [{ type: 'textfield', name: 'site', label: 'Website', help: 'Your domain' }] } as any);
    g.render();
    const field = g.getField()!;
    const row = field.el.querySelector('.op-field__control > .op-inputgroup__row')!;
    expect(Array.from(row.children).map((c) => c.className.split(' ')[0])).toEqual(['op-inputgroup__affix', 'op-textfield__wrap', 'op-inputgroup__affix']);
    const input = field.el.querySelector('input')!;
    const read = () => input.getAttribute('aria-describedby')!.split(' ').map((id) => g.el.querySelector(`#${id}`)!.textContent);
    expect(read()).toEqual(['Your domain', 'https://', '.com']);
    field.setError('Taken');
    expect(read()).toEqual(['Taken', 'Your domain', 'https://', '.com']);
    expect(field.el.classList.contains('has-prefix')).toBe(true);
    g.setPrefix(undefined);
    expect(field.el.classList.contains('has-prefix')).toBe(false);
    expect(row.children).toHaveLength(2);
  });

  it('a button affix calls its handler with the field; works with any field (a Select, a NumberField)', () => {
    const handler = vi.fn();
    const g = create<InputGroup>({ type: 'inputgroup', prefix: 'R$', suffix: { icon: 'x', ariaLabel: 'Clear', handler }, items: [{ type: 'numberfield', name: 'price', label: 'Price' }] } as any);
    const btn = g.el.querySelector<HTMLButtonElement>('.op-inputgroup__btn')!;
    expect(btn.getAttribute('aria-label')).toBe('Clear');
    btn.click();
    expect(handler).toHaveBeenCalledWith(g.getField());
    const s = create<InputGroup>({ type: 'inputgroup', suffix: 'kg', items: [{ type: 'select', name: 'w', label: 'Weight', options: ['1', '2'] }] } as any);
    expect(s.el.querySelector('.op-inputgroup__affix')!.textContent).toBe('kg');
  });

  it('the field inside is still a form field (name, value, validation)', () => {
    const f = create<Form>({ type: 'form', items: [{ type: 'inputgroup', prefix: 'R$', items: [{ type: 'numberfield', name: 'price', label: 'Price', required: true }] }] } as any);
    expect(f.getValues()).toEqual({ price: null });
    expect(f.validate()).toBe(false);
  });
});
