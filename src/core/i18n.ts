export type Locale = Record<string, string>;

// Messages shared by the core and several components. Component-only keys live with the component (addMessages).
const en: Locale = {
  _lang: 'en',
  _currency: 'USD',
  _firstDay: '0',
  required: 'This field is required',
  minLength: 'Enter at least {n} characters',
  maxLength: 'Enter at most {n} characters',
  pattern: 'Invalid format',
  email: 'Enter a valid email address',
  min: 'Must be at least {n}',
  max: 'Must be at most {n}',
  range: 'Must be between {min} and {max}',
  number: 'Enter a valid number',
  date: 'Enter a valid date',
  loading: 'Loading',
  close: 'Close',
  ok: 'OK',
  cancel: 'Cancel',
  clear: 'Clear',
  collapse: 'Collapse',
  expand: 'Expand',
  empty: 'No data',
  search: 'Search',
  noResults: 'No results',
  results: '{n} results',
};

const ptBR: Locale = {
  _lang: 'pt-BR',
  _currency: 'BRL',
  _firstDay: '0',
  required: 'Campo obrigatório',
  minLength: 'Informe ao menos {n} caracteres',
  maxLength: 'Informe no máximo {n} caracteres',
  pattern: 'Formato inválido',
  email: 'Informe um e-mail válido',
  min: 'Deve ser no mínimo {n}',
  max: 'Deve ser no máximo {n}',
  range: 'Deve estar entre {min} e {max}',
  number: 'Informe um número válido',
  date: 'Informe uma data válida',
  loading: 'Carregando',
  close: 'Fechar',
  ok: 'OK',
  cancel: 'Cancelar',
  clear: 'Limpar',
  collapse: 'Recolher',
  expand: 'Expandir',
  empty: 'Sem dados',
  search: 'Pesquisar',
  noResults: 'Nenhum resultado',
  results: '{n} resultados',
};

export const locales: Record<string, Locale> = { en, 'pt-BR': ptBR };
let current: Locale = en;

/** Picks a registered locale by name (`'pt-BR'`, or `'pt'` as a prefix) or merges a custom object over English. */
export function setLocale(l: string | Locale): void {
  if (typeof l === 'string') {
    current = locales[l] ?? locales[Object.keys(locales).find((k) => k.startsWith(l.split('-')[0])) ?? 'en'];
  } else {
    current = { ...en, ...l };
    if (l._lang) locales[l._lang] = current;
  }
}

/** The ISO 4217 code that `money` columns and currency fields use (each locale brings its own default). */
export function setCurrency(code: string): void {
  current._currency = code;
}

export const getLocale = (): Locale => current;

/**
 * Adds messages to a locale (created if missing). Keys already there are kept, so an app's own overrides win.
 * Each component registers its own keys this way, so its messages only ship with it.
 */
export function addMessages(lang: string, messages: Locale): void {
  const target = (locales[lang] ??= { _lang: lang });
  for (const k in messages) if (!(k in target)) target[k] = messages[k];
}

/** Translates a key, replacing `{name}` placeholders. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const s = current[key] ?? en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : s;
}
