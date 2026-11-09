// Runs one docs example: inline, or behind a button for things that float (windows, menus, toasts...).
import { create, toast, MessageBox, type Component } from 'optikos';
import { hydrate } from './hydrate';
import type { Text } from './i18n';

export type Launch = 'inline' | 'show' | 'open' | 'anchor' | 'toast' | 'messagebox';
export interface Example {
  title: Text;
  description?: Text;
  config?: Record<string, unknown>;
  launch?: Launch;
  code?: string;
  demo?: string;
}

/** The snippet a reader would paste into their app. */
export function snippet(ex: Example, config: unknown): string {
  const json = JSON.stringify(config, null, 2);
  if (ex.code) return ex.code;
  switch (ex.launch) {
    case 'toast': return `toast(${json});`;
    case 'messagebox': return `MessageBox.show(${json});`;
    case 'show': return `create(${json}).show();`;
    case 'open': return `create(${json}).open();`;
    case 'anchor': return `create(${json}); // anchored to a button, then .open() / .showBy(button)`;
    default: return `create({ ...${json}, renderTo: host });`;
  }
}

/** Renders `config` into `stage`; returns a function that cleans up what was created. */
export function run(ex: Example, config: Record<string, unknown>, stage: HTMLElement): () => void {
  let made: Component | undefined;
  const clean = () => {
    made?.destroy();
    made = undefined;
  };
  const launch = ex.launch ?? 'inline';
  const cfg = hydrate(config) as Record<string, unknown>;
  if (launch === 'inline') {
    made = create({ ...cfg, renderTo: stage } as never);
    return clean;
  }
  const btn = create({
    type: 'button', text: launch === 'toast' ? 'Show toast' : 'Open', variant: 'primary', renderTo: stage,
    handler: (b: Component) => {
      clean();
      if (launch === 'toast') return void toast(cfg as never);
      if (launch === 'messagebox') return void MessageBox.show(cfg as never);
      made = create(launch === 'anchor' ? ({ ...cfg, anchor: b.el } as never) : (cfg as never));
      const any = made as unknown as { show(): void; open(): void; showBy?(el: HTMLElement): void };
      if (launch === 'anchor' && any.showBy) any.showBy(b.el);
      else if (launch === 'show') any.show();
      else any.open();
    },
  } as never);
  return () => {
    clean();
    btn.destroy();
  };
}
