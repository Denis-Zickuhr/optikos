// Back-office panel demo ("Agon"): permissions, live charts and KPIs, a grid with export/print/saved layout, a form with masks, currency,
// date-time, lookup text and server errors, a schedule, shortcuts and a theme made from two colors. Public API only.
import {
  ui, Store, Grid, Stat, Window, Viewport, defineTheme, setTheme, toast, shortcuts, exportGrid, printGrid, persistState, setPermissionResolver, setLocale, setCurrency,
  registerLookup, type Model,
} from 'optikos';

setLocale('en');
setCurrency('USD');

// ---- a white-label theme from two colors (light and dark) ----------------------------------------------------------------------
const brand = defineTheme({ seeds: { primary: '#D9A441', neutral: '#2A1C12' } }, 'brand');
brand.apply();
let night = false;
const applyTheme = () => setTheme(night ? 'brand dark' : 'brand');

// ---- the data: candidates, a live votes feed and an event schedule ------------------------------------------------------------
const names = ['Amara Okafor', 'Bianca Reis', 'Chloe Martin', 'Dalia Haddad', 'Elena Rossi', 'Farah Khan', 'Giulia Conti', 'Hana Sato'];
const candidates = new Store({
  data: names.map((name, i) => ({ id: i + 1, name, taxId: `${100 + i}.456.789-0${i}`, votes: 120 + i * 37, fee: 150000 + i * 2500, event: 1 + (i % 2), eventName: i % 2 ? 'Final night' : 'Semi-final', at: `2026-11-1${i % 5}T19:30` })),
  model: { idField: 'id' },
});
const feed = new EventTarget();
const emit = (patches: unknown) => feed.dispatchEvent(Object.assign(new Event('message'), { data: JSON.stringify(patches) }));
const disconnect = candidates.connect(feed as never);
const hours = new Store({ data: Array.from({ length: 12 }, (_, i) => ({ id: i, hour: `${i + 8}h`, votes: 20 + ((i * 17) % 40) })) });
const ticker = setInterval(() => {
  const id = 1 + Math.floor(Math.random() * names.length);
  const now = candidates.getById(id)!.get('votes') as number;
  emit({ data: { id, votes: now + 1 + Math.floor(Math.random() * 5) } });
  hours.applyPatches([{ data: { id: 11, votes: (hours.getById(11)!.get('votes') as number) + 1 } }]);
}, 1500);

registerLookup('events', { store: () => new Store({ data: [{ id: 1, name: 'Semi-final' }, { id: 2, name: 'Final night' }] }), columns: [{ field: 'name', header: 'Event' }], filters: [{ type: 'textfield', name: 'name', label: 'Name', op: 'contains' }], title: 'Events' });

// ---- screens: each is a config with the tab's title and icon (any container can be a tab panel) -------------------------------
const money = (cents: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(cents / 100);
const sum = () => candidates.getData().reduce((a, c) => a + (c.votes as number), 0);

function dashboard() {
  const totals = new Store({ data: [] });
  const refresh = () => totals.loadData(candidates.getData().map((c) => ({ name: c.name, votes: c.votes })));
  refresh();
  candidates.subscribe(refresh);
  const votes = new Stat({ label: 'Votes', value: sum(), delta: 0.125, trend: hours.getData().map((h) => h.votes as number), caption: 'vs yesterday', icon: 'heart' });
  candidates.subscribe(() => votes.setValue(sum()));
  return {
    type: 'container', title: 'Dashboard', icon: 'chart', cls: 'pn-pad', layout: { type: 'vbox', gap: 12 }, items: [
      { type: 'container', cls: 'pn-grid', items: [votes, { type: 'stat', label: 'Revenue', value: 4820000, format: 'money', delta: 0.04, caption: 'tickets' }, { type: 'stat', label: 'Refunds', value: 31, delta: 0.2, good: 'down', caption: 'this week' }] },
      { type: 'container', cls: 'pn-grid', items: [
        { type: 'panel', title: 'Votes per hour (live)', items: [{ type: 'chart', kind: 'area', x: 'hour', series: ['votes'], store: hours, title: 'Votes per hour' }] },
        { type: 'panel', title: 'Share by candidate', items: [{ type: 'chart', kind: 'donut', x: 'name', series: ['votes'], store: totals, title: 'Votes by candidate' }] },
      ] },
    ],
  };
}

function openEditor(rec?: Model<any>) {
  const form = ui.form([
    ui.text('name', 'Name', { required: true }),
    ui.mask('taxId', 'Tax id', ['000.000.000-00', '00.000.000/0000-00'], { raw: true, validators: [(v: string) => (v.length >= 11 && /^(\d)\1+$/.test(v) ? 'Not a valid tax id' : true)] }),
    ui.number('fee', 'Fee', { format: 'currency', scale: 100, min: 0 }),
    ui.datetime('at', 'Starts at'),
    ui.lookup('event', 'Event', 'events', { displayFrom: 'eventName' }),
  ]);
  const win: Window = new Window({
    title: rec ? 'Edit candidate' : 'New candidate', width: 460, confirmDiscard: true, closable: true, items: [form],
    buttons: [{ text: 'Cancel', handler: () => win.close() }, {
      text: 'Save', variant: 'primary', handler: () => {
        if (!form.validate()) return;
        const values = form.getValues();
        // the "server" rejects a name that is taken, and the error lands on the field
        if (candidates.getData().some((c) => c.name === values.name && c.id !== rec?.id)) return void form.setErrors({ name: 'There is already a candidate with this name' });
        if (rec) for (const k in values) rec.set(k, values[k]);
        else candidates.add({ ...values, votes: 0 });
        form.markClean();
        win.close();
        toast({ text: 'Saved', type: 'success' });
      },
    }],
  });
  if (rec) form.load(rec.data);
  win.show();
}

function candidatesScreen() {
  const grid = new Grid({
    store: candidates, flex: 1, resizableColumns: true, reorderableColumns: true, columnMenu: true,
    columns: [
      { field: 'name', header: 'Candidate', sortable: true, flex: 2 },
      { field: 'votes', header: 'Votes', sortable: true, align: 'right', format: 'number' },
      { field: 'fee', header: 'Fee', align: 'right', renderer: (v: number) => money(v), permission: 'fees.view' },
      { field: 'eventName', header: 'Event', sortable: true },
    ],
    rowActions: [
      { text: 'Edit', icon: 'edit', permission: 'candidate.edit', handler: (rec) => openEditor(rec) },
      { text: 'Delete', icon: 'trash', variant: 'danger', permission: 'candidate.delete', handler: (rec) => candidates.remove(rec) },
    ],
    plugins: [persistState('panel-candidates')],
  });
  return {
    type: 'container', title: 'Candidates', icon: 'users', layout: { type: 'vbox' }, items: [
      { type: 'toolbar', items: [
        { type: 'button', text: 'New', icon: 'plus', variant: 'primary', permission: 'candidate.create', handler: () => openEditor() },
        '->',
        { type: 'button', text: 'CSV', icon: 'file', handler: () => void exportGrid(grid, { filename: 'candidates' }) },
        { type: 'button', text: 'Excel', icon: 'file', handler: () => void exportGrid(grid, { format: 'xlsx', filename: 'candidates' }) },
        { type: 'button', text: 'Print', handler: () => void printGrid(grid, { title: 'Candidates' }) },
      ] },
      grid,
    ],
  };
}

const scheduleScreen = () => ({
  type: 'container', title: 'Schedule', icon: 'calendar', cls: 'pn-pad', layout: { type: 'vbox', gap: 16 }, items: [
    { type: 'timeline', mode: 'range', lanes: ['Stage', 'Backstage', 'Security'], items: [
      { title: 'Rehearsal', lane: 'Stage', start: '2026-11-10', end: '2026-11-11', tone: 'info' },
      { title: 'Semi-final', lane: 'Stage', start: '2026-11-12T19:00', end: '2026-11-12T23:00' },
      { title: 'Final night', lane: 'Stage', start: '2026-11-14T19:00', end: '2026-11-14T23:59', tone: 'success' },
      { title: 'Make-up', lane: 'Backstage', start: '2026-11-12', end: '2026-11-14' },
      { title: 'Night shift', lane: 'Security', start: '2026-11-11', end: '2026-11-14', tone: 'warning' },
    ] },
    { type: 'timeline', items: [{ time: '2026-11-10T09:00', title: 'Voting opened', tone: 'success' }, { time: '2026-11-10T12:30', title: 'Sponsor added', text: 'Logo uploaded', icon: 'image' }, { time: '2026-11-10T16:00', title: 'Refund requested', tone: 'warning' }] },
  ],
});

// ---- the shell: rebuilt when the role changes, because permissions are read as components render ----------------------
const roles: Record<string, string[]> = {
  admin: ['candidate.create', 'candidate.edit', 'candidate.delete', 'fees.view', 'schedule.view'],
  operator: ['candidate.create', 'candidate.edit', 'schedule.view'],
  viewer: [],
};
let role = 'admin';
let shell: Viewport | undefined;

function build() {
  shell?.destroy();
  setPermissionResolver((p) => roles[role].includes(p));
  shell = new Viewport({
    layout: 'border', renderTo: document.body, items: [
      { type: 'toolbar', region: 'north', cls: 'pn-bar', items: [
        { type: 'avatar', name: { admin: 'Ada Admin', operator: 'Otto Operator', viewer: 'Vera Viewer' }[role], status: 'online', size: 'sm' },
        { type: 'label', text: 'Agon panel' }, '->',
        { type: 'select', ariaLabel: 'Role', width: 140, value: role, options: Object.keys(roles), listeners: { change: (v: string) => ((role = v), build()) } },
        { type: 'button', icon: 'moon', ariaLabel: 'Night mode', handler: () => ((night = !night), applyTheme()) },
        { type: 'button', text: '?', ariaLabel: 'Shortcuts', handler: () => shortcuts.help() },
      ] },
      { type: 'tabs', region: 'center', items: [dashboard(), candidatesScreen(), { ...scheduleScreen(), permission: 'schedule.view' }] },
    ],
  });
}
applyTheme();
build();

shortcuts.setScope('candidates');
shortcuts.register({ keys: 'mod+s', title: 'Save the open form', handler: () => document.querySelector<HTMLElement>('.op-window .op-button--primary')?.click() });
shortcuts.register({ keys: 'alt+n', title: 'New candidate', scope: 'candidates', handler: () => openEditor() });
window.addEventListener('pagehide', () => (clearInterval(ticker), disconnect()));
