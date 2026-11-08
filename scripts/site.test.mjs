import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { components, tokens, themes, guides } from './docs-data.mjs';

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
    expect(slider.fields['Propósito']).toMatch(/bolinha/);
    expect(Object.keys(slider.fields)).toEqual(expect.arrayContaining(['Config', 'API', 'Tokens']));
    expect(tokens()['--op-color-primary']).toBeTruthy();
    expect(themes()).toEqual(expect.arrayContaining(['light', 'dark', 'brand']));
    expect(guides().map((g) => g.name)).toContain('architecture');
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
    expect(init.result.serverInfo.name).toBe('optikos');
    expect(list.result.tools.map((t) => t.name)).toEqual(expect.arrayContaining(['list_components', 'get_component', 'get_examples', 'search_docs', 'get_guide', 'get_tokens', 'list_themes']));
    expect(get.result.content[0].text).toMatch(/Grid/);
    expect(bad.result.isError).toBe(true);
  });
});
