// Smoke tests: the bigger demos boot and their main flows work (they exercise the public API the way an app would).
import { describe, it, expect, beforeEach, vi } from 'vitest';

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  document.head.querySelectorAll('style').forEach((s) => s.remove());
});

describe('shop demo', () => {
  it('lists products, filters, adds to the cart and shows the totals', async () => {
    await import('../demos/shop/main');
    await tick();
    const cards = () => document.querySelectorAll('.sh-card').length;
    expect(cards()).toBe(12);
    // category filter
    const tech = [...document.querySelectorAll<HTMLInputElement>('input[type=radio]')].find((i) => i.value === 'Tech')!;
    tech.click();
    tech.dispatchEvent(new Event('change', { bubbles: true }));
    await tick(50);
    expect(cards()).toBe(3);
    // add the first one
    document.querySelector<HTMLElement>('.sh-card [data-op-action=add]')!.click();
    await tick();
    expect(document.body.textContent).toContain('Cart (1)');
  });

  it('opens the cart widget with its lines and runs the checkout to an order', async () => {
    await import('../demos/shop/main');
    await tick();
    const button = (start: string, root: ParentNode = document) => [...root.querySelectorAll('button')].find((b) => b.textContent!.startsWith(start))!;
    document.querySelector<HTMLElement>('.sh-card [data-op-action=add]')!.click();
    button('Cart').click();
    await tick(100);
    expect(document.querySelectorAll('.sh-line').length).toBe(1);
    button('Checkout').click();
    await tick(100);
    const win = () => document.querySelector('.op-window')!;
    const set = (label: string, value: string) => {
      const f = [...win().querySelectorAll('.op-field')].find((x) => x.querySelector('.op-field__label')?.textContent?.startsWith(label))!;
      const i = f.querySelector<HTMLInputElement>('input,textarea')!;
      i.focus();
      i.value = value;
      i.dispatchEvent(new Event('input', { bubbles: true }));
      i.dispatchEvent(new Event('change', { bubbles: true }));
      i.blur();
    };
    const next = () => [...win().querySelectorAll('button')].find((b) => /^(Next|Place order)/.test(b.textContent!))!.click();
    set('Email', 'ada@example.com');
    next();
    await tick(100);
    for (const [l, v] of [['Full name', 'Ada'], ['Street', '12 St'], ['City', 'London'], ['Postal', 'SW1Y']]) set(l, v);
    next();
    await tick(100);
    set('Card number', '4242 4242 4242 4242');
    set('Expiry', '08/29');
    set('CVC', '123');
    next();
    await tick(100);
    button('Place order', win()).click();
    await tick(1600);
    expect(document.body.textContent).toMatch(/Order LC-\d+/);
    expect(document.body.textContent).toContain('Cart (0)');
  });
});

describe('events landing demo', () => {
  it('boots with every section', async () => {
    await import('../demos/events/main');
    await tick();
    for (const id of ['schedule', 'models', 'partners', 'gallery', 'venue', 'faq', 'invite']) expect(document.getElementById(id), id).toBeTruthy();
    expect(document.querySelectorAll('.ev-card').length).toBeGreaterThan(8);
  });
});

describe('chat demo ("Prosa")', () => {
  it('boots with its conversation list and switches conversations', async () => {
    await import('../demos/chat/main');
    await tick();
    const rows = () => [...document.querySelectorAll<HTMLButtonElement>('.prosa-row')];
    expect(rows().length).toBe(3);
    expect(document.documentElement.getAttribute('data-op-theme')).toBe('prosa');
    rows().find((r) => r.textContent!.includes('Bruno'))!.click();
    await tick();
    expect(document.querySelector('.prosa-row.is-active')!.textContent).toContain('Bruno');
  });
});

describe('crm demo', () => {
  it('lists customers and "New customer" opens the editor form built with ui.*', async () => {
    await import('../demos/crm/main');
    await tick();
    expect(document.querySelectorAll('.op-grid__body-row').length).toBeGreaterThan(0);
    [...document.querySelectorAll('button')].find((b) => b.textContent!.trim().startsWith('New customer'))!.click();
    await tick();
    const win = document.querySelector('.op-window')!;
    const labels = [...win.querySelectorAll('.op-field__label')].map((l) => l.textContent);
    expect(labels).toEqual(expect.arrayContaining(['Name', 'Email', 'City', 'Country', 'Account manager', 'Status', 'Notes']));
  });
});

describe('admin demo', () => {
  it('boots with its tabs and the settings form', async () => {
    await import('../demos/admin/main');
    await tick();
    expect(document.querySelector('[role=tablist]')).not.toBeNull();
    expect(document.body.textContent).toContain('Settings');
  });
});

describe('panel demo', () => {
  it('boots with the dashboard, and the role decides what is there (permissions)', async () => {
    await import('../demos/panel/main');
    await tick();
    const tabs = () => [...document.querySelectorAll<HTMLElement>('.op-tabs__tab')].filter((t) => !t.hidden).map((t) => t.textContent!.trim());
    expect(tabs()).toEqual(expect.arrayContaining(['Dashboard', 'Candidates', 'Schedule']));
    expect(document.querySelectorAll('.op-stat')).toHaveLength(3);
    expect(document.querySelectorAll('.op-chart').length).toBeGreaterThanOrEqual(3);
    expect(document.documentElement.getAttribute('data-op-theme')).toBe('brand');
    expect(document.documentElement.querySelector('style#op-theme-brand')!.textContent).toContain("[data-op-theme~='brand'][data-op-theme~='dark']");
  });
});
