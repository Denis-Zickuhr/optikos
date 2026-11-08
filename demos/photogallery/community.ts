// Community: a feed of shared photos, with likes and a comment thread (a Chat) for the selected post. Public API only.
import { create, Store, toast, type Container, type Chat, type DataView, type Model, type Window, type Form, type ChatMessage, type Label } from 'optikos';
import { posts, photos, me, community, thumb, type Post } from './data';
import { el, ago, asPost, type Ctx } from './ui';

const hueOf = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('');

const postCard = (p: Post) => {
  const photo = photos.find((x) => x.id === p.photoId);
  const box = el('article', 'pg-post');
  const head = el('div', 'pg-post__head');
  const av = Object.assign(el('span', 'pg-avatar', initials(p.author)), { style: `background:hsl(${hueOf(p.author)},55%,45%)` });
  const who = el('div');
  who.append(el('strong', '', p.author === me ? 'You' : p.author), Object.assign(el('small', '', `${ago(p.createdAt)}${photo ? ` · ${photo.album}` : ''}`)));
  head.append(av, who);
  const img = Object.assign(document.createElement('img'), { src: photo ? photo.src : thumb(p.hue, 0), alt: p.caption, loading: 'lazy' });
  const foot = el('div', 'pg-post__foot');
  const like = Object.assign(el('button', p.liked ? 'is-on' : '', `${p.liked ? '♥' : '♡'} ${p.likes}`), { type: 'button' });
  like.dataset.opAction = 'like';
  like.setAttribute('aria-pressed', String(p.liked));
  const talk = Object.assign(el('button', '', `💬 ${p.comments.length}`), { type: 'button' });
  talk.dataset.opAction = 'comments';
  foot.append(like, talk);
  box.append(head, img, el('p', '', p.caption), foot);
  return box;
};

export function buildCommunity(ctx: Ctx): Container {
  const store = new Store<any>({ data: [...posts], pageSize: 12, model: { idField: 'id' } });
  const feed = create<DataView>({ type: 'dataview', store, selection: 'single', itemWidth: '17rem', gap: '1rem', paging: true, flex: 1, ariaLabel: 'Community posts', renderer: (rec: Model) => postCard(asPost(rec)) });
  const reload = () => store.loadData([...posts]);

  const title = create<Label>({ type: 'label', text: 'Pick a post', style: 'font-weight:600' });
  const sub = create<Label>({ type: 'label', text: 'Select a post to read and write comments.', style: 'color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)' });
  const chat = create<Chat>({ type: 'chat', me, flex: 1, showAuthors: true, readonly: true, placeholder: 'Write a comment…', users: {} });
  let current: Post | undefined;
  const show = (p: Post) => {
    current = p;
    title.setText(`${p.author === me ? 'Your post' : p.author}`);
    sub.setText(p.caption);
    chat.setReadonly(false);
    chat.setMessages(p.comments.map((c) => ({ from: c.from, text: c.text, time: c.time })));
    chat.focus();
  };
  const others = community;
  chat.on('send', (text: string, msg: ChatMessage) => {
    const p = current;
    if (!p) return;
    p.comments.push({ from: me, text, time: Date.now() });
    chat.updateMessage(msg.id!, { status: 'sent' });
    reload();
    // somebody answers now and then
    if (Math.random() > 0.35) {
      const who = others[Math.floor(Math.random() * others.length)];
      setTimeout(() => chat.setTyping(who.split(' ')[0]), 700);
      setTimeout(() => {
        chat.setTyping(false);
        const reply = ['Love this!', 'Haha yes', 'Totally agree', 'Thanks for sharing 🙌', 'Where was it taken?'][Math.floor(Math.random() * 5)];
        p.comments.push({ from: who, text: reply, time: Date.now() });
        if (current === p) chat.addMessage({ from: who, text: reply, time: Date.now() });
        reload();
      }, 2200);
    }
  });

  const side = create<Container>({
    type: 'container', region: 'east', width: 360, layout: { type: 'vbox', gap: 0 }, style: 'background:var(--op-color-surface);border-inline-start:1px solid var(--op-color-border);--op-region-drawer-width:100%',
    items: [{ type: 'container', layout: { type: 'vbox', gap: 2 }, style: 'padding:var(--op-space-3);border-bottom:1px solid var(--op-color-border)', items: [title, sub] }, chat],
  });
  const main = create<Container>({
    type: 'container', region: 'center', layout: { type: 'vbox', gap: 8 }, cls: 'pg-view',
    items: [
      { type: 'toolbar', style: 'background:transparent;border:0;padding:0', items: [{ type: 'label', text: 'Community', style: 'font-size:var(--op-font-size-xl);font-weight:700' }, '->', { type: 'button', text: 'Share a photo', icon: 'plus', variant: 'primary', handler: () => newPost() }] },
      feed,
    ],
  });
  const root = create<Container>({ type: 'container', id: 'view-community', layout: { type: 'border', narrowBelow: 900 }, items: [main, side] });

  feed.on('select', (recs: Model[]) => {
    const p = recs[0] ? asPost(recs[0]) : undefined;
    if (!p) return;
    show(p);
    root.layout?.openRegion?.('east');
  });
  feed.on('item-action', (action: string, rec: Model) => {
    const p = asPost(rec);
    if (action === 'like') {
      p.liked = !p.liked;
      p.likes += p.liked ? 1 : -1;
      reload();
    } else if (action === 'comments') {
      feed.select(rec);
    }
  });

  function newPost() {
    const form: Form = create<Form>({
      type: 'form', style: 'padding:var(--op-space-4)',
      items: [
        { type: 'select', name: 'photoId', label: 'Photo', required: true, options: photos.slice(0, 40).map((p) => ({ value: p.id, label: `${p.title} · ${p.album}` })) },
        { type: 'textarea', name: 'caption', label: 'Caption', rows: 3, required: true, maxLength: 200 },
        { type: 'radiogroup', name: 'who', label: 'Who can see it', value: 'community', direction: 'horizontal', options: [{ value: 'community', label: 'Community' }, { value: 'friends', label: 'Friends' }] },
      ],
    });
    const win: Window = create<Window>({ type: 'window', title: 'Share a photo', icon: 'plus', width: 480, layout: 'fit', items: [form], buttons: [{ text: 'Cancel', handler: () => win.close() }, { text: 'Post', variant: 'primary', handler: () => form.submit() }] });
    form.on('submit', (v: Record<string, any>) => {
      const ph = photos.find((p) => p.id === Number(v.photoId))!;
      posts.unshift({ id: posts.length + 1, author: me, hue: ph.hue, photoId: ph.id, caption: v.caption, createdAt: Date.now(), likes: 0, liked: false, comments: [] });
      ctx.photosChanged();
      reload();
      toast({ type: 'success', text: 'Posted to the community' });
      win.close();
    });
    win.show();
  }
  return root;
}
