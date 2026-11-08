import { create, Panel, Spinner, Grid } from 'optikos';
import { page } from '../../dev/kit';

const p = page('feedback');

p.section('Spinner', 'indeterminate indicator; size comes from --op-spinner-size.', (host) => {
  create<Spinner>({ type: 'spinner', renderTo: host });
  create({ type: 'spinner', renderTo: host, theme: { '--op-spinner-size': '2.5rem', '--op-spinner-stroke': '4px' } });
  create({ type: 'spinner', renderTo: host, label: 'Saving', style: '--op-spinner-color: var(--op-color-success)' });
});

p.section('Loading mask', '`loading: true | "text"` on any component: content becomes inert, aria-busy is set.', (host) => {
  const panel = create<Panel>({ type: 'panel', title: 'Orders', width: 300, height: 150, renderTo: host, items: [{ type: 'textfield', label: 'Search' }] });
  create({ type: 'button', text: 'Toggle mask', renderTo: host, handler: () => panel.setLoading(!panel.config.loading) });
  create({ type: 'button', text: 'With text', renderTo: host, handler: () => panel.setLoading('Loading orders…') });
  const grid = create<Grid>({ type: 'grid', width: 360, height: 150, columns: [{ field: 'n', header: 'Name' }], data: [{ n: 'Ada' }, { n: 'Linus' }], renderTo: host });
  create({ type: 'button', text: 'Grid loading', renderTo: host, handler: () => grid.setLoading(true) });
  create({ type: 'button', text: 'Grid done', renderTo: host, handler: () => grid.setLoading(false) });
});
