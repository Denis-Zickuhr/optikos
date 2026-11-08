import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, getLocale } from '../../../core/i18n';
import { Button } from '../../base/button/button';
import { iconEl } from '../../base/icon/icon';

export interface ChatMessage {
  id?: string | number;
  /** The author's id (compare with the `me` of the config). */
  from: string;
  text: string;
  time?: number | Date | string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  /** The id of the message this one answers (shown as a quote). */
  replyTo?: string | number;
  /** Anything the app wants to keep with the message. */
  meta?: unknown;
}

export interface ChatConfig extends ComponentConfig {
  messages?: ChatMessage[];
  /** The id of whoever is using the chat: their messages go on the right. */
  me: string;
  users?: Record<string, { name: string; color?: string }>;
  /** Show the author's name above the first bubble of a group of theirs. Default true. */
  showAuthors?: boolean;
  placeholder?: string;
  /** Prompt chips above the composer; clicking one sends it. */
  suggestions?: string[];
  readonly?: boolean;
  /** Enter sends and Shift+Enter breaks the line. Default true. */
  sendOnEnter?: boolean;
  maxLength?: number;
  /** Custom bubble content. The default is a minimal, safe formatting (`**bold**`, `*italic*`, `` `code` ``, line breaks). */
  renderer?: (msg: ChatMessage) => string | Node;
}

type Msg = ChatMessage & { id: string | number; at: number };

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/;

/** Text → nodes: bold, italic, code and line breaks only. Everything else stays text, so nothing can inject markup. */
function format(text: string): Node[] {
  const out: Node[] = [];
  text.split('\n').forEach((line, i) => {
    if (i) out.push(document.createElement('br'));
    for (const part of line.split(INLINE)) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) out.push(h('strong', '', {}, part.slice(2, -2)));
      else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) out.push(h('code', 'op-chat__code', {}, part.slice(1, -1)));
      else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) out.push(h('em', '', {}, part.slice(1, -1)));
      else out.push(document.createTextNode(part));
    }
  });
  return out;
}

const dayKey = (at: number) => new Date(at).toDateString();
const lang = () => getLocale()._lang;

/** Conversation view: bubbles grouped by author and day, delivery ticks, typing dots, streaming text, prompt chips and a composer. */
export class Chat extends Component<ChatConfig> {
  protected override baseCls = 'op-chat';
  private msgs: Msg[] = [];
  private seq = 0;
  private logEl!: HTMLElement;
  private emptyEl!: HTMLElement;
  private typingEl!: HTMLElement;
  private chipsEl!: HTMLElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: Button;
  private busy = false;

  protected override build() {
    const c = this.config;
    this.logEl = h('div', 'op-chat__log', { role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', 'aria-label': t('chatLog'), tabindex: 0 });
    this.emptyEl = h('div', 'op-chat__empty', {}, t('chatEmpty'));
    this.typingEl = h('div', 'op-chat__typing', { 'aria-hidden': 'true' }, h('span', 'op-chat__dots', {}, h('i'), h('i'), h('i')), h('span', 'op-chat__typing-text'));
    this.typingEl.hidden = true;
    this.chipsEl = h('div', 'op-chat__suggestions', { role: 'group', 'aria-label': t('chatSuggestions') });
    this.input = h('textarea', 'op-chat__input', { rows: 1, placeholder: c.placeholder ?? t('chatPlaceholder'), 'aria-label': c.placeholder ?? t('chatPlaceholder'), maxlength: c.maxLength ?? null });
    this.sendBtn = new Button({ icon: 'send', variant: 'primary', ariaLabel: t('chatSend'), handler: () => this.submit() });
    this.own(() => this.sendBtn.destroy());
    return h('div', this.baseCls, {}, this.logEl, this.chipsEl, h('div', 'op-chat__composer', {}, this.input, this.sendBtn.el));
  }

  protected override onRender() {
    const c = this.config;
    this.listen(this.input, 'input', () => this.grow());
    this.listen(this.input, 'keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing || c.sendOnEnter === false) return;
      e.preventDefault();
      this.submit();
    });
    this.listen(this.chipsEl, 'click', (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-s]');
      if (!b) return;
      this.emit('suggestion', b.dataset.s);
      this.send(b.dataset.s!);
    });
    this.listen(this.logEl, 'click', (e: Event) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('.op-chat__msg');
      const m = el && this.msgs.find((x) => String(x.id) === el.dataset.id);
      if (m) this.emit('message-click', m);
    });
    this.setReadonly(!!c.readonly);
    this.msgs = (c.messages ?? []).map((m) => this.norm(m));
    this.setSuggestions(c.suggestions ?? []);
    this.renderAll();
  }

  override notifyMount() {
    super.notifyMount();
    if (!this.rendered) return; // a Chat in a lazy tab is told it is mounted before it has a DOM
    this.sendBtn.notifyMount();
    this.scrollToBottom();
  }

  // ---- messages ------------------------------------------------------------------------------

  private norm(m: ChatMessage): Msg {
    const at = m.time == null ? Date.now() : new Date(m.time).getTime();
    return { ...m, id: m.id ?? `m${++this.seq}`, at };
  }

  getMessages(): ChatMessage[] {
    return this.msgs;
  }

  addMessage(msg: ChatMessage): ChatMessage {
    const m = this.norm(msg);
    this.msgs.push(m);
    if (!this.rendered) return (this.config.messages = this.msgs, m);
    const stick = this.nearBottom() || m.from === this.config.me;
    this.mountMsg(m, this.msgs.length - 1);
    this.syncEmpty();
    if (stick) this.scrollToBottom();
    return m;
  }

  setMessages(list: ChatMessage[]): void {
    this.msgs = list.map((m) => this.norm(m));
    this.config.messages = this.msgs; // so a chat that is not rendered yet (a lazy tab) starts with them
    if (this.rendered) {
      this.renderAll();
      this.scrollToBottom();
    }
  }

  updateMessage(id: string | number, patch: Partial<ChatMessage>): void {
    const i = this.msgs.findIndex((m) => m.id === id);
    if (i < 0) return;
    const stick = this.nearBottom();
    this.msgs[i] = { ...this.msgs[i], ...patch, at: patch.time != null ? new Date(patch.time).getTime() : this.msgs[i].at };
    if (!this.rendered) return;
    const old = this.msgEl(id);
    const fresh = this.buildMsg(this.msgs[i], i);
    old ? old.replaceWith(fresh) : this.logEl.insertBefore(fresh, this.typingEl);
    this.decorate(i);
    if (stick) this.scrollToBottom();
  }

  /** Adds text to a message: for answers that arrive in pieces (AI streaming). Only that bubble's text is redrawn. */
  appendToMessage(id: string | number, text: string): void {
    const m = this.msgs.find((x) => x.id === id);
    if (!m) return;
    m.text += text;
    const el = this.msgEl(id)?.querySelector('.op-chat__text');
    if (!el) return;
    const stick = this.nearBottom();
    this.fill(el as HTMLElement, m);
    if (stick) this.scrollToBottom();
  }

  removeMessage(id: string | number): void {
    this.msgs = this.msgs.filter((m) => m.id !== id);
    if (this.rendered) this.renderAll();
  }

  private msgEl(id: string | number): HTMLElement | null {
    return this.logEl.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
  }

  // ---- rendering -----------------------------------------------------------------------------

  private renderAll(): void {
    this.logEl.replaceChildren(this.emptyEl, ...this.msgs.flatMap((m, i) => this.nodesFor(m, i)), this.typingEl);
    this.syncEmpty();
  }

  /** The day separator (when the day changes) and the message itself. */
  private nodesFor(m: Msg, i: number): HTMLElement[] {
    const prev = this.msgs[i - 1];
    const nodes: HTMLElement[] = [];
    if (!prev || dayKey(prev.at) !== dayKey(m.at)) nodes.push(h('div', 'op-chat__day', { role: 'separator' }, h('span', '', {}, this.dayLabel(m.at))));
    nodes.push(this.buildMsg(m, i));
    return nodes;
  }

  private mountMsg(m: Msg, i: number): void {
    for (const n of this.nodesFor(m, i)) this.logEl.insertBefore(n, this.typingEl);
    this.decorate(i - 1);
    this.decorate(i);
  }

  private dayLabel(at: number): string {
    const d = dayKey(at);
    const now = Date.now();
    if (d === dayKey(now)) return t('chatToday');
    if (d === dayKey(now - 864e5)) return t('chatYesterday');
    return new Intl.DateTimeFormat(lang(), { dateStyle: 'medium' }).format(at);
  }

  private fill(el: HTMLElement, m: Msg): void {
    const out = this.config.renderer ? this.config.renderer(m) : format(m.text);
    el.replaceChildren(...(Array.isArray(out) ? out : [out]));
  }

  private buildMsg(m: Msg, i: number): HTMLElement {
    const c = this.config;
    const mine = m.from === c.me;
    const user = c.users?.[m.from];
    const el = h('article', `op-chat__msg ${mine ? 'is-me' : 'is-them'}`, { 'data-id': String(m.id) });
    const bubble = h('div', 'op-chat__bubble');
    if (!mine && c.showAuthors !== false && user) {
      const name = h('div', 'op-chat__author', {}, user.name);
      if (user.color) name.style.color = user.color;
      bubble.append(name);
    }
    const quoted = m.replyTo != null ? this.msgs.find((x) => x.id === m.replyTo) : undefined;
    if (quoted) bubble.append(h('div', 'op-chat__reply', { 'aria-label': t('chatReply') }, h('strong', '', {}, quoted.from === c.me ? '' : (c.users?.[quoted.from]?.name ?? quoted.from)), quoted.text.length > 80 ? `${quoted.text.slice(0, 80)}…` : quoted.text));
    const text = h('div', 'op-chat__text');
    this.fill(text, m);
    const time = new Intl.DateTimeFormat(lang(), { hour: '2-digit', minute: '2-digit' }).format(m.at);
    bubble.append(text, h('span', 'op-chat__meta', {}, h('time', '', { datetime: new Date(m.at).toISOString() }, time), mine && m.status ? this.statusEl(m.status) : ''));
    el.append(bubble);
    this.group(el, i);
    return el;
  }

  private statusEl(s: NonNullable<ChatMessage['status']>): HTMLElement {
    const el = h('span', `op-chat__status is-${s}`, { role: 'img', 'aria-label': s });
    if (s === 'error') el.append(iconEl('alert'));
    else if (s !== 'sending') el.append(iconEl('check'), ...(s === 'sent' ? [] : [iconEl('check')]));
    return el;
  }

  /** Group classes: first/last bubble of a run by the same author on the same day. */
  private group(el: HTMLElement, i: number): void {
    const m = this.msgs[i];
    const same = (a?: Msg, b?: Msg) => !!a && !!b && a.from === b.from && dayKey(a.at) === dayKey(b.at);
    el.classList.toggle('is-first', !same(this.msgs[i - 1], m));
    el.classList.toggle('is-last', !same(m, this.msgs[i + 1]));
    el.querySelector('.op-chat__author')?.toggleAttribute('hidden', same(this.msgs[i - 1], m));
  }

  private decorate(i: number): void {
    const m = this.msgs[i];
    const el = m && this.msgEl(m.id);
    if (el) this.group(el, i);
  }

  private syncEmpty(): void {
    this.emptyEl.hidden = this.msgs.length > 0;
    this.el.classList.toggle('is-empty', !this.msgs.length);
  }

  private nearBottom(): boolean {
    const l = this.logEl;
    return l.scrollHeight - l.scrollTop - l.clientHeight < 48;
  }

  scrollToBottom(): void {
    this.render();
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  // ---- typing, suggestions, state ------------------------------------------------------------

  /** `true` shows the dots, a name shows "name is typing…", `false` hides them. */
  setTyping(who: boolean | string): void {
    const stick = this.nearBottom();
    this.typingEl.hidden = !who;
    this.typingEl.querySelector('.op-chat__typing-text')!.textContent = typeof who === 'string' ? t('chatTyping', { n: who }) : '';
    if (who && stick) this.scrollToBottom();
  }

  setSuggestions(list: string[]): void {
    this.config.suggestions = list;
    if (!this.rendered) return;
    this.chipsEl.hidden = !list.length;
    this.chipsEl.replaceChildren(...list.map((s) => h('button', 'op-chat__chip', { type: 'button', 'data-s': s }, s)));
  }

  /** While busy (an answer is on its way) sending is off and the log tells assistive tech to wait. */
  setBusy(busy: boolean): void {
    this.busy = busy;
    this.el.classList.toggle('is-busy', busy);
    this.logEl.setAttribute('aria-busy', String(busy));
    this.sendBtn.setDisabled(busy || !!this.config.readonly);
    for (const b of Array.from(this.chipsEl.children) as HTMLButtonElement[]) b.disabled = busy || !!this.config.readonly;
  }

  setReadonly(readonly: boolean): void {
    this.config.readonly = readonly;
    if (!this.rendered) return;
    this.input.readOnly = readonly;
    this.el.classList.toggle('is-readonly', readonly);
    this.setBusy(this.busy);
  }

  setPlaceholder(text: string): void {
    this.config.placeholder = text;
    if (this.rendered) this.input.placeholder = text;
  }

  override focus(): void {
    this.render();
    this.input.focus();
  }

  // ---- sending -------------------------------------------------------------------------------

  private grow(): void {
    this.input.style.height = 'auto';
    this.input.style.height = `${this.input.scrollHeight}px`;
  }

  private submit(): void {
    const text = this.input.value;
    if (this.send(text)) {
      this.input.value = '';
      this.grow();
    }
  }

  /** The same path as the send button. Returns false when nothing was sent (empty, busy, read-only or cancelled). */
  send(text: string): boolean {
    text = text.trim();
    if (!text || this.busy || this.config.readonly || this.emit('before-send', text) === false) return false;
    const msg = this.addMessage({ from: this.config.me, text, time: Date.now(), status: 'sending' });
    this.emit('send', text, msg);
    return true;
  }
}
register('chat', Chat);
