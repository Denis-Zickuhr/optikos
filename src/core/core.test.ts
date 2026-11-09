import { describe, it, expect, vi } from 'vitest';
import { Emitter, Component, type ComponentConfig, Container, Field, register, create, h, validators, virtualize, setLocale, t, addMessages, locales, roving, trapFocus } from './index';

class Box extends Component<ComponentConfig & { text?: string }> {
  protected override baseCls = 'op-box';
  protected override onRender() {
    this.el.textContent = this.config.text ?? '';
  }
  setText(s: string) {
    this.config.text = s;
    if (this.rendered) this.el.textContent = s;
  }
}
register('box', Box);

class Txt extends Field<string> {
  protected createControl() {
    const i = (this.inputEl = h('input'));
    this.listen(i, 'input', () => this.commit(i.value));
    return i;
  }
  protected applyValue(v: string) {
    (this.inputEl as HTMLInputElement).value = v;
  }
}
register('txt', Txt);
register('container', Container);

describe('Emitter', () => {
  it('on/off/once/emit and cancellation', () => {
    const e = new Emitter();
    const fn = vi.fn();
    const off = e.on('x', fn);
    e.once('x', fn);
    e.emit('x', 1);
    e.emit('x', 2);
    expect(fn).toHaveBeenCalledTimes(3);
    off();
    e.emit('x', 3);
    expect(fn).toHaveBeenCalledTimes(3);
    e.on('before', () => false);
    expect(e.emit('before')).toBe(false);
  });
});

describe('Component', () => {
  it('renders lazily, applies common config, mounts and destroys cleanly', () => {
    const c = create<Box>({ type: 'box', text: 'hi', cls: 'a b', width: 100, tooltip: 'tip', theme: { radius: '3px' }, hidden: true });
    expect(c.rendered).toBe(false);
    expect(c.el.textContent).toBe('hi');
    expect(c.el.className).toContain('op-box a b');
    expect(c.el.style.width).toBe('100px');
    expect(c.el.dataset.opTip).toBe('tip');
    expect(c.el.style.getPropertyValue('--op-box-radius')).toBe('3px');
    expect(c.el.hidden).toBe(true);
    const onMount = vi.fn();
    c.on('mount', onMount);
    c.mount(document.body);
    expect(onMount).toHaveBeenCalledOnce();
    const spy = vi.fn();
    c.listen(document, 'click', spy);
    c.destroy();
    document.dispatchEvent(new Event('click'));
    expect(spy).not.toHaveBeenCalled();
    expect(document.body.contains(c.el)).toBe(false);
  });

  it('setters update only the DOM that changed, before and after render', () => {
    const c = new Box({ text: 'a' });
    c.setText('b');
    expect(c.el.textContent).toBe('b');
    c.setDisabled(true);
    expect(c.el.classList.contains('is-disabled')).toBe(true);
    c.setLoading('Wait');
    expect(c.el.querySelector('.op-mask__text')?.textContent).toBe('Wait');
    expect(c.el.getAttribute('aria-busy')).toBe('true');
    c.setLoading(false);
    expect(c.el.querySelector('.op-mask')).toBeNull();
  });

  it('throws a helpful error for unknown types', () => {
    expect(() => create({ type: 'nope' })).toThrow(/unknown component type/);
  });
});

describe('Container and layouts', () => {
  it('builds children from config with defaults and shared layout classes', () => {
    const c = create<Container>({ type: 'container', layout: { type: 'hbox', gap: 8 }, defaults: { text: 'd' }, defaultType: 'box', items: [{}, { type: 'box', text: 'own' }] });
    expect(c.el.classList.contains('op-layout-hbox')).toBe(true);
    expect(c.el.style.getPropertyValue('--op-layout-gap')).toBe('8px');
    expect(Array.from(c.el.children).map((e) => e.textContent)).toEqual(['d', 'own']);
  });

  it('add/insert/remove keep DOM order; destroy cascades', () => {
    const c = new Container({ items: [{ type: 'box', text: '1' }, { type: 'box', text: '3' }] });
    c.el;
    const two = c.insert(1, { type: 'box', text: '2' });
    expect(c.el.textContent).toBe('123');
    c.remove(two);
    expect(c.el.textContent).toBe('13');
    expect(two.destroyed).toBe(true);
    const kids = [...c.items];
    c.destroy();
    expect(kids.every((k) => k.destroyed)).toBe(true);
  });

  it('mount reaches nested children', () => {
    const inner = new Box();
    const c = new Container({ items: [new Container({ items: [inner] })] });
    c.mount();
    expect(inner.mounted).toBe(true);
    c.destroy();
  });

  it('card layout shows one child at a time', () => {
    const c = new Container({ layout: 'card', activeItem: 1, items: [{ type: 'box' }, { type: 'box' }, { type: 'box' }] });
    c.el;
    expect(c.items.map((i) => i.el.hidden)).toEqual([true, false, true]);
    c.setActiveItem(2);
    expect(c.items.map((i) => i.el.hidden)).toEqual([true, true, false]);
    expect(c.getActiveItem()).toBe(c.items[2]);
  });

  it('border and grid layouts position items', () => {
    const b = new Container({ layout: 'border', items: [{ type: 'box', region: 'north' }, { type: 'box' }] });
    b.el;
    expect(b.items[0].el.style.gridArea).toBe('north');
    expect(b.items[1].el.style.gridArea).toBe('center');
    const g = new Container({ layout: { type: 'grid', columns: 3 }, items: [{ type: 'box', colspan: 2 }] });
    g.el;
    expect(g.items[0].el.style.gridColumn).toBe('span 2');
  });

  it('setDisabled cascades', () => {
    const c = new Container({ items: [{ type: 'box' }] });
    c.el;
    c.setDisabled(true);
    expect(c.items[0].el.classList.contains('is-disabled')).toBe(true);
  });
});

describe('Field', () => {
  it('tracks value, dirty, change events and reset', () => {
    const f = new Txt({ value: 'a', label: 'L' });
    const change = vi.fn();
    f.on('change', change);
    f.el;
    expect(f.el.querySelector('label')?.textContent).toBe('L');
    const input = f.el.querySelector('input')!;
    expect(input.value).toBe('a');
    input.value = 'b';
    input.dispatchEvent(new Event('input'));
    expect(f.getValue()).toBe('b');
    expect(f.isDirty()).toBe(true);
    expect(f.el.classList.contains('is-dirty')).toBe(true);
    expect(change).toHaveBeenCalledWith('b', 'a');
    f.reset();
    expect(input.value).toBe('a');
    expect(f.isDirty()).toBe(false);
    f.setValue('z', true);
    expect(change).toHaveBeenCalledTimes(1);
    f.markClean();
    expect(f.isDirty()).toBe(false);
  });

  it('validates required and validators with ARIA wiring', () => {
    const f = new Txt({ required: true, validators: [validators.minLength(3)] });
    f.el;
    const input = f.el.querySelector('input')!;
    const invalid = vi.fn();
    f.on('invalid', invalid);
    expect(f.validate()).toBe(false);
    expect(f.getError()).toBe('This field is required');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('-error');
    expect(f.el.classList.contains('is-invalid')).toBe(true);
    f.setValue('ab');
    expect(f.getError()).toBe('Enter at least 3 characters');
    f.setValue('abc');
    expect(f.getError()).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(invalid).toHaveBeenCalled();
  });

  it('label points at the input; readonly/required classes', () => {
    const f = new Txt({ label: 'Name', required: true });
    f.el;
    const label = f.el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(f.el.querySelector('input')!.id);
    expect(f.el.classList.contains('is-required')).toBe(true);
    f.setReadonly(true);
    expect(f.el.classList.contains('is-readonly')).toBe(true);
  });

  it('validates on blur', () => {
    const f = new Txt({ required: true });
    f.mount();
    f.el.querySelector('input')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(f.getError()).not.toBe('');
    f.destroy();
  });
});

describe('custom Field without a native control', () => {
  it('setValue repaints through applyValue and emits change once (commit would not repaint)', () => {
    class Stars extends Field<number> {
      painted = 0;
      protected override emptyValue() { return 0; }
      protected createControl() {
        const b = (this.inputEl = h('button', 'star'));
        this.listen(b, 'click', () => this.setValue(this.value + 1));
        return b;
      }
      protected applyValue(v: number) { this.painted = v; this.inputEl.classList.toggle('is-on', v > 0); }
    }
    const f = new Stars({});
    const change = vi.fn();
    f.on('change', change);
    (f.el.querySelector('.star') as HTMLElement).click();
    expect(f.painted).toBe(1);
    expect(f.el.querySelector('.star')!.classList.contains('is-on')).toBe(true);
    expect(change).toHaveBeenCalledTimes(1);
  });
});

describe('i18n', () => {
  it('switches locale and interpolates', () => {
    setLocale('pt-BR');
    expect(t('minLength', { n: 2 })).toBe('Informe ao menos 2 caracteres');
    setLocale('en');
    expect(t('minLength', { n: 2 })).toBe('Enter at least 2 characters');
  });
});

describe('addMessages', () => {
  it('adds keys to a locale (creating it), keeps what the app already set, and t() falls back to English', () => {
    addMessages('en', { xGreet: 'Hello {name}' });
    addMessages('pt-BR', { xGreet: 'Olá {name}' });
    setLocale('pt-BR');
    expect(t('xGreet', { name: 'Ana' })).toBe('Olá Ana');
    addMessages('pt-BR', { xGreet: 'ignored' });
    expect(t('xGreet', { name: 'Ana' })).toBe('Olá Ana');
    addMessages('de', { xGreet: 'Hallo {name}' });
    expect(locales.de._lang).toBe('de');
    setLocale('de');
    expect(t('xGreet', { name: 'Ana' })).toBe('Hallo Ana');
    expect(t('required')).toBe('This field is required');
    setLocale('en');
  });
});

describe('virtualize', () => {
  it('keeps the DOM small and recycles rows on scroll', () => {
    const scroller = h('div');
    document.body.append(scroller);
    const render = vi.fn((row: HTMLElement, i: number) => (row.textContent = String(i)));
    const v = virtualize({ scroller, count: 100000, rowHeight: 30, render });
    expect(v.rows.length).toBeLessThan(40);
    expect(v.spacer.style.height).toBe('3000000px');
    expect(v.rows.every((r) => r.style.position === 'absolute')).toBe(true);
    expect(v.rows.map((r) => r.textContent)).toContain('0');
    scroller.scrollTop = 30 * 5000;
    scroller.dispatchEvent(new Event('scroll'));
    const shown = v.rows.map((r) => Number(r.textContent));
    expect(Math.min(...shown)).toBeGreaterThan(4900);
    expect(v.rows.length).toBeLessThan(40);
    v.destroy();
    scroller.remove();
  });
});

describe('focus helpers', () => {
  it('roving moves the tab stop with arrows', () => {
    const c = h('div', '', {}, h('button', 'i'), h('button', 'i'), h('button', 'i'));
    document.body.append(c);
    const r = roving(c, { selector: '.i' });
    const [a, b, d] = Array.from(c.querySelectorAll<HTMLElement>('.i'));
    expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(b);
    expect(b.tabIndex).toBe(0);
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(d);
    r.destroy();
    c.remove();
  });

  it('trapFocus wraps Tab', () => {
    const c = h('div', '', {}, h('button'), h('button'));
    document.body.append(c);
    const release = trapFocus(c);
    const [a, b] = Array.from(c.querySelectorAll('button'));
    b.focus();
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(a);
    release();
    c.remove();
  });
});
