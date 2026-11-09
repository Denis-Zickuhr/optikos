// Workbench demo: floating, draggable Widgets that are not chats (notes, a focus timer, settings) over a data grid. Public API only.
import { create, Store, toast, type Widget, type Grid, type Table, type Form, type Label, type Button } from 'optikos';

const customers = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne', 'Wonka'];
const orders = Array.from({ length: 120 }, (_, i) => ({
  id: 1000 + i, customer: customers[i % customers.length], total: Math.round(((i * 7919) % 90000) / 7) / 10,
  status: ['paid', 'pending', 'refunded'][i % 3], date: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
}));
const store = new Store({ data: orders, pageSize: 20 });

const grid = create<Grid>({
  type: 'grid', store, paging: true, flex: 1, ariaLabel: 'Orders', striped: true,
  columns: [
    { field: 'id', header: 'Order', width: 100, sortable: true }, { field: 'customer', sortable: true }, { field: 'total', format: 'money', align: 'right', sortable: true },
    { field: 'status', sortable: true }, { field: 'date', format: 'date', sortable: true },
  ],
});

// ---- Widget 1: notes. Free text saved in the browser; draggable, and the user can dock it left or right -------------------------
interface Note { text: string; at: string }
const NOTES_KEY = 'optikos.demo.workbench.notes';
let notes: Note[] = [];
try { notes = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '[]'); } catch { /* start empty */ }
const showNotes = () => notes.map((n) => ({ ...n }));
const notesTable = create<Table>({ type: 'table', data: showNotes(), columns: [{ field: 'text', header: 'Note' }, { field: 'at', header: 'When' }], striped: true, emptyText: 'No notes yet' } as any);
const noteField = create({ type: 'textarea', placeholder: 'Write a note about these orders…', rows: 3, autoGrow: true } as any);
const addNote = () => {
  const text = String((noteField as any).getValue() ?? '').trim();
  if (!text) return;
  notes.unshift({ text, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch { /* ignore */ }
  notesTable.setData(showNotes());
  (noteField as any).setValue('');
  toast({ type: 'success', text: 'Note saved' });
};
const notesW = create<Widget>({
  type: 'widget', title: 'Notes', icon: 'edit', side: 'right', draggable: true, sideSwitcher: true, sides: ['left', 'right'], width: 360, layout: { type: 'vbox', gap: 8 }, bodyCls: 'wb-pad',
  items: [noteField, { type: 'toolbar', items: [{ type: 'button', text: 'Save note', variant: 'primary', icon: 'check', handler: addNote }, '->', { type: 'button', text: 'Clear all', variant: 'ghost', icon: 'trash', handler: () => { notes = []; localStorage.removeItem(NOTES_KEY); notesTable.setData([]); } }] }, notesTable],
});

// ---- Widget 2: a focus timer. A small floating tool with its own state; the page keeps working underneath ----------------------
const MODES = { focus: 25 * 60, break: 5 * 60 } as const;
let mode: keyof typeof MODES = 'focus';
let left: number = MODES.focus;
let tick: ReturnType<typeof setInterval> | undefined;
const clock = create<Label>({ type: 'label', text: '25:00', cls: 'wb-clock' });
const bar = Object.assign(document.createElement('div'), { className: 'wb-bar' });
bar.append(Object.assign(document.createElement('i'), { className: 'wb-bar__fill' }));
const paint = () => {
  clock.setText(`${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`);
  bar.firstElementChild!.setAttribute('style', `inline-size:${((MODES[mode] - left) / MODES[mode]) * 100}%`);
  timerW.setTitle(`${tick ? '▶' : '⏸'} ${mode === 'focus' ? 'Focus' : 'Break'} timer`);
};
const stop = () => { if (tick) clearInterval(tick); tick = undefined; };
const toggle = (b?: Button) => {
  if (tick) { stop(); b?.setText('Start'); } else {
    b?.setText('Pause');
    tick = setInterval(() => {
      left--;
      if (left <= 0) { stop(); left = 0; startBtn.setText('Start'); toast({ type: 'success', title: mode === 'focus' ? 'Focus session done' : 'Break over', text: 'Nice work.' }); }
      paint();
    }, 1000);
  }
  paint();
};
const setMode = (m: keyof typeof MODES) => { stop(); mode = m; left = MODES[m]; startBtn.setText('Start'); paint(); };
const startBtn = create<Button>({ type: 'button', text: 'Start', variant: 'primary', handler: (b: Button) => toggle(b) });
const timerW = create<Widget>({
  type: 'widget', title: '⏸ Focus timer', icon: 'bell', side: 'bottom', draggable: true, size: '13rem', width: 400, layout: { type: 'vbox', gap: 8, align: 'center' }, bodyCls: 'wb-pad',
  items: [clock],
});
// the progress bar is plain DOM inside the widget body, next to the Optikos controls
timerW.on('show', () => { timerW.getBody().append(bar); paint(); });
timerW.add({ type: 'toolbar', items: [startBtn, { type: 'button', text: 'Reset', handler: () => setMode(mode) }, '->', { type: 'button', text: 'Focus', variant: 'ghost', handler: () => setMode('focus') }, { type: 'button', text: 'Break', variant: 'ghost', handler: () => setMode('break') }] });

// ---- Widget 3: settings. A form that changes the page live (no Apply button) ------------------------------------------------------
const settings = create<Form>({
  type: 'form', items: [
    { type: 'select', name: 'pageSize', label: 'Rows per page', options: [10, 20, 50], value: 20 },
    { type: 'checkbox', name: 'striped', boxLabel: 'Striped rows', value: true },
    { type: 'checkbox', name: 'toolbar', boxLabel: 'Show paging bar', value: true },
  ],
});
settings.on('change', () => {
  const v = settings.getValues();
  store.setPageSize(Number(v.pageSize));
  grid.el.classList.toggle('op-grid--striped', !!v.striped);
  (grid.el.querySelector('.op-grid__pager') as HTMLElement | null)?.toggleAttribute('hidden', !v.toolbar);
});
const settingsW = create<Widget>({ type: 'widget', title: 'View settings', icon: 'settings', side: 'left', draggable: true, sideSwitcher: true, width: 300, layout: 'fit', bodyCls: 'wb-pad', items: [settings] });

// ---- page ---------------------------------------------------------------------------------------------------------------------
const css = document.createElement('style');
css.textContent = `html,body{margin:0;height:100%}.wb-pad{padding:var(--op-space-3)}
.wb-clock{font-size:2.75rem;font-weight:600;font-variant-numeric:tabular-nums;text-align:center}
.wb-bar{inline-size:100%;block-size:.375rem;background:var(--op-color-surface-2);border-radius:var(--op-radius-pill);overflow:hidden}
.wb-bar__fill{display:block;block-size:100%;background:var(--op-color-primary);transition:inline-size 1s linear}`;
document.head.append(css);

const opener = (w: Widget, text: string, icon: string) => ({
  type: 'button', text, icon, variant: 'ghost', handler: (b: Button) => { w.setOpen(); b.el.setAttribute('aria-pressed', String(w.isOpen())); },
});
for (const w of [notesW, timerW, settingsW]) w.on('side-change', (s: string) => toast({ text: `Docked ${s}` }));

create({
  type: 'viewport', renderTo: document.body,
  items: [{
    type: 'panel', title: 'Orders workbench', icon: 'chart', layout: { type: 'vbox' },
    tbar: [opener(settingsW, 'Settings', 'settings'), opener(notesW, 'Notes', 'edit'), opener(timerW, 'Timer', 'bell'), '->',
      { type: 'label', text: 'Drag a widget by its header (or Alt+arrows); the arrows in the header dock it to a side.', style: 'color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)' }],
    items: [grid],
  }],
});
timerW.open();
