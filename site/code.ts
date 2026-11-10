// Code blocks for the docs site are the library's own CodeViewer (syntax colors, line numbers, copy button).
import { create, toast, type CodeViewer, type CodeLanguage } from 'optikos';
import { t } from './i18n';

const LANG: Record<string, CodeLanguage> = { ts: 'ts', typescript: 'ts', js: 'js', javascript: 'js', json: 'json', css: 'css', html: 'html', sh: 'sh', bash: 'sh', shell: 'sh' };

/** The language of a fence info string (```ts) or a block label ('JSON', 'site/recipes/x.ts'); TypeScript by default. */
export const languageOf = (hint = ''): CodeLanguage => LANG[hint.toLowerCase()] ?? LANG[/\.(\w+)$/.exec(hint)?.[1] ?? ''] ?? 'ts';

/** A highlighted, copyable block. */
export function codeBlock(code: string, label = 'TypeScript', language = languageOf(label)): HTMLElement {
  return create<CodeViewer>({ type: 'codeviewer', code, title: label, language } as never).el;
}

export async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast({ type: 'success', text: t('copied'), duration: 1500 });
  } catch { /* no clipboard (insecure context): nothing to do */ }
}
