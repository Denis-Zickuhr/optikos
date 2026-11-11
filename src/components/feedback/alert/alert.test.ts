import { describe, it, expect, afterEach } from 'vitest';
import { create, Alert } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));

describe('Alert', () => {
  it('danger and warning are role=alert, the rest status; the icon follows the tone', () => {
    const a = create<Alert>({ type: 'alert', tone: 'danger', title: 'Sign-in failed', text: 'Wrong password', renderTo: document.body });
    expect(a.el.getAttribute('role')).toBe('alert');
    expect(a.el.classList.contains('op-alert--danger')).toBe(true);
    expect(a.el.querySelector('.op-alert__title')!.textContent).toBe('Sign-in failed');
    expect(a.el.querySelector('.op-alert__icon svg')).toBeTruthy();
    a.setTone('info');
    expect(a.el.getAttribute('role')).toBe('status');
    expect(create<Alert>({ type: 'alert', role: 'note', renderTo: document.body }).el.getAttribute('role')).toBe('note');
  });

  it('title and text hide when empty; the icon can be left out', () => {
    const a = create<Alert>({ type: 'alert', text: 'No events ahead', icon: false, renderTo: document.body });
    expect((a.el.querySelector('.op-alert__title') as HTMLElement).hidden).toBe(true);
    expect((a.el.querySelector('.op-alert__icon') as HTMLElement).hidden).toBe(true);
    a.setText('');
    expect((a.el.querySelector('.op-alert__text') as HTMLElement).hidden).toBe(true);
  });

  it('closable: the button hides it and fires close', () => {
    const a = create<Alert>({ type: 'alert', text: 'x', closable: true, renderTo: document.body });
    let closed = 0;
    a.on('close', () => closed++);
    a.el.querySelector<HTMLElement>('.op-alert__close')!.click();
    expect(a.el.hidden).toBe(true);
    expect(closed).toBe(1);
  });
});
