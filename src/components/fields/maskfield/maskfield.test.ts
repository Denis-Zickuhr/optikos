import { describe, it, expect, afterEach } from 'vitest';
import { create, MaskField } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const mk = (cfg: object) => create<MaskField>({ type: 'maskfield', mask: '000.000.000-00', renderTo: document.body, ...cfg } as any);
const type = (f: MaskField, text: string) => {
  const i = f.el.querySelector('input')!;
  i.value = text;
  i.dispatchEvent(new Event('input', { bubbles: true }));
  return i.value;
};

describe('MaskField', () => {
  it('formats while typing, without trailing literals, ignoring what does not fit', () => {
    const f = mk({});
    expect(type(f, '123')).toBe('123');
    expect(type(f, '1234')).toBe('123.4');
    expect(type(f, '123.4x5')).toBe('123.45');
    expect(type(f, '12345678900')).toBe('123.456.789-00');
    expect(f.getValue()).toBe('123.456.789-00');
    expect(type(f, '123.456.789-001')).toBe('123.456.789-00');
  });

  it('raw keeps only the typed characters as the value', () => {
    const f = mk({ raw: true });
    type(f, '12345678900');
    expect(f.getValue()).toBe('12345678900');
    expect(f.getDisplayText()).toBe('123.456.789-00');
    f.setValue('98765432100');
    expect(f.el.querySelector('input')!.value).toBe('987.654.321-00');
    expect(f.getValue()).toBe('98765432100');
  });

  it('a list picks the pattern by length (tax id of a person, then of a company)', () => {
    const f = mk({ mask: ['000.000.000-00', '00.000.000/0000-00'] });
    expect(type(f, '12345678900')).toBe('123.456.789-00');
    expect(type(f, '123456789001')).toBe('12.345.678/9001');
    expect(type(f, '12345678000199')).toBe('12.345.678/0001-99');
    f.validate();
    expect(f.isValid()).toBe(true);
  });

  it('is invalid while incomplete, valid when full, and the app adds its own validator', () => {
    const f = mk({ validators: [(v: string) => (v.endsWith('00') ? 'No 00 here' : true)] });
    type(f, '1234');
    expect(f.validate()).toBe(false);
    expect(f.getError()).toContain('___.___.___-__');
    type(f, '12345678900');
    expect(f.validate()).toBe(false);
    expect(f.getError()).toBe('No 00 here');
    type(f, '12345678901');
    expect(f.validate()).toBe(true);
  });

  it('letters and any-character slots, literal escapes, and a placeholder from the pattern', () => {
    const f = mk({ mask: 'AAA-0000' });
    expect(type(f, 'abc1234')).toBe('abc-1234');
    expect(type(f, '1abc')).toBe('abc');
    expect(f.el.querySelector('input')!.placeholder).toBe('___-____');
    expect(type(mk({ mask: '\\0*0' }), 'x5')).toBe('0x5');
  });
});
