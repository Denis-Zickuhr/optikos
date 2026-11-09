import { describe, it, expect } from 'vitest';
import { create, Badge } from 'optikos';

describe('Badge', () => {
  it('shows text, tone, dot and icon, and updates through setters', () => {
    const b = create<Badge>({ type: 'badge', text: 'Paid', tone: 'success', dot: true, renderTo: document.body } as never);
    expect(b.el.tagName).toBe('SPAN');
    expect(b.el.textContent).toBe('Paid');
    expect(b.el.classList.contains('op-badge--success')).toBe(true);
    expect(b.el.querySelector('.op-badge__dot')!.getAttribute('aria-hidden')).toBe('true');
    b.setTone('danger');
    b.setText(3);
    expect(b.el.classList.contains('op-badge--success')).toBe(false);
    expect(b.el.classList.contains('op-badge--danger')).toBe(true);
    expect(b.el.textContent).toBe('3');
    b.destroy();
  });
});
