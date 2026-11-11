import { describe, it, expect } from 'vitest';
import { create, DateTimeField } from 'optikos';

const type = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
};

describe('DateTimeField', () => {
  it('splits the value into a date and a time and rebuilds it when either changes', () => {
    const f = create<DateTimeField>({ type: 'datetimefield', name: 'at', value: '2026-11-10T14:30' });
    const [d, tm] = Array.from(f.el.querySelectorAll('input'));
    expect(d.value).toMatch(/10/);
    expect(tm.value).toBe('14:30');
    type(tm, '0915');
    expect(f.getValue()).toBe('2026-11-10T09:15');
    f.destroy();
  });

  it('is incomplete (null and an error) with only one part', () => {
    const f = create<DateTimeField>({ type: 'datetimefield', required: false });
    f.render();
    const tm = f.el.querySelectorAll('input')[1];
    type(tm, '10:00');
    expect(f.getValue()).toBeNull();
    expect(f.validate()).toBe(false);
    f.destroy();
  });

  it('utc keeps the instant of the local date and time as an ISO string', () => {
    const local = new Date(2026, 10, 10, 14, 30);
    const f = create<DateTimeField>({ type: 'datetimefield', utc: true, value: local.toISOString() });
    const tm = f.el.querySelectorAll('input')[1];
    expect(tm.value).toBe('14:30');
    type(tm, '15:45');
    expect(f.getValue()).toBe(new Date(2026, 10, 10, 15, 45).toISOString());
    f.destroy();
  });
});
