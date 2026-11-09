import { describe, it, expect, vi } from 'vitest';
import { create, Chip } from 'optikos';

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('Chip', () => {
  it('selectable: a toggle button with aria-pressed and a change event', () => {
    const c = create<Chip>({ type: 'chip', text: 'Open', selectable: true, renderTo: document.body } as never);
    const main = c.el.querySelector('button')!;
    const change = vi.fn();
    c.on('change', change);
    expect(main.getAttribute('aria-pressed')).toBe('false');
    main.click();
    expect(c.isSelected()).toBe(true);
    expect(main.getAttribute('aria-pressed')).toBe('true');
    expect(c.el.classList.contains('is-selected')).toBe(true);
    expect(change).toHaveBeenCalledWith(true);
    c.destroy();
  });

  it('removable: a named × button and Delete fire remove; disabled blocks everything', () => {
    const c = create<Chip>({ type: 'chip', text: 'Lisbon', removable: true, renderTo: document.body } as never);
    const remove = vi.fn();
    c.on('remove', remove);
    const x = c.el.querySelector<HTMLButtonElement>('.op-chip__remove')!;
    expect(x.getAttribute('aria-label')).toBe('Remove Lisbon');
    x.click();
    key(c.el.querySelector('.op-chip__main')!, 'Delete');
    expect(remove).toHaveBeenCalledTimes(2);
    c.setDisabled(true);
    x.click();
    expect(remove).toHaveBeenCalledTimes(2);
    expect(x.disabled).toBe(true);
    c.destroy();
  });

  it('a plain chip runs its handler; focus() goes to the button', () => {
    const handler = vi.fn();
    const c = create<Chip>({ type: 'chip', text: 'Ada', icon: 'user', handler, renderTo: document.body } as never);
    c.el.querySelector('button')!.click();
    expect(handler).toHaveBeenCalledWith(c);
    expect(c.el.querySelector('button')!.hasAttribute('aria-pressed')).toBe(false);
    c.focus();
    expect(document.activeElement).toBe(c.el.querySelector('button'));
    c.destroy();
  });
});
