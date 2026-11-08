import { create, TextField, validators } from 'optikos';
import { page } from '../../dev/kit';

const p = page('fields');

p.section('TextField', 'label, placeholder, help, required (validates on blur), readonly, disabled, labelPos left.', (host, { watch }) => {
  const mk = (cfg: object) => create<TextField>({ type: 'textfield', width: 260, renderTo: host, ...cfg });
  watch(mk({ label: 'Name', placeholder: 'Your name', help: 'As on your ID' }), ['change', 'focus', 'blur', 'enter']);
  mk({ label: 'Required', required: true });
  mk({ label: 'Readonly', value: 'cannot edit', readonly: true });
  mk({ label: 'Disabled', value: 'disabled', disabled: true });
  mk({ label: 'Label left', labelPos: 'left', width: 400 });
});

p.section('TextField · validation', 'minLength, pattern, built-in email validator, manual setError.', (host) => {
  const mk = (cfg: object) => create<TextField>({ type: 'textfield', width: 260, renderTo: host, ...cfg });
  mk({ label: 'Min 3 chars', minLength: 3 });
  mk({ label: 'Email', validators: [validators.email()], inputType: 'email' });
  mk({ label: 'Letters only', pattern: '^[a-zA-Z]+$' });
  const f = mk({ label: 'Server error' });
  create({ type: 'button', text: 'Set error', renderTo: host, handler: () => f.setError('Already taken') });
});

p.section('TextField · other', 'clearable (Esc too), password, maxLength, selectOnFocus.', (host) => {
  const mk = (cfg: object) => create<TextField>({ type: 'textfield', width: 260, renderTo: host, ...cfg });
  mk({ label: 'Clearable', clearable: true, value: 'clear me' });
  mk({ label: 'Password', inputType: 'password' });
  mk({ label: 'Max 5', maxLength: 5 });
  mk({ label: 'Select on focus', selectOnFocus: true, value: 'selected on focus' });
});

import { create as c, Select, ComboBox, SuggestField, NumberField, Checkbox, RadioGroup, Store, LookupField, Slider } from 'optikos';

const fruits = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Date', 'Fig', 'Grape', 'Kiwi', 'Lemon', 'Mango', 'Orange'];
const objects: { value: string; label: string; disabled?: boolean }[] = [{ value: 'br', label: 'Brazil' }, { value: 'pt', label: 'Portugal' }, { value: 'us', label: 'United States', disabled: true }, { value: 'jp', label: 'Japan' }];

p.section('stableSize · invalid and searching', 'left: stableSize (default), right: stableSize:false. Showing the error or starting a search does not move the layout on the left.', (host, { log }) => {
  const row = (stableSize: boolean) => {
    const f = c<TextField>({ type: 'textfield', label: `Name (stableSize: ${stableSize})`, stableSize, required: true, width: 240, renderTo: host });
    c({ type: 'textfield', label: 'Field below', stableSize, width: 240, renderTo: host });
    return f;
  };
  const a = row(true);
  const b = row(false);
  c({ type: 'button', text: 'Toggle error', renderTo: host, handler: () => [a, b].forEach((f) => (f.getError() ? f.clearError() : f.setError('Required')) ) });
  const s = (stableSize: boolean) => c<SuggestField>({ type: 'suggestfield', label: `City (stableSize: ${stableSize})`, stableSize, query: () => new Promise((r) => setTimeout(() => r([]), 2500)), width: 240, renderTo: host });
  s(true);
  s(false);
  log('type in a City field: the spinner appears without moving the text when stableSize is on');
});

p.section('NumberField · TextArea', 'min/max/step/decimals, arrow and Page keys; textarea with autoGrow.', (host, { watch }) => {
  watch(c<NumberField>({ type: 'numberfield', label: 'Quantity (0–10, step 2)', min: 0, max: 10, step: 2, value: 4, width: 220, renderTo: host }), ['change']);
  c({ type: 'numberfield', label: 'Price (2 decimals)', decimals: 2, value: 9.9, width: 220, renderTo: host });
  c({ type: 'textarea', label: 'Notes', rows: 3, width: 260, renderTo: host });
  c({ type: 'textarea', label: 'Auto grow (max 6 rows)', autoGrow: true, maxRows: 6, width: 260, renderTo: host });
});

p.section('Checkbox · RadioGroup', 'boolean, indeterminate, required-means-checked; single choice with arrows.', (host, { watch }) => {
  watch(c<Checkbox>({ type: 'checkbox', boxLabel: 'Subscribe', renderTo: host }), ['change']);
  c<Checkbox>({ type: 'checkbox', label: 'Terms', boxLabel: 'I accept', required: true, renderTo: host }).validate();
  c({ type: 'checkbox', boxLabel: 'Partial', indeterminate: true, renderTo: host });
  c({ type: 'checkbox', boxLabel: 'Disabled', disabled: true, value: true, renderTo: host });
  watch(c<RadioGroup>({ type: 'radiogroup', label: 'Size', options: ['S', 'M', 'L'], value: 'M', direction: 'horizontal', renderTo: host }), ['change']);
  c({ type: 'radiogroup', label: 'Plan', options: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }, { value: 'ent', label: 'Enterprise', disabled: true }], renderTo: host });
});

p.section('Select', 'closed list; letters jump to matching items; disabled option; clearable-style empty.', (host, { watch }) => {
  watch(c<Select>({ type: 'select', label: 'Country', options: objects, value: 'br', width: 220, renderTo: host }), ['change', 'select', 'expand', 'collapse']);
  c({ type: 'select', label: 'Fruit', options: fruits, placeholder: 'Pick…', required: true, width: 220, renderTo: host });
  c({ type: 'select', label: 'Disabled', options: fruits, value: 'Fig', disabled: true, width: 220, renderTo: host });
});

p.section('ComboBox', 'type to filter (marked), 5,000 virtualized options, free text with forceSelection:false.', (host, { watch }) => {
  watch(c<ComboBox>({ type: 'combobox', label: 'Fruit', options: fruits, width: 220, renderTo: host }), ['change', 'select']);
  c({ type: 'combobox', label: '5,000 options', options: Array.from({ length: 5000 }, (_, i) => `Option ${i + 1}`), width: 220, renderTo: host });
  c({ type: 'combobox', label: 'Free text', options: fruits, forceSelection: false, width: 220, renderTo: host });
  c({ type: 'combobox', label: 'Starts with', options: fruits, filter: 'startsWith', width: 220, renderTo: host });
  c({ type: 'combobox', label: 'From a Store', store: new Store({ data: objects }), valueField: 'value', displayField: 'label', width: 220, renderTo: host });
});

p.section('SuggestField', 'debounced async search (simulated 400 ms), stale answers dropped, failing query, empty result.', (host, { watch, log }) => {
  const cities = ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Lisboa', 'Porto', 'Coimbra', 'Braga'];
  const search = (text: string) => new Promise<{ value: string; label: string }[]>((res) => setTimeout(() => res(cities.filter((x) => x.toLowerCase().includes(text.toLowerCase())).map((x) => ({ value: x.toLowerCase().replace(/\W+/g, '-'), label: x }))), 400));
  const s = c<SuggestField>({ type: 'suggestfield', label: 'City', query: search, width: 260, renderTo: host });
  watch(s, ['query', 'load', 'select', 'change']);
  c({ type: 'suggestfield', label: 'Fails', query: () => Promise.reject(new Error('network')), width: 260, renderTo: host, listeners: { error: () => log('error', 'query failed') } });
  c<SuggestField>({ type: 'suggestfield', label: 'With id (showValue)', query: search, showValue: true, width: 260, renderTo: host });
  c<SuggestField>({ type: 'suggestfield', label: 'Free text', query: search, forceSelection: false, width: 260, renderTo: host });
  c<SuggestField>({ type: 'suggestfield', label: 'No magnifier (icon: false)', query: search, icon: false, width: 260, renderTo: host });
  const pre = c<SuggestField>({ type: 'suggestfield', label: 'Preloaded', query: search, width: 260, renderTo: host });
  pre.setSelection({ value: 'lisboa', label: 'Lisboa' }, true);
});

p.section('LookupField', 'type to get suggestions, or press the magnifier (F4 / Alt+↓) for the search window: filters + grid, double-click or Enter picks. Typed text pre-fills the filter.', (host, { watch }) => {
  const names = ['Ada', 'Grace', 'Linus', 'Alan', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia', 'Tim'];
  const people = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, name: `${names[i % 10]} ${Math.floor(i / 10) + 1}`, city: ['Lisboa', 'Porto', 'Curitiba', 'Madrid'][i % 4] }));
  const lookup = {
    store: () => new Store({ data: people, pageSize: 8 }),
    columns: [{ field: 'id', header: '#', width: 70 }, { field: 'name', header: 'Name' }, { field: 'city', header: 'City' }],
    filters: [{ type: 'textfield', name: 'name', placeholder: 'Name…' }, { type: 'select', name: 'city', placeholder: 'Any city', options: ['Lisboa', 'Porto', 'Curitiba', 'Madrid'] }],
    valueField: 'id', displayField: 'name', title: 'Find a person',
  };
  watch(c<LookupField>({ type: 'lookupfield', label: 'Account manager (showValue)', lookup, showValue: true, width: 300, renderTo: host }), ['select', 'change']);
  c({ type: 'lookupfield', label: 'Required', lookup, required: true, width: 300, renderTo: host });
  c({ type: 'lookupfield', label: 'Disabled', lookup, disabled: true, width: 300, renderTo: host });
});

p.section('Slider', 'a bar with a ball to drag: click the track, drag the ball (it stretches 12 % in the direction it moves), arrows / Page / Home / End. Range = two balls that never cross. The bubble shows the value while dragging or focused.', (host, { watch }) => {
  watch(c<Slider>({ type: 'slider', label: 'Volume', value: 40, format: (v: number) => `${v}%`, width: 280, renderTo: host }), ['change', 'slide-end']);
  c({ type: 'slider', label: 'Rating (marks, step 1)', min: 0, max: 10, step: 1, value: 7, marks: true, showScale: true, width: 280, renderTo: host });
  watch(c<Slider>({ type: 'slider', label: 'Price range', range: true, min: 0, max: 1000, step: 10, value: [200, 700], format: (v: number) => `$${v}`, showValue: 'always', width: 320, renderTo: host }), ['change']);
  c({ type: 'slider', label: 'Labelled marks', min: 0, max: 100, step: 25, value: 50, marks: [{ value: 0, label: 'Low' }, { value: 50, label: 'Mid' }, { value: 100, label: 'High' }], width: 280, renderTo: host });
  c({ type: 'slider', label: 'Decimal step', min: 0, max: 1, step: 0.05, value: 0.35, width: 280, renderTo: host });
  c({ type: 'slider', label: 'Disabled', value: 60, disabled: true, width: 280, renderTo: host });
  c({ type: 'slider', label: 'Read-only', value: 60, readonly: true, width: 280, renderTo: host });
});
