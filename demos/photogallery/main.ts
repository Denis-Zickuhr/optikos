// Photo gallery demo ("Lumina"): library, favorites, albums, files, sharing, backup and a community with comments. NavMenu + Ctrl+K palette, responsive (drawer on phones). Public API only.
import {
  create, NavMenu, CommandPalette, Menu, toast, type Container, type NavItem, type Button, type Component,
} from 'optikos';
import { albums, photos, files, me, thumb, community, type Photo, type Comment } from './data';
import { css, el, progress, type Ctx } from './ui';
import { buildLibrary, openViewer } from './library';
import { buildFiles, buildShared } from './files';
import { buildBackup, runBackup } from './backup';
import { buildCommunity } from './community';
import { openShare } from './share';

const style = document.createElement('style');
style.textContent = css;
document.head.append(style);

// ---- app context: the views talk to each other through this ---------------------------------------------------------------------------------
const listeners: Array<() => void> = [];
const comments = new Map<number, Comment[]>();
const sample = ['Stunning colours!', 'Which lens?', 'I need to go there', 'Framing is perfect', 'Beautiful light'];
photos.slice(0, 14).forEach((p, i) => comments.set(p.id, Array.from({ length: (i % 3) + 1 }, (_, k) => ({ from: community[(i + k) % community.length], text: sample[(i + k) % sample.length], time: Date.UTC(2026, 10, 7, 9 + k) }))));

const ctx: Ctx = {
  navigate: (id) => open(id),
  openViewer: (p, list) => openViewer(ctx, p, list),
  openShare: (t) => openShare(ctx, t),
  photosChanged: () => {
    listeners.forEach((fn) => fn());
    paintChrome();
  },
  onPhotosChanged: (fn) => void listeners.push(fn),
  upload: (picked) => (picked ? ingest(picked) : chooser()),
  backupNow: () => runBackup(ctx),
  comments,
};

/** Files chosen by the user (or none: a few generated ones) become new photos, "pending" until the fake backup catches up. */
function ingest(list: File[]) {
  const added: Photo[] = list.map((f, i) => {
    const hue = (f.name.length * 37 + i * 53) % 360;
    const video = f.type.startsWith('video');
    return { id: Math.max(0, ...photos.map((p) => p.id)) + 1 + i, title: f.name.replace(/\.[^.]+$/, ''), album: 'Uploads', takenAt: '2026-11-08', size: Math.round((f.size / 1048576) * 10) / 10 || 0.1, kind: video ? 'video' : 'photo', favorite: false, backup: 'pending', shared: false, tags: ['upload'], hue, variant: i % 4, src: f.type.startsWith('image') ? URL.createObjectURL(f) : thumb(hue, i % 4), duration: video ? 30 : undefined, dateLabel: '2026-11-08' } as Photo;
  });
  photos.unshift(...added);
  ctx.photosChanged();
  toast({ type: 'success', title: `${added.length} uploaded`, text: 'They will be backed up shortly.' });
  setTimeout(() => (added.forEach((p) => (p.backup = 'synced')), ctx.photosChanged()), 2500);
}
function chooser() {
  const input = Object.assign(document.createElement('input'), { type: 'file', multiple: true, accept: 'image/*,video/*' });
  input.addEventListener('change', () => input.files?.length && ingest([...input.files]));
  input.click();
}
const sampleUploads = () => ingest(Array.from({ length: 5 }, (_, i) => new File(['x'.repeat(2e6 + i * 4e5)], `Sample ${i + 1}.jpg`, { type: 'image/jpeg' })));

// ---- views (built the first time they are opened) -----------------------------------------------------------------------------------------
const views = new Map<string, Component>();
let stage!: Container;
const factories: Record<string, () => Component> = {
  library: () => buildLibrary(ctx, { id: 'library', title: 'Library', predicate: () => true }),
  favorites: () => buildLibrary(ctx, { id: 'favorites', title: 'Favorites', predicate: (p) => p.favorite }),
  files: () => buildFiles(ctx),
  shared: () => buildShared(ctx),
  backup: () => buildBackup(ctx),
  community: () => buildCommunity(ctx),
};
for (const a of albums) factories[`album:${a}`] = () => buildLibrary(ctx, { id: `album-${a}`, title: a, album: a, predicate: (p) => p.album === a });

function open(id: string) {
  if (!factories[id]) return;
  let v = views.get(id);
  if (!v) {
    v = factories[id]();
    views.set(id, v);
    stage.add(v);
  }
  stage.setActiveItem(v);
  nav.setActive(id);
  shell.layout?.closeRegion?.('west');
  document.title = `${titleOf(id)} · Lumina`;
}
const titleOf = (id: string) => (id.startsWith('album:') ? id.slice(6) : id[0].toUpperCase() + id.slice(1));

// ---- navigation ---------------------------------------------------------------------------------------------------------------------------------
const navItems = (): NavItem[] => [
  { id: 'library', text: 'Library', icon: 'image' },
  { id: 'favorites', text: 'Favorites', icon: 'heart', badge: photos.filter((p) => p.favorite).length || undefined },
  { id: 'grp-albums', text: 'Albums', expanded: true, items: albums.map((a) => ({ id: `album:${a}`, text: a, icon: 'folder' })) },
  { id: 'files', text: 'Files', icon: 'file' },
  { id: 'shared', text: 'Shared', icon: 'share' },
  { id: 'backup', text: 'Backup', icon: 'cloud', badge: photos.filter((p) => p.backup !== 'synced').length + files.filter((f) => f.backup !== 'synced').length || undefined },
  { id: 'community', text: 'Community', icon: 'message', badge: 3 },
];
const nav = create<NavMenu>({ type: 'navmenu', items: navItems(), active: 'library', ariaLabel: 'Main navigation', flex: 1 });
nav.on('select', (i: NavItem) => open(i.id));

const used = el('span', '', '');
const usedBar = progress();
function paintChrome() {
  nav.updateItem('favorites', { badge: photos.filter((p) => p.favorite).length || undefined });
  nav.updateItem('backup', { badge: photos.filter((p) => p.backup !== 'synced').length + files.filter((f) => f.backup !== 'synced').length || undefined });
  const gb = (photos.reduce((s, p) => s + p.size, 0) + files.reduce((s, f) => s + f.size / 1024, 0)) / 1024;
  used.textContent = `${gb.toFixed(1)} GB of 100 GB used · ${photos.length} photos`;
  usedBar.set(gb);
}
paintChrome();

// ---- palette ---------------------------------------------------------------------------------------------------------------------------------------
const palette = create<CommandPalette>({
  type: 'commandpalette', categories: ['Go to', 'Do'], placeholder: 'Jump to an album, upload, back up…',
  commands: [
    ...[['library', 'Library', 'image'], ['favorites', 'Favorites', 'heart'], ['files', 'Files', 'file'], ['shared', 'Shared', 'share'], ['backup', 'Backup', 'cloud'], ['community', 'Community', 'message']].map(([id, text, icon]) => ({ id: `go-${id}`, title: `Go to ${text}`, category: 'Go to', icon, handler: () => open(id) })),
    ...albums.map((a) => ({ id: `go-album-${a}`, title: `Album: ${a}`, category: 'Go to', icon: 'folder', keywords: ['album', 'folder'], handler: () => open(`album:${a}`) })),
    { id: 'upload', title: 'Upload photos…', category: 'Do', icon: 'plus', shortcut: 'U', handler: () => chooser() },
    { id: 'upload-sample', title: 'Upload 5 sample photos', category: 'Do', icon: 'plus', handler: sampleUploads },
    { id: 'backup-now', title: 'Back up now', category: 'Do', icon: 'cloud', handler: () => runBackup(ctx) },
    { id: 'random', title: 'Open a random memory', category: 'Do', icon: 'image', keywords: ['shuffle'], handler: () => ctx.openViewer(photos[Math.floor(Math.random() * photos.length)], [...photos]) },
    { id: 'share-album', title: 'Share an album…', category: 'Do', icon: 'share', children: albums.map((a) => ({ id: `sa-${a}`, title: a, handler: () => ctx.openShare([{ kind: 'album', name: a }]) })) },
  ],
});

// ---- shell ----------------------------------------------------------------------------------------------------------------------------------------------
const userMenu = create<Menu>({ type: 'menu', items: [
  { text: 'Account', icon: 'user', handler: () => toast({ text: 'Account settings (demo)' }) },
  { text: 'Storage plan', icon: 'cloud', handler: () => open('backup') },
  '-', { text: 'Sign out', handler: () => toast({ type: 'warning', text: 'Signed out (demo)' }) },
] });
stage = create<Container>({ type: 'container', region: 'center', layout: { type: 'card' }, items: [] });
const side = create<Container>({
  type: 'container', region: 'west', width: 252, cls: 'pg-side', layout: { type: 'vbox', gap: 0 },
  items: [nav, { type: 'pg-html', cls: 'pg-storage', child: (() => { const d = el('div'); d.append(usedBar.el, used); return d; })() } as never],
});
const shell: Container = create<Container>({
  type: 'container', layout: { type: 'border', narrowBelow: 860 },
  items: [
    { type: 'toolbar', region: 'north', cls: 'pg-top', items: [
      { type: 'button', icon: 'menu', variant: 'ghost', cls: 'pg-burger', ariaLabel: 'Menu', handler: () => shell.layout?.toggleRegion?.('west') },
      { type: 'label', text: 'Lumina', cls: 'pg-brand' },
      { type: 'button', icon: 'search', variant: 'ghost', text: 'Search or jump to…  Ctrl K', handler: () => palette.open() },
      '->',
      { type: 'button', text: 'Upload', icon: 'plus', variant: 'primary', handler: () => chooser() },
      { type: 'button', icon: 'bell', variant: 'ghost', ariaLabel: 'Notifications', handler: () => toast({ type: 'info', title: 'Community', text: `${community[0]} commented on your photo` }) },
      { type: 'button', text: me, icon: 'user', variant: 'ghost', handler: (b: Button) => userMenu.showBy(b) },
    ] },
    side,
    stage,
  ],
});
create({ type: 'viewport', renderTo: document.body, items: [shell] });
open('library');
