// CRM demo: form with SuggestField/LookupField, Grid with checkbox selection, bulk actions, column menu and a dynamic FilterBuilder. Public API only.
import { create, Store, Grid, Window, Form, MessageBox, toast, validators, registerLookup, localViewStorage, type FilterBuilder, type Model } from 'optikos';

const cities = ['São Paulo', 'Rio de Janeiro', 'Lisboa', 'Porto', 'Curitiba', 'Recife', 'Madrid', 'Barcelona', 'Berlin', 'Munich'];
const names = ['Ada', 'Grace', 'Linus', 'Alan', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia', 'Tim'];
const surnames = ['Lovelace', 'Hopper', 'Torvalds', 'Turing', 'Hamilton', 'Ritchie', 'Liskov', 'Thompson', 'Perlman', 'Berners-Lee'];
const customers = Array.from({ length: 240 }, (_, i) => ({
  id: i + 1,
  name: `${names[i % 10]} ${surnames[(i * 7) % 10]}`,
  email: `${names[i % 10].toLowerCase()}${i}@example.com`,
  city: cities[(i * 3) % cities.length],
  country: ['br', 'pt', 'es', 'de'][i % 4],
  since: `20${String(10 + (i % 15))}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
  status: ['active', 'lead', 'inactive'][i % 3],
  active: i % 3 !== 2,
  notes: '',
}));

type Customer = (typeof customers)[number];
const store = new Store({ data: customers, pageSize: 15, model: { idField: 'id' } });
let nextId = customers.length + 1;

// "Account manager" is picked from a bigger set than a dropdown can show: a lookup (search window with filters + grid)
const staff = Array.from({ length: 400 }, (_, i) => ({ id: i + 1, name: `${names[(i * 3) % 10]} ${surnames[(i * 7) % 10]} ${i + 1}`, city: cities[i % cities.length], team: ['Sales', 'Support', 'Success'][i % 3] }));
registerLookup('staff', {
  store: () => new Store({ data: staff, pageSize: 8 }),
  columns: [{ field: 'id', header: '#', width: 64 }, { field: 'name', header: 'Name', minWidth: 180 }, { field: 'team', header: 'Team', width: 110 }, { field: 'city', header: 'City' }],
  filters: [{ type: 'textfield', name: 'name', placeholder: 'Name…' }, { type: 'select', name: 'team', placeholder: 'Any team', options: ['Sales', 'Support', 'Success'] }],
  valueField: 'id', displayField: 'name', title: 'Find an account manager', width: 760,
});

const searchCity = (text: string) => new Promise<{ value: string; label: string }[]>((res) => setTimeout(() => res(cities.filter((c) => c.toLowerCase().includes(text.toLowerCase())).map((c) => ({ value: c, label: c }))), 250));

function editor(rec?: Model) {
  const form = create<Form>({
    type: 'form',
    items: [
      { type: 'textfield', name: 'name', label: 'Name', required: true, minLength: 3 },
      { type: 'textfield', name: 'email', label: 'Email', inputType: 'email', required: true, validators: [validators.email()] },
      { type: 'container', layout: { type: 'grid', columns: 2, gap: 12 }, items: [
        { type: 'suggestfield', name: 'city', label: 'City', query: searchCity, forceSelection: false },
        { type: 'select', name: 'country', label: 'Country', options: [{ value: 'br', label: 'Brazil' }, { value: 'pt', label: 'Portugal' }, { value: 'es', label: 'Spain' }, { value: 'de', label: 'Germany' }], required: true },
        { type: 'datefield', name: 'since', label: 'Customer since' },
        { type: 'lookupfield', name: 'manager', label: 'Account manager', lookup: 'staff', showValue: true },
        { type: 'radiogroup', name: 'status', label: 'Status', options: ['active', 'lead', 'inactive'], direction: 'horizontal', value: 'lead' },
      ] },
      { type: 'textarea', name: 'notes', label: 'Notes', rows: 3 },
      { type: 'checkbox', name: 'active', boxLabel: 'Active customer', value: true },
    ],
  });
  const win = create<Window>({
    type: 'window', title: rec ? `Edit ${rec.get('name')}` : 'New customer', icon: rec ? 'edit' : 'plus', width: 520, items: [form],
    buttons: [{ text: 'Cancel', handler: () => win.close() }, { text: 'Save', variant: 'primary', handler: () => form.submit() }],
  });
  if (rec) form.load(rec);
  form.on('submit', (values: Record<string, any>) => {
    if (rec) {
      form.updateRecord(rec);
      toast({ type: 'success', text: `${values.name} updated` });
    } else {
      store.insert(0, { id: nextId++, ...values });
      toast({ type: 'success', text: `${values.name} created` });
    }
    win.close();
  });
  win.show();
}

async function deleteRecords(recs: Model<Customer>[]) {
  const what = recs.length === 1 ? recs[0].get('name') : `${recs.length} customers`;
  if (!(await MessageBox.confirm(`Delete ${what}? This cannot be undone.`, { danger: true, okText: 'Delete', title: 'Delete customers' }))) return;
  store.remove(recs);
  grid.deselectAll();
  toast({ text: recs.length === 1 ? 'Customer deleted' : `${recs.length} customers deleted` });
}

// `new Grid({ store })` takes the record type from the typed Store: selections, actions and renderers are all `Model<Customer>`
const grid = new Grid({
  store, paging: true, flex: 1, ariaLabel: 'Customers',
  checkboxSelection: true, keepSelection: true, columnMenu: true, reorderableColumns: true, resizableColumns: true, // drag headers to reorder; Views saves the order
  bulkActions: [
    { text: 'Mark active', icon: 'check', handler: (recs) => { recs.forEach((r) => r.set('status', 'active')); toast({ type: 'success', text: `${recs.length} marked active` }); } },
    { text: 'Delete', icon: 'trash', variant: 'danger', handler: (recs) => void deleteRecords(recs) },
  ],
  rowActionsMode: 'visible', // icon buttons in every row (dimmed until hover/selection); 'menu' folds them into a "⋯" menu
  rowActions: [
    { text: 'Edit', icon: 'edit', handler: (rec) => editor(rec) },
    { text: 'Delete (deactivate first)', icon: 'trash', variant: 'danger', disabled: (rec) => rec.get('status') === 'active', handler: (rec) => void deleteRecords([rec]) },
  ],
  columns: [
    { field: 'id', header: '#', width: 64, sortable: true, align: 'right' },
    { field: 'name', header: 'Name', sortable: true, minWidth: 160 },
    { field: 'email', header: 'Email', minWidth: 200 },
    { field: 'city', header: 'City', sortable: true },
    { field: 'since', header: 'Since', format: 'date', sortable: true, width: 130 },
    { field: 'status', header: 'Status', sortable: true, width: 110, renderer: (v: string) => Object.assign(document.createElement('span'), { textContent: v, className: `crm-status crm-status--${v}` }) },
  ],
  listeners: { 'row-dblclick': (rec: Model) => editor(rec), 'row-activate': (rec: Model) => editor(rec) },
});

const style = document.createElement('style');
style.textContent = `.crm-status{padding:.1rem .5rem;border-radius:var(--op-radius-pill);font-size:var(--op-font-size-sm);background:var(--op-color-surface-2)}
.crm-status--active{background:var(--op-color-success-soft);color:var(--op-color-success)}.crm-status--lead{background:var(--op-color-info-soft);color:var(--op-color-info)}.crm-status--inactive{background:var(--op-color-danger-soft);color:var(--op-color-danger)}`;
document.head.append(style);

const edit = () => (grid.getSelection()[0] ? editor(grid.getSelection()[0]) : toast({ type: 'warning', text: 'Select a customer first' }));

const filters = create<FilterBuilder>({
  type: 'filterbuilder', store, style: 'padding: var(--op-space-3); border-bottom: 1px solid var(--op-color-border)',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email' },
    { name: 'city', label: 'City', type: 'select', options: cities },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'lead', 'inactive'] },
    { name: 'since', label: 'Customer since', type: 'date' },
    { name: 'id', label: 'Id', type: 'number' },
  ],
  value: { op: 'and', filters: [{ field: 'status', op: 'in', value: ['active', 'lead'] }] },
});

create({
  type: 'viewport',
  renderTo: document.body,
  items: [{
    type: 'panel', title: 'Customers', icon: 'users', layout: { type: 'vbox' },
    tbar: [
      // saved views: visible columns, filters (with their groups) and sort. Here they live in localStorage;
      // swap localViewStorage(...) for restViewStorage({ url: '/api/views' }) (or your own storage) to keep them on a server.
      { type: 'viewmanager', grid, filters, storage: localViewStorage('optikos.demo.crm.views'),
        listeners: { save: (v: { name: string }) => toast({ type: 'success', text: `View "${v.name}" saved` }), remove: (v: { name: string }) => toast({ text: `View "${v.name}" deleted` }), error: (e: Error) => toast({ type: 'error', text: e.message }) } },
      { type: 'button', text: 'Filters', icon: 'filter', handler: () => (filters.config.hidden ? filters.show() : filters.hide()) },
      '->',
      { type: 'button', text: 'Edit', icon: 'edit', handler: edit },
      { type: 'button', text: 'New customer', icon: 'plus', variant: 'primary', handler: () => editor() },
    ],
    items: [filters, grid],
  }],
});
