// Backup: status cards, devices, settings (with a stored encryption key that can only be replaced), a simulated "Back up now".
import { create, Store, toast, Table, type Container, type Form, type Grid, type Label } from 'optikos';
import { photos, files, devices, bytes } from './data';
import { pill, progress, el, type Ctx } from './ui';

let running = false;
let setProgress: (pct: number, text: string) => void = () => undefined;

/** Marks every pending/failed item as synced one by one, moving the progress bar. */
export function runBackup(ctx: Ctx): void {
  if (running) return void toast({ text: 'A backup is already running' });
  const todo = [...photos.filter((p) => p.backup !== 'synced'), ...files.filter((f) => f.backup !== 'synced')];
  if (!todo.length) return void toast({ type: 'success', text: 'Everything is already backed up' });
  running = true;
  let i = 0;
  const timer = setInterval(() => {
    const it = todo[i++];
    it.backup = 'synced';
    setProgress((i / todo.length) * 100, `Backing up ${i} of ${todo.length}…`);
    if (i % 5 === 0 || i === todo.length) ctx.photosChanged();
    if (i >= todo.length) {
      clearInterval(timer);
      running = false;
      devices.forEach((d) => ((d.pending = 0), (d.status = 'up to date'), (d.lastBackup = '2026-11-08 13:05')));
      ctx.photosChanged();
      setProgress(100, 'All backed up');
      toast({ type: 'success', title: 'Backup complete', text: `${todo.length} item(s) synced` });
    }
  }, 90);
}

export function buildBackup(ctx: Ctx): Container {
  const stat = (label: string) => {
    const v = create<Label>({ type: 'label', text: '' });
    const box = el('div', 'pg-stat');
    const b = el('b');
    box.append(b, el('span', '', label));
    return { box, set: (t: string) => (b.textContent = t), v };
  };
  const used = stat('Storage used');
  const pending = stat('Waiting to back up');
  const failed = stat('Failed');
  const last = stat('Last backup');
  const bar = progress();
  const status = el('div', '', 'Idle');
  status.style.cssText = 'color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)';
  setProgress = (pct, text) => (bar.set(pct), (status.textContent = text));

  const failedStore = new Store<any>({ data: [], pageSize: 6 });
  const refresh = () => {
    const mb = photos.reduce((s, p) => s + p.size, 0) + files.reduce((s, f) => s + f.size / 1024, 0);
    used.set(`${bytes(mb)} of 100 GB`);
    const pend = photos.filter((p) => p.backup === 'pending').length + files.filter((f) => f.backup === 'pending').length;
    const fail = photos.filter((p) => p.backup === 'failed').length + files.filter((f) => f.backup === 'failed').length;
    pending.set(String(pend));
    failed.set(String(fail));
    last.set(devices.map((d) => d.lastBackup).sort().pop()!.slice(5));
    failedStore.loadData([...photos.filter((p) => p.backup === 'failed').map((p) => ({ name: p.title, kind: 'photo', size: `${p.size} MB`, thumb: p.src })), ...files.filter((f) => f.backup === 'failed').map((f) => ({ name: f.name, kind: 'file', size: `${f.size} KB`, thumb: '' }))]);
  };
  refresh();
  ctx.onPhotosChanged(refresh);

  const deviceStore = new Store<any>({ data: devices });
  ctx.onPhotosChanged(() => deviceStore.loadData([...devices]));
  const grid = create<Grid>({
    type: 'grid', store: deviceStore, height: 190, ariaLabel: 'Devices', rowActionsMode: 'visible',
    columns: [
      { field: 'name', header: 'Device', minWidth: 180 }, { field: 'os', header: 'System', width: 130 }, { field: 'lastBackup', header: 'Last backup', width: 160 },
      { field: 'status', header: 'Status', width: 120, renderer: (v: string) => pill(v, v === 'up to date' ? 'ok' : v === 'syncing' ? 'info' : 'warn') },
      { field: 'pending', header: 'Waiting', align: 'right', width: 90 }, { field: 'size', header: 'Size', align: 'right', width: 100, format: (v: number) => `${v} GB` },
    ],
    rowActions: [{ text: 'Back up now', icon: 'check', handler: () => runBackup(ctx) }],
  });

  const settings = create<Form>({
    type: 'form', style: 'padding:var(--op-space-3)',
    items: [
      { type: 'container', layout: { type: 'grid', columns: 2, gap: 12 }, items: [
        { type: 'checkbox', name: 'auto', boxLabel: 'Back up automatically', value: true },
        { type: 'checkbox', name: 'wifi', boxLabel: 'Only on Wi-Fi', value: true },
        { type: 'checkbox', name: 'videos', boxLabel: 'Include videos', value: true },
        { type: 'checkbox', name: 'files', boxLabel: 'Include files and documents', value: true },
        { type: 'select', name: 'quality', label: 'Photo quality', value: 'Original', options: ['Original', 'High (saves space)'] },
        { type: 'select', name: 'schedule', label: 'Schedule', value: 'Continuous', options: ['Continuous', 'Nightly', 'Weekly'] },
        { type: 'secretfield', name: 'passphrase', label: 'Encryption passphrase', colspan: 2, help: 'Protects your backups. The saved passphrase can never be shown; you can only replace it.' },
      ] },
      { type: 'toolbar', items: ['->', { type: 'button', text: 'Save settings', variant: 'primary', handler: () => (settings.validate() ? (toast({ type: 'success', text: 'Backup settings saved' }), settings.markClean()) : undefined) }] },
    ],
  });
  settings.load({ auto: true, wifi: true, videos: true, files: true, quality: 'Original', schedule: 'Continuous', passphrase: true });

  const failedTable = create<Table>({
    type: 'table', store: failedStore, emptyText: 'Nothing failed. Nice.', striped: true,
    columns: [{ field: 'name', header: 'Item' }, { field: 'kind', header: 'Kind', width: 80 }, { field: 'size', header: 'Size', width: 100 }],
  } as never);

  const root = create<Container>({
    type: 'container', id: 'view-backup', layout: { type: 'vbox', gap: 12 }, cls: 'pg-view',
    items: [
      { type: 'label', text: 'Backup', style: 'font-size:var(--op-font-size-xl);font-weight:700' },
      { type: 'container', layout: { type: 'hbox', gap: 12, stackBelow: 760 }, items: [{ type: 'pg-html', child: used.box }, { type: 'pg-html', child: pending.box }, { type: 'pg-html', child: failed.box }, { type: 'pg-html', child: last.box }] },
      { type: 'panel', title: 'Back up now', icon: 'check', items: [{ type: 'pg-html', child: bar.el }, { type: 'pg-html', child: status }, { type: 'button', text: 'Back up now', variant: 'primary', icon: 'check', style: 'align-self:flex-start', handler: () => runBackup(ctx) }], layout: { type: 'vbox', gap: 8 } },
      { type: 'panel', title: 'Devices', icon: 'user', items: [grid] },
      { type: 'container', layout: { type: 'hbox', gap: 12, stackBelow: 900 }, items: [
        { type: 'panel', title: 'Settings', icon: 'settings', flex: 1, items: [settings] },
        { type: 'panel', title: 'Failed items', icon: 'alert', flex: 1, items: [failedTable] },
      ] },
    ],
  });
  return root;
}
