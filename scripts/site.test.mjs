import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { components, tokens, themes, guides, LANGS, canonKey } from './docs-data.mjs';

describe('docs data (feeds the docs site and the MCP server)', () => {
  it('every spec sheet but the base "field" has at least one example, and every example is renderable', () => {
    for (const c of components()) {
      if (c.name === 'field') continue;
      expect(c.examples.length, c.name).toBeGreaterThan(0);
      for (const ex of c.examples) expect(ex.config || ex.code, `${c.name}: ${ex.title}`).toBeTruthy();
    }
  });

  it('parses the sheet fields, tokens, themes and guides', () => {
    const slider = components().find((c) => c.name === 'slider');
    expect(slider.fields.Purpose).toMatch(/knob/);
    expect(slider.docs['pt-BR'].fields['Propósito']).toMatch(/bolinha/);
    expect(Object.keys(slider.fields)).toEqual(expect.arrayContaining(['Config', 'API', 'Tokens']));
    expect(tokens()['--op-color-primary']).toBeTruthy();
    expect(themes().sort()).toEqual(['compact', 'dark', 'light']);
    expect(guides().map((g) => g.name)).toContain('architecture');
  });
});

describe('docs in two languages', () => {
  it('every spec sheet exists in English and Portuguese with the same sections', () => {
    for (const c of components()) {
      for (const lang of LANGS) expect(c.docs[lang], `${c.name} (${lang})`).toBeTruthy();
      const keys = (lang) => Object.keys(c.docs[lang].fields).map(canonKey);
      expect(keys('pt-BR').length, `${c.name}: section count`).toBe(keys('en').length);
      for (const k of ['Purpose', 'Config', 'Tokens', 'Out of scope']) {
        if (keys('en').includes(k)) expect(keys('pt-BR'), `${c.name}: ${k}`).toContain(k);
      }
    }
  });

  it('every guide but the Portuguese-only architecture log has both languages, and every example a title in both', () => {
    for (const g of guides()) if (!['architecture', 'performance'].includes(g.name)) for (const lang of LANGS) expect(g.i18n[lang], `${g.name} (${lang})`).toBeTruthy();
    for (const c of components()) for (const ex of c.examples) for (const lang of LANGS) expect(typeof ex.title === 'object' && ex.title[lang], `${c.name}: ${JSON.stringify(ex.title)} (${lang})`).toBeTruthy();
  });
});

describe('MCP server (stdio)', () => {
  const ask = (...calls) => {
    const input = calls.map((c, i) => JSON.stringify({ jsonrpc: '2.0', id: i + 1, ...c })).join('\n') + '\n';
    const r = spawnSync('node', ['scripts/mcp.mjs'], { input, encoding: 'utf8', timeout: 10000 });
    return r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  };

  it('initializes, lists tools and serves a component', () => {
    const [init, list, get, bad] = ask(
      { method: 'initialize', params: {} },
      { method: 'tools/list' },
      { method: 'tools/call', params: { name: 'get_component', arguments: { name: 'grid' } } },
      { method: 'tools/call', params: { name: 'get_component', arguments: { name: 'nope' } } },
    );
    const [pt] = ask({ method: 'tools/call', params: { name: 'get_component', arguments: { name: 'grid', lang: 'pt-BR' } } });
    expect(pt.result.content[0].text).toMatch(/\*\*Propósito:\*\*/);
    expect(init.result.serverInfo.name).toBe('optikos');
    expect(list.result.tools.map((t) => t.name)).toEqual(expect.arrayContaining(['list_components', 'get_component', 'get_examples', 'search_docs', 'get_guide', 'get_tokens', 'list_themes']));
    expect(get.result.content[0].text).toMatch(/Grid/);
    expect(get.result.content[0].text).toMatch(/\*\*Purpose:\*\*/);
    expect(bad.result.isError).toBe(true);
  });
});
