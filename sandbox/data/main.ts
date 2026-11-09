import { create, cellEditing, Grid, Table, Pagination, Store, RestProxy, FilterBuilder, SearchGrid, DataView, registerLookup, toast, localViewStorage, restViewStorage, type Model } from 'optikos';
import { page } from '../../dev/kit';

const p = page('data');
const names = ['Ada', 'Grace', 'Linus', 'Alan', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia', 'Tim'];
const make = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`, total: Math.round(((i * 7919) % 10000) / 3) / 10, active: i % 3 !== 0, since: `20${10 + (i % 15)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}` }));
const columns = [
  { field: 'id', header: '#', width: 70, sortable: true, align: 'right' as const },
  { field: 'name', header: 'Name', sortable: true, minWidth: 140 },
  { field: 'total', header: 'Total', format: 'money', align: 'right' as const, sortable: true },
  { field: 'since', header: 'Since', format: 'date', sortable: true },
  { field: 'active', header: 'Active', format: 'bool', align: 'center' as const },
];

p.section('Grid · 100,000 rows', 'virtualized: look at the DOM, ~30 rows exist. Click headers to sort (asc → desc → none), arrows/Home/End/Page keys.', (host, { watch, log }) => {
  const store = new Store({ data: make(100000) });
  const g = create<Grid>({ type: 'grid', store, columns, height: 320, width: '100%', ariaLabel: '100,000 rows', renderTo: host });
  watch(g, ['select', 'sort', 'row-activate']);
  create({ type: 'button', text: 'Scroll to row 50,000', renderTo: host, handler: () => g.focusRow(49999) });
  create({ type: 'button', text: 'Count rows in the DOM', renderTo: host, handler: () => log('rows in DOM', g.el.querySelectorAll('.op-grid__body-row').length) });
});

p.section('Grid · selection', 'multi: click, Ctrl/Cmd+click toggles, Shift+click range, Space, Ctrl+A. Custom renderer on a column.', (host, { watch }) => {
  const g = create<Grid>({
    type: 'grid', data: make(30), selection: 'multi', striped: true, height: 240, width: '100%', renderTo: host,
    columns: [...columns.slice(0, 3), { field: 'active', header: 'Status', renderer: (v: boolean) => Object.assign(document.createElement('span'), { textContent: v ? 'Active' : 'Inactive', style: `color:var(--op-color-${v ? 'success' : 'danger'})` }) }],
  });
  watch(g, ['select', 'row-dblclick']);
});

p.section('Grid · paging (local) and "remote" paging', 'a Pagination bar bound to the store; the remote one fakes 300 ms server latency and shows the loading mask.', (host) => {
  create({ type: 'grid', data: make(95), columns, paging: true, pageSize: 10, height: 380, width: '100%', renderTo: host });
  const all = make(500);
  const remote = new Store({
    remote: true, pageSize: 10,
    proxy: (params) => new Promise<any>((res) => setTimeout(() => {
      let rows = [...all];
      const s = params.sorters?.[0];
      if (s) rows.sort((a, b) => ((a as any)[s.field] > (b as any)[s.field] ? 1 : -1) * (s.dir === 'asc' ? 1 : -1));
      const start = ((params.page ?? 1) - 1) * (params.pageSize ?? 10);
      res({ data: rows.slice(start, start + (params.pageSize ?? 10)), total: all.length });
    }, 300)),
  });
  create({ type: 'grid', store: remote, columns, paging: true, height: 380, width: '100%', renderTo: host });
  void remote.load();
});

p.section('Grid · empty, states', 'empty text, per-instance tokens (row height, header colors).', (host) => {
  create({ type: 'grid', data: [], columns, emptyText: 'No customers yet', height: 120, width: '100%', renderTo: host });
  create({ type: 'grid', data: make(6), columns, height: 220, width: '100%', theme: { rowHeight: '3rem', headerBg: 'var(--op-color-primary-soft)' }, renderTo: host });
});

p.section('Table · Pagination', 'semantic table for small data; standalone pagination (manual mode).', (host, { watch }) => {
  create<Table>({ type: 'table', caption: 'Top customers', data: make(5), columns: columns.slice(1, 4), striped: true, width: '100%', renderTo: host });
  watch(create<Pagination>({ type: 'pagination', total: 480, pageSize: 20, page: 7, renderTo: host }), ['page-change']);
  void RestProxy;
});

p.section('Grid · checkbox selection, bulk actions, row actions', 'header checkbox selects the page (indeterminate when partial); after the page is selected, "Select all N" reaches every filtered record. keepSelection survives paging. ⋯ opens the row menu.', (host, { log }) => {
  const store = new Store<any>({ data: make(95), pageSize: 10 });
  create<Grid>({
    type: 'grid', store, columns, paging: true, checkboxSelection: true, keepSelection: true, height: 440, width: '100%', renderTo: host,
    bulkActions: [
      { text: 'Delete', icon: 'trash', variant: 'danger', handler: (recs: Model[]) => { store.remove(recs); toast({ text: `${recs.length} deleted` }); } },
      { text: 'Export', handler: (recs: Model[]) => log('export', recs.map((r) => r.data.id)) },
    ],
    rowActions: [
      { text: 'Edit', icon: 'edit', handler: (rec: Model) => log('edit', rec.data.name) },
      { text: 'Delete', icon: 'trash', handler: (rec: Model) => store.remove(rec) },
    ],
  });
});

p.section('Grid · row actions: menu vs visible', "rowActionsMode 'menu' (default) = one ⋯ button + menu; 'visible' = an icon button per action, always shown (dimmed until hover/active/selected), per-row `disabled`. Shift+F10 / the menu key opens the row menu from the keyboard.", (host, { log }) => {
  const actions = [
    { text: 'Edit', icon: 'edit', handler: (rec: Model) => log('edit', rec.data.name) },
    { text: 'Delete', icon: 'trash', variant: 'danger' as const, disabled: (rec: Model) => rec.data.id % 3 === 0, handler: (rec: Model) => log('delete', rec.data.name) },
  ];
  create({ type: 'grid', data: make(6), columns, rowActions: actions, height: 240, width: '100%', renderTo: host });
  create({ type: 'grid', data: make(6), columns, rowActions: actions, rowActionsMode: 'visible', height: 240, width: '100%', renderTo: host });
});

p.section('Grid · reorder columns', 'reorderableColumns: drag a header to a new place (a bar shows where it lands; a plain click still sorts). Keyboard: focus a header, Alt+← / Alt+→. The log shows `column-move`.', (host, { watch }) => {
  watch(create<Grid>({ type: 'grid', data: make(20), columns, reorderableColumns: true, columnMenu: true, height: 280, width: '100%', renderTo: host }), ['column-move', 'sort']);
});

p.section('Grid · resize columns', 'resizableColumns: drag the edge of a header (double-click resets it). Total has `resizable: false`; Name has min/max. Keyboard: focus a header, Alt+Shift+←/→. Widths go into getColumnState (and saved views).', (host, { watch }) => {
  watch(create<Grid>({ type: 'grid', data: make(20), columns: columns.map((c) => (c.field === 'total' ? { ...c, resizable: false } : c.field === 'name' ? { ...c, minWidth: 100, maxWidth: 320 } : c)), resizableColumns: true, reorderableColumns: true, columnMenu: true, height: 280, width: '100%', renderTo: host }), ['column-resize']);
});

p.section('Grid · column groups', 'Column.group labels columns: a band over the header and sections in the Columns menu (group checkbox with a partial state, chips, searching a group name lists its columns). getColumnGroups() / setColumnGroupVisible().', (host, { log }) => {
  const g = create<Grid>({
    type: 'grid', data: make(20), columnMenu: true, reorderableColumns: true, height: 280, width: '100%', renderTo: host,
    columns: [{ ...columns[0], group: 'Identification' }, { ...columns[1], group: 'Identification' }, { ...columns[2], group: 'Values' }, { ...columns[3], group: 'Dates' }, { ...columns[4], group: 'Status' }],
  });
  create({ type: 'button', text: 'Hide "Values"', renderTo: host, handler: () => g.setColumnGroupVisible('Values', false) });
  create({ type: 'button', text: 'Show "Values"', renderTo: host, handler: () => g.setColumnGroupVisible('Values', true) });
  create({ type: 'button', text: 'List groups', renderTo: host, handler: () => log('groups', g.getColumnGroups()) });
});

p.section('Grid · column menu', 'the Columns button: checkboxes toggle columns, the search box narrows the list, the last visible column cannot be hidden. getColumnState()/setColumnState() save and restore it.', (host, { log }) => {
  const g = create<Grid>({ type: 'grid', data: make(40), columns, columnMenu: true, height: 300, width: '100%', renderTo: host });
  let saved = g.getColumnState();
  create({ type: 'button', text: 'Save state', renderTo: host, handler: () => { saved = g.getColumnState(); log('saved', saved.map((c) => `${c.field}${c.hidden ? ' (hidden)' : ''}`)); } });
  create({ type: 'button', text: 'Restore state', renderTo: host, handler: () => g.setColumnState(saved) });
  create({ type: 'button', text: 'Reverse order', renderTo: host, handler: () => g.setColumnState([...g.getColumnState()].reverse()) });
});

p.section('FilterBuilder', 'Add filter / Add group. Operators change with the field type (between has two inputs, "is empty" none); groups switch AND/OR and nest. Live: the grid filters as you edit.', (host, { watch }) => {
  const store = new Store({ data: make(300), pageSize: 8 });
  const fb = create<FilterBuilder>({
    type: 'filterbuilder', store, renderTo: host, width: '100%',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'total', label: 'Total', type: 'number' },
      { name: 'since', label: 'Since', type: 'date' },
      { name: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
    ],
    value: { op: 'and', filters: [{ field: 'total', op: 'between', value: [100, 400] }, { op: 'or', filters: [{ field: 'name', op: 'startsWith', value: 'Ada' }, { field: 'name', op: 'startsWith', value: 'Tim' }] }] },
  });
  watch(fb, ['apply']);
  create({ type: 'grid', store, columns, paging: true, height: 360, width: '100%', renderTo: host });
});

p.section('FilterBuilder · ask for the field first', "addMode: 'pick': \"Add filter\" opens a menu of the fields, and the new row is for the one you choose (focus goes to its value).", (host) => {
  const store = new Store({ data: make(300), pageSize: 8 });
  create<FilterBuilder>({
    type: 'filterbuilder', store, addMode: 'pick', renderTo: host, width: '100%',
    fields: [{ name: 'name', label: 'Name' }, { name: 'total', label: 'Total', type: 'number' }, { name: 'since', label: 'Since', type: 'date' }],
  });
  create({ type: 'grid', store, columns, paging: true, height: 320, width: '100%', renderTo: host });
});

p.section('SearchGrid · registered lookup', 'filters on top, grid below; the same registered definition used twice gets two independent stores.', (host, { watch }) => {
  registerLookup('people', {
    store: () => new Store({ data: make(1000), pageSize: 8 }),
    columns: columns.slice(0, 4),
    filters: [{ type: 'textfield', name: 'name', placeholder: 'Name…' }, { type: 'numberfield', name: 'total', placeholder: 'Total ≥', op: 'ge' }],
    valueField: 'id', displayField: 'name', title: 'Find a person',
  });
  watch(create<SearchGrid>({ type: 'searchgrid', lookup: 'people', height: 420, width: '100%', renderTo: host }), ['search', 'select', 'confirm']);
});

p.section('ViewManager · saved views', 'Views ▾: save the visible columns, the filters (with groups) and the sort under a name; apply, set as default (opens with it), delete, reset. Reload the page: it comes back. Storage here: localStorage.', (host, { watch }) => {
  const store = new Store<any>({ data: make(300), pageSize: 8 });
  const filters = create<FilterBuilder>({ type: 'filterbuilder', store, renderTo: host, width: '100%', fields: [{ name: 'name', label: 'Name' }, { name: 'total', label: 'Total', type: 'number' }, { name: 'since', label: 'Since', type: 'date' }] });
  const grid = create<Grid>({ type: 'grid', store, columns, columnMenu: true, paging: true, height: 360, width: '100%' });
  const vm = create({ type: 'viewmanager', grid, filters, storage: localViewStorage('optikos.sandbox.views') });
  host.prepend(vm.el);
  host.append(grid.el);
  watch(vm, ['apply', 'save', 'remove', 'reset', 'error']);
});

p.section('ViewManager · server storage (simulated)', 'the same component on restViewStorage: GET/POST/PUT/DELETE to /api/views. A fake fetch plays the server (300 ms), and the log shows the calls.', (host, { log, watch }) => {
  const server: any[] = [];
  const fake = (async (url: string, o: RequestInit) => {
    await new Promise((r) => setTimeout(r, 300));
    log(`${o.method} ${url}`);
    const id = url.split('/').pop();
    if (o.method === 'GET') return Response.json(server);
    if (o.method === 'DELETE') return (server.splice(server.findIndex((v) => v.id === id), 1), new Response(null, { status: 204 }));
    const view = { ...JSON.parse(o.body as string), id: id !== 'views' ? id : `srv-${server.length + 1}` };
    const i = server.findIndex((v) => v.id === view.id);
    if (i < 0) server.push(view); else server[i] = view;
    return Response.json(view);
  }) as typeof fetch;
  const grid = create<Grid>({ type: 'grid', data: make(40), columns, columnMenu: true, height: 220, width: '100%' });
  const vm = create({ type: 'viewmanager', grid, storage: restViewStorage({ url: '/api/views', fetch: fake }) });
  host.prepend(vm.el);
  host.append(grid.el);
  watch(vm, ['load', 'save', 'error']);
});

p.section('DataView · cards', 'a Store as a responsive grid of cards: columns adapt to the width, multi-selection (click, Ctrl/⌘, Shift), arrows move by a row, Space toggles, Enter activates, paging. The heart is a `data-op-action` button: it does not select the card.', (host, { watch }) => {
  const store = new Store<any>({ data: make(60), pageSize: 18 });
  const hue = (id: number) => (id * 47) % 360;
  const v = create<DataView>({
    type: 'dataview', store, selection: 'multi', itemWidth: '11rem', paging: true, height: 420, width: '100%', renderer: (rec: Model) => {
      const d = rec.data;
      const card = document.createElement('div');
      card.style.cssText = `padding:.75rem;border-radius:var(--op-radius);color:#fff;background:linear-gradient(135deg,hsl(${hue(d.id)},65%,45%),hsl(${hue(d.id) + 40},70%,35%));min-height:6rem`;
      const heart = Object.assign(document.createElement('button'), { type: 'button', textContent: d.active ? '♥' : '♡', ariaLabel: 'Favorite' });
      heart.dataset.opAction = 'fav';
      heart.style.cssText = 'float:right;color:#fff;background:transparent;border:0;cursor:pointer;font-size:1.1rem';
      card.append(heart, document.createElement('b'), document.createElement('br'), `${d.since}`);
      (card.querySelector('b') as HTMLElement).textContent = d.name;
      return card;
    },
  });
  v.on('item-action', (_a: string, rec: Model) => (rec.set('active', !rec.get('active')), v.refresh()));
  watch(v, ['select', 'item-activate', 'item-dblclick']);
  v.render();
  host.append(v.el);
  create<DataView>({ type: 'dataview', data: [], emptyText: 'Nothing to show', width: '100%', renderer: () => '', renderTo: host });
});

p.section('Grid · inline editing (cellEditing plugin)', 'double click a cell (or F2 on the active row), type, Enter saves, Esc cancels, Tab moves to the next editable cell. Name is required; record #3 is locked; # is not editable; a boolean gets a checkbox editor.', (host, { watch }) => {
  const g = create<Grid>({
    type: 'grid', renderTo: host, height: 300, store: new Store({ data: make(30) }), plugins: [cellEditing()],
    columns: [
      { field: 'id', header: '#', width: 70, align: 'right' },
      { field: 'name', header: 'Name', flex: 2, editor: { type: 'textfield', required: true }, editable: (r: { get(f: string): unknown }) => r.get('id') !== 3 },
      { field: 'total', header: 'Total', format: 'money', align: 'right', editor: true },
      { field: 'active', header: 'Active', align: 'center', editor: true, renderer: (v: boolean) => (v ? '✓' : '') }, // a boolean gets a checkbox
    ],
  } as never);
  watch(g, ['before-edit', 'edit', 'edit-cancel']);
});
