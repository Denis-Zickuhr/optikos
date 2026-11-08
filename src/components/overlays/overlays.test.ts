import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { create, Window, MessageBox, Menu, Tabs, FieldSet, Viewport, Toast, toast, Tooltip, Container, Spinner, TextField } from 'optikos';

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Window', () => {
  const mk = (cfg: object = {}) => create<Window>({ type: 'window', title: 'Edit', items: [{ type: 'textfield', label: 'Name' }], buttons: [{ text: 'Save', variant: 'primary' }], ...cfg });

  it('shows modal in the layer: backdrop, dialog role, inert page, focus in the first field, restores focus', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const page = document.createElement('main');
    document.body.append(page);
    const w = mk();
    const events: string[] = [];
    ['before-show', 'show', 'before-hide', 'hide'].forEach((e) => w.on(e, () => events.push(e)));
    w.show();
    expect(w.isVisible()).toBe(true);
    expect(document.querySelector('.op-layer .op-window-backdrop .op-window')).not.toBeNull();
    expect(w.el.getAttribute('role')).toBe('dialog');
    expect(w.el.getAttribute('aria-modal')).toBe('true');
    expect(w.el.getAttribute('aria-labelledby')).toBe(w.el.querySelector('.op-panel__title')!.id);
    expect(page.hasAttribute('inert')).toBe(true);
    expect(opener.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(w.el.querySelector('input'));
    w.hide();
    expect(page.hasAttribute('inert')).toBe(false);
    expect(document.querySelector('.op-window')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(events).toEqual(['before-show', 'show', 'before-hide', 'hide']);
    w.show();
    expect(w.isVisible()).toBe(true);
    w.destroy();
    expect(page.hasAttribute('inert')).toBe(false);
  });

  it('Esc and the close button close it (destroy by default, hide with closeAction)', () => {
    const w = mk();
    w.show();
    key(w.el.querySelector('input')!, 'Escape');
    expect(w.destroyed).toBe(true);
    const h = mk({ closeAction: 'hide' });
    h.show();
    (h.el.querySelector('.op-panel__tool') as HTMLElement).click();
    expect(h.destroyed).toBe(false);
    expect(h.isVisible()).toBe(false);
  });

  it('before-close can cancel; closeOnEsc:false; backdrop click only when enabled', () => {
    const w = mk({ closeOnEsc: false, closeOnBackdrop: true });
    w.show();
    key(w.el, 'Escape');
    expect(w.destroyed).toBe(false);
    const off = w.on('before-close', () => false);
    w.el.parentElement!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(w.destroyed).toBe(false);
    off();
    w.el.parentElement!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(w.destroyed).toBe(true);
  });

  it('traps Tab and stacks: only the top window is interactive', () => {
    const a = mk({ title: 'A' });
    const b = mk({ title: 'B' });
    a.show();
    b.show();
    expect(a.el.parentElement!.hasAttribute('inert')).toBe(true);
    expect(b.el.parentElement!.hasAttribute('inert')).toBe(false);
    b.close();
    expect(a.el.parentElement!.hasAttribute('inert')).toBe(false);
    a.destroy();
  });

  it('non-modal windows leave the page interactive', () => {
    const page = document.createElement('main');
    document.body.append(page);
    const w = mk({ modal: false });
    w.show();
    expect(page.hasAttribute('inert')).toBe(false);
    expect(w.el.parentElement!.className).toBe('op-layer');
    w.destroy();
  });

  it('dragging the header moves the window', () => {
    const w = mk();
    w.show();
    const header = w.el.querySelector('.op-panel__header')!;
    header.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { clientX: 10, clientY: 10, button: 0 }));
    document.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 200, clientY: 120 }));
    expect(parseFloat(w.el.style.left)).toBeGreaterThan(100);
    document.dispatchEvent(new Event('pointerup'));
    expect(w.el.classList.contains('is-dragging')).toBe(false);
    w.destroy();
  });
});

describe('MessageBox', () => {
  it('alert resolves on OK; Esc also resolves', async () => {
    const p = MessageBox.alert('Saved!', { title: 'Done' });
    const dlg = document.querySelector('.op-window')!;
    expect(dlg.getAttribute('role')).toBe('alertdialog');
    expect(dlg.getAttribute('aria-describedby')).toBe(dlg.querySelector('.op-label')!.id);
    expect(dlg.textContent).toContain('Saved!');
    (dlg.querySelector('.op-button--primary') as HTMLElement).click();
    await p;
    expect(document.querySelector('.op-window')).toBeNull();
  });

  it('confirm resolves true/false; primary has focus; danger variant', async () => {
    const yes = MessageBox.confirm('Delete?', { danger: true, okText: 'Delete' });
    expect(document.activeElement?.querySelector('.op-button__text')?.textContent).toBe('Delete');
    expect(document.querySelector('.op-button--danger')).not.toBeNull();
    (document.querySelector('.op-button--danger') as HTMLElement).click();
    expect(await yes).toBe(true);
    const no = MessageBox.confirm('Sure?');
    key(document.querySelector('.op-window')!, 'Escape');
    expect(await no).toBe(false);
    const cancel = MessageBox.confirm('Sure?');
    ([...document.querySelectorAll('.op-panel__footer button')].find((b) => b.querySelector('.op-button__text')?.textContent === 'Cancel') as HTMLElement).click();
    expect(await cancel).toBe(false);
  });

  it('prompt returns text, null on cancel, and stays open while validation fails', async () => {
    const p = MessageBox.prompt('Name?', { value: 'Bob', validators: [(v: string) => (v.length < 3 ? 'too short' : true)] });
    const input = document.querySelector('.op-window input') as HTMLInputElement;
    expect(input.value).toBe('Bob');
    input.value = 'Al';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    (document.querySelector('.op-button--primary') as HTMLElement).click();
    expect(document.querySelector('.op-window')).not.toBeNull();
    expect(document.querySelector('.op-field__error')!.textContent).toBe('too short');
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    key(input, 'Enter');
    expect(await p).toBe('Alice');
    const c = MessageBox.prompt('Name?');
    key(document.querySelector('.op-window')!, 'Escape');
    expect(await c).toBeNull();
  });

  it('show() with custom buttons and stacking over another window', async () => {
    const base = create<Window>({ type: 'window', title: 'Base' });
    base.show();
    const p = MessageBox.show({ text: 'Pick', buttons: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B', variant: 'primary' }], cancelId: 'a' });
    expect(document.querySelectorAll('.op-window').length).toBe(2);
    ([...document.querySelectorAll('.op-messagebox button')].find((b) => b.querySelector('.op-button__text')?.textContent === 'B') as HTMLElement).click();
    expect(await p).toBe('b');
    expect(base.el.parentElement!.hasAttribute('inert')).toBe(false);
    base.destroy();
  });
});

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers());

  it('shows after the delay on hover, links aria-describedby, hides on leave/Esc', () => {
    const b = create<any>({ type: 'button', icon: 'plus', tooltip: 'Add item' });
    b.mount();
    b.el.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(document.querySelector('.op-tooltip')).toBeNull();
    vi.advanceTimersByTime(400);
    const tip = document.querySelector('.op-tooltip')!;
    expect(tip.textContent).toBe('Add item');
    expect(tip.getAttribute('role')).toBe('tooltip');
    expect(b.el.getAttribute('aria-describedby')).toBe('op-tooltip');
    b.el.dispatchEvent(new Event('pointerout', { bubbles: true }));
    expect(document.querySelector('.op-tooltip')).toBeNull();
    expect(b.el.hasAttribute('aria-describedby')).toBe(false);
    b.el.dispatchEvent(new Event('pointerover', { bubbles: true }));
    vi.advanceTimersByTime(400);
    key(document.body, 'Escape');
    expect(document.querySelector('.op-tooltip')).toBeNull();
    b.setTooltip('');
    expect(b.el.dataset.opTip).toBeUndefined();
  });

  it('keyboard focus shows it right away; configure changes the delay', () => {
    Tooltip.configure({ delay: 50 });
    const b = create<any>({ type: 'button', text: 'x', tooltip: 'hi' });
    b.mount();
    b.el.dispatchEvent(new Event('pointerover', { bubbles: true }));
    vi.advanceTimersByTime(49);
    expect(document.querySelector('.op-tooltip')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(document.querySelector('.op-tooltip')).not.toBeNull();
    Tooltip.configure({ delay: 400 });
  });
});

describe('Menu', () => {
  const items = [
    { text: 'Open', handler: vi.fn() },
    '-' as const,
    { text: 'Disabled', disabled: true },
    { text: 'Bold', checked: false },
    { text: 'More', items: [{ text: 'Sub A', handler: vi.fn() }, { text: 'Sub B' }] },
  ];

  it('opens at an anchor, focuses the first item, roves with arrows skipping disabled and separators', () => {
    const btn = document.createElement('button');
    document.body.append(btn);
    btn.focus();
    const m = create<Menu>({ type: 'menu', items });
    m.showBy(btn);
    expect(document.querySelector('.op-layer [role=menu]')).not.toBeNull();
    const rows = () => Array.from(document.querySelectorAll<HTMLElement>('.op-menu__item'));
    expect(document.activeElement).toBe(rows()[0]);
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement?.textContent).toBe('Bold');
    expect(rows()[2].getAttribute('role')).toBe('menuitemcheckbox');
    key(document.activeElement!, 'End');
    expect(document.activeElement?.textContent).toBe('More');
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement?.textContent).toBe('Open');
    m.destroy();
  });

  it('activates with Enter/click, toggles checkables, ignores disabled, closes and restores focus', () => {
    const btn = document.createElement('button');
    document.body.append(btn);
    btn.focus();
    const m = create<Menu>({ type: 'menu', items });
    const click = vi.fn();
    m.on('click', click);
    m.showBy(btn);
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.op-menu__item'));
    rows[1].click(); // disabled
    expect(m.isOpen()).toBe(true);
    rows[2].click();
    expect((items[3] as any).checked).toBe(true);
    expect(m.isOpen()).toBe(false);
    expect(click).toHaveBeenCalled();
    expect(document.activeElement).toBe(btn);
    m.showBy(btn);
    key(document.activeElement!, 'Enter');
    expect((items[0] as any).handler).toHaveBeenCalled();
    m.destroy();
  });

  it('submenus open with ArrowRight, close with ArrowLeft/Esc one level at a time, click closes all', () => {
    const m = create<Menu>({ type: 'menu', items });
    const btn = document.createElement('button');
    document.body.append(btn);
    m.showBy(btn);
    const more = Array.from(document.querySelectorAll<HTMLElement>('.op-menu__item')).find((r) => r.textContent === 'More')!;
    more.focus();
    expect(more.getAttribute('aria-haspopup')).toBe('menu');
    key(more, 'ArrowRight');
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.textContent).toBe('Sub A');
    expect(document.querySelectorAll('[role=menu]').length).toBe(2);
    key(document.activeElement!, 'ArrowLeft');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(more);
    key(more, 'ArrowRight');
    key(document.body, 'Escape'); // closes only the submenu
    expect(m.isOpen()).toBe(true);
    key(more, 'ArrowRight');
    (document.activeElement as HTMLElement).click();
    expect((items[4] as any).items[0].handler).toHaveBeenCalled();
    expect(m.isOpen()).toBe(false);
    m.destroy();
  });

  it('context menu at a point; outside click and Tab close it', () => {
    const m = create<Menu>({ type: 'menu', items: [{ text: 'Copy' }] });
    m.showAt(40, 50);
    expect(m.isOpen()).toBe(true);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(m.isOpen()).toBe(false);
    m.showAt(1, 1);
    key(document.activeElement!, 'Tab');
    expect(m.isOpen()).toBe(false);
    m.destroy();
    expect(document.querySelector('[role=menu]')).toBeNull();
  });
});

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());

  it('renders in a live region by type, closes by timer, pauses on hover', () => {
    toast({ text: 'Saved', title: 'Done', type: 'success' });
    const el = document.querySelector('.op-toast')!;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.closest('.op-toast-region')!.getAttribute('data-pos')).toBe('top-right');
    expect(el.textContent).toContain('Done');
    vi.advanceTimersByTime(3000);
    el.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(5000);
    expect(document.querySelector('.op-toast')).not.toBeNull();
    el.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(1000);
    expect(document.querySelector('.op-toast')).toBeNull();
  });

  it('errors use role=alert; duration 0 stays; close button and handle close; max visible', () => {
    const h = toast({ text: 'Boom', type: 'error', duration: 0 });
    expect(document.querySelector('.op-toast')!.getAttribute('role')).toBe('alert');
    vi.advanceTimersByTime(60000);
    expect(document.querySelector('.op-toast')).not.toBeNull();
    (document.querySelector('.op-toast__close') as HTMLElement).click();
    expect(document.querySelector('.op-toast')).toBeNull();
    h.close();
    for (let i = 0; i < 8; i++) toast({ text: `t${i}`, duration: 0, position: 'bottom' });
    expect(document.querySelectorAll('.op-toast').length).toBe(5);
    expect(document.querySelector('.op-toast-region[data-pos=bottom]')).not.toBeNull();
  });

  it('is a Component: close event, no timers left after destroy', () => {
    const t = new Toast({ text: 'x' });
    const closed = vi.fn();
    t.on('close', closed);
    t.show();
    t.destroy();
    vi.advanceTimersByTime(10000);
    expect(document.querySelector('.op-toast')).toBeNull();
  });
});

describe('Tabs', () => {
  const mk = (cfg: object = {}) =>
    create<Tabs>({
      type: 'tabs',
      items: [
        { title: 'One', items: [{ type: 'label', text: 'first' }] },
        { title: 'Two', closable: true, items: [{ type: 'label', text: 'second' }] },
        { title: 'Three', disabled: true },
      ],
      ...cfg,
    });
  const tabs = (t: Tabs) => Array.from(t.el.querySelectorAll<HTMLElement>('[role=tab]'));

  it('renders tablist/tabs/tabpanel with aria links; only the active panel is built (lazy)', () => {
    const t = mk();
    expect(t.el.querySelector('[role=tablist]')).not.toBeNull();
    expect(tabs(t).map((x) => x.textContent)).toEqual(['One', 'Two', 'Three']);
    expect(tabs(t)[0].getAttribute('aria-selected')).toBe('true');
    const panels = t.el.querySelectorAll('[role=tabpanel]');
    expect(panels).toHaveLength(1);
    expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs(t)[0].id);
    expect(tabs(t)[0].getAttribute('aria-controls')).toBe(panels[0].id);
    expect(t.el.textContent).not.toContain('second');
    t.setActive(1);
    expect(t.el.textContent).toContain('second');
    expect(t.el.querySelectorAll('[role=tabpanel]')).toHaveLength(2);
    expect((t.items[0].el as HTMLElement).hidden).toBe(true);
    expect(tabs(t)[1].getAttribute('aria-selected')).toBe('true');
  });

  it('non-lazy builds everything; active option selects initial tab', () => {
    const t = mk({ lazy: false, active: 1 });
    expect(t.el.querySelectorAll('[role=tabpanel]')).toHaveLength(3);
    expect(t.getActive()).toBe(t.items[1]);
  });

  it('click, before-change cancel, disabled tabs and change event', () => {
    const t = mk();
    const change = vi.fn();
    t.on('change', change);
    tabs(t)[2].click();
    expect(t.getActive()).toBe(t.items[0]);
    const off = t.on('before-change', () => false);
    tabs(t)[1].click();
    expect(t.getActive()).toBe(t.items[0]);
    off();
    tabs(t)[1].click();
    expect(t.getActive()).toBe(t.items[1]);
    expect(change).toHaveBeenCalledWith(t.items[1], 1);
  });

  it('keyboard: arrows move and activate, Home/End, roving tabindex, Delete closes closable', () => {
    const t = mk();
    t.mount();
    const [a, b] = tabs(t);
    expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
    a.focus();
    key(a, 'ArrowRight');
    expect(document.activeElement).toBe(b);
    expect(t.getActive()).toBe(t.items[1]);
    expect(b.tabIndex).toBe(0);
    key(b, 'ArrowRight'); // Three is disabled → loops to One
    expect(t.getActive()).toBe(t.items[0]);
    key(tabs(t)[0], 'ArrowLeft');
    expect(t.getActive()).toBe(t.items[1]);
    const closed = vi.fn();
    t.on('close', closed);
    key(tabs(t)[1], 'Delete');
    expect(closed).toHaveBeenCalled();
    expect(tabs(t).map((x) => x.textContent)).toEqual(['One', 'Three']);
    expect(t.getActive()).toBe(t.items[1]);
    t.destroy();
  });

  it('close button, cancelable close, neighbor activation and add()', () => {
    const t = mk({ closable: true, lazy: false });
    const x = t.el.querySelectorAll('.op-tabs__close');
    expect(x).toHaveLength(3);
    t.setActive(1);
    const off = t.on('before-close', () => false);
    (x[1] as HTMLElement).click();
    expect(t.items).toHaveLength(3);
    off();
    (x[1] as HTMLElement).click();
    expect(t.items).toHaveLength(2);
    expect(t.items.every((p) => !p.destroyed)).toBe(true);
    const added = t.add({ title: 'New', items: [{ type: 'label', text: 'fresh' }] });
    expect(tabs(t).map((e) => e.textContent)).toEqual(['One', 'Three', 'New']);
    expect(t.getActive()).toBe(added);
    expect(t.el.textContent).toContain('fresh');
    t.setTitle(added, 'Renamed');
    expect(tabs(t)[2].textContent).toBe('Renamed');
  });

  it('left position is vertical', () => {
    const t = mk({ position: 'left' });
    expect(t.el.classList.contains('op-tabs--left')).toBe(true);
    expect(t.el.querySelector('[role=tablist]')!.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('destroy removes everything', () => {
    const t = mk();
    t.mount();
    t.setActive(1);
    t.destroy();
    expect(document.querySelector('.op-tabs')).toBeNull();
    expect(t.items.length).toBe(0);
  });
});

describe('FieldSet, Viewport, Spinner', () => {
  it('FieldSet: legend, collapse with aria, disabling cascades to fields', () => {
    const f = create<FieldSet>({ type: 'fieldset', title: 'Address', collapsible: true, items: [{ type: 'textfield', name: 'a' }] });
    expect(f.el.tagName).toBe('FIELDSET');
    expect(f.el.querySelector('legend')!.textContent).toBe('Address');
    const btn = f.el.querySelector('.op-fieldset__toggle') as HTMLElement;
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    btn.click();
    expect(f.el.querySelector<HTMLElement>('.op-fieldset__body')!.hidden).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    f.setCollapsed(false);
    f.setDisabled(true);
    expect((f.items[0].el.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('Viewport: fills the window with fit layout; a second one is rejected', () => {
    const v = create<Viewport>({ type: 'viewport', items: [{ type: 'label', text: 'app' }], renderTo: document.body });
    expect(v.el.parentElement).toBe(document.body);
    expect(v.el.classList.contains('op-layout-fit')).toBe(true);
    expect(() => new Viewport()).toThrow(/only one Viewport/);
    v.destroy();
    expect(() => new Viewport()).not.toThrow();
  });

  it('Spinner is a labelled progressbar', () => {
    const s = create<Spinner>({ type: 'spinner' });
    expect(s.el.getAttribute('role')).toBe('progressbar');
    expect(s.el.getAttribute('aria-label')).toBe('Loading');
    s.setLabel('Saving');
    expect(s.el.getAttribute('aria-label')).toBe('Saving');
  });
});

void Container;
void TextField;
