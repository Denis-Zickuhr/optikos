import { create, Chat, type ChatMessage } from 'optikos';
import { page } from '../../dev/kit';

const p = page('chat');
const min = (n: number) => Date.now() - n * 60000;

p.section('Chat · static', 'bubbles by author, grouped runs, day separators (Yesterday / Today), delivery ticks (sent ✓, delivered ✓✓, read ✓✓ blue), a quoted reply, **bold**, *italic* and `code`.', (host, { watch }) => {
  const messages: ChatMessage[] = [
    { id: 1, from: 'ana', text: 'Did you see the **release notes**?', time: min(60 * 26) },
    { id: 2, from: 'ana', text: 'The grid now has `rowActionsMode`.', time: min(60 * 26 - 1) },
    { id: 3, from: 'me', text: 'Not yet! Reading now.', time: min(60 * 25), status: 'read' },
    { id: 4, from: 'me', text: 'Sent', time: min(5), status: 'sent' },
    { id: 5, from: 'ana', text: 'Great. *Tell me what you think.*', time: min(4), replyTo: 3 },
    { id: 6, from: 'me', text: 'Delivered, not read yet', time: min(2), status: 'delivered' },
    { id: 7, from: 'me', text: 'Failed to send', time: min(1), status: 'error' },
  ];
  watch(create<Chat>({ type: 'chat', me: 'me', users: { ana: { name: 'Ana', color: 'var(--op-color-info)' } }, messages, height: 420, width: '100%', renderTo: host }), ['message-click']);
});

p.section('Chat · send and reply', 'type and press Enter (Shift+Enter = new line). The message goes "sending → sent → read"; the other side shows "typing…" and answers.', (host, { log }) => {
  const chat = create<Chat>({ type: 'chat', me: 'me', users: { bot: { name: 'Echo' } }, height: 360, width: '100%', renderTo: host, messages: [{ from: 'bot', text: 'Say something, I will repeat it.', time: Date.now() }] });
  chat.on('send', (text: string, msg: ChatMessage) => {
    log('send', text);
    setTimeout(() => chat.updateMessage(msg.id!, { status: 'sent' }), 300);
    setTimeout(() => chat.updateMessage(msg.id!, { status: 'read' }), 900);
    setTimeout(() => chat.setTyping('Echo'), 1000);
    setTimeout(() => { chat.setTyping(false); chat.addMessage({ from: 'bot', text: `You said: **${text}**` }); }, 2200);
  });
});

p.section('Chat · AI streaming', 'the answer arrives in pieces (appendToMessage), the composer is busy meanwhile (setBusy), prompt chips send a ready-made question.', (host) => {
  const chat = create<Chat>({
    type: 'chat', me: 'me', users: { ai: { name: '✨ Assistant', color: 'var(--op-color-primary)' } }, height: 380, width: '100%', renderTo: host,
    suggestions: ['What can you do?', 'Show me some code'],
    messages: [{ from: 'ai', text: 'Hi! Ask me something, or pick one of the suggestions.', time: Date.now() }],
  });
  const answers: Record<string, string> = {
    'What can you do?': 'I am a **fake** assistant: the answer is typed out piece by piece with `appendToMessage`.\nTwo prompts are enough to test the idea.',
    'Show me some code': 'Sure:\n`chat.appendToMessage(id, token)`\nOnly the text node of this bubble is redrawn, so it stays *fast* even for long answers.',
  };
  chat.on('send', async (text: string) => {
    chat.setBusy(true);
    chat.setTyping(true);
    await new Promise((r) => setTimeout(r, 700));
    chat.setTyping(false);
    const id = chat.addMessage({ from: 'ai', text: '' }).id!;
    for (const tok of (answers[text] ?? 'That is outside my two scripted answers, try a chip.').match(/\S+\s*/g)!) {
      chat.appendToMessage(id, tok);
      await new Promise((r) => setTimeout(r, 45));
    }
    chat.setBusy(false);
    chat.focus();
  });
});

p.section('Chat · group, readonly', 'authors get a colour and a name above the first bubble of their run; a readonly chat hides the composer.', (host) => {
  const users = { ana: { name: 'Ana', color: '#c2410c' }, bruno: { name: 'Bruno', color: '#0369a1' }, caio: { name: 'Caio', color: '#15803d' } };
  const messages: ChatMessage[] = [
    { from: 'ana', text: 'Pizza tonight?', time: min(30) }, { from: 'bruno', text: 'Yes!', time: min(29) }, { from: 'bruno', text: 'Margherita for me', time: min(29) },
    { from: 'caio', text: 'Count me in', time: min(27) }, { from: 'me', text: 'Same. 8pm?', time: min(26), status: 'read' },
  ];
  create({ type: 'chat', me: 'me', users, messages, height: 300, width: '100%', renderTo: host });
  create({ type: 'chat', me: 'me', users, messages: messages.slice(0, 3), readonly: true, height: 220, width: '100%', renderTo: host });
});
