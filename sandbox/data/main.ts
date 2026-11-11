import { buildGrid, buildForm, buildFilterFields, type FieldSpec } from 'optikos/build';
import { create, grouping, timeEntry, columnTotals, exportBar, quickSearch, rowEditing, treeGrid, flattenTree, exportGrid, printGrid, persistState, setStateStorage, Stat, Timeline, cellEditing, Tree, Grid, Table, Pagination, Store, RestProxy, FilterBuilder, type Form, SearchGrid, DataView, registerLookup, toast, localViewStorage, restViewStorage, type Model } from 'optikos';
import { viewModel, bindVM, bindForm } from 'optikos/bind';
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

p.section('Tree', 'a file tree: multi selection (Ctrl/⌘+click), tri-state checkboxes, "remote" children loaded after 400 ms ("broken" fails), a filter. Keyboard: arrows, → / ←, Enter, Space.', (host, { watch, log }) => {
  const folder = (id: string, text: string, children?: object[]) => ({ id, text, icon: 'folder', children });
  const t = create<Tree>({
    type: 'tree', ariaLabel: 'Files', selection: 'multi', checkboxes: true, style: 'inline-size: 20rem',
    items: [folder('src', 'src', [folder('core', 'core', [{ id: 'c1', text: 'component.ts', icon: 'file' }])]), folder('remote', 'remote (lazy)'), folder('broken', 'broken (fails)')],
    load: (n: { id: string }) => new Promise((ok, fail) => setTimeout(() => (n.id === 'broken' ? fail(new Error('server down')) : ok([1, 2, 3].map((i) => ({ id: `${n.id}-${i}`, text: `file ${i}.ts`, icon: 'file', leaf: true })))), 400)),
  } as never);
  const filter = create({ type: 'textfield', placeholder: 'Filter…', clearable: true, style: 'inline-size: 20rem', listeners: { change: (v: string) => t.filter(v ?? '') } } as never);
  filter.mount(host);
  t.mount(host);
  watch(t, ['select', 'check', 'activate', 'expand', 'load', 'error']);
  log('ready');
});

const votes = () => new Store({ data: ['Ada', 'Grace', 'Linus', 'Alan', 'Margaret'].map((name, i) => ({ id: i + 1, name, votes: 40 + i * 25, share: 10 + i })) });
const hours = Array.from({ length: 12 }, (_, i) => ({ hour: `${i + 8}h`, a: 20 + ((i * 17) % 40), b: 10 + ((i * 11) % 30) }));

p.section('Chart · every kind', 'bar, stacked bar, line, area, pie, donut and a sparkline. Hover or use ←/→ on a chart; click the legend to hide a series. Colors are --op-chart-1…8: switch the theme.', (host) => {
  const wrap = Object.assign(document.createElement('div'), { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr));gap:1rem;inline-size:100%' });
  host.append(wrap);
  const series = [{ field: 'a', label: 'Online' }, { field: 'b', label: 'Store' }];
  for (const cfg of [{ kind: 'bar' }, { kind: 'bar', stacked: true }, { kind: 'line' }, { kind: 'area', stacked: true }, { kind: 'pie', series: ['a'] }, { kind: 'donut', series: ['a'], format: 'number' }]) {
    create({ type: 'chart', x: 'hour', series, data: hours, title: JSON.stringify(cfg), renderTo: wrap, ...cfg });
  }
  create({ type: 'chart', kind: 'sparkline', x: 'hour', series: ['a'], data: hours, width: 160, renderTo: wrap });
});

p.section('Chart · live Store + KPI tiles', 'one store feeds a grid, a chart and a Stat; every 1.5 s a patch arrives (store.applyPatches), a burst repaints once.', (host, { log }) => {
  const store = votes();
  const sum = () => store.getData().reduce((a, r) => a + r.votes, 0);
  const stat = create<Stat>({ type: 'stat', label: 'Votes', value: sum(), delta: 0.08, trend: [3, 5, 4, 8, 9, 12], caption: 'live', width: 220, renderTo: host });
  create({ type: 'stat', label: 'Refunds', value: 31, delta: 0.2, good: 'down', caption: 'up is bad', width: 220, renderTo: host });
  create({ type: 'chart', kind: 'bar', x: 'name', series: ['votes'], store, title: 'Votes', width: 340, renderTo: host });
  create({ type: 'grid', store, columns: [{ field: 'name' }, { field: 'votes', align: 'right' }], width: 260, height: 220, renderTo: host });
  const t = setInterval(() => {
    if (!host.isConnected) return clearInterval(t);
    const id = 1 + Math.floor(Math.random() * 5);
    store.applyPatches([{ data: { id, votes: store.getById(id)!.get('votes') + 1 + Math.floor(Math.random() * 6) } }]);
    stat.setValue(sum());
  }, 1500);
  log('patching every 1.5 s');
});

p.section('Stat · clickable', 'a handler (or href) makes the tile a button: Tab to it, Enter or Space opens; it is named "label: value".', (host, { log }) => {
  create<Stat>({ type: 'stat', label: 'Open orders', value: 12, delta: 0.125, caption: 'vs last week', width: 220, handler: (s: Stat) => log('open', s.config.label), renderTo: host });
  create<Stat>({ type: 'stat', label: 'Late invoices', value: 3, delta: 0.5, good: 'down', width: 220, href: '#invoices', renderTo: host });
});

p.section('Timeline · log and schedule', 'list mode (an event log) and range mode (phases and shifts on a time axis, lanes in order). Click or Enter on an item fires select.', (host, { watch }) => {
  watch(create<Timeline>({ type: 'timeline', width: 340, renderTo: host, items: [{ time: '2026-11-10T09:00', title: 'Voting opened', tone: 'success' }, { time: '2026-11-10T12:30', title: 'Sponsor added', text: 'Logo uploaded', icon: 'image' }, { time: '2026-11-10T16:00', title: 'Refund requested', tone: 'warning' }] }), ['select']);
  create({ type: 'timeline', mode: 'range', lanes: ['Stage', 'Backstage', 'Security'], width: '100%', renderTo: host, items: [
    { title: 'Rehearsal', lane: 'Stage', start: '2026-11-10', end: '2026-11-11', tone: 'info' }, { title: 'Semi-final', lane: 'Stage', start: '2026-11-12T19:00', end: '2026-11-12T23:00' },
    { title: 'Final night', lane: 'Stage', start: '2026-11-14T19:00', end: '2026-11-14T23:59', tone: 'success' }, { title: 'Make-up', lane: 'Backstage', start: '2026-11-12', end: '2026-11-14' }, { title: 'Night shift', lane: 'Security', start: '2026-11-11', end: '2026-11-14', tone: 'warning' },
  ] });
});

const askEntry = (item: { title?: string; text?: string }, mode: 'create' | 'edit') =>
  new Promise<{ title: string; text: string } | false>((done) => {
    const title = create({ type: 'textfield', label: 'Title', value: item.title === 'New entry' ? '' : item.title, required: true } as never) as any;
    const text = create({ type: 'textarea', label: 'Notes', value: item.text ?? '' } as never) as any;
    const w: any = create({
      type: 'window', title: mode === 'create' ? 'New entry' : 'Edit entry', width: 360, autoFocus: true, closeAction: 'destroy', items: [title, text],
      buttons: [{ text: 'Cancel', handler: () => w.close() }, { text: 'Save', variant: 'primary', handler: () => { if (!title.validate()) return; done({ title: title.getValue(), text: text.getValue() }); w.close(); } }],
    });
    w.on('hide', () => done(false));
    w.show();
  });

p.section('Timeline · vertical', 'the same range timeline with time running top to bottom and one column per lane (direction: vertical).', (host) => {
  create<Timeline>({ type: 'timeline', mode: 'range', direction: 'vertical', now: false, from: '08:00', to: '18:00', lanes: ['Room A', 'Room B', 'Room C'], width: '100%', renderTo: host, items: [
    { title: 'Stand-up', lane: 'Room A', start: '09:00', end: '09:30', tone: 'info' }, { title: 'Workshop', lane: 'Room A', start: '10:00', end: '13:00' },
    { title: 'Interview', lane: 'Room B', start: '09:30', end: '11:00', tone: 'success' }, { title: 'Demo', lane: 'Room C', start: '14:00', end: '16:30', tone: 'warning' },
  ] });
});

p.section('Timeline · time entry', 'drag an empty lane to create, a block to move, its ends to resize; Tab to a block: ←/→ move, Shift resizes, Delete removes; Tab to a lane: ←/→ then Enter adds. A dialog (your callback) asks for the title and notes on create and on Enter / double click. Lanes add up to 8h; Tue is locked, overlap is refused.', (host, { watch }) => {
  const tl = create<Timeline>({
    type: 'timeline', mode: 'range', from: '07:00', to: '19:00', lanes: ['Mon', 'Tue', 'Wed'], width: '100%', renderTo: host,
    items: [{ title: 'Design review', lane: 'Mon', start: '09:00', end: '11:30', tone: 'info' }, { title: 'Build', lane: 'Mon', start: '13:00', end: '17:30' }, { title: 'Invoiced', lane: 'Tue', start: '08:00', end: '16:00', tone: 'success' }, { title: 'Support', lane: 'Wed', start: '08:00', end: '12:00', tone: 'warning' }],
    plugins: [timeEntry({ step: 15, overlap: false, moveAcrossLanes: true, target: 480, editable: (it) => it.title !== 'Invoiced', form: askEntry })],
  });
  watch(tl, ['create', 'change', 'remove', 'edit']);
  create<Timeline>({
    type: 'timeline', mode: 'range', direction: 'vertical', from: '08:00', to: '18:00', lanes: ['Ana', 'Bruno'], width: '100%', renderTo: host,
    items: [{ title: 'Kick-off', lane: 'Ana', start: '09:00', end: '10:30', tone: 'info' }, { title: 'Review', lane: 'Bruno', start: '11:00', end: '12:00' }],
    plugins: [timeEntry({ step: 15, moveAcrossLanes: true, form: askEntry })],
  });
});

const orderSpecs: FieldSpec[] = [
  { name: 'number', label: 'Order', readonly: true, width: 90 },
  { name: 'customer', required: true },
  { name: 'status', type: 'select', options: ['open', 'paid', 'late'], group: 'State' },
  { name: 'paid', type: 'bool', group: 'State' },
  { name: 'due', type: 'date', summary: 'max' },
  { name: 'total', type: 'money', summary: 'sum' },
  { name: 'note', type: 'area', hide: ['grid', 'filter'] },
];
p.section('Build · grid, form and filters from one field list', 'buildGrid / buildForm / buildFilterFields read the same FieldSpec[]; the ⋯ button on a header picks a total over the filtered rows (total and due start with one).', (host) => {
  const store = new Store<any>({ data: Array.from({ length: 12 }, (_, i) => ({ number: `SO-${100 + i}`, customer: names[i % names.length], status: ['open', 'paid', 'late'][i % 3], paid: i % 3 === 1, due: `2026-1${i % 3}-${String(i + 10).padStart(2, '0')}`, total: 120 + i * 37.5 })) });
  create({ type: 'filterbuilder', store, fields: buildFilterFields(orderSpecs), renderTo: host });
  buildGrid(orderSpecs, { store, height: 260, width: '100%', plugins: [columnTotals()] }).mount(host);
  buildForm(orderSpecs, { width: 520 }).mount(host);
});

p.section('Grid · column totals', 'the ⋯ button on a header opens the totals: sum, average, min, max, count and a custom one (Spread); the bar under the grid follows the filter. Dates offer earliest / latest.', (host) => {
  const store = new Store<any>({ data: Array.from({ length: 40 }, (_, i) => ({ id: i + 1, customer: names[i % names.length], qty: 1 + (i % 5), spent: 45 + ((i * 37) % 400), price: 40 + i * 12.5, due: `2026-1${1 + (i % 2)}-${String(5 + (i % 20)).padStart(2, '0')}` })) });
  const box = create({ type: 'textfield', placeholder: 'Filter by customer…', width: 240, renderTo: host }) as any;
  box.on('change', () => store.filter(box.getValue() ? [{ field: 'customer', op: 'contains', value: box.getValue() }] : []));
  create<Grid>({
    type: 'grid', store, height: 320, width: '100%', renderTo: host,
    plugins: [columnTotals({ operations: [{ text: 'Spread', run: (v: number[]) => Math.max(...v) - Math.min(...v) }] })],
    columns: [
      { field: 'customer', header: 'Customer', sortable: true },
      { field: 'qty', header: 'Qty', align: 'right', sortable: true, summary: 'sum' },
      { field: 'spent', header: 'Time spent', align: 'right', format: 'duration', sortable: true, summary: 'sum' },
      { field: 'price', header: 'Price', align: 'right', format: 'money', sortable: true },
      { field: 'due', header: 'Due', format: 'date', sortable: true },
    ],
  });
  create<Grid>({
    type: 'grid', store, height: 220, width: '100%', renderTo: host, plugins: [columnTotals({ show: 'modal' })],
    columns: [{ field: 'customer', header: 'Customer' }, { field: 'qty', header: 'Qty (answers in a dialog)', align: 'right' }, { field: 'price', header: 'Price (answers in a dialog)', align: 'right', format: 'money' }],
  });
});

p.section('Grid · export, print, saved layout', 'the icons next to the pager (exportBar plugin) and, below, the same actions from your own buttons: CSV / Excel / Print of the visible columns, sort and filters (every page); the layout (widths, order, sort, page) is saved per user — resize a column and reload the page.', (host) => {
  setStateStorage(undefined);
  const g = create<Grid>({ type: 'grid', store: new Store({ data: make(250), pageSize: 25 }), columns, paging: true, resizableColumns: true, reorderableColumns: true, plugins: [persistState('sandbox-data-grid'), quickSearch({ fields: ['name'] }), exportBar({ filename: 'rows', title: 'Rows' })], height: 360, width: '100%', renderTo: host });
  create({ type: 'button', text: 'CSV', renderTo: host, handler: () => void exportGrid(g, { filename: 'rows' }) });
  create({ type: 'button', text: 'Excel', renderTo: host, handler: () => void exportGrid(g, { format: 'xlsx', filename: 'rows' }) });
  create({ type: 'button', text: 'This page only', renderTo: host, handler: () => void exportGrid(g, { scope: 'page', filename: 'page' }) });
  create({ type: 'button', text: 'Print', renderTo: host, handler: () => void printGrid(g, { title: 'Rows' }) });
});

const tally = () => new Store({ data: ['Semi-final', 'Final'].flatMap((event, e) => ['Amara', 'Bianca', 'Chloe', 'Dalia'].map((name, i) => ({ id: e * 10 + i + 1, event, name, votes: 50 + ((i * 37 + e * 19) % 120), fee: 90000 + i * 25000 }))) });
const tallyCols = [{ field: 'name', header: 'Candidate', sortable: true, summary: 'count' as const, editor: { type: 'textfield', required: true } }, { field: 'votes', header: 'Votes', align: 'right' as const, sortable: true, summary: 'sum' as const, format: 'number', editor: 'numberfield' }, { field: 'fee', header: 'Fee (cents)', align: 'right' as const, summary: 'avg' as const, renderer: (v: number) => (v / 100).toFixed(2) }];

p.section('Grid · grouping with totals', 'a header per group (click, Enter/Space, → ←), a total per group and a grand total; sorting works inside the groups. The icons beside the pager (grouping controls) and the buttons below do the same.', (host, { watch }) => {
  const g = grouping({ field: 'event', summary: 'both', controls: true, choices: [{ text: 'Event', field: 'event' }, { text: 'Leaders (≥100 votes)', by: (r) => (r.get('votes') >= 100 ? 'Leaders' : 'Chasing') }] });
  const grid = create<Grid>({ type: 'grid', store: tally(), columns: tallyCols.map(({ editor: _e, ...c }) => c), plugins: [g], height: 340, width: '100%', renderTo: host });
  watch(grid, ['group-toggle', 'sort']);
  create({ type: 'button', text: 'Collapse all', renderTo: host, handler: () => g.collapseAll() });
  create({ type: 'button', text: 'Expand all', renderTo: host, handler: () => g.expandAll() });
  create({ type: 'button', text: 'By votes (≥100)', renderTo: host, handler: () => g.setGroupBy((r) => (r.get('votes') >= 100 ? 'Leaders' : 'Chasing')) });
  create({ type: 'button', text: 'By event', renderTo: host, handler: () => g.setGroupBy('event') });
});

p.section('Grid · locked columns', 'scroll sideways: the checkbox, the first column and the actions stay; a shadow shows when there is more to scroll. Pin or release a column with the buttons.', (host) => {
  const grid = create<Grid>({
    type: 'grid', store: new Store({ data: make(40) }), checkboxSelection: true, resizableColumns: true, reorderableColumns: true, width: 480, height: 260, renderTo: host,
    columns: [{ field: 'name', header: 'Name', width: 150, locked: 'start' }, { field: 'total', header: 'Total', width: 140 }, { field: 'since', header: 'Since', width: 140 }, { field: 'active', header: 'Active', width: 140 }, { field: 'id', header: '#', width: 140, locked: 'end' }],
    rowActions: [{ text: 'Open', icon: 'edit', handler: () => {} }],
  });
  create({ type: 'button', text: 'Lock Total at start', renderTo: host, handler: () => grid.setColumnLocked('total', 'start') });
  create({ type: 'button', text: 'Release Total', renderTo: host, handler: () => grid.setColumnLocked('total', null) });
});

p.section('Grid · row editing', 'double-click (or Enter / F2): every editor column opens under a Save / Cancel bar. Name is required; Esc cancels, Enter saves; the edit event carries only what changed.', (host, { log }) => {
  const grid = create<Grid>({ type: 'grid', store: tally(), columns: tallyCols.map(({ summary: _s, ...c }) => c), plugins: [rowEditing()], height: 300, width: '100%', renderTo: host });
  grid.on('edit', (_rec: unknown, values: unknown, old: unknown) => log('edit', values, 'was', old));
  grid.on('cancel-edit', () => log('cancelled'));
});

p.section('Grid · tree with columns', 'flat rows with a parentId, nested data through flattenTree, lazy children (a delay; “Broken” fails). ←/→ close/open and walk to the parent / first child.', (host, { watch }) => {
  const rows = flattenTree([{ id: 1, name: 'Events', size: '', children: [{ id: 2, name: 'Gala', size: '120', children: [{ id: 3, name: 'Doors', size: '40' }, { id: 4, name: 'Stage', size: '80' }] }, { id: 5, name: 'Final', size: '300' }] }, { id: 6, name: 'Lazy (loads)', size: '?' }, { id: 7, name: 'Broken (fails)', size: '?' }]);
  const grid = create<Grid>({
    type: 'grid', store: new Store({ data: rows }), resizableColumns: true, selection: 'multi', height: 300, width: '100%', renderTo: host,
    columns: [{ field: 'name', header: 'Name', width: 260, sortable: true }, { field: 'size', header: 'Size', align: 'right' }, { field: 'id', header: '#', width: 70 }],
    plugins: [treeGrid({ load: (n) => new Promise((ok, fail) => setTimeout(() => (n.get('name').startsWith('Broken') ? fail(new Error('server down')) : ok([{ id: 60 + Number(n.id), name: 'Loaded child', size: '1', leaf: true }])), 600)) })],
  });
  watch(grid, ['expand-node', 'collapse-node', 'load-error']);
});

p.section('Bind · view model master/detail', 'select a row: the form is bound to the record (clean until you edit), the title and the Save button read the view model, and a formula counts the changes.', (host) => {
  const store = tally();
  const vm = viewModel({ formulas: { name: (get) => get('record.name') ?? '', dirty: (get) => get('touched') > 0 }, data: { touched: 0 } });
  const grid = create<Grid>({ type: 'grid', store, columns: tallyCols.map(({ editor: _e, summary: _s, ...c }) => c), height: 220, width: 360, renderTo: host });
  const title = create({ type: 'label', renderTo: host });
  const form = create<Form>({ type: 'form', width: 360, renderTo: host, items: [{ type: 'textfield', name: 'name', label: 'Name' }, { type: 'numberfield', name: 'votes', label: 'Votes' }] } as never);
  const save = create({ type: 'button', text: 'Save', variant: 'primary', renderTo: host, handler: () => (store.commitChanges(), vm.set('touched', 0)) });
  bindVM(title, vm, { text: 'Editing {record.name}' });
  bindVM(save, vm, { disabled: '{!dirty}' });
  bindForm(form, vm, 'record');
  grid.on('select', (recs: Model[]) => vm.link('record', recs[0] ?? null));
  form.on('dirty-change', (d: boolean) => d && vm.set('touched', 1));
});
