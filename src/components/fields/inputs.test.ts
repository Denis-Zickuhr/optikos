import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, setLocale, date } from 'optikos';

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const cleanup: Array<{ destroy(): void }> = [];
const mk = (cfg: object): any => {
  const c = create(cfg as any) as any;
  c.mount();
  cleanup.push(c);
  return c;
};
const type = (f: any, text: string) => {
  f.getInput().value = text;
  f.getInput().dispatchEvent(new Event('input', { bubbles: true }));
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
  setLocale('en');
});

describe('TimeField', () => {
  it('normalizes typed digits to HH:mm, flags text that is not a time, steps with the arrows', () => {
    const f = mk({ type: 'timefield', label: 'At' });
    type(f, '930');
    expect(f.getValue()).toBe('09:30');
    type(f, '9');
    expect(f.getValue()).toBe('09:00');
    type(f, '2561');
    expect(f.getValue()).toBeNull();
    expect(f.validate()).toBe(false);
    f.setValue('23:59');
    key(f.getInput(), 'ArrowUp');
    expect(f.getValue()).toBe('00:00');
    key(f.getInput(), 'PageDown');
    expect(f.getValue()).toBe('23:00');
  });

  it('min/max stop the arrows and validate typed values', () => {
    const f = mk({ type: 'timefield', min: '08:00', max: '18:00', step: 15, value: '17:50' });
    key(f.getInput(), 'ArrowUp');
    expect(f.getValue()).toBe('18:00');
    type(f, '1900');
    expect(f.validate()).toBe(false);
    type(f, '1200');
    expect(f.validate()).toBe(true);
  });
});

describe('NumberField', () => {
  it('parses to numbers, null when empty, flags garbage', () => {
    const f = mk({ type: 'numberfield', label: 'Qty' });
    type(f, '12.5');
    expect(f.getValue()).toBe(12.5);
    type(f, '');
    expect(f.getValue()).toBeNull();
    type(f, 'abc');
    expect(f.getValue()).toBeNull();
    expect(f.validate()).toBe(false);
    expect(f.getError()).toBe('Enter a valid number');
    f.setValue(3);
    expect(f.getInput().value).toBe('3');
  });

  it('min/max/step/decimals and keyboard', () => {
    const f = mk({ type: 'numberfield', min: 0, max: 10, step: 2.5, decimals: 1, value: 1 });
    const input = f.getInput();
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-valuemax')).toBe('10');
    key(input, 'ArrowUp');
    expect(f.getValue()).toBe(3.5);
    key(input, 'PageUp');
    expect(f.getValue()).toBe(10);
    key(input, 'ArrowDown');
    expect(f.getValue()).toBe(7.5);
    f.setValue(11);
    expect(f.validate()).toBe(false);
    expect(f.getError()).toMatch(/between 0 and 10/);
    f.setMax(undefined);
    expect(f.validate()).toBe(true);
    f.setMin(5);
    f.setValue(2);
    f.validate();
    expect(f.getError()).toBe('Must be at least 5');
    input.value = '7';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('7.0');
  });

  it('uses a decimal comma in pt-BR', () => {
    setLocale('pt-BR');
    const f = mk({ type: 'numberfield', decimals: 2 });
    type(f, '1.234,5');
    expect(f.getValue()).toBe(1234.5);
    f.setValue(2.5);
    expect(f.getInput().value).toBe('2,50');
  });
});

describe('TextArea', () => {
  it('rows, Enter is a line break, Ctrl+Enter emits enter, form not submitted', () => {
    const f = mk({ type: 'textarea', rows: 5, value: 'a\nb' });
    expect(Number((f.getInput() as HTMLTextAreaElement).rows)).toBe(5);
    expect(f.getInput().value).toBe('a\nb');
    const enter = vi.fn();
    f.on('enter', enter);
    key(f.getInput(), 'Enter');
    expect(enter).not.toHaveBeenCalled();
    key(f.getInput(), 'Enter', { ctrlKey: true });
    expect(enter).toHaveBeenCalledWith('a\nb');
    f.setRows(2);
    expect(Number((f.getInput() as HTMLTextAreaElement).rows)).toBe(2);
  });
});

describe('Checkbox', () => {
  it('toggles, emits change, supports indeterminate and required meaning "checked"', () => {
    const c = mk({ type: 'checkbox', label: 'Terms', boxLabel: 'I agree', required: true });
    const input = c.el.querySelector('input') as HTMLInputElement;
    expect(c.el.textContent).toContain('I agree');
    expect(c.validate()).toBe(false);
    const change = vi.fn();
    c.on('change', change);
    input.click();
    expect(c.getValue()).toBe(true);
    expect(change).toHaveBeenCalledWith(true, false);
    expect(c.validate()).toBe(true);
    expect(c.el.classList.contains('is-checked')).toBe(true);
    c.setIndeterminate(true);
    expect(input.getAttribute('aria-checked')).toBe('mixed');
    expect(c.el.classList.contains('is-indeterminate')).toBe(true);
    input.click();
    expect(c.config.indeterminate).toBe(false);
    expect(c.getValue()).toBe(false); // the native click unchecked it
    c.toggle();
    expect(c.getValue()).toBe(true);
  });

  it('readonly ignores clicks; disabled disables the input', () => {
    const c = mk({ type: 'checkbox', readonly: true });
    const input = c.el.querySelector('input') as HTMLInputElement;
    input.click();
    expect(c.getValue()).toBe(false);
    expect(input.checked).toBe(false);
    c.setDisabled(true);
    expect(input.disabled).toBe(true);
  });
});

describe('RadioGroup', () => {
  it('renders options, selects, labels the group, keeps one checked', () => {
    const r = mk({ type: 'radiogroup', label: 'Size', options: ['S', { value: 'm', label: 'Medium' }, { value: 'l', label: 'Large', disabled: true }], direction: 'horizontal', value: 'S' });
    const inputs = r.el.querySelectorAll('input[type=radio]') as NodeListOf<HTMLInputElement>;
    expect(inputs).toHaveLength(3);
    expect(inputs[0].checked).toBe(true);
    expect(inputs[2].disabled).toBe(true);
    const group = r.el.querySelector('[role=radiogroup]')!;
    expect(r.el.querySelector(`#${group.getAttribute('aria-labelledby')}`)?.textContent).toBe('Size');
    const change = vi.fn();
    r.on('change', change);
    inputs[1].click();
    expect(r.getValue()).toBe('m');
    expect(change).toHaveBeenCalledWith('m', 'S');
    expect(Array.from(inputs).filter((i) => i.checked)).toHaveLength(1);
    r.setValue('S');
    expect(inputs[0].checked).toBe(true);
    r.setOptions(['x', 'y']);
    expect(r.el.querySelectorAll('input[type=radio]')).toHaveLength(2);
  });

  it('required validation', () => {
    const r = mk({ type: 'radiogroup', options: ['a', 'b'], required: true });
    expect(r.validate()).toBe(false);
    r.setValue('b');
    expect(r.validate()).toBe(true);
  });
});

describe('date utils', () => {
  it('ISO round trip, month math clamps days, week info', () => {
    expect(date.toISO(new Date(2026, 10, 7))).toBe('2026-11-07');
    expect(date.fromISO('2026-02-30')).toBeNull();
    expect(date.addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(date.addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(date.addMonths('2026-01-15', -2)).toBe('2025-11-15');
  });
  it('parses by locale order', () => {
    expect(date.parseDate('11/25/2026')).toBe('2026-11-25');
    expect(date.parseDate('2026-11-25')).toBe('2026-11-25');
    expect(date.parseDate('13/45/2026')).toBeNull();
    setLocale('pt-BR');
    expect(date.parseDate('25/11/2026')).toBe('2026-11-25');
    expect(date.parseDate('25/11/26')).toBe('2026-11-25');
    expect(date.parseDate('abc')).toBeNull();
  });
});

describe('Calendar', () => {
  it('renders the month with weekday headers and marks value/today/outside', () => {
    const c = mk({ type: 'calendar', value: '2026-11-07', firstDay: 1 });
    expect(c.el.querySelector('.op-calendar__title').textContent).toMatch(/November 2026/i);
    const days = c.el.querySelectorAll('[data-iso]');
    expect(days).toHaveLength(42);
    expect((days[0] as HTMLElement).dataset.iso).toBe('2026-10-26'); // Monday start
    expect(c.el.querySelector('.is-selected').dataset.iso).toBe('2026-11-07');
    expect(c.el.querySelector('.is-selected').getAttribute('aria-selected')).toBe('true');
    expect(c.el.querySelector('[data-iso="2026-10-26"]').classList.contains('is-outside')).toBe(true);
    expect(c.el.querySelectorAll('th')[0].textContent).toMatch(/mon/i);
  });

  it('selects on click, ignores disabled days, navigates months', () => {
    const c = mk({ type: 'calendar', value: '2026-11-07', min: '2026-11-05', max: '2026-11-20', isDisabled: (iso: string) => iso === '2026-11-10' });
    const select = vi.fn();
    const nav = vi.fn();
    c.on('select', select);
    c.on('navigate', nav);
    (c.el.querySelector('[data-iso="2026-11-04"]') as HTMLElement).click();
    (c.el.querySelector('[data-iso="2026-11-10"]') as HTMLElement).click();
    expect(select).not.toHaveBeenCalled();
    (c.el.querySelector('[data-iso="2026-11-12"]') as HTMLElement).click();
    expect(select).toHaveBeenCalledWith('2026-11-12');
    (c.el.querySelectorAll('.op-calendar__nav')[1] as HTMLElement).click();
    expect(c.el.querySelector('.op-calendar__title').textContent).toMatch(/December 2026/i);
    expect(nav).toHaveBeenCalledWith(2026, 11);
  });

  it('keyboard moves the focused day across months and selects with Enter', () => {
    const c = mk({ type: 'calendar', value: '2026-11-30' });
    c.focusDay();
    const body = c.el.querySelector('.op-calendar__body');
    const select = vi.fn();
    c.on('select', select);
    key(document.activeElement!, 'ArrowRight');
    expect((document.activeElement as HTMLElement).dataset.iso).toBe('2026-12-01');
    key(document.activeElement!, 'PageUp');
    expect((document.activeElement as HTMLElement).dataset.iso).toBe('2026-11-01');
    key(document.activeElement!, 'ArrowDown');
    expect((document.activeElement as HTMLElement).dataset.iso).toBe('2026-11-08');
    key(document.activeElement!, 'PageDown', { shiftKey: true });
    expect((document.activeElement as HTMLElement).dataset.iso).toBe('2027-11-08');
    key(document.activeElement!, 'Enter');
    expect(select).toHaveBeenCalledWith('2027-11-08');
    expect(body).not.toBeNull();
  });

  it('title switches to month picker and back', () => {
    const c = mk({ type: 'calendar', value: '2026-11-07' });
    (c.el.querySelector('.op-calendar__title') as HTMLElement).click();
    const months = c.el.querySelectorAll('.op-calendar__month');
    expect(months).toHaveLength(12);
    (months[0] as HTMLElement).click();
    expect(c.el.querySelector('.op-calendar__title').textContent).toMatch(/January 2026/i);
    expect(c.el.querySelector('[data-iso="2026-01-07"]')).not.toBeNull();
  });
});

describe('DateField', () => {
  it('displays and parses by locale, stores ISO', () => {
    const f = mk({ type: 'datefield', value: '2026-11-07', label: 'Date' });
    expect(f.getInput().value).toBe('11/07/2026');
    type(f, '12/25/2026');
    expect(f.getValue()).toBe('2026-12-25');
    type(f, 'garbage');
    expect(f.getValue()).toBeNull();
    expect(f.getError()).toBe('Enter a valid date');
    type(f, '');
    expect(f.getError()).toBe('');
    setLocale('pt-BR');
    f.setValue('2026-11-07');
    expect(f.getInput().value).toBe('07/11/2026');
  });

  it('min/max messages', () => {
    const f = mk({ type: 'datefield', min: '2026-01-10', max: '2026-01-20' });
    f.setValue('2026-01-05');
    expect(f.validate()).toBe(false);
    expect(f.getError()).toMatch(/on or after/);
    f.setValue('2026-01-25');
    expect(f.getError()).toMatch(/on or before/);
    f.setValue('2026-01-15');
    expect(f.validate()).toBe(true);
  });

  it('opens the calendar with ArrowDown or the button, picks a day, closes with Esc', () => {
    const f = mk({ type: 'datefield', value: '2026-11-07' });
    const input = f.getInput();
    key(input, 'ArrowDown');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const cal = document.querySelector('.op-layer .op-calendar')!;
    expect(cal).not.toBeNull();
    expect(document.activeElement).toBe(cal.querySelector('[data-iso="2026-11-07"]'));
    (cal.querySelector('[data-iso="2026-11-20"]') as HTMLElement).click();
    expect(f.getValue()).toBe('2026-11-20');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(input);
    (f.el.querySelector('.op-picker__trigger') as HTMLElement).click();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    key(document.body, 'Escape');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('readonly and disabled never open', () => {
    const f = mk({ type: 'datefield', readonly: true });
    f.open();
    expect(f.getInput().getAttribute('aria-expanded')).toBe('false');
    f.setReadonly(false);
    f.setDisabled(true);
    f.open();
    expect(f.getInput().getAttribute('aria-expanded')).toBe('false');
  });
});

describe('SuggestField icon', () => {
  it('shows a magnifier by default and hides it with icon: false', async () => {
    const { create } = await import('../../core/registry');
    const a = create({ type: 'suggestfield', query: () => [] });
    const b = create({ type: 'suggestfield', query: () => [], icon: false });
    expect(a.el.querySelector('.op-suggest__icon')).not.toBeNull();
    expect(b.el.querySelector('.op-suggest__icon')).toBeNull();
  });
});

describe('Calendar range / DateRangeField', () => {
  const day = (iso: string) => document.querySelector<HTMLElement>(`.op-calendar [data-iso="${iso}"]`)!;
  it('Calendar range: first click starts, second ends (swapped if earlier)', () => {
    const cal = mk({ type: 'calendar', range: true, value: { start: '2026-11-01', end: '2026-11-01' } });
    document.body.append(cal.el);
    const picks: unknown[] = [];
    cal.on('select', (r: unknown) => picks.push(r));
    day('2026-11-10').click();
    expect(day('2026-11-10').classList.contains('is-range-start')).toBe(true);
    expect(picks).toHaveLength(0);
    day('2026-11-05').click();
    expect(picks).toEqual([{ start: '2026-11-05', end: '2026-11-10' }]);
    expect(day('2026-11-07').classList.contains('is-in-range')).toBe(true);
    expect(day('2026-11-07').getAttribute('aria-selected')).toBe('true');
    expect(day('2026-11-12').getAttribute('aria-selected')).toBe('false');
  });

  it('single mode is unchanged', () => {
    const cal = mk({ type: 'calendar', value: '2026-11-03' });
    document.body.append(cal.el);
    day('2026-11-09').click();
    expect(cal.config.value).toBe('2026-11-09');
  });

  it('parses and displays a range, accepts a reversed one, rejects garbage', () => {
    const f = mk({ type: 'daterangefield', value: { start: '2026-11-01', end: '2026-11-15' } });
    expect(f.getInput().value).toBe('11/01/2026 – 11/15/2026');
    type(f, '11/20/2026 - 11/10/2026');
    expect(f.getValue()).toEqual({ start: '2026-11-10', end: '2026-11-20' });
    type(f, '11/05/2026');
    expect(f.getValue()).toEqual({ start: '2026-11-05', end: '2026-11-05' });
    type(f, 'x - y');
    expect(f.getError()).toBe('Enter a valid date');
    type(f, '');
    expect(f.getValue()).toBeNull();
  });

  it('picking two days in the popup sets the value and closes it', () => {
    const f = mk({ type: 'daterangefield', value: { start: '2026-11-01', end: '2026-11-02' } });
    key(f.getInput(), 'ArrowDown');
    day('2026-11-04').click();
    day('2026-11-09').click();
    expect(f.getValue()).toEqual({ start: '2026-11-04', end: '2026-11-09' });
    expect(f.getInput().getAttribute('aria-expanded')).toBe('false');
  });

  it('min/max validation uses the whole range', () => {
    const f = mk({ type: 'daterangefield', min: '2026-11-05', max: '2026-11-20' });
    f.setValue({ start: '2026-11-01', end: '2026-11-10' });
    expect(f.validate()).toBe(false);
    f.setValue({ start: '2026-11-06', end: '2026-11-25' });
    expect(f.validate()).toBe(false);
    f.setValue({ start: '2026-11-06', end: '2026-11-19' });
    expect(f.validate()).toBe(true);
  });
});

describe('showValue (id badge)', () => {
  it('shows the selected value as a badge and as a hint in the list; hides it while typing', async () => {
    const f = mk({ type: 'suggestfield', showValue: true, query: () => [{ value: 17, label: 'Barbara 2' }], delay: 0 });
    document.body.append(f.el);
    const badge = () => f.el.querySelector('.op-picker__id') as HTMLElement;
    expect(badge().hidden).toBe(true);
    f.getInput().focus();
    type(f, 'bar');
    await f.search('bar');
    expect(document.querySelector('.op-layer .op-listbox__hint')!.textContent).toBe('17');
    f.setSelection({ value: 17, label: 'Barbara 2' });
    expect(badge().hidden).toBe(false);
    expect(badge().textContent).toBe('17');
    type(f, 'ba');
    expect(badge().hidden).toBe(true);
  });

  it('is off by default', () => {
    const f = mk({ type: 'suggestfield', query: () => [] });
    expect(f.el.querySelector('.op-picker__id')).toBeNull();
  });
});

describe('RadioGroup: the styled dot follows the user', () => {
  it('after the user picks an option the is-checked class moves with the native state (and reset/setValue keep it right)', () => {
    const r = mk({ type: 'radiogroup', options: ['person', 'company'], value: 'person' });
    const labels = () => Array.from(r.el.querySelectorAll('label.op-radio')).map((l: any) => l.classList.contains('is-checked'));
    expect(labels()).toEqual([true, false]);
    const inputs = r.el.querySelectorAll('input');
    (inputs[1] as HTMLInputElement).click();
    expect(r.getValue()).toBe('company');
    expect(labels()).toEqual([false, true]);
    r.reset();
    expect(labels()).toEqual([true, false]);
    r.setValue('company');
    expect(labels()).toEqual([false, true]);
  });

  it('getDisplayText: the label of the option, the text of a picker, the formatted date', () => {
    const r = mk({ type: 'radiogroup', options: [{ value: 'c', label: 'Company' }], value: 'c' });
    expect(r.getDisplayText()).toBe('Company');
    const s = mk({ type: 'select', options: [{ value: 'gb', label: 'United Kingdom' }], value: 'gb' });
    expect(s.getDisplayText()).toBe('United Kingdom');
    const d = mk({ type: 'datefield', value: '2026-11-07' });
    expect(d.getDisplayText()).toBe('11/07/2026');
    expect(mk({ type: 'textfield', value: 'x' }).getDisplayText()).toBe('x');
  });
});

describe('SecretField', () => {
  const wait = () => new Promise((r) => setTimeout(r, 0));
  const eye = (f: any) => f.el.querySelector('.op-secret__eye') as HTMLButtonElement;
  const confirmDialog = () => document.querySelector('.op-window');
  const answer = async (ok: boolean) => {
    await wait();
    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.op-window .op-button'));
    const b = ok ? btns.find((x) => x.classList.contains('op-button--danger'))! : btns.find((x) => !x.classList.contains('op-button--danger') && !x.classList.contains('op-button--primary'))!;
    b.click();
    await wait();
  };

  it('creating: typing is masked, the eye shows and hides it, and it hides again on blur', () => {
    const f = mk({ type: 'secretfield', label: 'Token' });
    const input = f.getInput();
    expect(input.type).toBe('password');
    type(f, 's3cret');
    expect(f.getValue()).toBe('s3cret');
    eye(f).click();
    expect(input.type).toBe('text');
    expect(eye(f).getAttribute('aria-pressed')).toBe('true');
    expect(f.isRevealed()).toBe(true);
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(input.type).toBe('password');
    eye(f).click();
    eye(f).click();
    expect(input.type).toBe('password');
  });

  it('a saved secret is never shown: mask only, read-only, no eye, value stays null, required is satisfied', () => {
    const f = mk({ type: 'secretfield', stored: true, required: true });
    const input = f.getInput();
    expect(f.isStored()).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('••••••••');
    expect(eye(f).hidden).toBe(true);
    expect(f.getValue()).toBeNull();
    expect(f.validate()).toBe(true);
    expect(f.getDisplayText()).toBe('••••••••');
    f.setRevealed(true);
    expect(f.isRevealed()).toBe(false); // nothing to reveal
    expect(f.el.textContent).toContain('cannot be shown');
  });

  it('replacing asks first (a danger modal); cancelling changes nothing; confirming empties the field and opens it for typing', async () => {
    const f = mk({ type: 'secretfield', stored: true });
    const replaced = vi.fn();
    f.on('replace', replaced);
    (f.el.querySelector('.op-secret__replace') as HTMLElement).click();
    await wait();
    expect(confirmDialog()!.textContent).toContain('cannot be displayed');
    await answer(false);
    expect(f.isStored()).toBe(true);
    expect(replaced).not.toHaveBeenCalled();
    f.getInput().click(); // clicking the field opens the same warning
    await answer(true);
    expect(f.isStored()).toBe(false);
    expect(f.isReplacing()).toBe(true);
    expect(replaced).toHaveBeenCalledTimes(1);
    expect(f.getValue()).toBe('');
    expect(f.getInput().readOnly).toBe(false);
    expect(eye(f).hidden).toBe(false);
    type(f, 'new-value');
    expect(f.getValue()).toBe('new-value');
    expect(f.isDirty()).toBe(true);
  });

  it('"Keep current" and reset() give back the saved secret untouched; replaced-and-empty means "clear"', async () => {
    const f = mk({ type: 'secretfield', stored: true, confirmReplace: false, required: true });
    await f.replace();
    expect(f.getValue()).toBe('');
    expect(f.validate()).toBe(false); // required: you replaced it, so give a new one
    (f.el.querySelector('.op-secret__keep') as HTMLElement).click();
    expect(f.isStored()).toBe(true);
    expect(f.getValue()).toBeNull();
    expect(f.validate()).toBe(true);
    await f.replace();
    type(f, 'x');
    f.reset();
    expect(f.isStored()).toBe(true);
    expect(f.getValue()).toBeNull();
    expect(f.isDirty()).toBe(false);
  });

  it('form.load({ key: true }) means "a secret exists"; getValues carries null for untouched, the text once replaced', async () => {
    const form = mk({ type: 'form', items: [{ type: 'secretfield', name: 'apiKey', confirmReplace: false }, { type: 'textfield', name: 'name' }] });
    form.load({ name: 'Acme', apiKey: true });
    const f = form.getField('apiKey') as any;
    expect(f.isStored()).toBe(true);
    expect(form.getValues()).toEqual({ apiKey: null, name: 'Acme' });
    expect(form.isDirty()).toBe(false);
    await f.replace();
    type(f, 'sk_live_123');
    expect(form.getValues({ dirtyOnly: true })).toEqual({ apiKey: 'sk_live_123' });
    form.load({ name: 'Acme', apiKey: false }); // the server says there is none now
    expect(f.isStored()).toBe(false);
  });

  it('readonly/disabled fields do not open the warning; before-replace can cancel; the text never reaches getDisplayText', async () => {
    const ro = mk({ type: 'secretfield', stored: true, readonly: true });
    expect(await ro.replace()).toBe(false);
    const f = mk({ type: 'secretfield', stored: true, confirmReplace: false });
    f.on('before-replace', () => false);
    expect(await f.replace()).toBe(false);
    const g = mk({ type: 'secretfield', value: 'abc' });
    expect(g.getDisplayText()).toBe('••••••••');
    expect(g.getDisplayText()).not.toContain('abc');
  });
});
