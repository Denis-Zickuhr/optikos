// Files and Shares: grids with filters, saved views, bulk and row actions. Public API only.
import {
  create, Store, MessageBox, toast, localViewStorage,
  type Grid, type Container, type FilterBuilder, type Model, type Column, type FilterGroup, type Button, type Tabs,
} from 'optikos';
import { files, shares, kb, type FileRow, type Share } from './data';
import { pill, BACKUP_TONE, asFile, type Ctx } from './ui';

const TYPE_TONE: Record<string, 'info' | 'warn' | 'ok' | 'muted' | 'bad'> = { pdf: 'bad', docx: 'info', xlsx: 'ok', zip: 'warn', png: 'muted', txt: 'muted' };
const count = (n: FilterGroup['filters'][number] | null | undefined): number => (!n ? 0 : 'filters' in n ? n.filters.reduce((s, f) => s + count(f), 0) : 1);

export function buildFiles(ctx: Ctx): Container {
  const store = new Store({ data: [...files], pageSize: 25, model: { idField: 'id' } });
  const reload = () => store.loadData([...files]);
  ctx.onPhotosChanged(reload);
  const cols: Column[] = [
    { field: 'name', header: 'Name', sortable: true, minWidth: 220, group: 'File' },
    { field: 'folder', header: 'Folder', sortable: true, width: 130, group: 'File' },
    { field: 'type', header: 'Type', sortable: true, width: 90, group: 'Info', renderer: (v: string) => pill(v, TYPE_TONE[v] ?? 'muted') },
    { field: 'size', header: 'Size', sortable: true, align: 'right', width: 100, group: 'Info', format: (v: number) => kb(v) },
    { field: 'modified', header: 'Modified', sortable: true, width: 120, group: 'Info' },
    { field: 'backup', header: 'Backup', sortable: true, width: 100, group: 'Status', renderer: (v: FileRow['backup']) => pill(v, BACKUP_TONE[v]) },
    { field: 'shared', header: 'Shared', width: 90, align: 'center', group: 'Status', format: 'bool' },
  ];
  const filters = create<FilterBuilder>({
    type: 'filterbuilder', store, addMode: 'pick', hidden: true, style: 'padding:var(--op-space-3);border-bottom:1px solid var(--op-color-border)',
    fields: [
      { name: 'name', label: 'Name' }, { name: 'folder', label: 'Folder', type: 'select', options: ['Documents', 'Receipts', 'Work', 'Travel', 'Archive'] },
      { name: 'type', label: 'Type', type: 'select', options: ['pdf', 'docx', 'xlsx', 'zip', 'png', 'txt'] }, { name: 'size', label: 'Size (KB)', type: 'number' },
      { name: 'modified', label: 'Modified', type: 'date' }, { name: 'backup', label: 'Backup', type: 'select', options: ['synced', 'pending', 'failed'] },
    ],
  });
  const selectedRows = (recs: Model[]) => recs.map(asFile);
  const del = async (recs: Model[]) => {
    if (!(await MessageBox.confirm(`Delete ${recs.length} file${recs.length === 1 ? '' : 's'}?`, { danger: true, okText: 'Delete', title: 'Delete files' }))) return;
    const ids = new Set(selectedRows(recs).map((f) => f.id));
    files.splice(0, files.length, ...files.filter((f) => !ids.has(f.id)));
    ctx.photosChanged();
    toast({ text: `${ids.size} deleted` });
  };
  const grid = create<Grid>({
    type: 'grid', store, paging: true, flex: 1, striped: true, ariaLabel: 'Files', columns: cols,
    checkboxSelection: true, columnMenu: true, reorderableColumns: true, resizableColumns: true, rowActionsMode: 'visible',
    bulkActions: [
      { text: 'Download', icon: 'file', handler: (recs: Model[]) => toast({ type: 'info', text: `Preparing ${recs.length} download(s)…` }) },
      { text: 'Share', icon: 'users', handler: (recs: Model[]) => ctx.openShare(selectedRows(recs).map((f) => ({ kind: 'file' as const, name: f.name }))) },
      { text: 'Back up', icon: 'check', handler: (recs: Model[]) => { selectedRows(recs).forEach((f) => (f.backup = 'synced')); ctx.photosChanged(); } },
      { text: 'Delete', icon: 'trash', variant: 'danger', handler: (recs: Model[]) => void del(recs) },
    ],
    rowActions: [
      { text: 'Share', icon: 'users', handler: (rec: Model) => ctx.openShare([{ kind: 'file', name: asFile(rec).name }]) },
      { text: 'Download', icon: 'file', handler: (rec: Model) => toast({ text: `Downloading ${asFile(rec).name}` }) },
    ],
  });
  let filtersBtn!: Button;
  const showFilters = (on: boolean) => ((filters.config.hidden = !on), on ? filters.show() : filters.hide());
  filters.on('apply', (f: FilterGroup | null) => filtersBtn?.setText(count(f) ? `Filters (${count(f)})` : 'Filters'));
  return create<Container>({
    type: 'container', id: 'view-files', layout: { type: 'vbox', gap: 0 }, cls: 'pg-view', style: 'padding:0',
    items: [
      { type: 'toolbar', items: [
        { type: 'label', text: 'Files', style: 'font-size:var(--op-font-size-xl);font-weight:700' },
        { type: 'viewmanager', grid, filters, storage: localViewStorage('pg.demo.views.files'), extra: { filtersOpen: { get: () => !filters.config.hidden, set: (v: unknown) => showFilters(!!v) } } },
        (filtersBtn = create<Button>({ type: 'button', text: 'Filters', icon: 'filter', variant: 'ghost', handler: () => showFilters(!!filters.config.hidden) })) as never,
        '->',
        { type: 'button', text: 'Upload', icon: 'plus', variant: 'primary', handler: () => ctx.upload() },
      ] },
      filters, grid,
    ],
  });
}

const PERM_TONE = { view: 'muted', comment: 'info', edit: 'warn' } as const;
export function buildShared(ctx: Ctx): Container {
  const make = (direction: 'by' | 'with') => {
    const store = new Store({ data: shares.filter((s) => s.direction === direction), pageSize: 20, model: { idField: 'id' } });
    ctx.onPhotosChanged(() => store.loadData(shares.filter((s) => s.direction === direction)));
    return create<Grid>({
      type: 'grid', store, paging: true, flex: 1, striped: true, ariaLabel: direction === 'by' ? 'Shared by me' : 'Shared with me',
      checkboxSelection: direction === 'by', columnMenu: true, resizableColumns: true,
      columns: [
        { field: 'item', header: 'Item', sortable: true, minWidth: 200 }, { field: 'kind', header: 'Kind', sortable: true, width: 90 },
        { field: 'with', header: direction === 'by' ? 'Shared with' : 'Shared by', sortable: true, minWidth: 180 },
        { field: 'permission', header: 'Access', sortable: true, width: 110, renderer: (v: Share['permission']) => pill(v, PERM_TONE[v]) },
        { field: 'expires', header: 'Expires', width: 120, format: (v: string) => v || 'never' }, { field: 'created', header: 'Shared on', sortable: true, width: 120 },
        { field: 'views', header: 'Views', sortable: true, align: 'right', width: 80 },
      ],
      bulkActions: direction === 'by' ? [{ text: 'Revoke access', icon: 'trash', variant: 'danger', handler: (recs: Model[]) => {
        const ids = new Set(recs.map((r) => (r.data as Share).id));
        shares.splice(0, shares.length, ...shares.filter((s) => !ids.has(s.id)));
        ctx.photosChanged();
        toast({ text: `${ids.size} share(s) revoked` });
      } }] : [],
    });
  };
  const tabs = create<Tabs>({ type: 'tabs', flex: 1, items: [{ type: 'container', title: 'Shared by me', icon: 'users', layout: 'fit', items: [make('by')] }, { type: 'container', title: 'Shared with me', icon: 'user', layout: 'fit', items: [make('with')] }] });
  return create<Container>({
    type: 'container', id: 'view-shared', layout: { type: 'vbox', gap: 0 }, cls: 'pg-view', style: 'padding:0',
    items: [{ type: 'toolbar', items: [{ type: 'label', text: 'Shared', style: 'font-size:var(--op-font-size-xl);font-weight:700' }] }, tabs],
  });
}
