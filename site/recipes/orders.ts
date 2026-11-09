import { create, ui, Store, Grid, toast } from 'optikos';

interface Order { id: number; customer: string; city: string; total: number; status: string }
const statuses = ['open', 'paid', 'shipped'];
const cities = ['Lisbon', 'Recife', 'Porto', 'Natal', 'Braga'];
const data: Order[] = Array.from({ length: 240 }, (_, i) => ({
  id: 1001 + i, customer: `Customer ${(i * 37) % 97}`, city: cities[i % 5], total: ((i * 53) % 900) + 20, status: statuses[i % 3],
}));

export default function orders(host: HTMLElement) {
  const store = new Store({ data, pageSize: 10 });
  // filters fire `settled`: once the user stops typing, not on every key
  const search = ui.text('q', 'Customer', { placeholder: 'Search…', clearable: true, debounce: 300 });
  const status = ui.select('status', 'Status', ['all', ...statuses], { value: 'all', width: 160 });
  const refilter = () => {
    const q = String(search.getValue() ?? '');
    const s = status.getValue();
    void store.filter([...(q ? [{ field: 'customer', op: 'contains' as const, value: q }] : []), ...(s !== 'all' ? [{ field: 'status', value: s }] : [])]);
  };
  search.on('settled', refilter);
  status.on('change', refilter);

  const grid = new Grid({
    store, paging: true, height: 420, checkboxSelection: true, ariaLabel: 'Orders',
    columns: [
      { field: 'id', header: '#', width: 80, sortable: true },
      { field: 'customer', header: 'Customer', flex: 2, sortable: true },
      { field: 'city', header: 'City', flex: 1 },
      { field: 'total', header: 'Total', format: 'money', align: 'right', sortable: true },
      { field: 'status', header: 'Status', width: 110 },
    ],
    bulkActions: [{ text: 'Mark shipped', icon: 'truck', handler: (recs) => { recs.forEach((r) => r.set('status', 'shipped')); toast(`${recs.length} order(s) shipped`); } }],
    rowActions: [{ text: 'Open', icon: 'eye', handler: (rec) => toast(`Order ${rec.data.id} — ${rec.data.customer}`) }],
  });
  const page = create({ type: 'container', renderTo: host, layout: { type: 'vbox', gap: 12 }, items: [ui.row(search, status), grid] });
  return () => page.destroy();
}
