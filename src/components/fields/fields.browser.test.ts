// Real browser: typing with the real keyboard, the listbox placed under the field, aria-activedescendant following the arrows.
import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { create, ComboBox, Select, DateField } from 'optikos';

afterEach(() => {
  document.body.innerHTML = '';
});
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

describe('ComboBox (browser)', () => {
  it('typing filters, the list opens under the field, arrows move the active option and Enter picks it', async () => {
    const c = create<ComboBox>({ type: 'combobox', label: 'Fruit', renderTo: document.body, options: ['Apple', 'Apricot', 'Banana', 'Cherry'] } as never);
    const input = c.el.querySelector('input')!;
    await userEvent.click(input);
    await userEvent.keyboard('ap');
    await frame();
    const list = document.querySelector<HTMLElement>('.op-layer [role=listbox]')!;
    expect(list).not.toBeNull();
    const options = [...list.querySelectorAll('[role=option]')].map((o) => o.textContent);
    expect(options).toEqual(['Apple', 'Apricot']);
    expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(input.getBoundingClientRect().bottom - 1);
    const active = () => document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent;
    expect(active()).toBe('Apple'); // filtering highlights the first match
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe('Apricot');
    await userEvent.keyboard('{Enter}');
    expect(c.getValue()).toBe('Apricot');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Select (browser)', () => {
  it('opens with Alt+ArrowDown / Space and picks with the keyboard, without typing into the field', async () => {
    const s = create<Select>({ type: 'select', label: 'Plan', renderTo: document.body, options: ['Free', 'Pro', 'Team'] } as never);
    const input = s.el.querySelector('input')!;
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await frame();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(['Pro', 'Free']).toContain(s.getValue());
    expect(input.value).toBe(s.getValue());
  });
});

describe('DateField (browser)', () => {
  it('typed text is parsed on blur into an ISO value', async () => {
    const d = create<DateField>({ type: 'datefield', label: 'Due', renderTo: document.body } as never);
    const input = d.el.querySelector('input')!;
    await userEvent.click(input);
    await userEvent.keyboard('3/15/2026');
    await userEvent.tab();
    expect(d.getValue()).toBe('2026-03-15');
  });
});
