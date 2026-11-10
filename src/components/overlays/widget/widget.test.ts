import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Widget } from 'optikos';

const cleanup: Widget[] = [];
const mk = (cfg: object = {}) => {
  const w = create<Widget>({ type: 'widget', title: 'Assistant', items: [{ type: 'textfield', placeholder: 'ask' }], ...cfg } as any);
  cleanup.push(w);
  return w;
};
afterEach(() => {
  cleanup.splice(0).forEach((w) => w.destroy());
  document.body.innerHTML = '';
});
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const inLayer = (w: Widget) => !!w.el.closest('.op-layer');

describe('Widget', () => {
  it('floats in the layer by default (page not inert, no trap), opens on the right, shows with a transition class', async () => {
    const page = document.createElement('main');
    document.body.append(page);
    const w = mk();
    expect(inLayer(w)).toBe(false); // nothing happens until it is opened
    w.open();
    expect(inLayer(w)).toBe(true);
    expect(w.isOpen()).toBe(true);
    expect(w.el.classList.contains('op-widget--right')).toBe(true);
    expect(w.el.classList.contains('is-floating')).toBe(true);
    expect(w.el.getAttribute('role')).toBe('complementary');
    expect(page.hasAttribute('inert')).toBe(false);
    await frame();
    expect(w.el.classList.contains('is-open')).toBe(true);
  });

  it('side is configurable and settable; the class follows and `side-change` fires', () => {
    const w = mk({ side: 'bottom' });
    const changed = vi.fn();
    w.on('side-change', changed);
    w.open();
    expect(w.getSide()).toBe('bottom');
    expect(w.el.classList.contains('op-widget--bottom')).toBe(true);
    w.setSide('left');
    expect(w.el.classList.contains('op-widget--left')).toBe(true);
    expect(w.el.classList.contains('op-widget--bottom')).toBe(false);
    w.setSide('left'); // same: nothing
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith('left');
  });

  it('sideSwitcher: header buttons pick the side and mark the current one with aria-pressed', () => {
    const w = mk({ sideSwitcher: true, tools: [{ icon: 'info', label: 'About' }] });
    w.open();
    const btn = (s: string) => w.el.querySelector<HTMLElement>(`[data-side="${s}"]`)!;
    expect(['left', 'right', 'bottom'].map((s) => !!btn(s))).toEqual([true, true, true]);
    expect(btn('top')).toBeNull(); // not offered by default
    expect(btn('right').getAttribute('aria-pressed')).toBe('true');
    btn('left').click();
    expect(w.getSide()).toBe('left');
    expect(btn('left').getAttribute('aria-pressed')).toBe('true');
    expect(btn('right').getAttribute('aria-pressed')).toBe('false');
    expect(w.el.querySelector('[aria-label="About"]')).not.toBeNull(); // user tools are kept
  });

  it('close button and Esc (focus inside) hide it and return the focus; before-hide can cancel', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const w = mk();
    w.open();
    expect(w.el.contains(document.activeElement)).toBe(true); // autoFocus
    let allow = false;
    w.on('before-hide', () => allow);
    w.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(w.isOpen()).toBe(true);
    allow = true;
    (w.el.querySelector('.op-panel__tool[aria-label="Close"]') as HTMLElement).click();
    expect(w.isOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
    w.open();
    expect(w.isOpen()).toBe(true); // reusable
  });

  it('hides after the transition (hidden attribute), and reopening in time cancels that', async () => {
    vi.useFakeTimers();
    const w = mk();
    w.open();
    w.hide();
    expect(w.el.hidden).toBe(false);
    vi.advanceTimersByTime(300);
    expect(w.el.hidden).toBe(true);
    w.open();
    w.hide();
    w.open();
    vi.advanceTimersByTime(300);
    expect(w.el.hidden).toBe(false);
    vi.useRealTimers();
  });

  it('floating: false is an ordinary panel: stays where it is rendered, never goes to the layer', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const w = mk({ floating: false, hidden: false, renderTo: host });
    expect(host.contains(w.el)).toBe(true);
    expect(w.el.classList.contains('is-floating')).toBe(false);
    w.hide();
    expect(w.el.hidden).toBe(true);
    w.show();
    expect(inLayer(w)).toBe(false);
    expect(host.contains(w.el)).toBe(true);
  });

  it('setSize writes the token; setOpen toggles; destroy removes it from the layer', () => {
    const w = mk({ size: 400 });
    w.open();
    expect(w.el.style.getPropertyValue('--op-widget-size')).toBe('400px');
    w.setSize('30rem');
    expect(w.el.style.getPropertyValue('--op-widget-size')).toBe('30rem');
    w.setOpen();
    expect(w.isOpen()).toBe(false);
    w.setOpen(true);
    expect(w.isOpen()).toBe(true);
    w.destroy();
    expect(document.querySelector('.op-widget')).toBeNull();
  });
});

describe('Widget draggable', () => {
  const rect = (w: Widget) => {
    w.el.getBoundingClientRect = () => ({ left: 100, top: 50, width: 300, height: 400, right: 400, bottom: 450, x: 100, y: 50, toJSON() {} }) as DOMRect;
    Object.defineProperty(w.el, 'offsetWidth', { value: 300, configurable: true });
    Object.defineProperty(w.el, 'offsetHeight', { value: 400, configurable: true });
  };
  const ptr = (el: EventTarget, type: string, x: number, y: number) => el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 }));

  it('is fixed to its side unless draggable', () => {
    const w = mk();
    w.open();
    const head = w.el.querySelector('.op-panel__header') as HTMLElement;
    rect(w);
    ptr(head, 'pointerdown', 120, 60);
    ptr(document, 'pointermove', 300, 300);
    expect(w.getPosition()).toBeUndefined();
    expect(w.el.classList.contains('is-moved')).toBe(false);
  });

  it('dragging by the header moves it, pins its size, clamps to the viewport and emits `move`', () => {
    const w = mk({ draggable: true });
    const moved = vi.fn();
    w.on('move', moved);
    w.open();
    rect(w);
    const head = w.el.querySelector('.op-panel__header') as HTMLElement;
    expect(head.tabIndex).toBe(0);
    ptr(head, 'pointerdown', 120, 60); // grabbed 20px right, 10px below the corner
    ptr(document, 'pointermove', 320, 260);
    expect(w.getPosition()).toEqual({ x: 300, y: 250 });
    expect(w.el.classList.contains('is-moved')).toBe(true);
    expect(w.el.style.width).toBe('300px');
    expect(w.el.style.left).toBe('300px');
    ptr(document, 'pointermove', -500, -500); // out of the window: clamped
    expect(w.getPosition()).toEqual({ x: 0, y: 0 });
    ptr(document, 'pointerup', 0, 0);
    ptr(document, 'pointermove', 400, 400); // no longer following
    expect(w.getPosition()).toEqual({ x: 0, y: 0 });
    expect(moved).toHaveBeenCalled();
  });

  it('pressing a header tool does not start a drag; setSide docks it again', () => {
    const w = mk({ draggable: true, sideSwitcher: true });
    w.open();
    rect(w);
    ptr(w.el.querySelector('.op-panel__tool')!, 'pointerdown', 120, 60);
    ptr(document, 'pointermove', 300, 300);
    expect(w.getPosition()).toBeUndefined();
    const head = w.el.querySelector('.op-panel__header') as HTMLElement;
    ptr(head, 'pointerdown', 120, 60);
    ptr(document, 'pointermove', 200, 200);
    ptr(document, 'pointerup', 0, 0);
    expect(w.getPosition()).toBeDefined();
    w.setSide('left');
    expect(w.getPosition()).toBeUndefined();
    expect(w.el.classList.contains('is-moved')).toBe(false);
    expect(w.el.style.left).toBe('');
  });

  it('keyboard: Alt+arrows nudge it, Alt+Home returns it', () => {
    const w = mk({ draggable: true });
    w.open();
    rect(w);
    const head = w.el.querySelector('.op-panel__header') as HTMLElement;
    head.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
    expect(w.getPosition()).toEqual({ x: 116, y: 50 });
    head.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, shiftKey: true, bubbles: true, cancelable: true }));
    expect(w.getPosition()!.y).toBe(114);
    head.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', altKey: true, bubbles: true, cancelable: true }));
    expect(w.getPosition()).toBeUndefined();
  });
});

describe('Widget resizable', () => {
  const rect = (w: Widget, width = 300, height = 400) => {
    w.el.getBoundingClientRect = () => ({ left: 100, top: 50, width, height, right: 100 + width, bottom: 50 + height, x: 100, y: 50, toJSON() {} }) as DOMRect;
    Object.defineProperty(w.el, 'offsetWidth', { value: width, configurable: true });
    Object.defineProperty(w.el, 'offsetHeight', { value: height, configurable: true });
  };
  const grip = (w: Widget) => w.el.querySelector('.op-widget__resize') as HTMLElement;
  const key = (el: Element, k: string, shiftKey = false) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }));
  const ptr = (el: EventTarget, type: string, x: number, y: number) => el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 }));

  it('only when asked: a focusable splitter (role=separator) named "Resize"', () => {
    const plain = mk();
    plain.open();
    expect(grip(plain)).toBeNull();
    const w = mk({ resizable: true });
    w.open();
    expect(grip(w).getAttribute('role')).toBe('separator');
    expect(grip(w).tabIndex).toBe(0);
    expect(grip(w).getAttribute('aria-label')).toBe('Resize');
    w.setResizable(false);
    expect(grip(w)).toBeNull();
  });

  it('docked: the inner edge sets the size (pulling away from the edge grows it), never under the minimum; emits resize', () => {
    const w = mk({ resizable: true, side: 'right' });
    const resized = vi.fn();
    w.on('resize', resized);
    w.open();
    rect(w);
    expect(grip(w).getAttribute('aria-orientation')).toBe('vertical');
    ptr(grip(w), 'pointerdown', 100, 200);
    ptr(document, 'pointermove', 60, 200); // 40 px to the left, away from the right edge
    expect(w.el.style.getPropertyValue('--op-widget-size')).toBe('340px');
    expect(grip(w).getAttribute('aria-valuenow')).toBe('300'); // the size as laid out (the mocked rect)
    ptr(document, 'pointermove', 1000, 200);
    expect(w.el.style.getPropertyValue('--op-widget-size')).toBe('160px'); // the minimum
    ptr(document, 'pointerup', 0, 0);
    expect(resized).toHaveBeenCalled();
    w.setSide('bottom');
    expect(grip(w).getAttribute('aria-orientation')).toBe('horizontal');
    key(grip(w), 'ArrowUp', true); // bottom: up is away from the edge
    expect(w.el.style.getPropertyValue('--op-widget-size')).toBe('464px');
  });

  it('moved: a corner grip sets width and height', () => {
    const w = mk({ resizable: true, draggable: true });
    w.open();
    rect(w);
    const head = w.el.querySelector('.op-panel__header') as HTMLElement;
    head.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
    expect(w.el.classList.contains('is-moved')).toBe(true);
    key(grip(w), 'ArrowRight');
    key(grip(w), 'ArrowDown');
    expect(w.el.style.width).toBe('316px');
    expect(w.el.style.height).toBe('416px');
  });
});

