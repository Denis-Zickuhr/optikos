import { create, ui, toast, type Form, type Panel, type Button } from 'optikos';

export default function login(host: HTMLElement) {
  const form: Form = ui.form([
    ui.email('email', 'Email', { required: true, value: 'ada@example.com' }),
    ui.password('password', 'Password', { required: true, help: 'Try "optikos"' }),
    ui.check('remember', 'Keep me signed in'),
  ]);
  const panel = create<Panel>({
    type: 'panel', title: 'Sign in', icon: 'user', style: 'max-inline-size: 360px', renderTo: host, items: [form],
    buttons: [{ text: 'Sign in', variant: 'primary', handler: (b: Button) => void signIn(b) }],
  });
  form.on('submit', () => void signIn());

  async function signIn(button?: Button) {
    if (!form.validate()) return;
    button?.setLoading('Signing in…');
    await new Promise((r) => setTimeout(r, 700)); // the server
    button?.setLoading(false);
    const ok = form.getValues().password === 'optikos';
    if (ok) toast({ type: 'success', text: 'Signed in' });
    else form.getField('password')!.setError('Wrong email or password');
  }
  return () => panel.destroy();
}
