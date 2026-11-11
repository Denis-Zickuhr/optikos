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

import { create as c, Select, ComboBox, SuggestField, NumberField, TimeField, DateTimeField, MaskField, Checkbox, RadioGroup, Store, LookupField, Slider, Dial } from 'optikos';

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

p.section('TimeField', 'Type 930 / 9:30, ↑/↓ by step, PageUp/PageDown by an hour; limits stop the value.', (host, { watch }) => {
  watch(c<TimeField>({ type: 'timefield', label: 'Free', value: '09:30', width: 160, renderTo: host }), ['change']);
  c({ type: 'timefield', label: '08:00–18:00, 15 min', min: '08:00', max: '18:00', step: 15, width: 200, renderTo: host });
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

p.section('Dial', 'a flat ruler under a fixed needle: drag it (a slow drag rests on the nearest value, a flick glides on to the nearest snap point ahead), click a tick, arrows / Page (snap points) / Home / End. The readout digits roll; a text value slides in.', (host, { watch }) => {
  watch(c<Dial>({ type: 'dial', label: 'Age', min: 0, max: 120, value: 34, width: 340, renderTo: host }), ['change', 'slide-end']);
  c({ type: 'dial', label: 'Birth year', min: 1920, max: 2026, value: 1990, width: 340, renderTo: host });
  c({ type: 'dial', label: 'Age (format)', max: 120, value: 27, format: (v: number) => `${v} years`, width: 340, renderTo: host });
  c({ type: 'dial', label: 'Month', options: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], value: 'May', width: 340, renderTo: host });
  c({ type: 'dial', label: 'Disabled', max: 120, value: 50, disabled: true, width: 340, renderTo: host });
  c({ type: 'dial', label: 'Read-only', max: 120, value: 50, readonly: true, width: 340, renderTo: host });
});

p.section('Dial · circle', 'shape: circle, a clock face: drag the hand around (it turns the short way), click a tick, the same keys.', (host, { watch }) => {
  watch(c<Dial>({ type: 'dial', label: 'Month', shape: 'circle', options: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], value: 'Mar', renderTo: host }), ['change']);
  c({ type: 'dial', label: 'Minutes', shape: 'circle', min: 0, max: 59, snap: 5, value: 15, renderTo: host });
  c({ type: 'dial', label: 'Size', shape: 'circle', options: [{ value: 's', label: 'S' }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' }, { value: 'xl', label: 'XL' }], value: 'm', renderTo: host });
});

p.section('Toggle', 'an on/off switch (role="switch"): Space or a click toggles; disabled and read-only.', (host, { watch }) => {
  const on = create({ type: 'toggle', boxLabel: 'Email me about new orders', value: true, renderTo: host } as never);
  create({ type: 'toggle', boxLabel: 'Weekly digest', renderTo: host } as never);
  create({ type: 'toggle', boxLabel: 'Disabled', disabled: true, value: true, renderTo: host } as never);
  create({ type: 'toggle', boxLabel: 'Read-only', readonly: true, renderTo: host } as never);
  watch(on, ['change']);
});

p.section('CheckboxGroup', 'several choices; the value is the list of checked values in option order. Required = at least one.', (host, { watch }) => {
  const g = create({ type: 'checkboxgroup', label: 'Notify me by', required: true, options: ['Email', 'SMS', { value: 'push', label: 'Push (disabled)', disabled: true }], renderTo: host } as never);
  create({ type: 'checkboxgroup', label: 'Days', direction: 'horizontal', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], value: ['Mon', 'Fri'], renderTo: host } as never);
  watch(g, ['change', 'invalid', 'valid']);
});

p.section('ImageField', 'click or drop an image; a preview with a remove button; a new image replaces the old one (single).', (host, { watch }) => {
  watch(c({ type: 'imagefield', label: 'Avatar', help: 'PNG or JPG, up to 1 MB', accept: 'image/png,image/jpeg', maxSize: 1048576, width: 320, renderTo: host } as never), ['change', 'reject', 'invalid']);
  c({ type: 'imagefield', label: 'Saved cover', value: 'https://example.com/covers/summer.jpg', width: 320, renderTo: host } as never);
});

p.section('ImageField · multiple', 'multiple with maxFiles 3: the zone goes away when full; extra files are rejected with a message.', (host, { watch }) => {
  watch(c({ type: 'imagefield', label: 'Gallery', multiple: true, maxFiles: 3, renderTo: host } as never), ['change', 'reject']);
  c({ type: 'imagefield', label: 'Disabled', disabled: true, value: 'cover.png', renderTo: host } as never);
  c({ type: 'imagefield', label: 'Read-only', readonly: true, value: 'cover.png', renderTo: host } as never);
});

p.section('ImageField · in a Form', 'required: the form does not validate without an image; getValues returns the File.', (host, { log }) => {
  const form = c<import('optikos').Form>({ type: 'form', width: 360, renderTo: host, items: [{ type: 'textfield', name: 'title', label: 'Title' }, { type: 'imagefield', name: 'photo', label: 'Photo', required: true }] } as never);
  c({ type: 'button', text: 'Validate', renderTo: host, handler: () => log(`valid: ${form.validate()} · values: ${JSON.stringify(form.getValues())}`) });
});

p.section('DateTimeField', 'a date and a time in one value: local `YYYY-MM-DDTHH:mm`, or with utc an ISO instant of what was typed. One part alone is invalid.', (host, { watch }) => {
  watch(c<DateTimeField>({ type: 'datetimefield', label: 'Starts at (local)', value: '2026-11-10T19:30', renderTo: host }), ['change']);
  watch(c<DateTimeField>({ type: 'datetimefield', label: 'Deadline (utc)', utc: true, min: '2026-11-01', renderTo: host }), ['change']);
});

p.section('MaskField', 'type 12345678900 → 123.456.789-00; a list of patterns picks one by length (tax id, then company id); raw keeps only the digits; the check digit is the app\'s validator.', (host, { watch }) => {
  watch(c<MaskField>({ type: 'maskfield', label: 'CPF / CNPJ (raw)', mask: ['000.000.000-00', '00.000.000/0000-00'], raw: true, width: 260, renderTo: host }), ['change']);
  c({ type: 'maskfield', label: 'Plate', mask: 'AAA-0A00', width: 160, renderTo: host });
  c({ type: 'maskfield', label: 'Not all equal digits', mask: '000.000.000-00', width: 200, validators: [(v: string) => (/^(\d)\1+$/.test(v.replace(/\D/g, '')) ? 'Invalid number' : true)], renderTo: host });
});

p.section('NumberField · money and percent', 'Intl formats from one code; scale 100 keeps cents as an integer; locale and currency per field or global (setLocale / setCurrency).', (host, { watch }) => {
  watch(c<NumberField>({ type: 'numberfield', label: 'US, cents (value 123456)', format: 'currency', currency: 'USD', locale: 'en-US', scale: 100, value: 123456, width: 220, renderTo: host }), ['change']);
  watch(c<NumberField>({ type: 'numberfield', label: 'BR, cents', format: 'currency', currency: 'BRL', locale: 'pt-BR', scale: 100, value: 123456, width: 220, renderTo: host }), ['change']);
  watch(c<NumberField>({ type: 'numberfield', label: 'Percent (a fraction)', format: 'percent', decimals: 1, value: 0.15, width: 160, renderTo: host }), ['change']);
});
