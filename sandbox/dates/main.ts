import { create, Calendar, DateField, DateRangeField, setLocale } from 'optikos';
import { page } from '../../dev/kit';

const p = page('dates');

p.section('Calendar', 'arrow keys, Page keys (Shift = year), Home/End, Enter; click the title for months.', (host, { watch }) => {
  watch(create<Calendar>({ type: 'calendar', value: '2026-11-07', renderTo: host }), ['select', 'navigate']);
  create({ type: 'calendar', min: '2026-11-05', max: '2026-11-20', isDisabled: (iso: string) => iso.endsWith('-10'), value: '2026-11-12', renderTo: host });
  create({ type: 'calendar', firstDay: 1, value: '2026-11-07', renderTo: host });
});

p.section('DateField', 'type in your locale order or ISO; ↓ opens the calendar; value is an ISO string.', (host, { watch }) => {
  watch(create<DateField>({ type: 'datefield', label: 'Birthday', width: 220, renderTo: host }), ['change', 'expand', 'collapse']);
  create({ type: 'datefield', label: 'With value', value: '2026-11-07', width: 220, renderTo: host });
  create<DateField>({ type: 'datefield', label: 'Between Nov 5–20', min: '2026-11-05', max: '2026-11-20', value: '2026-12-01', width: 220, renderTo: host }).validate();
  create({ type: 'datefield', label: 'Required', required: true, width: 220, renderTo: host });
  create({ type: 'datefield', label: 'Readonly', value: '2026-01-01', readonly: true, width: 220, renderTo: host });
});

p.section('Calendar · range', 'two clicks: start, then end (an earlier second click swaps them). The selection stays highlighted between the two.', (host, { watch }) => {
  watch(create<Calendar>({ type: 'calendar', range: true, value: { start: '2026-11-04', end: '2026-11-11' }, renderTo: host }), ['start', 'select']);
  create({ type: 'calendar', range: true, min: '2026-11-05', max: '2026-11-25', renderTo: host });
});

p.section('DateRangeField', 'type "01/11/2026 – 15/11/2026" (or one date), or open the calendar with ↓ and pick two days. Value is { start, end }.', (host, { watch }) => {
  watch(create<DateRangeField>({ type: 'daterangefield', label: 'Period', width: 300, renderTo: host }), ['change']);
  create({ type: 'daterangefield', label: 'With value', value: { start: '2026-11-01', end: '2026-11-15' }, width: 300, renderTo: host });
  create<DateRangeField>({ type: 'daterangefield', label: 'Within Nov 5–20', min: '2026-11-05', max: '2026-11-20', value: { start: '2026-11-01', end: '2026-11-10' }, width: 300, renderTo: host }).validate();
  create({ type: 'daterangefield', label: 'Required', required: true, width: 300, renderTo: host });
  create({ type: 'daterangefield', label: 'Readonly', value: { start: '2026-01-01', end: '2026-01-31' }, readonly: true, width: 300, renderTo: host });
});

p.section('Locale', 'switch to pt-BR (new components pick it up).', (host) => {
  create({ type: 'button', text: 'setLocale("pt-BR")', renderTo: host, handler: () => { setLocale('pt-BR'); create({ type: 'datefield', label: 'Data (pt-BR)', value: '2026-11-07', width: 220, renderTo: host }); create({ type: 'calendar', value: '2026-11-07', renderTo: host }); } });
  create({ type: 'button', text: 'setLocale("en")', renderTo: host, handler: () => setLocale('en') });
});
