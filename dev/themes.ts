// Dev-only: the themes offered in the sandbox bar and the demo frame, shared so the choice follows you between pages.
export const THEMES = ['light', 'corporate', 'dark', 'brutal', 'soft', 'terminal', 'editorial', 'brand', 'brand night'] as const;
export type DevTheme = (typeof THEMES)[number];

const KEY = 'kit-theme';
export interface DevThemeState {
  theme: DevTheme;
  compact: boolean;
  custom: boolean;
}

const read = (): Partial<DevThemeState> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
};

/** `?theme=brutal compact` wins over the remembered choice (handy for screenshots). */
export function initialState(): DevThemeState {
  const asked = new URLSearchParams(location.search).get('theme')?.split(/\s+/);
  // a demo can ask for its own look with <meta name="op-theme" content="corporate">; ?theme= still wins
  const own = document.querySelector<HTMLMetaElement>('meta[name="op-theme"]')?.content;
  const s: Partial<DevThemeState> = !asked && own
    ? { theme: own as DevTheme }
    : asked
    ? { theme: [...THEMES].sort((a, b) => b.length - a.length).find((t) => t.split(' ').every((w) => asked.includes(w))), compact: asked.includes('compact'), custom: asked.includes('custom') }
    : read();
  return { theme: THEMES.includes(s.theme as DevTheme) ? (s.theme as DevTheme) : 'light', compact: !!s.compact, custom: !!s.custom };
}

/** Folder the page loaded optikos.css from ('/.dev/' on the dev servers, './' on the static docs site); themes and data sit next to it. */
export function assetBase(): string {
  return document.querySelector('link[href$="optikos.css"]')?.getAttribute('href')?.replace(/optikos\.css$/, '') ?? '/.dev/';
}

/** Loads the theme's stylesheet when the page did not link it, then sets `data-op-theme` on <html> and remembers it. */
export function applyThemeState(s: DevThemeState, extra: () => void = () => {}): void {
  for (const name of [...s.theme.split(' '), 'compact']) {
    if (name !== 'light' && name !== 'night' && !document.querySelector(`link[href$="/themes/${name}.css"]`)) {
      document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `${assetBase()}themes/${name}.css` }));
    }
  }
  extra();
  document.documentElement.setAttribute('data-op-theme', [s.theme, s.compact && 'compact', s.custom && 'custom'].filter(Boolean).join(' '));
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}
