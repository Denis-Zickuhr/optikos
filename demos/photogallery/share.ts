// The "Share" window: people or a link, permission, expiry, optional link password (a SecretField).
import { create, toast, type Window, type Form } from 'optikos';
import { shares, photos } from './data';
import type { Ctx, ShareTarget } from './ui';

export function openShare(ctx: Ctx, targets: ShareTarget[]): void {
  if (!targets.length) return;
  const what = targets.length === 1 ? `“${targets[0].name}”` : `${targets.length} ${targets[0].kind}s`;
  const form: Form = create<Form>({
    type: 'form', style: 'padding:var(--op-space-4)',
    items: [
      { type: 'label', text: `Sharing ${what}`, style: 'font-weight:600' },
      { type: 'radiogroup', name: 'mode', label: 'How', value: 'people', direction: 'horizontal', options: [{ value: 'people', label: 'With people' }, { value: 'link', label: 'With a link' }] },
      { type: 'textfield', name: 'people', label: 'People', placeholder: 'ana@example.com, bruno@example.com', help: 'Separate with commas' },
      { type: 'container', layout: { type: 'grid', columns: 2, gap: 12 }, items: [
        { type: 'select', name: 'permission', label: 'Can', value: 'view', options: [{ value: 'view', label: 'View' }, { value: 'comment', label: 'View and comment' }, { value: 'edit', label: 'Edit' }] },
        { type: 'datefield', name: 'expires', label: 'Expires', min: '2026-11-09' },
        { type: 'secretfield', name: 'password', label: 'Link password (optional)', id: 'share-pass', colspan: 2, help: 'Anyone opening the link must type it.' },
        { type: 'checkbox', name: 'download', boxLabel: 'Allow downloads', value: true, colspan: 2 },
      ] },
      { type: 'textarea', name: 'message', label: 'Message', rows: 2, placeholder: 'Optional note for the people you share with' },
    ],
  });
  const mode = form.getField('mode')!;
  const people = form.getField('people')!;
  const password = form.getField('password')!;
  const paint = () => {
    const link = mode.getValue() === 'link';
    link ? people.hide() : people.show();
    link ? password.show() : password.hide();
  };
  mode.on('change', paint);
  paint();

  const win: Window = create<Window>({
    type: 'window', title: 'Share', icon: 'users', width: 520, layout: 'fit', items: [form],
    buttons: [{ text: 'Cancel', handler: () => win.close() }, { text: 'Share', variant: 'primary', handler: () => form.submit() }],
  });
  form.on('before-submit', () => {
    if (mode.getValue() === 'people' && !String(people.getValue() ?? '').trim()) {
      people.setError('Add at least one person');
      people.focus();
      return false;
    }
    return undefined;
  });
  form.on('submit', (v: Record<string, any>) => {
    const link = v.mode === 'link';
    const who = link ? ['Anyone with the link'] : String(v.people).split(',').map((s) => s.trim()).filter(Boolean);
    for (const t of targets) {
      for (const w of who) shares.unshift({ id: shares.length + 1, item: t.name, kind: t.kind, with: w, permission: v.permission, link, expires: v.expires ?? '', created: '2026-11-08', views: 0, direction: 'by' });
      if (t.kind === 'photo') for (const p of photos) if (p.title === t.name) p.shared = true;
    }
    ctx.photosChanged();
    const url = `https://lumina.example/s/${Math.random().toString(36).slice(2, 8)}`;
    try { void navigator.clipboard?.writeText(url); } catch { /* ignore */ }
    toast({ type: 'success', title: link ? 'Link created' : `Shared with ${who.length} ${who.length === 1 ? 'person' : 'people'}`, text: link ? `${url} (copied)${v.password ? ' · password protected' : ''}` : `${what} · ${v.permission}` });
    win.close();
  });
  win.show();
}
