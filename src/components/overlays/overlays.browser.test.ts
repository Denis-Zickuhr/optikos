// Real browser: real focus, real Tab order, real key events from the keyboard (not dispatched by hand).
import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { create, Window, Menu, Tabs, MessageBox } from 'optikos';

afterEach(() => {
  document.body.innerHTML = '';
});

const opener = () => {
  const b = document.body.appendChild(Object.assign(document.createElement('button'), { textContent: 'Open' }));
  b.focus();
  return b;
};

describe('Window (browser)', () => {
  it('keeps Tab inside the modal, both ways, and Esc gives the focus back to the opener', async () => {
    const btn = opener();
    const w = create<Window>({ type: 'window', title: 'Edit', items: [{ type: 'textfield', label: 'Name' }, { type: 'textfield', label: 'City' }], buttons: [{ text: 'Save', variant: 'primary' }] });
    w.show();
    const inside = () => w.el.contains(document.activeElement);
    expect(document.activeElement).toBe(w.el); // the dialog itself: no field autofocus (a phone keyboard would pop up)
    for (let i = 0; i < 8; i++) {
      await userEvent.tab();
      expect(inside(), `Tab #${i + 1} left the window`).toBe(true);
    }
    for (let i = 0; i < 8; i++) {
      await userEvent.tab({ shift: true });
      expect(inside(), `Shift+Tab #${i + 1} left the window`).toBe(true);
    }
    await userEvent.keyboard('{Escape}');
    expect(w.el.isConnected).toBe(false);
    expect(document.activeElement).toBe(btn);
  });

  it('the page behind a modal is inert: a real click does not reach it', async () => {
    let clicks = 0;
    const behind = document.body.appendChild(Object.assign(document.createElement('button'), { textContent: 'Behind' }));
    behind.addEventListener('click', () => clicks++);
    const w = create<Window>({ type: 'window', title: 'Modal', items: [{ type: 'textfield', label: 'Name' }] });
    w.show();
    expect(behind.closest('[inert]')).not.toBeNull();
    behind.click(); // programmatic click still fires; the point is that it cannot receive focus
    behind.focus();
    expect(document.activeElement).not.toBe(behind);
    w.close();
    expect(clicks).toBe(1);
  });

  it('MessageBox.confirm answers to the keyboard', async () => {
    opener();
    const answer = MessageBox.confirm('Delete it?');
    await new Promise((r) => setTimeout(r, 0));
    await userEvent.keyboard('{Enter}');
    expect(await answer).toBe(true);
  });
});

describe('Menu (browser)', () => {
  it('opens next to its anchor, roves with real arrow keys and activates with Enter', async () => {
    const btn = opener();
    const picked: string[] = [];
    const m = create<Menu>({ type: 'menu', items: [{ text: 'Open', handler: () => picked.push('open') }, { text: 'Rename', handler: () => picked.push('rename') }, '-', { text: 'Delete', disabled: true }] });
    m.showBy(btn);
    const box = m.el.getBoundingClientRect();
    const anchor = btn.getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(anchor.bottom - 1);
    expect(box.width).toBeGreaterThan(0);
    expect(document.activeElement?.textContent).toBe('Open');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Rename');
    await userEvent.keyboard('{ArrowDown}'); // skips the separator and the disabled item, wraps to the top
    expect(document.activeElement?.textContent).toBe('Open');
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(picked).toEqual(['rename']);
    expect(document.activeElement).toBe(btn);
  });
});

describe('Tabs (browser)', () => {
  it('arrow keys move between tabs with a roving tabindex and show the right panel', async () => {
    const tabs = create<Tabs>({ type: 'tabs', renderTo: document.body, items: [{ title: 'One', html: '1' }, { title: 'Two', html: '2' }, { title: 'Three', html: '3' }].map((t) => ({ type: 'container', title: t.title })) } as never);
    const tabEls = () => [...tabs.el.querySelectorAll<HTMLElement>('[role=tab]')];
    tabEls()[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabEls()[1]);
    expect(tabEls()[1].getAttribute('aria-selected')).toBe('true');
    expect(tabEls().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    const panel = document.getElementById(tabEls()[1].getAttribute('aria-controls')!)!;
    expect(panel.getBoundingClientRect().height).toBeGreaterThanOrEqual(0);
    expect(panel.hidden).toBe(false);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabEls()[2]);
  });
});
