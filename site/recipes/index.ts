// Recipes: small, complete screens. Each file exports one function that builds the screen into a host and returns
// its cleanup. The docs site runs that function and shows the very same file as the code.
import type { Text } from '../i18n';
import signup from './signup';
import orders from './orders';
import login from './login';
import dashboard from './dashboard';
import settings from './settings';
import checkout from './checkout';
import palette from './palette';
import theme from './theme';
import signals from './signals';

export interface Recipe { id: string; icon: string; title: Text; intro: Text; notes: Text[]; mount: (host: HTMLElement) => () => void }

export const recipes: Recipe[] = [
  {
    id: 'signup', icon: 'user', mount: signup,
    title: { en: 'Sign-up form with validation', 'pt-BR': 'Cadastro com validação' },
    intro: { en: 'Fields, validators and a submit in a dozen lines with the `ui` shortcuts.', 'pt-BR': 'Campos, validadores e envio em uma dúzia de linhas com os atalhos `ui`.' },
    notes: [
      { en: 'Errors show on blur, then follow every keystroke; the field never jumps in height (`stableSize`).', 'pt-BR': 'O erro aparece ao sair do campo e depois acompanha cada tecla; o campo não muda de altura (`stableSize`).' },
      { en: '`submit` only fires when every field is valid; otherwise the first invalid field gets the focus.', 'pt-BR': '`submit` só dispara com tudo válido; senão o foco vai para o primeiro campo inválido.' },
    ],
  },
  {
    id: 'orders', icon: 'list', mount: orders,
    title: { en: 'Orders list: filter, select, act', 'pt-BR': 'Lista de pedidos: filtrar, selecionar, agir' },
    intro: { en: 'A typed `Grid<Order>` with paging, checkbox selection, bulk and row actions, fed by a filtered `Store`.', 'pt-BR': 'Um `Grid<Order>` tipado com paginação, seleção por checkbox, ações em lote e por linha, alimentado por um `Store` filtrado.' },
    notes: [
      { en: 'The search uses `debounce` and `settled`: it filters when the user stops typing, not on every key.', 'pt-BR': 'A busca usa `debounce` e `settled`: filtra quando a pessoa para de digitar, não a cada tecla.' },
      { en: '`new Grid({ store })` takes the record type from the store, so `recs` in the actions is `Model<Order>[]`.', 'pt-BR': '`new Grid({ store })` pega o tipo do registro do store, então `recs` nas ações é `Model<Order>[]`.' },
    ],
  },
  {
    id: 'login', icon: 'shield', mount: login,
    title: { en: 'Login card', 'pt-BR': 'Tela de login' },
    intro: { en: 'A panel with a form, a loading button and a server error shown on the right field.', 'pt-BR': 'Um painel com formulário, botão em loading e erro do servidor mostrado no campo certo.' },
    notes: [
      { en: '`setLoading(text)` keeps the button size and blocks double clicks.', 'pt-BR': '`setLoading(texto)` mantém o tamanho do botão e impede clique duplo.' },
      { en: '`setError()` puts a server answer on a field, announced to screen readers.', 'pt-BR': '`setError()` põe a resposta do servidor num campo, anunciada aos leitores de tela.' },
    ],
  },
  {
    id: 'dashboard', icon: 'chart', mount: dashboard,
    title: { en: 'Dashboard', 'pt-BR': 'Painel de indicadores' },
    intro: { en: 'Stat panels in a responsive grid, and tabs with a table and progress sliders.', 'pt-BR': 'Painéis de números numa grade responsiva, e abas com uma tabela e sliders de progresso.' },
    notes: [
      { en: 'A numeric `grid` layout becomes one column when its container is narrow (measured on the container, not the window).', 'pt-BR': 'Um layout `grid` numérico vira uma coluna quando o container fica estreito (medido no container, não na janela).' },
    ],
  },
  {
    id: 'settings', icon: 'settings', mount: settings,
    title: { en: 'Settings in tabs', 'pt-BR': 'Configurações em abas' },
    intro: { en: 'One form spread over tabs, with a secret that is never shown again once saved.', 'pt-BR': 'Um formulário dividido em abas, com um segredo que nunca é exibido de novo depois de salvo.' },
    notes: [
      { en: 'Clear "Display name" and save: the form jumps to the right tab and the tab shows the error count.', 'pt-BR': 'Apague "Display name" e salve: o formulário vai para a aba certa e a aba mostra a contagem de erros.' },
      { en: 'Changed tabs get a dot; `markClean()` clears them after saving.', 'pt-BR': 'Abas alteradas ganham um ponto; `markClean()` limpa depois de salvar.' },
    ],
  },
  {
    id: 'checkout', icon: 'truck', mount: checkout,
    title: { en: 'Checkout wizard', 'pt-BR': 'Checkout em etapas' },
    intro: { en: 'A `StepForm`: validation per step, an optional step and a review of everything at the end.', 'pt-BR': 'Um `StepForm`: validação por etapa, uma etapa opcional e a revisão de tudo no fim.' },
    notes: [
      { en: 'Enter moves to the next step; Back keeps the values; it is still one form (`getValues`, `load`, `reset`).', 'pt-BR': 'Enter avança; Voltar mantém os valores; continua sendo um formulário só (`getValues`, `load`, `reset`).' },
    ],
  },
  {
    id: 'palette', icon: 'search', mount: palette,
    title: { en: 'Search everything with Ctrl+K', 'pt-BR': 'Busque tudo com Ctrl+K' },
    intro: { en: 'A command palette: register actions once, run them from the keyboard.', 'pt-BR': 'Uma paleta de comandos: registre as ações uma vez e rode pelo teclado.' },
    notes: [
      { en: 'Commands rank by title, keywords and category; `children` opens a second level.', 'pt-BR': 'Os comandos são ordenados por título, palavras-chave e categoria; `children` abre um segundo nível.' },
    ],
  },
  {
    id: 'theme', icon: 'sun', mount: theme,
    title: { en: 'Your brand theme in 10 lines', 'pt-BR': 'O tema da sua marca em 10 linhas' },
    intro: { en: '`defineTheme` turns a few typed tokens into a theme, here scoped to one box.', 'pt-BR': '`defineTheme` transforma alguns tokens tipados num tema, aqui aplicado a uma caixa só.' },
    notes: [
      { en: '`setTheme(name, el)` themes any subtree; popups opened from it follow the same theme.', 'pt-BR': '`setTheme(nome, el)` aplica o tema a qualquer subárvore; os popups abertos dali seguem o mesmo tema.' },
    ],
  },
  {
    id: 'signals', icon: 'sparkles', mount: signals,
    title: { en: 'Live binding with signals', 'pt-BR': 'Ligação ao vivo com signals' },
    intro: { en: '`optikos/bind` adds signals on top of the setters: two-way for field values, one-way for anything else.', 'pt-BR': '`optikos/bind` acrescenta signals por cima dos setters: duas vias para valores de campo, uma via para o resto.' },
    notes: [
      { en: 'Components never depend on signals: `bind` just calls `setValue`, `setText`, `setDisabled`.', 'pt-BR': 'Os componentes não dependem de signals: o `bind` só chama `setValue`, `setText`, `setDisabled`.' },
    ],
  },
];
