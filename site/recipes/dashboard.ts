import { create, Store } from 'optikos';

const stat = (title: string, value: string, note: string) => ({
  type: 'panel', title, items: [
    { type: 'label', variant: 'title', text: value },
    { type: 'label', variant: 'muted', text: note, style: 'display:block' },
  ],
});

export default function dashboard(host: HTMLElement) {
  const recent = new Store({ data: [
    { id: 1042, customer: 'Ada Lovelace', total: 1280.5, status: 'paid' },
    { id: 1041, customer: 'Alan Turing', total: 310.25, status: 'open' },
    { id: 1040, customer: 'Grace Hopper', total: 9400, status: 'shipped' },
    { id: 1039, customer: 'Katherine Johnson', total: 640, status: 'paid' },
  ] });
  const page = create({
    type: 'container', renderTo: host, layout: { type: 'vbox', gap: 16 }, items: [
      // a numeric grid collapses to one column on narrow screens
      { type: 'container', layout: { type: 'grid', columns: 3, gap: 16 }, items: [stat('Revenue', '$48,210', '+12% this month'), stat('Orders', '1,284', '38 waiting to ship'), stat('Customers', '312', '9 new this week')] },
      { type: 'tabs', items: [
        { type: 'container', title: 'Recent orders', items: [{ type: 'table', store: recent, columns: [{ field: 'id', header: '#' }, { field: 'customer', header: 'Customer' }, { field: 'total', header: 'Total', format: 'money', align: 'right' }, { field: 'status', header: 'Status' }] }] },
        { type: 'container', title: 'Goals', layout: { type: 'vbox', gap: 8 }, style: 'padding:12px', items: [
          { type: 'slider', label: 'Monthly target reached', value: 72, format: (v: number) => `${v}%`, readonly: true, showValue: 'always' },
          { type: 'slider', label: 'Support tickets answered', value: 91, format: (v: number) => `${v}%`, readonly: true, showValue: 'always' },
        ] },
      ] },
    ],
  });
  return () => page.destroy();
}
