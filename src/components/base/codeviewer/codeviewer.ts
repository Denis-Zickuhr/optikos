import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { addMessages, t } from '../../../core/i18n';
import { Button } from '../button/button';

export type CodeLanguage = 'ts' | 'js' | 'json' | 'css' | 'html' | 'sh' | 'text';

export interface CodeViewerConfig extends ComponentConfig {
  code?: string;
  language?: CodeLanguage;
  /** The bar text. Default: the language name. */
  title?: string;
  lineNumbers?: boolean;
  startLine?: number;
  /** Lines to mark: `[3, 4]` or `'3-5,8'` (numbers as shown, so they follow `startLine`). */
  highlight?: number[] | string;
  wrap?: boolean;
  copyable?: boolean;
  bar?: boolean;
  maxHeight?: number | string;
}

addMessages('en', { codeCopy: 'Copy', codeCopied: 'Copied' });
addMessages('pt-BR', { codeCopy: 'Copiar', codeCopied: 'Copiado' });

const NAMES: Record<CodeLanguage, string> = { ts: 'TypeScript', js: 'JavaScript', json: 'JSON', css: 'CSS', html: 'HTML', sh: 'Shell', text: 'Text' };

// One regex per language: each capture group is a token kind, in the order of KINDS[lang]. Anything else is plain text.
const JS_WORDS = 'import|from|export|default|function|return|const|let|var|new|await|async|if|else|for|of|in|while|do|switch|case|break|continue|throw|try|catch|finally|class|extends|implements|interface|type|enum|as|typeof|instanceof|keyof|readonly|public|private|protected|static|this|void|true|false|null|undefined';
const STR = `'(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*"`;
const RULES: Record<Exclude<CodeLanguage, 'text'>, [RegExp, string[]]> = {
  ts: [new RegExp(`(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|(${STR}|\`(?:[^\`\\\\]|\\\\.)*\`)|\\b(${JS_WORDS})\\b|\\b(\\d+(?:\\.\\d+)?)\\b`, 'g'), ['comment', 'string', 'keyword', 'number']],
  js: [/./g, []], // same as ts (filled below)
  json: [new RegExp(`("(?:[^"\\\\\\n]|\\\\.)*")(?=\\s*:)|(${STR})|\\b(true|false|null)\\b|(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`, 'g'), ['property', 'string', 'keyword', 'number']],
  css: [new RegExp(`(\\/\\*[\\s\\S]*?\\*\\/)|(${STR})|(@[\\w-]+)|([\\w-]+)(?=\\s*:[^:{;]*[;}\\n])|(#[0-9a-fA-F]{3,8}\\b|-?\\d*\\.?\\d+(?:%|[a-z]+)?)`, 'g'), ['comment', 'string', 'keyword', 'property', 'number']],
  html: [new RegExp(`(<!--[\\s\\S]*?-->)|(<\\/?[\\w-]+|\\/?>)|([\\w:-]+)(?==)|(${STR})`, 'g'), ['comment', 'tag', 'attr', 'string']],
  sh: [new RegExp(`(#[^\\n]*)|(${STR})|\\b(if|then|else|fi|for|in|do|done|case|esac|while|function|export|return|sudo)\\b|(\\$\\{?[\\w]+\\}?|--?[\\w-]+)`, 'g'), ['comment', 'string', 'keyword', 'attr']],
};
RULES.js = RULES.ts;

type Tok = [kind: string, text: string];

/** Splits code into tokens (kind '' = plain). Pure: no DOM. */
export function tokenize(code: string, language: CodeLanguage = 'ts'): Tok[] {
  if (language === 'text' || !RULES[language]) return [['', code]];
  const [re, kinds] = RULES[language];
  const out: Tok[] = [];
  let last = 0;
  for (const m of code.matchAll(re)) {
    if (m.index! > last) out.push(['', code.slice(last, m.index)]);
    out.push([kinds[m.slice(1).findIndex((g) => g !== undefined)] ?? '', m[0]]);
    last = m.index! + m[0].length;
  }
  if (last < code.length) out.push(['', code.slice(last)]);
  return out;
}

/** `'3-5,8'` or `[3, 4]` → a set of line numbers. */
const lineSet = (v: CodeViewerConfig['highlight']): Set<number> => {
  if (Array.isArray(v)) return new Set(v);
  const out = new Set<number>();
  for (const part of (v ?? '').split(',')) {
    const [a, b] = part.split('-').map((x) => Number(x.trim()));
    if (Number.isFinite(a)) for (let n = a; n <= (Number.isFinite(b) ? b : a); n++) out.add(n);
  }
  return out;
};

/** Read-only code: syntax colors, line numbers (CSS counters, never copied), marked lines and a copy button. */
export class CodeViewer extends Component<CodeViewerConfig> {
  protected override baseCls = 'op-codeviewer';
  private titleEl!: HTMLElement;
  private bar!: HTMLElement;
  private pre!: HTMLElement;
  private codeEl!: HTMLElement;
  private status!: HTMLElement;
  private copyBtn!: Button;

  protected override build() {
    this.titleEl = h('span', 'op-codeviewer__title');
    this.copyBtn = new Button({ text: t('codeCopy'), icon: 'file', variant: 'ghost', handler: () => void this.copy() });
    this.status = h('span', 'op-sr-only op-codeviewer__status', { 'aria-live': 'polite' });
    this.bar = h('div', 'op-codeviewer__bar', {}, this.titleEl, this.copyBtn.el, this.status);
    this.codeEl = h('code', 'op-codeviewer__code');
    this.pre = h('pre', 'op-codeviewer__pre', { tabindex: 0 }, this.codeEl);
    return h('div', 'op-codeviewer', {}, this.bar, this.pre);
  }

  protected override onRender() {
    this.own(() => this.copyBtn.destroy());
    this.paintBar();
    this.paintCode();
    this.setWrap(!!this.config.wrap);
    this.setMaxHeight(this.config.maxHeight);
  }

  private get language(): CodeLanguage {
    return this.config.language ?? 'ts';
  }

  private paintBar() {
    const c = this.config;
    const title = c.title ?? NAMES[this.language] ?? this.language;
    this.titleEl.textContent = title;
    this.pre.setAttribute('aria-label', title);
    this.bar.hidden = c.bar === false;
    this.copyBtn.el.hidden = c.copyable === false;
  }

  /** One line element per line, tokens split at line breaks so a comment or string can span lines. */
  private paintCode() {
    const c = this.config;
    const start = c.startLine ?? 1;
    const marks = lineSet(c.highlight);
    const lines: HTMLElement[] = [h('span', 'op-codeviewer__line')];
    for (const [kind, text] of tokenize(c.code ?? '', this.language)) {
      text.split('\n').forEach((piece, i) => {
        if (i) lines.push(h('span', 'op-codeviewer__line'));
        if (piece) lines[lines.length - 1].append(kind ? h('span', `op-codeviewer__tok--${kind}`, {}, piece) : piece);
      });
    }
    lines.forEach((l, i) => {
      if (marks.has(start + i)) l.classList.add('is-marked');
      if (i < lines.length - 1) l.append('\n');
    });
    this.codeEl.replaceChildren(...lines);
    const numbers = c.lineNumbers !== false;
    this.el.classList.toggle('has-numbers', numbers);
    this.codeEl.style.counterReset = `op-codeline ${start - 1}`;
    this.codeEl.style.setProperty('--op-codeviewer-gutter', `${String(start + lines.length - 1).length}ch`);
  }

  getCode(): string {
    return this.config.code ?? '';
  }

  /** Copies the code. Without a clipboard (an insecure page) it selects the code instead and resolves false. */
  async copy(): Promise<boolean> {
    const code = this.getCode();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(this.codeEl);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      return false;
    }
    this.copyBtn.setText(t('codeCopied'));
    this.copyBtn.setIcon('check');
    this.status.textContent = t('codeCopied');
    this.later(() => {
      this.copyBtn.setText(t('codeCopy'));
      this.copyBtn.setIcon('file');
      this.status.textContent = '';
    }, 1600);
    this.emit('copy', code);
    return true;
  }

  private update(patch: Partial<CodeViewerConfig>, bar = false) {
    Object.assign(this.config, patch);
    if (!this.rendered) return;
    if (bar) this.paintBar();
    this.paintCode();
  }
  setCode(code: string) {
    this.update({ code });
  }
  setLanguage(language: CodeLanguage) {
    this.update({ language }, true);
  }
  setTitle(title: string) {
    this.update({ title }, true);
  }
  setLineNumbers(lineNumbers: boolean) {
    this.update({ lineNumbers });
  }
  setStartLine(startLine: number) {
    this.update({ startLine });
  }
  setHighlight(highlight: CodeViewerConfig['highlight']) {
    this.update({ highlight });
  }
  setWrap(wrap: boolean) {
    this.config.wrap = wrap;
    if (this.rendered) this.el.classList.toggle('is-wrapped', wrap);
  }
  setMaxHeight(maxHeight: CodeViewerConfig['maxHeight']) {
    this.config.maxHeight = maxHeight;
    if (this.rendered) this.pre.style.maxBlockSize = maxHeight == null ? '' : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
  }
}
register('codeviewer', CodeViewer);
