import { describe, it, expect } from 'vitest';
import { dictionaries, tx } from './i18n';

describe('docs site i18n', () => {
  it('both languages have the same keys and no empty text', () => {
    expect(Object.keys(dictionaries['pt-BR']).sort()).toEqual(Object.keys(dictionaries.en).sort());
    for (const d of Object.values(dictionaries)) for (const [k, v] of Object.entries(d)) expect(v.trim(), k).not.toBe('');
  });

  it('tx picks the current language and falls back to English', () => {
    expect(tx('plain')).toBe('plain');
    expect(tx({ en: 'Hello' })).toBe('Hello');
    expect(tx(undefined)).toBe('');
  });
});
