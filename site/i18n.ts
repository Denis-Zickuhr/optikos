// Language of the docs site: English or Portuguese. The choice comes from ?lang=, then from what the reader picked
// before (localStorage), then from the browser. Changing it reloads the page; the library's components follow it too.
import { setLocale } from 'optikos';

export type Lang = 'en' | 'pt-BR';
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'pt-BR', label: 'Português' },
];
const KEY = 'optikos-docs-lang';

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'pt-BR';
function pick(): Lang {
  const asked = new URLSearchParams(location.search).get('lang');
  if (isLang(asked)) return asked;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch { /* storage blocked: fall through */ }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

export const lang: Lang = pick();
setLocale(lang);
document.documentElement.lang = lang;

/** Saves the choice and reloads, dropping a ?lang= that would win over it. */
export function setLang(next: Lang): void {
  try {
    localStorage.setItem(KEY, next);
  } catch { /* the URL below still carries it */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  location.replace(url.toString());
}

/** Text that may come in both languages (`{ en, 'pt-BR' }`), as in site/examples.json. */
export type Text = string | Partial<Record<Lang, string>>;
export const tx = (t: Text | undefined): string => (t == null ? '' : typeof t === 'string' ? t : (t[lang] ?? t.en ?? Object.values(t)[0] ?? ''));

const strings = {
  en: {
    start: 'Start', components: 'Components', guides: 'Guides', recipes: 'Recipes', demos: 'Demos', tokens: 'Tokens and themes', mcp: 'MCP server',
    search: 'Search', filterComponents: 'Filter components…', navigation: 'Navigation', theme: 'Theme', language: 'Language', documentation: 'Documentation', goTo: 'Go to',
    examples: 'Examples', sheet: 'Spec sheet', moreSandbox: 'More in the dev sandbox:', runningExample: 'Running example:', apply: 'Apply', reset: 'Reset', copy: 'Copy code', copied: 'Copied',
    configOf: 'Config of', guideMissing: 'Guide not found.', onlyIn: 'This page is only available in {lang}.',
    lead: 'Declarative UI in plain TypeScript. No runtime dependencies, tokens-only styling, keyboard and ARIA everywhere. Every example on this site is live: edit its config and apply.',
    nComponents: '{n} documented components', nThemes: '{n} themes', nTokens: '{n} tokens',
    tokensLead: 'Every visual decision is a custom property. Pick a theme in the top bar to see the values change on this very page; the table shows the defaults of the base (light) theme.',
    themes: 'Themes', themesCombine: '— combine with `compact` in `data-op-theme="dark compact"`.', filterTokens: 'Filter tokens (e.g. button, color)…',
    mcpLead: 'The same knowledge as this site, for AI assistants: spec sheets, example configs, tokens, themes and guides, over the Model Context Protocol (stdio, no dependencies).',
    connect: 'Connect', mcpConnect: 'An MCP client that reads `.mcp.json` from the repo root picks it up by itself. For any other client, add this server:', mcpRun: 'Or run it by hand with `npm run mcp`.', tools: 'Tools',
    cat_base: 'Base', cat_layout: 'Layout', cat_fields: 'Fields', cat_form: 'Forms', cat_data: 'Data', cat_dates: 'Dates', cat_overlays: 'Overlays', cat_navigation: 'Navigation', cat_feedback: 'Feedback', cat_chat: 'Chat', cat_core: 'Core',
  },
  'pt-BR': {
    start: 'Início', components: 'Componentes', guides: 'Guias', recipes: 'Receitas', demos: 'Demos', tokens: 'Tokens e temas', mcp: 'Servidor MCP',
    search: 'Buscar', filterComponents: 'Filtrar componentes…', navigation: 'Navegação', theme: 'Tema', language: 'Idioma', documentation: 'Documentação', goTo: 'Ir para',
    examples: 'Exemplos', sheet: 'Ficha', moreSandbox: 'Mais na sandbox de desenvolvimento:', runningExample: 'Exemplo rodando:', apply: 'Aplicar', reset: 'Restaurar', copy: 'Copiar código', copied: 'Copiado',
    configOf: 'Config de', guideMissing: 'Guia não encontrado.', onlyIn: 'Esta página só existe em {lang}.',
    lead: 'Interfaces declarativas em TypeScript puro. Sem dependências em runtime, visual só com tokens, teclado e ARIA em tudo. Todo exemplo deste site é vivo: edite a config e aplique.',
    nComponents: '{n} componentes documentados', nThemes: '{n} temas', nTokens: '{n} tokens',
    tokensLead: 'Toda decisão visual é uma custom property. Escolha um tema na barra do topo para ver os valores mudarem nesta mesma página; a tabela mostra os padrões do tema base (claro).',
    themes: 'Temas', themesCombine: '— combine com `compact` em `data-op-theme="dark compact"`.', filterTokens: 'Filtrar tokens (ex.: button, color)…',
    mcpLead: 'O mesmo conhecimento deste site, para assistentes de IA: fichas, configs de exemplo, tokens, temas e guias, pelo Model Context Protocol (stdio, sem dependências).',
    connect: 'Conectar', mcpConnect: 'Um cliente MCP que lê o `.mcp.json` da raiz do repositório o encontra sozinho. Para qualquer outro cliente, adicione este servidor:', mcpRun: 'Ou rode à mão com `npm run mcp`.', tools: 'Ferramentas',
    cat_base: 'Base', cat_layout: 'Layout', cat_fields: 'Campos', cat_form: 'Formulários', cat_data: 'Dados', cat_dates: 'Datas', cat_overlays: 'Sobreposições', cat_navigation: 'Navegação', cat_feedback: 'Feedback', cat_chat: 'Chat', cat_core: 'Núcleo',
  },
} satisfies Record<Lang, Record<string, string>>;

export type Key = keyof (typeof strings)['en'];
/** A site string in the current language, with `{name}` placeholders. */
export const t = (key: Key, vars: Record<string, string | number> = {}): string =>
  strings[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
/** Both dictionaries, for the test that checks they have the same keys. */
export const dictionaries = strings;
