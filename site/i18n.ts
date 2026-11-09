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
    // home
    heroEyebrow: 'v{version} · MIT · zero runtime dependencies', heroTitle: 'Describe the screen. Optikos builds it.',
    heroLead: 'Forms, data grids, windows, menus and themes from plain configuration objects, in TypeScript, with no framework underneath. Keyboard and accessibility are part of every component.',
    getStarted: 'Get started', browseComponents: 'Browse components', copyInstall: 'Copy the install command',
    tryIt: 'Try it: this form is live', newCustomer: 'New customer', save: 'Save', saved: 'Saved {name}',
    statDeps: 'runtime dependencies', statComponents: 'components', statCore: 'kB core (gzip)', statThemes: 'ready-made themes', statTokens: 'design tokens', statA11y: 'checked with axe in every theme',
    pillarsTitle: 'Why Optikos',
    p_fast: 'Fast', p_fastText: 'No virtual DOM: setters touch only what changed. A grid over 100,000 rows mounts in about 30 ms.',
    p_light: 'Light', p_lightText: 'Zero dependencies. Import one component and pay only for it; every entry has a size budget.',
    p_complete: 'Complete', p_completeText: 'Fields, pickers, grid, filters, wizards, windows, palette, chat: enough for a whole business app.',
    p_theme: 'Themeable', p_themeText: 'Every color, space, radius and shadow is a token. Light and dark out of the box, or your own look in a few lines.',
    p_a11y: 'Accessible', p_a11yText: 'Keyboard, focus and ARIA come with each component, and are tested in a real browser.',
    p_ext: 'Extensible', p_extText: 'Your components, layouts and themes use the same public API as the built-in ones.',
    themesTitle: 'Light and dark, from tokens', themesText: 'Switch the theme: this whole page repaints, because everything is a token.',
    codeTitle: 'From a config to a screen', codeText: 'This is all it takes for the sortable, paged grid on the right.',
    recipesTitle: 'Recipes', recipesText: 'Complete small screens you can copy: the code shown is the code that runs.',
    demosTitle: 'Demos', demosText: 'Whole apps built with the public API only.', seeAll: 'See all', footer: 'MIT licensed · built with Optikos itself',
    // pages
    componentsLead: 'Every component, with live examples you can edit and its full spec sheet.', size: '{kb} kB gzip',
    onThisPage: 'On this page', result: 'Result', code: 'Code', usage: 'Usage', anatomy: 'Anatomy and tokens', accessibility: 'Accessibility', scope: 'Scope',
    recipesLead: 'Small, complete screens. Each one runs here, and the code below it is the very file that runs.', whatToNotice: 'What to notice',
    demosLead: 'Complete apps that use only the public API. Open one, resize the window, switch the theme.', openDemo: 'Open live demo', viewCode: 'View code',
    tokenFilterHint: 'Filtered by "{q}"',
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
    // home
    heroEyebrow: 'v{version} · MIT · zero dependências em runtime', heroTitle: 'Descreva a tela. O Optikos monta.',
    heroLead: 'Formulários, grids de dados, janelas, menus e temas a partir de objetos de configuração, em TypeScript, sem framework por baixo. Teclado e acessibilidade fazem parte de cada componente.',
    getStarted: 'Começar', browseComponents: 'Ver componentes', copyInstall: 'Copiar o comando de instalação',
    tryIt: 'Experimente: este formulário é de verdade', newCustomer: 'Novo cliente', save: 'Salvar', saved: '{name} salvo',
    statDeps: 'dependências em runtime', statComponents: 'componentes', statCore: 'kB de núcleo (gzip)', statThemes: 'temas prontos', statTokens: 'tokens de design', statA11y: 'verificado com axe em todo tema',
    pillarsTitle: 'Por que Optikos',
    p_fast: 'Rápido', p_fastText: 'Sem virtual DOM: os setters mexem só no que mudou. Um grid com 100 mil linhas monta em uns 30 ms.',
    p_light: 'Leve', p_lightText: 'Zero dependências. Importe um componente e pague só por ele; toda entrada tem orçamento de tamanho.',
    p_complete: 'Completo', p_completeText: 'Campos, seletores, grid, filtros, assistentes, janelas, paleta, chat: o bastante para um app de negócio inteiro.',
    p_theme: 'Tematizável', p_themeText: 'Toda cor, espaço, raio e sombra é um token. Claro e escuro prontos, ou o seu visual em poucas linhas.',
    p_a11y: 'Acessível', p_a11yText: 'Teclado, foco e ARIA vêm com cada componente, e são testados num navegador de verdade.',
    p_ext: 'Expansível', p_extText: 'Seus componentes, layouts e temas usam a mesma API pública dos que vêm prontos.',
    themesTitle: 'Claro e escuro, só com tokens', themesText: 'Troque o tema: a página inteira se repinta, porque tudo é token.',
    codeTitle: 'De uma config a uma tela', codeText: 'Isto é tudo o que o grid ordenável e paginado ao lado precisa.',
    recipesTitle: 'Receitas', recipesText: 'Telas pequenas e completas para copiar: o código mostrado é o código que roda.',
    demosTitle: 'Demos', demosText: 'Apps inteiros feitos só com a API pública.', seeAll: 'Ver todos', footer: 'Licença MIT · feito com o próprio Optikos',
    // pages
    componentsLead: 'Todos os componentes, com exemplos vivos que você pode editar e a ficha completa.', size: '{kb} kB gzip',
    onThisPage: 'Nesta página', result: 'Resultado', code: 'Código', usage: 'Uso', anatomy: 'Anatomia e tokens', accessibility: 'Acessibilidade', scope: 'Escopo',
    recipesLead: 'Telas pequenas e completas. Cada uma roda aqui, e o código abaixo dela é o mesmo arquivo que roda.', whatToNotice: 'O que observar',
    demosLead: 'Apps completos que usam só a API pública. Abra um, redimensione a janela, troque o tema.', openDemo: 'Abrir a demo', viewCode: 'Ver o código',
    tokenFilterHint: 'Filtrado por "{q}"',
    cat_base: 'Base', cat_layout: 'Layout', cat_fields: 'Campos', cat_form: 'Formulários', cat_data: 'Dados', cat_dates: 'Datas', cat_overlays: 'Sobreposições', cat_navigation: 'Navegação', cat_feedback: 'Feedback', cat_chat: 'Chat', cat_core: 'Núcleo',
  },
} satisfies Record<Lang, Record<string, string>>;

export type Key = keyof (typeof strings)['en'];
/** A site string in the current language, with `{name}` placeholders. */
export const t = (key: Key, vars: Record<string, string | number> = {}): string =>
  strings[lang][key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
/** Both dictionaries, for the test that checks they have the same keys. */
export const dictionaries = strings;
