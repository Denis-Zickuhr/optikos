import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, CodeViewer, tokenize } from 'optikos';

const cleanup: Array<{ destroy(): void }> = [];
const mk = (cfg: object = {}): any => {
  const c = create<CodeViewer>({ type: 'codeviewer', ...cfg } as any) as any;
  document.body.append(c.el);
  cleanup.push(c);
  return c;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const lines = (c: any) => Array.from(c.el.querySelectorAll('.op-codeviewer__line')) as HTMLElement[];
const kinds = (c: any, kind: string) => Array.from(c.el.querySelectorAll(`.op-codeviewer__tok--${kind}`)).map((e: any) => e.textContent);

describe('CodeViewer', () => {
  it('shows the code exactly as written, one element per line, with a titled, focusable scroll area', () => {
    const code = "const a = '<b>hi</b>';\n// done";
    const c = mk({ code });
    expect(c.el.querySelector('code').textContent).toBe(code); // text nodes only: markup in the code is shown, never parsed
    expect(c.el.querySelector('b')).toBeNull();
    expect(lines(c)).toHaveLength(2);
    const pre = c.el.querySelector('pre');
    expect(pre.tabIndex).toBe(0);
    expect(pre.getAttribute('aria-label')).toBe('TypeScript');
    expect(c.el.querySelector('.op-codeviewer__title').textContent).toBe('TypeScript');
    expect(c.getCode()).toBe(code);
  });

  it('colors tokens per language', () => {
    expect(kinds(mk({ code: "import { x } from 'y'; // hi\nlet n = 42;" }), 'keyword')).toEqual(['import', 'from', 'let']);
    const json = mk({ language: 'json', code: '{ "name": "Ada", "age": 36, "ok": true }' });
    expect(kinds(json, 'property')).toEqual(['"name"', '"age"', '"ok"']);
    expect(kinds(json, 'string')).toEqual(['"Ada"']);
    expect(kinds(json, 'number')).toEqual(['36']);
    const css = mk({ language: 'css', code: '@layer x { .a { color: #fff; margin: 2px; } }' });
    expect(kinds(css, 'keyword')).toEqual(['@layer']);
    expect(kinds(css, 'property')).toEqual(['color', 'margin']);
    expect(kinds(css, 'number')).toEqual(['#fff', '2px']);
    const html = mk({ language: 'html', code: '<a href="/x">go</a>' });
    expect(kinds(html, 'tag')).toEqual(['<a', '>', '</a', '>']);
    expect(kinds(html, 'attr')).toEqual(['href']);
    expect(kinds(mk({ language: 'sh', code: 'npm i optikos # install' }), 'comment')).toEqual(['# install']);
    expect(tokenize('just text', 'text')).toEqual([['', 'just text']]);
  });

  it('a block comment spanning lines is colored on each of its lines', () => {
    const c = mk({ code: 'a();\n/* one\ntwo */\nb();' });
    expect(kinds(c, 'comment')).toEqual(['/* one', 'two */']);
    expect(lines(c)).toHaveLength(4);
  });

  it('line numbers are CSS counters starting at startLine; marked lines follow the shown numbers', () => {
    const c = mk({ code: 'a\nb\nc\nd\ne', startLine: 10, highlight: '11-12,14' });
    expect(c.el.classList.contains('has-numbers')).toBe(true);
    expect(c.el.querySelector('code').style.counterReset).toBe('op-codeline 9');
    expect(lines(c).map((l) => l.classList.contains('is-marked'))).toEqual([false, true, true, false, true]);
    c.setHighlight([10]);
    expect(lines(c).map((l) => l.classList.contains('is-marked'))).toEqual([true, false, false, false, false]);
    c.setLineNumbers(false);
    expect(c.el.classList.contains('has-numbers')).toBe(false);
  });

  it('setters repaint: code, language (and title), wrap, max height, bar and copy button', () => {
    const c = mk({ code: '1', bar: false, copyable: false });
    expect(c.el.querySelector('.op-codeviewer__bar').hidden).toBe(true);
    c.setCode('{"a": 1}');
    c.setLanguage('json');
    expect(c.el.querySelector('.op-codeviewer__title').textContent).toBe('JSON');
    c.setTitle('package.json');
    expect(c.el.querySelector('pre').getAttribute('aria-label')).toBe('package.json');
    c.setWrap(true);
    expect(c.el.classList.contains('is-wrapped')).toBe(true);
    c.setMaxHeight(120);
    expect(c.el.querySelector('pre').style.maxBlockSize).toBe('120px');
  });

  it('copy: writes to the clipboard, says so (button and live region) and emits; without a clipboard it selects the code', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true });
    const c = mk({ code: 'x = 1' });
    const onCopy = vi.fn();
    c.on('copy', onCopy);
    expect(await c.copy()).toBe(true);
    expect(write).toHaveBeenCalledWith('x = 1');
    expect(onCopy).toHaveBeenCalledWith('x = 1');
    expect(c.el.querySelector('.op-codeviewer__bar .op-button').textContent).toContain('Copied');
    expect(c.el.querySelector('.op-codeviewer__status').textContent).toBe('Copied');
    write.mockRejectedValue(new Error('no clipboard'));
    expect(await c.copy()).toBe(false);
    expect(getSelection()?.toString()).toBe('x = 1');
  });
});
