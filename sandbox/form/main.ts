import { create, ui, Direction, Form, TextField, StepForm, Window, MessageBox, Store, registerLookup, toast, validators } from 'optikos';
import { page } from '../../dev/kit';

const p = page('form');
const cities = ['London', 'Lisboa', 'Porto', 'Madrid', 'Berlin', 'Curitiba', 'São Paulo'];
const searchCity = (text: string) => cities.filter((c) => c.toLowerCase().includes(text.toLowerCase())).map((c) => ({ value: c, label: c }));
const people = Array.from({ length: 80 }, (_, i) => ({ id: i + 1, name: `${['Ada', 'Grace', 'Linus', 'Alan', 'Margaret', 'Dennis'][i % 6]} ${['Lovelace', 'Hopper', 'Torvalds', 'Turing', 'Hamilton', 'Ritchie'][(i * 5) % 6]} ${i + 1}` }));
registerLookup('managers', { store: () => new Store<any>({ data: people, pageSize: 8 }), columns: [{ field: 'id', header: '#', width: 60 }, { field: 'name', header: 'Name' }], filters: [{ type: 'textfield', name: 'name', placeholder: 'Name…' }], valueField: 'name', displayField: 'name', title: 'Find a manager' });

/** The fields of a customer record, split the way real sign-up screens are (written with the `ui` shortcuts). */
const personal = () => [
  ui.text('name', 'Full name', { required: true, minLength: 3, colspan: 2 }),
  ui.email('email', 'Email', { required: true, validators: [validators.email()] }),
  ui.date('birthday', 'Birthday', { max: '2008-12-31' }),
  ui.radio('kind', 'Customer type', ['person', 'company'], { value: 'person', direction: Direction.Horizontal, colspan: 2 }),
];
const address = () => [
  ui.text('address.street', 'Street', { colspan: 2 }),
  ui.suggest('address.city', 'City', searchCity, { forceSelection: false, required: true }),
  ui.select('address.country', 'Country', [{ value: 'gb', label: 'United Kingdom' }, { value: 'pt', label: 'Portugal' }, { value: 'es', label: 'Spain' }, { value: 'br', label: 'Brazil' }], { required: true }),
  ui.text('address.zip', 'Postal code', { pattern: /^[\w -]{3,10}$/, help: '3–10 letters, digits, space or dash' }),
];
const account = () => [
  ui.lookup('manager', 'Account manager', 'managers', { forceSelection: false }),
  ui.number('credit', 'Credit limit', { decimals: 2, min: 0, max: 100000, value: 5000 }),
  ui.area('notes', 'Internal notes', { rows: 3, colspan: 2 }),
  ui.check('newsletter', 'Send the newsletter', { value: true, colspan: 2 }),
];
const record = { name: 'Ada Lovelace', email: 'ada@example.com', kind: 'person', address: { street: '12 St James Square', city: 'London', country: 'gb', zip: 'SW1Y' }, manager: 'Grace Hopper 2', credit: 25000, notes: 'Prefers email.', newsletter: false };

// ---- 1. the basics -----------------------------------------------------------------------------------------------------------------
p.section('Form · the basics', 'nested names (address.city), load/reset/dirty, validate focuses the first invalid, submit is cancelable. Label on the left for a denser look.', (host, { log, watch }) => {
  const form: Form = create<Form>({
    type: 'form', width: 380, labelPos: 'left', renderTo: host,
    items: [
      ui.text('name', 'Name', { required: true }),
      ui.email('email', 'Email'),
      ui.suggest('address.city', 'City', searchCity, { forceSelection: false }),
      ui.toolbar(
        ui.button('Load record', () => form.load({ name: 'Ada Lovelace', email: 'ada@example.com', address: { city: 'London' } })),
        ui.button('Reset', () => form.reset()),
        '->',
        ui.primary('Save', undefined, { htmlType: 'submit' }),
      ),
    ],
  });
  watch(form, ['submit', 'invalid', 'load']);
  form.on('dirty-change', () => log('dirty', form.isDirty()));
  create({ type: 'button', text: 'Show values', renderTo: host, handler: () => log('values', form.getValues()) });
});

// ---- 1b. layouts: sections, columns, fieldset variants, aligned labels ----------------------------------------------------------------
p.section('Form layouts · a settings page', 'FormSection puts the title and description beside the fields (it stacks when the section is narrow: resize the window); `columns` makes a responsive grid and `colspan: "full"` takes the row; FieldSet comes as box, line or plain, with a description.', (host, { log }) => {
  const form: Form = create<Form>({
    type: 'form', width: '100%', renderTo: host,
    items: [
      { type: 'formsection', title: 'Profile', description: 'How other people see you in the app.', columns: 2, items: [
        ui.text('first', 'First name', { required: true }),
        ui.text('last', 'Last name'),
        ui.email('email', 'Email', { required: true, colspan: 'full' }),
        ui.area('bio', 'Bio', { rows: 2, colspan: 'full', help: 'A sentence or two.' }),
      ] },
      { type: 'formsection', title: 'Address', description: 'Where invoices and orders are shipped.', items: [
        { type: 'fieldset', title: 'Street address', variant: 'line', columns: 3, items: [
          ui.text('address.street', 'Street', { colspan: 2 }),
          ui.text('address.number', 'Number'),
          ui.suggest('address.city', 'City', searchCity, { forceSelection: false }),
          ui.text('address.state', 'State'),
          ui.text('address.zip', 'Postal code'),
        ] },
      ] },
      { type: 'formsection', title: 'Notifications', description: 'Pick what reaches your inbox.', items: [
        { type: 'fieldset', title: 'Email me about', variant: 'plain', items: [ui.check('notify.orders', 'New orders', { value: true }), ui.check('notify.digest', 'A weekly digest')] },
      ] },
      ui.toolbar('->', ui.primary('Save', undefined, { htmlType: 'submit' })),
    ],
  });
  form.on('submit', (v: Record<string, unknown>) => log('submit', v));
});

p.section('Form layouts · labels and fieldsets', 'labelPos: left with `labelWidth` lines the labels up in one column; the three FieldSet variants, each with a description (read as the group description) and collapsible (the chevron or the title; `collapsed`, `collapse()`, `expand()`, `toggle()`).', (host) => {
  create({ type: 'form', width: 420, labelPos: 'left', labelWidth: 140, renderTo: host, items: [
    ui.text('company', 'Company'), ui.text('vat', 'VAT number'), ui.email('billing', 'Billing email'), ui.select('terms', 'Payment terms', ['15 days', '30 days', '60 days'], { value: '30 days' }),
  ] });
  for (const variant of ['box', 'line', 'plain'] as const) {
    create({ type: 'fieldset', title: `variant: '${variant}'`, description: 'Fields that belong together.', variant, collapsible: true, collapsed: variant === 'plain', width: 260, renderTo: host, items: [ui.text(`${variant}.a`, 'Name'), ui.text(`${variant}.b`, 'Role')] });
  }
});

// ---- 1c. compound fields: one label over several inputs; text and buttons joined to an input ------------------------------------
p.section('Compound fields · FieldGroup and InputGroup', 'FieldGroup: one label, one help line and one error line over several inputs (each keeps its own name: phone.country, phone.number). InputGroup joins text ("R$", ".com") or a button to the box of any field (the text is read with the input). Validate to see the shared error line.', (host, { log }) => {
  const form: Form = create<Form>({
    type: 'form', width: 460, renderTo: host,
    items: [
      { type: 'fieldgroup', label: 'Phone', help: 'We only call about your orders.', items: [
        ui.select('phone.country', 'Country code', ['+351', '+55', '+44'], { value: '+351', width: 104 }),
        ui.text('phone.number', 'Number', { required: true, pattern: /^[0-9 ]{6,}$/ }),
      ] },
      { type: 'fieldgroup', label: 'Date of birth', required: true, stackBelow: 320, items: [
        ui.number('dob.day', 'Day', { min: 1, max: 31, required: true }),
        ui.select('dob.month', 'Month', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], { required: true, flex: 2 }),
        ui.number('dob.year', 'Year', { min: 1900, max: 2026, required: true }),
      ] },
      { type: 'inputgroup', prefix: 'R$', items: [ui.number('price', 'Price', { decimals: 2 })] },
      { type: 'inputgroup', prefix: 'https://', suffix: '.com', items: [ui.text('site', 'Website')] },
      { type: 'inputgroup', suffix: { icon: 'file', text: 'Copy', handler: (f: TextField) => void navigator.clipboard?.writeText(String(f.getValue())).then(() => toast({ type: 'success', text: 'Copied' })) }, items: [ui.text('token', 'API token', { value: 'tok_live_4f9a', readonly: true })] },
      { type: 'inputgroup', suffix: { icon: 'search', text: 'Go', handler: (f: TextField) => log('search', f.getValue()) }, items: [ui.text('q', 'Search')] },
      { type: 'inputgroup', suffix: 'kg', items: [ui.select('weight', 'Parcel weight', ['1', '2', '5', '10'], { value: '2' })] },
      ui.toolbar('->', ui.primary('Validate', () => form.validate() && log('values', form.getValues()))),
    ],
  });
});

// ---- 1d. a repeating block ---------------------------------------------------------------------------------------------------------
p.section('FieldList · repeating rows', 'one field whose value is an array: add, remove and reorder rows (buttons, all reachable with Tab), min 1 / max 5, labels shown once as a column header. Validate checks every row and focuses the first problem; Load / Reset / dirty work on the whole list.', (host, { log }) => {
  const form: Form = create<Form>({
    type: 'form', width: 620, renderTo: host,
    items: [
      ui.text('customer', 'Customer', { required: true, value: 'Ada Lovelace' }),
      { type: 'fieldlist', name: 'contacts', label: 'Contacts', min: 1, max: 5, addText: 'Add a contact', value: [{ name: 'Ada', email: 'ada@example.com', role: 'Owner' }], items: [
        ui.text('name', 'Name', { required: true }),
        ui.email('email', 'Email', { required: true }),
        ui.select('role', 'Role', ['Owner', 'Finance', 'Support'], { value: 'Support', width: 140 }),
      ] },
      { type: 'fieldlist', name: 'lines', label: 'Order lines', help: 'Quantity × unit price; the total updates as you type.', newRow: { qty: 1 }, items: [
        ui.text('product', 'Product', { required: true }),
        ui.number('qty', 'Qty', { min: 1, width: 90 }),
        { type: 'inputgroup', width: 150, prefix: '$', items: [ui.number('price', 'Unit price', { decimals: 2, min: 0 })] },
      ] },
      ui.toolbar(
        ui.button('Load an order', () => form.load({ customer: 'Grace Hopper', contacts: [{ name: 'Grace', email: 'grace@navy.mil', role: 'Owner' }, { name: 'Alan', email: 'alan@bletchley.uk', role: 'Finance' }], lines: [{ product: 'Compiler', qty: 2, price: 1200 }, { product: 'Manual', qty: 5, price: 19.9 }] })),
        ui.button('Reset', () => form.reset()),
        '->',
        ui.primary('Save', undefined, { htmlType: 'submit' }),
      ),
    ],
  });
  const total = create({ type: 'label', text: 'Total: $0.00', renderTo: host, style: 'width:100%;font-weight:600' }) as any;
  const sum = () => total.setText(`Total: $${(form.getValues().lines as { qty?: number; price?: number }[]).reduce((t, r) => t + (r.qty ?? 0) * (r.price ?? 0), 0).toFixed(2)}`);
  form.getField('lines')!.on('change', sum);
  form.on('load', sum); // load is silent (no change events): recount after it
  form.on('submit', (v: Record<string, unknown>) => log('submit', v));
  form.on('dirty-change', () => log('dirty', form.isDirty()));
});

// ---- 1e. rules, error summary, action bar ------------------------------------------------------------------------------------------
p.section('Form utils · showIf, FormErrors and FormActions', 'pick "Company": the company fields appear (showIf) and count again; "Send invoices by email" enables the email field (enableIf). Save with errors: the summary at the top lists them, each link opens the right tab and focuses the field. The bar at the bottom shows "Unsaved changes" and Save waits for a change (requireChanges); Cancel asks first.', (host, { log }) => {
  const form: Form = create<Form>({
    type: 'form', width: 560, height: 520, style: 'overflow:auto', renderTo: host,
    items: [
      { type: 'formerrors' },
      {
        type: 'tabs', flex: 1, items: [
          { title: 'Customer', layout: { type: 'vbox' }, items: [
            ui.radio('kind', 'Customer type', ['person', 'company'], { value: 'person', direction: Direction.Horizontal }),
            ui.text('name', 'Full name', { required: true, showIf: (v: any) => v.kind === 'person' }),
            { type: 'fieldset', title: 'Company', variant: 'line', showIf: (v: any) => v.kind === 'company', columns: 2, items: [
              ui.text('company', 'Company name', { required: true, colspan: 'full' }),
              ui.text('vat', 'VAT number', { required: true }),
              ui.text('contact', 'Contact person'),
            ] },
          ] },
          { title: 'Billing', layout: { type: 'vbox' }, items: [
            ui.check('byEmail', 'Send invoices by email'),
            ui.email('billingEmail', 'Billing email', { required: true, enableIf: (v: any) => v.byEmail === true, help: 'Enabled when invoices go by email.' }),
            ui.select('terms', 'Payment terms', ['15 days', '30 days', '60 days'], { required: true }),
          ] },
        ],
      },
      { type: 'formactions', sticky: true, requireChanges: true, buttons: [{ text: 'Save as draft', variant: 'ghost', handler: () => log('draft', form.getValues()) }] },
    ],
  });
  const bar = form.items[2] as any;
  bar.on('cancel', () => {
    void MessageBox.confirm('Discard your changes?', { danger: true, okText: 'Discard' }).then((ok) => ok && form.reset());
    return false; // the confirm decides
  });
  form.on('submit', (v: Record<string, unknown>) => log('submit', v));
});

// ---- 2. tabs -------------------------------------------------------------------------------------------------------------------------
p.section('Form with tabs', 'ONE form across tabs: values, dirty and validate see every field, even in tabs you never opened. "Validate" jumps to the first invalid field\'s tab; headers show an error badge and a dot while changed.', (host, { log, watch }) => {
  const form = create<Form>({
    type: 'form', width: '100%', renderTo: host,
    tabs: [
      { title: 'Personal', icon: 'user', items: personal() },
      { title: 'Address', icon: 'home', items: address() },
      { title: 'Account', icon: 'settings', items: account() },
    ],
  } as any);
  watch(form, ['submit', 'invalid', 'load']);
  create({ type: 'button', text: 'Validate (go to first error)', variant: 'primary', renderTo: host, handler: () => form.validate() });
  create({ type: 'button', text: 'Load a record', renderTo: host, handler: () => form.load(record) });
  create({ type: 'button', text: 'Reset', renderTo: host, handler: () => form.reset() });
  create({ type: 'button', text: 'Submit', renderTo: host, handler: () => form.submit() });
  create({ type: 'button', text: 'Show dirty values', renderTo: host, handler: () => log('dirty only', form.getValues({ dirtyOnly: true })) });
});

// ---- 3. tabs in a modal, with a "discard changes?" guard -----------------------------------------------------------------------------------
p.section('Form in a modal (Window)', 'the same tabbed form in a modal Window: Save validates (jumping to the tab with the error), Cancel / the X ask before discarding unsaved changes.', (host, { log }) => {
  const open = (withData: boolean) => {
    const form = create<Form>({ type: 'form', tabs: [{ title: 'Personal', icon: 'user', items: personal() }, { title: 'Address', icon: 'home', items: address() }, { title: 'Account', icon: 'settings', items: account() }] } as any);
    if (withData) form.load(record);
    const win: Window = create<Window>({
      type: 'window', title: withData ? `Edit ${record.name}` : 'New customer', icon: withData ? 'edit' : 'plus', width: 720, layout: 'fit', items: [form],
      buttons: [{ text: 'Cancel', handler: () => win.close() }, { text: 'Save', variant: 'primary', handler: () => form.submit() }],
    });
    win.on('before-close', () => {
      if (!form.isDirty() || win.config.closeAction === 'hide') return;
      void MessageBox.confirm('Discard your changes?', { danger: true, okText: 'Discard', title: 'Unsaved changes' }).then((ok) => {
        if (ok) {
          form.markClean();
          win.close();
        }
      });
      return false;
    });
    form.on('submit', (values: unknown) => {
      log('saved', values);
      toast({ type: 'success', text: 'Customer saved' });
      form.markClean();
      win.close();
    });
    win.show();
  };
  create({ type: 'button', text: 'New customer', icon: 'plus', variant: 'primary', renderTo: host, handler: () => open(false) });
  create({ type: 'button', text: 'Edit existing', icon: 'edit', renderTo: host, handler: () => open(true) });
});

// ---- 4. wizard on the page ------------------------------------------------------------------------------------------------------------------
const wizardSteps = () => [
  { title: 'Person', description: 'Who is it', items: personal() },
  { title: 'Address', description: 'Where', optional: true, items: address().map((f) => ({ ...f, required: false })) },
  { title: 'Account', description: 'How we work', items: account() },
];
p.section('StepForm (wizard)', 'one step at a time with a Stepper: Next validates the step (and shows the error on the stepper), Back keeps the values, "Address" is optional, the last step is a Review of everything. Enter = Next. Finish validates all steps.', (host, { log, watch }) => {
  const wizard = create<StepForm>({ type: 'stepform', steps: wizardSteps(), review: true, width: '100%', cancelText: 'Cancel', renderTo: host } as any);
  watch(wizard, ['step-change', 'finish', 'cancel']);
  wizard.on('finish', (v: unknown) => toast({ type: 'success', title: 'Customer created', text: JSON.stringify(v).slice(0, 90) + '…' }));
  wizard.on('cancel', () => (wizard.reset(), log('reset')));
  create({ type: 'button', text: 'Fill with a record', renderTo: host, handler: () => wizard.load(record) });
  create({ type: 'button', text: 'Jump to Review (linear: stops at the first invalid step)', renderTo: host, handler: () => wizard.goTo(3) });
});

// ---- 5. wizard in a modal ----------------------------------------------------------------------------------------------------------------------
p.section('StepForm in a modal', 'the wizard inside a Window: it brings its own Back / Next / Finish footer (no Window buttons). Finish closes the window, Cancel asks first when something was typed.', (host) => {
  create({ type: 'button', text: 'New customer (wizard)', icon: 'plus', variant: 'primary', renderTo: host, handler: () => {
    const wizard = create<StepForm>({ type: 'stepform', steps: wizardSteps(), review: true, cancelText: 'Cancel' } as any);
    const win: Window = create<Window>({ type: 'window', title: 'New customer', icon: 'plus', width: 760, layout: 'fit', items: [wizard] });
    wizard.on('finish', (v: Record<string, any>) => {
      toast({ type: 'success', title: 'Customer created', text: v.name });
      win.close();
    });
    wizard.on('cancel', async () => (!wizard.isDirty() || (await MessageBox.confirm('Discard what you typed?', { danger: true, okText: 'Discard' }))) && win.close());
    win.show();
  } });
});

// ---- 6. free navigation + custom review ---------------------------------------------------------------------------------------------------------
p.section('StepForm: free navigation and a custom review', 'linear: false (click any step, nothing is validated on the way) and a review you render yourself. Finish still validates every step and takes you to the first problem.', (host) => {
  const wizard = create<StepForm>({
    type: 'stepform', linear: false, width: '100%', finishText: 'Create customer', nextText: 'Continue', renderTo: host,
    steps: wizardSteps().slice(0, 3),
    review: (v: Record<string, any>) => {
      const card = document.createElement('div');
      card.style.cssText = 'padding:1rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius);background:var(--op-color-surface-2)';
      const b = Object.assign(document.createElement('strong'), { textContent: v.name || '(no name yet)' });
      card.append(b, document.createElement('br'), `${v.email || 'no email'} · ${v.address?.city || 'no city'} · credit ${v.credit ?? 0}`);
      return card;
    },
  } as any);
  wizard.on('finish', () => toast({ type: 'success', text: 'Created' }));
});

// ---- secret fields: create vs edit ------------------------------------------------------------------------------------------------------------
p.section('SecretField: create and edit', 'creating: type the secret, the eye lets you check what you typed. Editing a saved secret: it is NEVER shown again (mask only, no eye); to change it you press Replace (or click the field), read the warning, and type a new one. "Keep current" undoes the replacement; the form sends null for an untouched secret.', (host, { log }) => {
  const make = (stored: boolean) => {
    const form: Form = create<Form>({
      type: 'form', width: 420,
      items: [
        { type: 'textfield', name: 'name', label: 'Integration name', required: true, value: stored ? 'Payments gateway' : '' },
        { type: 'secretfield', name: 'apiKey', label: 'API key', required: true, help: stored ? 'Saved on the server.' : 'Shown only while you type.', placeholder: 'sk_live_…' },
        { type: 'secretfield', name: 'webhookSecret', label: 'Webhook secret (optional)' },
        { type: 'toolbar', items: [{ type: 'button', text: 'Reset', handler: () => form.reset() }, '->', { type: 'button', text: 'Save', variant: 'primary', htmlType: 'submit' }] },
      ],
    });
    if (stored) form.load({ name: 'Payments gateway', apiKey: true, webhookSecret: false });
    form.on('submit', (v: Record<string, unknown>) => log(stored ? 'PATCH (null = keep)' : 'POST', v));
    return form;
  };
  create({ type: 'label', text: 'New integration', renderTo: host, style: 'width:100%;font-weight:600' });
  host.append(make(false).el);
  create({ type: 'label', text: 'Edit integration (API key already saved on the server)', renderTo: host, style: 'width:100%;font-weight:600' });
  host.append(make(true).el);
});

// ---- 7. the field kinds, validation and server errors ----------------------------------------------------------------------------------------
p.section('Validation and server errors', 'built-in validators, a cross-field rule (the two passwords must match) and a "server" error set from code (`setError`) after submit. The form stays one unit: dirty tracking, reset, readonly.', (host, { log }) => {
  const form: Form = create<Form>({
    type: 'form', width: 420, renderTo: host,
    items: [
      { type: 'textfield', name: 'user', label: 'Username', required: true, minLength: 3, pattern: /^[a-z0-9._-]+$/i, help: 'Letters, digits, dot, dash' },
      { type: 'textfield', name: 'pass', label: 'Password', inputType: 'password', required: true, minLength: 8 },
      { type: 'textfield', name: 'pass2', label: 'Repeat password', inputType: 'password', required: true, validators: [(v: string) => (v === form.getField('pass')?.getValue() ? '' : 'Passwords do not match')] },
      { type: 'numberfield', name: 'age', label: 'Age', min: 18, max: 120, required: true },
      { type: 'checkbox', name: 'terms', boxLabel: 'I accept the terms', required: true },
      { type: 'toolbar', items: [{ type: 'button', text: 'Reset', handler: () => form.reset() }, { type: 'button', text: 'Toggle readonly', handler: () => form.setReadonly(!form.config.readonly) }, '->', { type: 'button', text: 'Create account', variant: 'primary', htmlType: 'submit' }] },
    ],
  });
  form.on('submit', (v: Record<string, any>) => {
    log('submit → server…', v.user);
    setTimeout(() => {
      if (v.user.toLowerCase() === 'admin') form.getField('user')!.setError('That username is taken');
      else toast({ type: 'success', text: `Welcome, ${v.user}` });
    }, 400);
  });
  form.getField('pass')!.on('change', () => form.getField('pass2')!.getValue() && form.getField('pass2')!.validate());
  create({ type: 'label', text: 'Try the username "admin" to get a server error.', renderTo: host, style: 'color:var(--op-color-fg-muted)' });
});

