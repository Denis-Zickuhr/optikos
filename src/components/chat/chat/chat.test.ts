import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Chat, setLocale } from 'optikos';

const cleanup: Chat[] = [];
const mk = (cfg: object = {}) => {
  const c = create<Chat>({ type: 'chat', me: 'me', ...cfg } as any);
  document.body.append(c.el);
  c.notifyMount();
  cleanup.push(c);
  return c;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
  setLocale('en');
});
const msgs = (c: Chat) => Array.from(c.el.querySelectorAll<HTMLElement>('.op-chat__msg'));
const text = (c: Chat) => msgs(c).map((m) => m.querySelector('.op-chat__text')!.textContent);
const input = (c: Chat) => c.el.querySelector('.op-chat__input') as HTMLTextAreaElement;
const enter = (c: Chat, init: KeyboardEventInit = {}) => input(c).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init }));
const at = (d: string) => new Date(d).getTime();

describe('Chat', () => {
  it('renders bubbles on the right side, groups by author and day, with day separators', () => {
    const c = mk({
      users: { ana: { name: 'Ana' } },
      messages: [
        { id: 1, from: 'ana', text: 'Hi', time: at('2026-11-05T10:00:00') },
        { id: 2, from: 'ana', text: 'Are you there?', time: at('2026-11-05T10:01:00') },
        { id: 3, from: 'me', text: 'Yes!', time: at('2026-11-05T10:02:00'), status: 'read' },
        { id: 4, from: 'ana', text: 'Next day', time: at('2026-11-06T09:00:00') },
      ],
    });
    expect(msgs(c).map((m) => m.className.includes('is-me'))).toEqual([false, false, true, false]);
    expect(msgs(c).map((m) => [m.classList.contains('is-first'), m.classList.contains('is-last')])).toEqual([[true, false], [false, true], [true, true], [true, true]]);
    expect(c.el.querySelectorAll('.op-chat__day')).toHaveLength(2);
    expect(msgs(c)[0].querySelector('.op-chat__author')!.textContent).toBe('Ana');
    expect((msgs(c)[1].querySelector('.op-chat__author') as HTMLElement).hidden).toBe(true); // same run: name only once
    expect(c.el.querySelector('.op-chat__log')!.getAttribute('role')).toBe('log');
  });

  it('formats **bold**, *italic*, `code` and line breaks without ever creating markup from the text', () => {
    const c = mk({ messages: [{ from: 'x', text: 'a **b** *c* `d`\n<img src=x onerror=alert(1)> **' }] });
    const el = c.el.querySelector('.op-chat__text')!;
    expect(el.querySelector('strong')!.textContent).toBe('b');
    expect(el.querySelector('em')!.textContent).toBe('c');
    expect(el.querySelector('code')!.textContent).toBe('d');
    expect(el.querySelector('br')).not.toBeNull();
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('Enter sends (trimmed), Shift+Enter does not; the message appears as "sending" and `send` carries it', () => {
    const c = mk();
    const sent = vi.fn();
    c.on('send', sent);
    input(c).value = '  hello  ';
    enter(c, { shiftKey: true });
    expect(sent).not.toHaveBeenCalled();
    enter(c);
    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0][0]).toBe('hello');
    expect(text(c)).toEqual(['hello']);
    expect(msgs(c)[0].querySelector('.op-chat__status')!.className).toContain('is-sending');
    expect(input(c).value).toBe('');
    input(c).value = '   ';
    enter(c);
    expect(sent).toHaveBeenCalledTimes(1); // empty: nothing
  });

  it('before-send can cancel; busy and readonly block sending; send(text) is the same path', () => {
    const c = mk();
    c.on('before-send', (t: string) => t !== 'no');
    expect(c.send('no')).toBe(false);
    expect(c.send('yes')).toBe(true);
    c.setBusy(true);
    expect(c.send('later')).toBe(false);
    expect(c.el.classList.contains('is-busy')).toBe(true);
    expect(c.el.querySelector('.op-chat__log')!.getAttribute('aria-busy')).toBe('true');
    c.setBusy(false);
    c.setReadonly(true);
    expect(c.send('x')).toBe(false);
    expect(text(c)).toEqual(['yes']);
  });

  it('updateMessage changes status; appendToMessage streams into the same bubble without redrawing others', () => {
    const c = mk({ messages: [{ id: 'a', from: 'me', text: 'q', status: 'sent' }, { id: 'b', from: 'bot', text: '' }] });
    const first = msgs(c)[0];
    c.updateMessage('a', { status: 'read' });
    expect(msgs(c)[0].querySelector('.op-chat__status')!.className).toContain('is-read');
    const bubble = msgs(c)[1];
    for (const piece of ['Hel', 'lo ', '**wor', 'ld**']) c.appendToMessage('b', piece);
    expect(msgs(c)[1]).toBe(bubble); // same element
    expect(bubble.querySelector('.op-chat__text')!.textContent).toBe('Hello world');
    expect(bubble.querySelector('strong')!.textContent).toBe('world');
    expect(c.getMessages()[1].text).toBe('Hel' + 'lo **world**');
    void first;
  });

  it('typing indicator: dots, with a name, hidden again; stays the last child when messages arrive', () => {
    const c = mk();
    const typing = c.el.querySelector('.op-chat__typing') as HTMLElement;
    expect(typing.hidden).toBe(true);
    c.setTyping('Ana');
    expect(typing.hidden).toBe(false);
    expect(typing.textContent).toBe('Ana is typing…');
    c.addMessage({ from: 'ana', text: 'hey' });
    expect(c.el.querySelector('.op-chat__log')!.lastElementChild).toBe(typing);
    c.setTyping(false);
    expect(typing.hidden).toBe(true);
  });

  it('suggestion chips send their text and emit `suggestion`; they are disabled while busy', () => {
    const c = mk({ suggestions: ['Summarize', 'Reply politely'] });
    const sug = vi.fn();
    c.on('suggestion', sug);
    const chips = () => Array.from(c.el.querySelectorAll<HTMLButtonElement>('.op-chat__chip'));
    expect(chips().map((b) => b.textContent)).toEqual(['Summarize', 'Reply politely']);
    chips()[1].click();
    expect(sug).toHaveBeenCalledWith('Reply politely');
    expect(text(c)).toEqual(['Reply politely']);
    c.setBusy(true);
    expect(chips().every((b) => b.disabled)).toBe(true);
    c.setSuggestions([]);
    expect((c.el.querySelector('.op-chat__suggestions') as HTMLElement).hidden).toBe(true);
  });

  it('quotes a replied message, supports a custom renderer, removes messages, shows the empty text', () => {
    const c = mk({ messages: [{ id: 1, from: 'ana', text: 'Lunch?' }, { id: 2, from: 'me', text: 'Sure', replyTo: 1 }] });
    expect(c.el.querySelector('.op-chat__reply')!.textContent).toContain('Lunch?');
    c.removeMessage(1);
    expect(msgs(c)).toHaveLength(1);
    c.removeMessage(2);
    expect((c.el.querySelector('.op-chat__empty') as HTMLElement).hidden).toBe(false);
    const r = mk({ renderer: (m: any) => Object.assign(document.createElement('b'), { textContent: m.text.toUpperCase() }), messages: [{ from: 'x', text: 'shout' }] });
    expect(r.el.querySelector('.op-chat__text b')!.textContent).toBe('SHOUT');
  });

  it('message-click, pt-BR texts, and cleanup', () => {
    setLocale('pt-BR');
    const c = mk({ messages: [{ id: 'k', from: 'x', text: 'hi', time: Date.now() }] });
    const click = vi.fn();
    c.on('message-click', click);
    (c.el.querySelector('.op-chat__bubble') as HTMLElement).click();
    expect(click.mock.calls[0][0].id).toBe('k');
    expect(c.el.querySelector('.op-chat__day')!.textContent).toBe('Hoje');
    expect(input(c).placeholder).toBe('Digite uma mensagem');
    c.destroy();
    expect(document.body.contains(c.el)).toBe(false);
  });
});

describe('Chat in a lazy container', () => {
  it('can be told it is mounted before it is rendered, keeps messages set before render', () => {
    const c = create<Chat>({ type: 'chat', me: 'me' } as any);
    expect(() => c.notifyMount()).not.toThrow();
    c.setMessages([{ from: 'ana', text: 'hello' }]);
    c.addMessage({ from: 'me', text: 'hi' });
    document.body.append(c.el);
    cleanup.push(c);
    expect(msgs(c).map((m) => m.querySelector('.op-chat__text')!.textContent)).toEqual(['hello', 'hi']);
  });
});
