import { ui, toast, validators, type Form } from 'optikos';

export default function signup(host: HTMLElement) {
  const form: Form = ui.form([
    ui.text('name', 'Full name', { required: true, minLength: 3 }),
    ui.email('email', 'Email', { required: true, validators: [validators.email()] }),
    ui.password('password', 'Password', { required: true, minLength: 8, help: 'At least 8 characters' }),
    ui.select('plan', 'Plan', ['Free', 'Team', 'Business'], { value: 'Team' }),
    ui.check('terms', 'I accept the terms', { required: true }),
    ui.primary('Create account', () => form.submit()),
  ], { style: 'max-inline-size: 360px' });
  form.on('submit', (values: Record<string, unknown>) => toast({ type: 'success', text: `Welcome, ${values.name}!` }));
  form.mount(host);
  return () => form.destroy();
}
