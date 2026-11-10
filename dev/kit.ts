// Sandbox helper (not part of the library): theme bar, sections and an event log.
import { defineTheme, type Component } from 'optikos';
import { mountNav, installShortcuts } from './nav';
import { THEMES, initialState, applyThemeState, type DevTheme } from './themes';

/** Example of a proprietary theme, selectable from the bar. */
export const customTheme = defineTheme(
  {
    color: { primary: '#7c3aed', primaryHover: '#6d28d9', primarySoft: '#f5f3ff', focus: '#a78bfa', selected: '#ede9fe' },
    radius: '0.75rem',
    button: { radius: '62.5rem', fontWeight: 700 },
    panel: { radius: '1rem' },
  },
  'custom',
);

type Log = (name: string, ...args: unknown[]) => void;
export interface Tools {
  log: Log;
  /** Logs these events of a component. */
  watch(cmp: Component, events: string[]): void;
}

const css = `
body{margin:0;padding-top:3.25rem;overflow-x:hidden;background:var(--op-color-bg);color:var(--op-color-fg);font:var(--op-font-size)/var(--op-line-height) var(--op-font-family)}
.kit-bar{position:fixed;inset:0 0 auto 0;z-index:5;display:flex;flex-wrap:wrap;gap:.25rem 1rem;align-items:center;padding:.5rem 1rem;background:var(--op-color-surface);border-bottom:1px solid var(--op-color-border);box-shadow:var(--op-shadow-sm)}
.kit-nav{display:flex;align-items:center;gap:.5rem;flex:1;min-width:0}.kit-bar label{display:flex;gap:.35rem;align-items:center}
.kit-section{scroll-margin-top:4rem}
@media (max-width:40rem){body{padding-top:6rem}.kit-main{padding:.5rem}.kit-section{padding:.75rem}.kit-section{scroll-margin-top:6.5rem}}
.kit-main{max-width:68rem;margin:0 auto;padding:1rem;display:grid;gap:1.5rem}
.kit-section{background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius);padding:1rem}
.kit-section h2{margin:0 0 .25rem;font-size:1rem}.kit-section p{margin:0 0 .75rem;color:var(--op-color-fg-muted)}
.kit-host{display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-start}
.kit-log{margin:.75rem 0 0;padding:.5rem;max-height:7rem;overflow:auto;background:var(--op-color-surface-2);border-radius:var(--op-radius-sm);font:.75rem/1.4 var(--op-font-mono);color:var(--op-color-fg-muted)}
.kit-log:empty{display:none}
.dev-hero{display:flex;align-items:center;gap:1rem;padding:1.5rem 1.25rem;border-radius:var(--op-radius-lg);border:1px solid var(--op-color-border);
  background:radial-gradient(40rem 16rem at 0% 0%,color-mix(in srgb,var(--op-color-primary) 16%,transparent),transparent 70%),var(--op-color-surface)}
.dev-hero h1{margin:0;font-size:1.6rem;letter-spacing:-.02em}.dev-hero p{margin:.15rem 0 0;color:var(--op-color-fg-muted)}
.dev-logo{flex:none;inline-size:3rem;block-size:3rem}
.dev-hero a{margin-inline-start:auto;color:var(--op-color-primary);font-weight:600}
`;

export function page(title: string) {
  document.title = `Optikos sandbox · ${title}`;
  document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
  const bar = document.createElement('header');
  bar.className = 'kit-bar';
  bar.innerHTML = `<div class="kit-nav"></div>
    <label>Theme <select id="kit-theme">${THEMES.map((t) => `<option>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" id="kit-compact"> compact</label>
    <label><input type="checkbox" id="kit-custom"> custom</label>`;
  mountNav(bar.querySelector<HTMLElement>('.kit-nav')!);
  installShortcuts();
  const main = document.createElement('main');
  main.className = 'kit-main';
  document.body.append(bar, main);

  const theme = bar.querySelector<HTMLSelectElement>('#kit-theme')!;
  const compact = bar.querySelector<HTMLInputElement>('#kit-compact')!;
  const custom = bar.querySelector<HTMLInputElement>('#kit-custom')!;
  // ?theme=brutal%20compact (e.g. for screenshots) wins over the remembered choice
  const saved = initialState();
  theme.value = saved.theme;
  compact.checked = saved.compact;
  custom.checked = saved.custom;
  const applyTheme = () => applyThemeState({ theme: theme.value as DevTheme, compact: compact.checked, custom: custom.checked }, () => customTheme.inject());
  for (const el of [theme, compact, custom]) el.addEventListener('change', applyTheme);
  applyTheme();

  return {
    main,
    /** One block of the page: heading, description, a host for components and a live event log. */
    section(name: string, description: string, build: (host: HTMLElement, tools: Tools) => void) {
      const sec = document.createElement('section');
      sec.className = 'kit-section';
      sec.id = name.toLowerCase().replace(/\W+/g, '-');
      sec.innerHTML = `<h2></h2><p></p><div class="kit-host"></div><pre class="kit-log" aria-live="polite"></pre>`;
      sec.querySelector('h2')!.textContent = name;
      sec.querySelector('p')!.textContent = description;
      const host = sec.querySelector<HTMLElement>('.kit-host')!;
      const out = sec.querySelector<HTMLElement>('.kit-log')!;
      const log: Log = (n, ...args) => {
        const text = args.map((a) => (typeof a === 'object' && a !== null ? (a instanceof Event ? a.type : JSON.stringify(a)?.slice(0, 80)) : String(a))).join(' ');
        out.textContent = `${n} ${text}\n` + (out.textContent ?? '').split('\n').slice(0, 30).join('\n');
      };
      main.append(sec);
      build(host, { log, watch: (cmp, events) => events.forEach((e) => cmp.on(e, (...a) => log(e, ...a))) });
    },
  };
}

