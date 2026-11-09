import { create, ui, toast, type Form } from 'optikos';

export default function settings(host: HTMLElement) {
  // one form, three tabs: validation jumps to the tab with the error, and each tab shows its error count and a "changed" dot
  const form = create<Form>({
    type: 'form', style: 'max-inline-size: 460px', tabs: [
      { title: 'Profile', icon: 'user', items: [ui.text('name', 'Display name', { required: true, value: 'Ada' }), ui.email('email', 'Email', { required: true, value: 'ada@example.com' })] },
      { title: 'Notifications', icon: 'bell', items: [ui.check('mail', 'Email me about new orders', { value: true }), ui.check('digest', 'Weekly digest')] },
      { title: 'API', icon: 'shield', items: [ui.secret('apiKey', 'API key', { stored: true, help: 'Saved keys are never shown again' })] },
    ],
  });
  const save = ui.primary('Save', () => form.submit());
  form.on('submit', () => {
    form.markClean();
    toast({ type: 'success', text: 'Settings saved' });
  });
  const page = create({ type: 'container', renderTo: host, layout: { type: 'vbox', gap: 12 }, items: [form, save] });
  return () => page.destroy();
}
