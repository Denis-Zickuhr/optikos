// Photo grids (Library, Favorites, one per album) and the full-size viewer. Public API only.
import {
  create, register, Component, Store, MessageBox, toast, Menu,
  type DataView, type Container, type Window, type Chat, type Form, type Model, type Toolbar, type Button, type Label, type ChatMessage,
} from 'optikos';
import { albums, photos, bytes, me, type Photo } from './data';
import { el, asPhoto, type Ctx } from './ui';

// ---- the viewer's big picture: a small custom component with Prev / Next ----------------------------------------------------------------
interface StageConfig { onPrev: () => void; onNext: () => void }
class Stage extends Component<StageConfig & { id?: string }> {
  protected override baseCls = 'pg-stage';
  private img = document.createElement('img');
  private cap = el('figcaption');
  protected override onRender() {
    const prev = Object.assign(el('button', 'pg-prev', '‹'), { type: 'button', ariaLabel: 'Previous photo' });
    const next = Object.assign(el('button', 'pg-next', '›'), { type: 'button', ariaLabel: 'Next photo' });
    prev.setAttribute('aria-label', 'Previous photo');
    next.setAttribute('aria-label', 'Next photo');
    this.listen(prev, 'click', () => this.config.onPrev());
    this.listen(next, 'click', () => this.config.onNext());
    this.el.append(this.img, prev, next, this.cap);
  }
  setPhoto(p: Photo) {
    this.render();
    this.img.src = p.src;
    this.img.alt = p.title;
    this.cap.textContent = `${p.title} · ${p.album} · ${p.takenAt}`;
  }
}
register('pg-stage', Stage);

/** One photo card: thumbnail, backup dot, favorite heart, caption, video badge. */
const card = (p: Photo) => {
  const wrap = el('span', 'pg-card');
  const img = Object.assign(document.createElement('img'), { src: p.src, alt: p.title, loading: 'lazy' });
  const dot = Object.assign(el('span', `pg-dot pg-dot--${p.backup}`), { title: `Backup: ${p.backup}` });
  const heart = Object.assign(el('button', `pg-heart${p.favorite ? ' is-on' : ''}`, p.favorite ? '♥' : '♡'), { type: 'button' });
  heart.dataset.opAction = 'favorite';
  heart.setAttribute('aria-pressed', String(p.favorite));
  heart.setAttribute('aria-label', p.favorite ? `Remove ${p.title} from favorites` : `Add ${p.title} to favorites`);
  const cap = el('span', 'pg-cap', `${p.title} · ${p.takenAt}`);
  wrap.append(img, dot, heart, cap);
  if (p.kind === 'video') wrap.append(el('span', 'pg-tag', `▶ ${Math.floor((p.duration ?? 0) / 60)}:${String((p.duration ?? 0) % 60).padStart(2, '0')}`));
  return wrap;
};

export interface LibraryDef { id: string; title: string; subtitle?: string; predicate: (p: Photo) => boolean; album?: string }

const SIZE = { Small: '8rem', Medium: '12rem', Large: '17rem' } as const;

export function buildLibrary(ctx: Ctx, def: LibraryDef): Container {
  const store = new Store<any>({ data: [...photos], pageSize: 60, model: { idField: 'id' } });
  let kind = 'all';
  const view = create<DataView>({
    type: 'dataview', store, selection: 'multi', itemWidth: SIZE.Medium, paging: true, flex: 1, ariaLabel: def.title,
    emptyText: def.id === 'favorites' ? 'No favorites yet: tap the heart on a photo.' : 'No photos here yet',
    renderer: (rec: Model) => card(asPhoto(rec)), itemCls: () => 'pg-item',
  });
  const count = create<Label>({ type: 'label', text: '', style: 'color:var(--op-color-fg-muted)' });
  const sync = () => {
    store.filter((r) => def.predicate(asPhoto(r)) && (kind === 'all' || asPhoto(r).kind === kind));
    count.setText(`${store.totalCount} item${store.totalCount === 1 ? '' : 's'}`);
  };
  const reload = () => (store.loadData([...photos]), sync());
  ctx.onPhotosChanged(reload);
  sync();

  const selected = () => view.getSelection().map(asPhoto);
  const bar = create<Toolbar>({
    type: 'toolbar', hidden: true, style: 'background:var(--op-color-primary-soft)',
    items: [
      { type: 'label', text: '0 selected', id: `${def.id}-count`, style: 'font-weight:600' },
      { type: 'button', text: 'Favorite', icon: 'check', variant: 'ghost', handler: () => { const s = selected(); const all = s.every((p) => p.favorite); s.forEach((p) => (p.favorite = !all)); ctx.photosChanged(); } },
      { type: 'button', text: 'Add to album', icon: 'plus', variant: 'ghost', handler: (b: Button) => albumMenu(b) },
      { type: 'button', text: 'Share', icon: 'users', variant: 'ghost', handler: () => ctx.openShare(selected().map((p) => ({ kind: 'photo' as const, name: p.title }))) },
      { type: 'button', text: 'Back up', variant: 'ghost', handler: () => { selected().forEach((p) => (p.backup = 'synced')); ctx.photosChanged(); toast({ type: 'success', text: 'Backed up' }); } },
      '->',
      { type: 'button', text: 'Delete', icon: 'trash', variant: 'danger', handler: () => void del() },
      { type: 'button', text: 'Clear', variant: 'ghost', handler: () => view.deselectAll() },
    ],
  });
  const menu = create<Menu>({ type: 'menu', items: [] });
  const albumMenu = (b: Button) => {
    menu.setItems(albums.map((a) => ({ text: a, handler: () => { selected().forEach((p) => (p.album = a)); ctx.photosChanged(); toast({ text: `Moved to ${a}` }); } })));
    menu.showBy(b);
  };
  const del = async () => {
    const s = selected();
    if (!(await MessageBox.confirm(`Delete ${s.length} item${s.length === 1 ? '' : 's'}? They will be removed from every device.`, { danger: true, okText: 'Delete', title: 'Delete photos' }))) return;
    for (const p of s) photos.splice(photos.indexOf(p), 1);
    ctx.photosChanged();
    toast({ text: `${s.length} deleted` });
  };
  view.on('select', (recs: Model[]) => {
    (bar.items[0] as unknown as { setText(t: string): void }).setText(`${recs.length} selected`);
    recs.length ? bar.show() : bar.hide();
  });
  view.on('item-action', (action: string, rec: Model) => {
    if (action !== 'favorite') return;
    const p = asPhoto(rec);
    p.favorite = !p.favorite;
    ctx.photosChanged();
  });
  const open = (rec: Model) => ctx.openViewer(asPhoto(rec), store.getFiltered().map(asPhoto));
  view.on('item-dblclick', open);
  view.on('item-activate', open);

  const header = create<Toolbar>({
    type: 'toolbar', style: 'background:transparent;border:0;padding:0',
    items: [
      { type: 'label', text: def.title, style: 'font-size:var(--op-font-size-xl);font-weight:700' },
      count as never,
      '->',
      { type: 'select', width: 130, stableSize: false, value: 'all', options: [{ value: 'all', label: 'All media' }, { value: 'photo', label: 'Photos' }, { value: 'video', label: 'Videos' }], listeners: { change: (v: string) => ((kind = v ?? 'all'), sync()) } },
      { type: 'select', width: 140, stableSize: false, value: 'newest', options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'title', label: 'Title' }, { value: 'size', label: 'Largest' }], listeners: { change: (v: string) => (v === 'oldest' ? store.sort('takenAt', 'asc') : v === 'title' ? store.sort('title', 'asc') : v === 'size' ? store.sort('size', 'desc') : store.sort('takenAt', 'desc')) } },
      { type: 'select', width: 110, stableSize: false, value: 'Medium', options: ['Small', 'Medium', 'Large'], listeners: { change: (v: string) => view.el.style.setProperty('--op-dataview-item-width', SIZE[(v ?? 'Medium') as keyof typeof SIZE]) } },
      ...(def.album ? [{ type: 'button', text: 'Share album', icon: 'users', handler: () => ctx.openShare([{ kind: 'album', name: def.album! }]) }] : []),
    ],
  });
  return create<Container>({ type: 'container', id: `view-${def.id}`, layout: { type: 'vbox', gap: 8 }, cls: 'pg-view', items: [header, bar, view] });
}

// ---- the viewer ---------------------------------------------------------------------------------------------------------------------------------
export function openViewer(ctx: Ctx, photo: Photo, list: Photo[]): void {
  let index = Math.max(0, list.indexOf(photo));
  let win!: Window;
  const cur = () => list[index];
  const stage = create<Stage>({ type: 'pg-stage', onPrev: () => go(-1), onNext: () => go(1), flex: 1 } as never);

  const form = create<Form>({
    type: 'form', style: 'padding:var(--op-space-3)',
    items: [
      { type: 'textfield', name: 'title', label: 'Title', listeners: { change: (v: string) => v && ((cur().title = v), ctx.photosChanged()) } },
      { type: 'select', name: 'album', label: 'Album', options: albums, listeners: { change: (v: string) => v && ((cur().album = v), ctx.photosChanged()) } },
      { type: 'datefield', name: 'takenAt', label: 'Taken on', listeners: { change: (v: string) => v && ((cur().takenAt = v), ctx.photosChanged()) } },
      { type: 'textfield', name: 'tags', label: 'Tags', help: 'Comma separated', listeners: { change: (v: string) => (cur().tags = (v ?? '').split(',').map((s) => s.trim()).filter(Boolean)) } },
      { type: 'label', name: 'meta', text: '' },
    ],
  });
  const meta = form.items[form.items.length - 1] as unknown as { setText(t: string): void };

  const chat = create<Chat>({ type: 'chat', me, flex: 1, showAuthors: true, placeholder: 'Write a comment…', users: {} });
  chat.on('send', (text: string, msg: ChatMessage) => {
    const list2 = ctx.comments.get(cur().id) ?? [];
    list2.push({ from: me, text, time: Date.now() });
    ctx.comments.set(cur().id, list2);
    chat.updateMessage(msg.id!, { status: 'sent' });
  });

  const tabs = create({
    type: 'tabs', flex: 1,
    items: [
      { type: 'container', title: 'Details', layout: 'fit', items: [form] },
      { type: 'container', title: 'Comments', layout: 'fit', items: [chat] },
    ],
  });

  const heartBtn = create<Button>({ type: 'button', text: '♡ Favorite', variant: 'ghost', handler: () => { cur().favorite = !cur().favorite; show(); ctx.photosChanged(); } });
  function show() {
    const p = cur();
    stage.setPhoto(p);
    form.load({ title: p.title, album: p.album, takenAt: p.takenAt, tags: p.tags.join(', ') });
    meta.setText(`${p.kind} · ${bytes(p.size)} · backup ${p.backup}${p.shared ? ' · shared' : ''}`);
    heartBtn.setText(p.favorite ? '♥ Favorited' : '♡ Favorite');
    win.setTitle(`${p.title} (${index + 1} / ${list.length})`);
    chat.setMessages((ctx.comments.get(p.id) ?? []).map((c) => ({ from: c.from, text: c.text, time: c.time })));
  }
  const go = (d: number) => {
    index = (index + d + list.length) % list.length;
    show();
  };

  win = create<Window>({
    type: 'window', title: '', width: 980, layout: 'fit', icon: 'search',
    items: [{ type: 'container', layout: { type: 'hbox', gap: 12, stackBelow: 760 }, style: 'padding:var(--op-space-3);min-block-size:24rem', items: [stage, { type: 'container', width: 340, layout: 'fit', items: [tabs] }] }],
    bbar: [
      heartBtn,
      { type: 'button', text: 'Share', icon: 'users', variant: 'ghost', handler: () => ctx.openShare([{ kind: 'photo', name: cur().title }]) },
      '->',
      { type: 'button', text: 'Delete', icon: 'trash', variant: 'danger', handler: async () => {
        if (!(await MessageBox.confirm(`Delete “${cur().title}”?`, { danger: true, okText: 'Delete' }))) return;
        photos.splice(photos.indexOf(cur()), 1);
        list.splice(index, 1);
        ctx.photosChanged();
        if (!list.length) return win.close();
        index = Math.min(index, list.length - 1);
        show();
      } },
    ] as never,
    buttons: [{ text: 'Close', variant: 'primary', handler: () => win.close() }],
  });
  win.el.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('input,textarea,select,[contenteditable]')) return;
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });
  win.show();
  show();
}
