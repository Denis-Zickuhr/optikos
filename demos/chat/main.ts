// Messaging demo ("Prosa"): conversation list, the Chat widget, an AI assistant side widget (fake, two scripted prompts) and a Ctrl+K command palette. Public API only.
import { create, register, setLocale, Component, Chat, CommandPalette, defineTheme, setTheme, toast, type ChatMessage, type Command, type ComponentConfig, type Toolbar, type Container, type Label, type Button, type Widget, type WidgetSide } from 'optikos';

// ---- themes: the clay look is only tokens (the Chat reads --op-chat-*) ----------------------------------------------
const light = defineTheme({
  color: { primary: '#b5562f', primaryHover: '#9a4626', primaryFg: '#ffffff', primarySoft: '#f6e3d8', focus: '#b5562f', bg: '#f4efe9', surface2: '#f4efe9', selected: '#efe4da', hover: '#f8f3ee' },
  chat: { bg: '#f7f2ec', bubbleMeBg: '#f3dccd', bubbleMeFg: '#2a1d15', bubbleThemBg: '#ffffff', readFg: '#b5562f', dayBg: '#ffffff', composerBg: '#f4efe9', inputRadius: '0.75rem', chipFg: '#9a4626', chipBorder: '#d9a58b' },
  radius: { lg: '0.75rem' },
}, 'prosa');
const dark = defineTheme({
  color: { primary: '#e07a4f', primaryHover: '#ea8d66', primaryFg: '#1c1714', primarySoft: '#4a2a1c', bg: '#1c1714', surface: '#27201b', surface2: '#2a221d', fg: '#f1e9e2', fgMuted: '#a8978a', border: '#3a2f28', borderStrong: '#4a3c33', hover: '#33291f', selected: '#3a2f28', focus: '#e07a4f' },
  chat: { bg: '#161210', bubbleMeBg: '#6b3420', bubbleMeFg: '#f8ece4', bubbleThemBg: '#27201b', bubbleThemFg: '#f1e9e2', readFg: '#f0a07c', dayBg: '#2a221d', composerBg: '#27201b', inputBg: '#3a2f28', chipFg: '#e07a4f', chipBorder: '#8a4a30' },
  radius: { lg: '0.75rem' },
}, 'prosa-dark');
setLocale('pt-BR');
light.inject();
dark.inject();
setTheme('prosa');

// ---- fake world ---------------------------------------------------------------------------------------------------
const P_SUMMARY = 'Resuma esta conversa';
const P_REPLY = 'Sugira uma resposta educada';
const min = (n: number) => Date.now() - n * 60000;
const AI = { name: '✨ Optikos AI', color: '#7c3aed' };

interface Convo {
  id: string; name: string; color: string; kind: 'person' | 'group'; status: string;
  users: Record<string, { name: string; color?: string }>;
  messages: ChatMessage[]; unread: number; chat?: Chat;
  replies: Array<{ from: string; text: string }>;
}
const convos: Convo[] = [
  { id: 'ana', name: 'Ana Souza', color: '#e11d48', kind: 'person', status: 'online', unread: 2, users: { ana: { name: 'Ana Souza' } },
    replies: [{ from: 'ana', text: 'Combinado! 😄' }, { from: 'ana', text: 'Me manda o link quando puder?' }, { from: 'ana', text: 'Perfeito, obrigada!' }],
    messages: [
      { id: 'a1', from: 'ana', text: 'Oi! Você viu o novo **grid** com ações em lote?', time: min(190) },
      { id: 'a2', from: 'me', text: 'Vi sim, ficou ótimo. O `rowActionsMode: visible` ajudou muito.', time: min(185), status: 'read' },
      { id: 'a3', from: 'ana', text: 'Vamos apresentar na sexta?', time: min(12) },
      { id: 'a4', from: 'ana', text: 'Consegue preparar uma demo curta?', time: min(11) },
    ] },
  { id: 'bruno', name: 'Bruno Lima', color: '#2563eb', kind: 'person', status: 'ativo hoje às 09:41', unread: 0, users: { bruno: { name: 'Bruno Lima' } },
    replies: [{ from: 'bruno', text: 'Beleza 👍' }, { from: 'bruno', text: 'Depois te falo.' }],
    messages: [{ id: 'b1', from: 'bruno', text: 'Fechou o orçamento?', time: min(60 * 26) }, { id: 'b2', from: 'me', text: 'Fechou! Te mando o PDF.', time: min(60 * 26 - 3), status: 'read' }] },
  { id: 'familia', name: 'Família 🏡', color: '#16a34a', kind: 'group', status: 'Mãe, Pai, Rafa', unread: 1,
    users: { mae: { name: 'Mãe', color: '#c2410c' }, pai: { name: 'Pai', color: '#0369a1' }, rafa: { name: 'Rafa', color: '#7e22ce' } },
    replies: [{ from: 'mae', text: 'Não esquece o bolo!' }, { from: 'rafa', text: 'Eu levo os refrigerantes' }, { from: 'pai', text: '👍' }],
    messages: [{ id: 'f1', from: 'mae', text: 'Domingo almoço aqui, ok?', time: min(300) }, { id: 'f2', from: 'pai', text: 'Confirmado', time: min(298) }, { id: 'f3', from: 'me', text: 'Eu vou!', time: min(290), status: 'read' }, { id: 'f4', from: 'rafa', text: 'Chego um pouco mais tarde', time: min(40) }] },
];
let current = convos[0];

const avatar = (c: Convo) => Object.assign(document.createElement('span'), { className: 'prosa-avatar', textContent: c.name.replace(/[^\p{L}]/gu, '')[0], style: `background:${c.color}` });
const hhmm = (at: number) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(at);
const last = (c: Convo) => c.chat?.getMessages().at(-1) ?? c.messages.at(-1);

const css = document.createElement('style');
css.textContent = `html,body{margin:0;height:100%}
.prosa-list{display:flex;flex-direction:column;overflow:auto;background:var(--op-color-surface)}
.prosa-row{display:flex;gap:var(--op-space-3);align-items:center;padding:var(--op-space-3) var(--op-space-4);font:inherit;color:inherit;text-align:start;background:transparent;border:0;border-bottom:1px solid var(--op-color-border);cursor:pointer}
.prosa-row:hover,.prosa-row.is-active{background:var(--op-color-selected)}
.prosa-row:focus-visible{outline:var(--op-focus-width) solid var(--op-color-focus);outline-offset:-2px}
.prosa-avatar{display:inline-grid;place-items:center;flex:none;inline-size:2.75rem;block-size:2.75rem;color:#fff;border-radius:50%;font-weight:600;font-size:1.1rem}
.prosa-body{flex:1;min-inline-size:0;display:flex;flex-direction:column}.prosa-top{display:flex;justify-content:space-between;gap:var(--op-space-2)}
.prosa-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.prosa-time{font-size:var(--op-font-size-sm);color:var(--op-color-fg-muted)}
.prosa-prev{display:flex;justify-content:space-between;gap:var(--op-space-2);color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}
.prosa-prev span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prosa-badge{flex:none;min-inline-size:1.25rem;padding:0 .35rem;text-align:center;color:var(--op-color-primary-fg);background:var(--op-color-primary);border-radius:var(--op-radius-pill);font-size:var(--op-font-size-sm);font-weight:600}
.prosa-side{--op-region-drawer-width:100%;background:var(--op-color-surface);border-inline-end:1px solid var(--op-color-border)}
.prosa-head{display:flex;align-items:center;gap:var(--op-space-3);padding:var(--op-space-2) var(--op-space-4);background:var(--op-color-surface-2);border-bottom:1px solid var(--op-color-border)}
.prosa-head .prosa-title{flex:1;display:flex;flex-direction:column;min-inline-size:0}.prosa-title small{color:var(--op-color-fg-muted)}
`;
css.textContent += `\n.prosa-back{display:none}.op-layout-border.is-narrow .prosa-back{display:inline-flex}`;
document.head.append(css);

/** The conversation list: a custom component built with the same tools the library uses. */
interface ListConfig extends ComponentConfig { onPick: (c: Convo) => void }
class ConvoList extends Component<ListConfig> {
  protected override baseCls = 'prosa-list';
  filter = '';
  protected override onRender() {
    this.el.setAttribute('role', 'list');
    this.listen(this.el, 'click', (e: Event) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
      const c = convos.find((x) => x.id === row?.dataset.id);
      if (c) this.config.onPick(c);
    });
    this.paint();
  }
  paint() {
    if (!this.rendered) return;
    const q = this.filter.trim().toLowerCase();
    const shown = convos.filter((c) => !q || c.name.toLowerCase().includes(q)).sort((a, b) => (last(b)?.time as number ?? 0) - (last(a)?.time as number ?? 0));
    this.el.replaceChildren(...shown.map((c) => {
      const m = last(c);
      const row = Object.assign(document.createElement('button'), { className: `prosa-row${c === current ? ' is-active' : ''}`, type: 'button' });
      row.dataset.id = c.id;
      row.setAttribute('role', 'listitem');
      const body = document.createElement('span');
      body.className = 'prosa-body';
      const top = Object.assign(document.createElement('span'), { className: 'prosa-top' });
      top.append(Object.assign(document.createElement('span'), { className: 'prosa-name', textContent: c.name }), Object.assign(document.createElement('span'), { className: 'prosa-time', textContent: m?.time ? hhmm(new Date(m.time).getTime()) : '' }));
      const prev = Object.assign(document.createElement('span'), { className: 'prosa-prev' });
      prev.append(Object.assign(document.createElement('span'), { textContent: m ? `${m.from === 'me' ? 'Você: ' : ''}${m.text.replace(/[*`]/g, '')}` : '' }));
      if (c.unread) prev.append(Object.assign(document.createElement('span'), { className: 'prosa-badge', textContent: String(c.unread) }));
      body.append(top, prev);
      row.append(avatar(c), body);
      return row;
    }));
  }
}
register('prosa-convolist', ConvoList);

// ---- behaviour ----------------------------------------------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Types the assistant's answer into a new bubble piece by piece. */
async function stream(text: string) {
  ai.setBusy(true);
  ai.setTyping(true);
  await sleep(700);
  ai.setTyping(false);
  const id = ai.addMessage({ from: 'ai', text: '', time: Date.now() }).id!;
  for (const tok of text.match(/\S+\s*/g) ?? []) {
    ai.appendToMessage(id, tok);
    await sleep(35);
  }
  ai.setBusy(false);
  ai.focus();
}

/** The two scripted prompts; "this conversation" is whichever chat is open in the main area. */
function aiAnswer(prompt: string): string {
  const target = current;
  const msgs = (target.chat?.getMessages() ?? target.messages).filter((m) => m.from !== 'ai');
  const lastIn = [...msgs].reverse().find((m) => m.from !== 'me');
  if (prompt === P_SUMMARY) {
    const who = [...new Set(msgs.map((m) => (m.from === 'me' ? 'você' : (target.users[m.from]?.name ?? m.from))))].join(', ');
    return `**Resumo da conversa com ${target.name}**\n• ${msgs.length} mensagens entre ${who}\n• Último assunto: “${(msgs.at(-1)?.text ?? '').replace(/[*`]/g, '')}”\n• ${lastIn && msgs.at(-1)?.from !== 'me' ? 'Ficou algo **sem resposta** sua.' : 'Nada pendente do seu lado.'}`;
  }
  if (prompt === P_REPLY) {
    const name = target.kind === 'group' ? 'pessoal' : target.name.split(' ')[0];
    return `**Sugestão de resposta para ${target.name}:**\n“Oi, ${name}! Obrigado pela mensagem. Vou olhar com calma e te respondo ainda hoje. 🙂”\n*Edite antes de enviar.*`;
  }
  return 'Ainda sou um protótipo 🙂 Só entendo dois pedidos: **resumir** a conversa e **sugerir uma resposta**. Use os botões abaixo.';
}

async function onSend(c: Convo, _text: string, msg: ChatMessage) {
  const chat = c.chat!;
  await sleep(300); chat.updateMessage(msg.id!, { status: 'sent' });
  await sleep(500); chat.updateMessage(msg.id!, { status: 'delivered' });
  await sleep(700); chat.updateMessage(msg.id!, { status: 'read' });
  list.paint();
  const r = pick(c.replies);
  await sleep(500);
  if (c.status === 'online') setHeader(c, 'digitando…');
  chat.setTyping(c.kind === 'group' ? (c.users[r.from]?.name ?? true) : true);
  await sleep(1500 + Math.random() * 1000);
  chat.setTyping(false);
  chat.addMessage({ from: r.from, text: r.text, time: Date.now() });
  setHeader(c);
  if (c !== current) c.unread++;
  list.paint();
}

function build(c: Convo) {
  c.chat = create<Chat>({ type: 'chat', me: 'me', users: c.users, messages: c.messages, flex: 1, hidden: c !== current, placeholder: 'Digite uma mensagem', showAuthors: c.kind !== 'person' });
  c.chat.on('send', (text: string, msg: ChatMessage) => void onSend(c, text, msg));
}

const list = create<ConvoList>({ type: 'prosa-convolist', flex: 1, onPick: (c: Convo) => open(c) } as any);
let shell!: Container;
let nameLabel!: Label; let statusLabel!: Label; let aiBtn!: Button; let aiPanel!: Widget; let aiContext!: Label;

function setHeader(c: Convo, status = c.status) {
  if (c !== current) return;
  nameLabel.setText(c.name);
  statusLabel.setText(status);
  aiContext.setText(`Conversa em foco: ${c.name}`);
}

function open(c: Convo) {
  current = c;
  shell.layout?.closeRegion?.('west'); // phones: the list is a drawer, choosing a chat shows the chat
  c.unread = 0;
  convos.forEach((x) => (x === c ? x.chat!.show() : x.chat!.hide()));
  c.chat!.scrollToBottom();
  setHeader(c);
  list.paint();
}

/** The assistant is a widget on the side: it keeps its own conversation and reads whichever chat is open. */
function toggleAi(on = !aiPanel.isOpen()) {
  aiPanel.setOpen(on);
  if (on) ai.focus();
}
function syncAiButton(on: boolean) {
  aiBtn.el.setAttribute('aria-pressed', String(on));
  aiBtn.el.classList.toggle('is-pressed', on);
}

function runPrompt(prompt: string) { // from the palette: open the widget and ask
  toggleAi(true);
  ai.send(prompt);
}

const commands: Command[] = [
  ...convos.map((c): Command => ({ id: `open-${c.id}`, title: `Abrir: ${c.name}`, category: 'Conversas', icon: 'user', keywords: [c.kind === 'group' ? 'grupo' : 'contato', 'conversa', 'chat'], handler: () => open(c) })),
  { id: 'read-all', title: 'Marcar todas como lidas', category: 'Conversas', icon: 'check', handler: () => { convos.forEach((c) => (c.unread = 0)); list.paint(); toast({ text: 'Tudo lido' }); } },
  { id: 'clear', title: 'Limpar conversa atual', category: 'Conversas', icon: 'trash', handler: () => { current.chat!.setMessages([]); list.paint(); } },
  { id: 'ai-toggle', title: 'Abrir/fechar o assistente de IA', category: 'IA', icon: 'sparkles', shortcut: 'IA', handler: () => toggleAi() },
  { id: 'ai-summary', title: 'Resumir esta conversa (IA)', category: 'IA', icon: 'sparkles', description: P_SUMMARY, handler: () => runPrompt(P_SUMMARY) },
  { id: 'ai-reply', title: 'Sugerir resposta educada (IA)', category: 'IA', icon: 'sparkles', description: P_REPLY, handler: () => runPrompt(P_REPLY) },
  { id: 'ai-side', title: 'Posição do assistente…', category: 'IA', icon: 'sparkles', children: (['right', 'left', 'bottom'] as WidgetSide[]).map((side) => ({ id: `side-${side}`, title: ({ right: 'Na direita', left: 'Na esquerda', bottom: 'Embaixo', top: 'Em cima' } as Record<WidgetSide, string>)[side], handler: () => { aiPanel.setSide(side); toggleAi(true); } })) },
  { id: 'theme', title: 'Trocar tema…', category: 'Aparência', icon: 'sun', children: [
    { id: 't-light', title: 'Claro', icon: 'sun', handler: () => setTheme('prosa') },
    { id: 't-dark', title: 'Escuro', icon: 'moon', handler: () => setTheme('dark prosa-dark') },
  ] },
];
const palette = create<CommandPalette>({ type: 'commandpalette', commands, categories: ['Conversas', 'IA', 'Aparência'], placeholder: 'Abrir conversa, pedir à IA, trocar tema…' });

// ---- layout -------------------------------------------------------------------------------------------------------
convos.forEach(build);
const ai = create<Chat>({
  type: 'chat', me: 'me', users: { ai: AI }, flex: 1, placeholder: 'Pergunte à IA…', suggestions: [P_SUMMARY, P_REPLY],
  messages: [{ from: 'ai', text: 'Oi! Sou um assistente **de mentirinha**. Leio a conversa que está aberta ao lado e entendo dois pedidos: *resumir* e *sugerir uma resposta*. Escolha um abaixo.', time: Date.now() }],
});
ai.on('send', (text: string, msg: ChatMessage) => {
  ai.updateMessage(msg.id!, { status: 'read' });
  void stream(aiAnswer(text));
});

aiContext = create<Label>({ type: 'label', text: '', style: 'padding:var(--op-space-2) var(--op-space-4);color:#5b21b6;background:#ede9fe;font-size:var(--op-font-size-sm)' });
// the assistant is a Widget: it floats over the app (nothing is pushed aside) and the user can dock it left, right or bottom
aiPanel = create<Widget>({
  type: 'widget', title: '✨ Optikos AI', side: 'right', sideSwitcher: true, cls: 'prosa-ai', layout: { type: 'vbox' },
  items: [aiContext, ai],
  listeners: { show: () => syncAiButton(true), hide: () => syncAiButton(false) },
});

const search = create({ type: 'textfield', placeholder: 'Pesquisar conversas', clearable: true, style: 'padding:var(--op-space-2) var(--op-space-3)', listeners: { change: (v: string) => ((list.filter = v ?? ''), list.paint()) } } as any);
const header = create<Toolbar>({
  type: 'toolbar', cls: 'prosa-head',
  items: [
    { type: 'button', icon: 'chevron-left', variant: 'ghost', cls: 'prosa-back', ariaLabel: 'Conversas', tooltip: 'Conversas', handler: () => shell.layout?.openRegion?.('west') },
    { type: 'label', text: current.name, cls: 'prosa-name', id: 'prosa-name' },
    { type: 'label', text: current.status, id: 'prosa-status', style: 'color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)' },
    '->',
    { type: 'button', icon: 'sparkles', text: 'IA', variant: 'ghost', ariaLabel: 'Abrir assistente de IA', tooltip: 'Assistente de IA (painel lateral)', id: 'prosa-ai', handler: () => toggleAi() },
    { type: 'button', icon: 'search', variant: 'ghost', ariaLabel: 'Paleta de comandos (Ctrl+K)', tooltip: 'Ctrl + K', handler: () => palette.open() },
  ],
});
[nameLabel, statusLabel, aiBtn] = [header.items[1] as Label, header.items[2] as Label, header.items[4] as Button];

create({
  type: 'viewport', renderTo: document.body,
  items: [shell = create<Container>({
    type: 'container', layout: { type: 'border', open: 'west' }, items: [
      { type: 'container', region: 'west', width: 360, cls: 'prosa-side', layout: { type: 'vbox' }, items: [
        { type: 'toolbar', items: [{ type: 'label', text: 'Prosa', style: 'font-weight:600;font-size:var(--op-font-size-lg)' }, '->', { type: 'button', icon: 'search', text: 'Ctrl K', variant: 'ghost', handler: () => palette.open() }] },
        search, list,
      ] },
      { type: 'container', region: 'center', layout: { type: 'vbox' }, items: [header, ...convos.map((c) => c.chat!)] },
    ],
  })],
});
setHeader(current);
