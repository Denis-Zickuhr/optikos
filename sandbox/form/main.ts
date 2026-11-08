import { create, ui, Direction, Form, StepForm, Window, MessageBox, Store, registerLookup, toast, validators } from 'optikos';
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

