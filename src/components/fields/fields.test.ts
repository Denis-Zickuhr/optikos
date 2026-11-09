import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { create, Select, ComboBox, SuggestField, ListBox, Dropdown, Store } from 'optikos';

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const type = (f: any, text: string) => {
  f.getInput().value = text;
  f.getInput().dispatchEvent(new Event('input', { bubbles: true }));
};
const opts = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' }, { value: 'c', label: 'Cherry', disabled: true }, { value: 'd', label: 'Date' }];
const cleanup: Array<{ destroy(): void }> = [];
const mk = <T,>(cfg: object): T => {
  const c = create(cfg as any) as any;
  c.mount();
  cleanup.push(c);
  return c;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});

describe('field root classes', () => {
  it('keep the component class so its tokens apply', () => {
    for (const [type, cls] of [['textfield', 'op-textfield'], ['combobox', 'op-combobox'], ['select', 'op-select'], ['suggestfield', 'op-suggest']]) {
      const f = mk<any>({ type });
      expect(f.el.classList.contains(cls), type).toBe(true);
      expect(f.el.classList.contains('op-field'), type).toBe(true);
    }
  });
});

describe('stableSize on fields', () => {
  it('is on by default and can be turned off; the error line exists even when empty', () => {
    const f = mk<any>({ type: 'suggestfield' });
    expect(f.el.classList.contains('op-stable')).toBe(true);
    expect(f.el.querySelector('.op-field__error')).not.toBeNull();
    f.validate();
    expect(f.el.classList.contains('op-stable')).toBe(true);
    const off = mk<any>({ type: 'textfield', stableSize: false });
    expect(off.el.classList.contains('op-stable')).toBe(false);
  });
});

describe('ListBox', () => {
  it('virtualizes, marks active/selected/disabled and highlights', () => {
    const items = Array.from({ length: 5000 }, (_, i) => ({ value: i, label: `Item ${i}` }));
    const l = mk<ListBox>({ type: 'listbox', items, selected: 3 });
    expect(l.el.querySelectorAll('[role=option]').length).toBeLessThan(40);
    expect(l.el.querySelector('[aria-selected=true]')?.textContent).toBe('Item 3');
    l.setActive(2);
    expect(l.getActiveId()).toBe(`${l.id}-opt-2`);
    expect(l.el.querySelector('.is-active')?.textContent).toBe('Item 2');
    l.setItems([{ value: 1, label: 'Hello world' }]);
    l.setHighlight('lo w');
    expect(l.el.querySelector('mark')?.textContent).toBe('lo w');
    l.setItems([]);
    expect((l.el.querySelector('.op-listbox__empty') as HTMLElement).hidden).toBe(false);
  });

  it('moveActive skips disabled and wraps; activate emits select', () => {
    const l = mk<ListBox>({ type: 'listbox', items: opts });
    const sel = vi.fn();
    l.on('select', sel);
    l.moveActive(1);
    l.moveActive(1);
    expect(l.getActive()!.value).toBe('b');
    l.moveActive(1);
    expect(l.getActive()!.value).toBe('d');
    l.moveActive(1);
    expect(l.getActive()!.value).toBe('a');
    l.setActive(2);
    expect(l.getActive()!.value).toBe('a');
    l.activate();
    expect(sel).toHaveBeenCalledWith(expect.objectContaining({ value: 'a' }), 0);
  });
});

describe('Dropdown', () => {
  it('opens into the layer, copies theme scope, closes on Esc and outside click', () => {
    const scope = document.createElement('div');
    scope.setAttribute('data-op-theme', 'dark');
    const anchor = document.createElement('button');
    scope.append(anchor);
    document.body.append(scope);
    const dd = mk<Dropdown>({ type: 'dropdown', anchor, content: Object.assign(document.createElement('div'), { textContent: 'hi' }) });
    const events: string[] = [];
    ['open', 'close'].forEach((e) => dd.on(e, () => events.push(e)));
    dd.open();
    expect(dd.el.parentElement?.className).toBe('op-layer');
    expect(dd.el.getAttribute('data-op-theme')).toBe('dark');
    expect(anchor.getAttribute('aria-expanded')).toBe('true');
    anchor.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dd.isOpen()).toBe(true);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(dd.isOpen()).toBe(false);
    dd.open();
    key(document.body, 'Escape');
    expect(dd.isOpen()).toBe(false);
    expect(events).toEqual(['open', 'close', 'open', 'close']);
    expect(anchor.getAttribute('aria-expanded')).toBe('false');
  });

  it('before-open can cancel; destroy cleans up listeners and DOM', () => {
    const anchor = document.createElement('div');
    document.body.append(anchor);
    const dd = create<Dropdown>({ type: 'dropdown', anchor, content: document.createElement('div') });
    const off = dd.on('before-open', () => false);
    dd.open();
    expect(dd.isOpen()).toBe(false);
    off();
    dd.open();
    dd.destroy();
    expect(document.querySelector('.op-dropdown')).toBeNull();
    expect(() => key(document.body, 'Escape')).not.toThrow();
  });
});

describe('Select', () => {
  it('shows the label of the value; keyboard opens, moves and selects', () => {
    const s = mk<Select>({ type: 'select', label: 'Fruit', options: opts, value: 'b' });
    const input = s.getInput();
    expect(input.value).toBe('Banana');
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.readOnly).toBe(true);
    const change = vi.fn();
    s.on('change', change);
    key(input, 'ArrowDown');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
    key(input, 'ArrowDown'); // b -> d (c is disabled)
    key(input, 'Enter');
    expect(s.getValue()).toBe('d');
    expect(input.value).toBe('Date');
    expect(change).toHaveBeenCalledWith('d', 'b');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('Esc closes only the list; clicking an option picks it', () => {
    const s = mk<Select>({ type: 'select', options: ['x', 'y'] });
    const input = s.getInput();
    key(input, 'ArrowDown');
    key(document.body, 'Escape');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    s.open();
    const row = document.querySelectorAll<HTMLElement>('.op-listbox__item')[1];
    row.click();
    expect(s.getValue()).toBe('y');
  });

  it('typeahead selects by first letters while closed', () => {
    vi.useFakeTimers();
    const s = mk<Select>({ type: 'select', options: opts });
    key(s.getInput(), 'd');
    expect(s.getValue()).toBe('d');
    key(s.getInput(), 'a'); // buffer is "da": no match, selection stays
    expect(s.getValue()).toBe('d');
    vi.advanceTimersByTime(700);
    key(s.getInput(), 'a');
    expect(s.getValue()).toBe('a');
    vi.useRealTimers();
  });

  it('required + placeholder; disabled/readonly do not open', () => {
    const s = mk<Select>({ type: 'select', options: opts, required: true, placeholder: 'Pick' });
    expect(s.validate()).toBe(false);
    s.setReadonly(true);
    s.open();
    expect(document.querySelector('.op-dropdown:not([hidden])')).toBeNull();
    s.setReadonly(false);
    s.setDisabled(true);
    s.open();
    expect(document.querySelector('.op-dropdown:not([hidden])')).toBeNull();
  });

  it('setOptions and Store feed the list', () => {
    const s = mk<Select>({ type: 'select', options: ['one'], value: 'two' });
    expect(s.getInput().value).toBe('two');
    s.setOptions([{ value: 'two', label: 'Two!' }]);
    expect(s.getInput().value).toBe('Two!');
    const store = new Store({ data: [{ id: 1, name: 'A' }] });
    const s2 = mk<Select>({ type: 'select', store, valueField: 'id', displayField: 'name', value: 1 });
    expect(s2.getInput().value).toBe('A');
    store.add({ id: 2, name: 'B' });
    s2.setValue(2);
    expect(s2.getInput().value).toBe('B');
  });
});

describe('ComboBox', () => {
  it('filters while typing (highlighted), picks with Enter, reverts unknown text on blur', () => {
    const c = mk<ComboBox>({ type: 'combobox', options: opts });
    const input = c.getInput();
    type(c, 'an');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const rows = document.querySelectorAll('.op-listbox__item');
    expect(Array.from(rows).map((r) => r.textContent)).toEqual(['Banana']);
    expect(document.querySelector('mark')?.textContent).toBe('an');
    key(input, 'Enter');
    expect(c.getValue()).toBe('b');
    expect(input.value).toBe('Banana');
    type(c, 'zzz');
    expect(document.querySelector('.op-listbox__empty:not([hidden])')).not.toBeNull();
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(input.value).toBe('Banana');
    expect(c.getValue()).toBe('b');
  });

  it('clearing the text clears the value; forceSelection:false keeps free text', () => {
    const c = mk<ComboBox>({ type: 'combobox', options: opts, value: 'a' });
    type(c, '');
    c.getInput().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(c.getValue()).toBeNull();
    const f = mk<ComboBox>({ type: 'combobox', options: opts, forceSelection: false });
    type(f, 'Kiwi');
    expect(f.getValue()).toBe('Kiwi');
  });

  it('startsWith / custom filter, trigger button toggles', () => {
    const c = mk<ComboBox>({ type: 'combobox', options: opts, filter: 'startsWith' });
    type(c, 'an');
    expect(document.querySelectorAll('.op-listbox__item').length).toBe(0);
    c.close();
    const d = mk<ComboBox>({ type: 'combobox', options: opts, filter: (i: any, s: string) => i.label.length === Number(s) });
    type(d, '4');
    expect(Array.from(document.querySelectorAll('.op-listbox__item')).map((r) => r.textContent)).toEqual(['Date']);
    d.close();
    (d.el.querySelector('.op-picker__trigger') as HTMLElement).click();
    expect(d.el.classList.contains('is-open')).toBe(true);
  });

  it('handles 5000 options with a small DOM', () => {
    const many = Array.from({ length: 5000 }, (_, i) => `Option ${i}`);
    const c = mk<ComboBox>({ type: 'combobox', options: many });
    c.open();
    expect(document.querySelectorAll('.op-listbox__item').length).toBeLessThan(40);
    type(c, 'Option 4999');
    expect(document.querySelectorAll('.op-listbox__item').length).toBe(1);
  });
});

describe('SuggestField', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces, queries, shows results, selects; ignores stale responses', async () => {
    const query = vi.fn(async (text: string) => {
      await new Promise((r) => setTimeout(r, text === 'ro' ? 100 : 10));
      return [{ value: text, label: `${text}-city` }];
    });
    const s = mk<SuggestField>({ type: 'suggestfield', query, delay: 50, minChars: 2 });
    const input = s.getInput();
    input.focus();
    type(s, 'r');
    vi.advanceTimersByTime(100);
    expect(query).not.toHaveBeenCalled();
    type(s, 'ro');
    vi.advanceTimersByTime(49);
    expect(query).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(query).toHaveBeenCalledTimes(1);
    type(s, 'rom');
    vi.advanceTimersByTime(50);
    await vi.advanceTimersByTimeAsync(200);
    expect(query).toHaveBeenCalledTimes(2);
    const rows = Array.from(document.querySelectorAll('.op-listbox__item')).map((r) => r.textContent);
    expect(rows).toEqual(['rom-city']);
    expect(s.el.querySelector('[aria-live]')?.textContent).toBe('1 results');
    key(input, 'Enter');
    expect(s.getValue()).toBe('rom');
    expect(input.value).toBe('rom-city');
  });

  it('reports errors, supports empty results, preloaded selection and a Store proxy', async () => {
    const s = mk<SuggestField>({ type: 'suggestfield', query: async () => { throw new Error('x'); }, delay: 0 });
    const err = vi.fn();
    s.on('error', err);
    await s.search('q');
    expect(err).toHaveBeenCalled();
    expect(s.el.classList.contains('is-searching')).toBe(false);
    const e = mk<SuggestField>({ type: 'suggestfield', query: () => [], delay: 0 });
    e.getInput().focus();
    await e.search('none');
    expect(e.el.querySelector('[aria-live]')?.textContent).toBe('No results');
    const pre = mk<SuggestField>({ type: 'suggestfield', query: () => [] });
    pre.setSelection({ value: 7, label: 'Preloaded' });
    expect(pre.getInput().value).toBe('Preloaded');
    expect(pre.getValue()).toBe(7);
    const store = new Store({ proxy: async (p: any) => [{ value: p.query, label: p.query.toUpperCase() }] });
    const st = mk<SuggestField>({ type: 'suggestfield', store, delay: 0 });
    st.getInput().focus();
    await st.search('abc');
    expect(Array.from(document.querySelectorAll('.op-listbox__item')).map((r) => r.textContent)).toEqual(['ABC']);
  });

  it('before-query can cancel', async () => {
    const query = vi.fn(() => []);
    const s = mk<SuggestField>({ type: 'suggestfield', query });
    s.on('before-query', () => false);
    await s.search('x');
    expect(query).not.toHaveBeenCalled();
  });
});

describe('ariaLabel on a field without a visible label', () => {
  it('names the control itself, not the wrapper', () => {
    for (const type of ['textfield', 'select', 'numberfield']) {
      const f = create({ type, ariaLabel: 'Theme', renderTo: document.body } as never) as unknown as { el: HTMLElement; destroy(): void };
      const input = f.el.querySelector('input')!;
      expect(input.getAttribute('aria-label'), type).toBe('Theme');
      expect(f.el.hasAttribute('aria-label'), type).toBe(false);
      f.destroy();
    }
  });
});
