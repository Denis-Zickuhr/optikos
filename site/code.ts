// Code blocks for the docs site: a tiny highlighter (keywords, strings, comments, numbers) and a copy button.
// It builds text nodes and spans, never innerHTML, so any code is shown exactly as written.
import { create, toast } from 'optikos';
import { t } from './i18n';

const TOKENS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|export|default|function|return|const|let|new|await|async|if|else|for|of|type|interface|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g;
const KIND = ['', 'comment', 'string', 'keyword', 'number'];

export function highlight(code: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of code.matchAll(TOKENS)) {
    if (m.index! > last) frag.append(code.slice(last, m.index));
    const kind = KIND[m.slice(1).findIndex((g) => g !== undefined) + 1];
    frag.append(Object.assign(document.createElement('span'), { className: `site-code__${kind}`, textContent: m[0] }));
    last = m.index! + m[0].length;
  }
  frag.append(code.slice(last));
  return frag;
}

/** A highlighted, copyable block. */
export function codeBlock(code: string, label = 'TypeScript'): HTMLElement {
  const box = Object.assign(document.createElement('div'), { className: 'site-code' });
  const bar = box.appendChild(Object.assign(document.createElement('div'), { className: 'site-code__bar' }));
  bar.append(Object.assign(document.createElement('span'), { textContent: label }));
  create({ type: 'button', text: t('copy'), icon: 'file', variant: 'ghost', renderTo: bar, handler: () => void copy(code) } as never);
  const pre = box.appendChild(document.createElement('pre'));
  pre.tabIndex = 0; // it scrolls: reachable from the keyboard
  pre.setAttribute('aria-label', label);
  pre.appendChild(document.createElement('code')).append(highlight(code));
  return box;
}

export async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast({ type: 'success', text: t('copied'), duration: 1500 });
  } catch { /* no clipboard (insecure context): nothing to do */ }
}
