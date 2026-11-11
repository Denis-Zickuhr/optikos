import { describe, it, expect, afterEach } from 'vitest';
import { registerLayout, create, Carousel, Label, Stat, NavMenu, Container, Viewport, DateTimeField, MaskField, Grid, Store, quickSearch, Panel } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const slide = (text: string) => ({ type: 'label', text }) as const;

describe('Carousel fade, overlay and captions', () => {
  it('fade stacks the items and marks the active one; overlay and captions follow it', () => {
    const c = create<Carousel>({ type: 'carousel', transition: 'fade', overlay: true, captions: ['One', 'Two'], items: [slide('a'), slide('b')], renderTo: document.body });
    expect(c.el.classList.contains('op-carousel--fade')).toBe(true);
    expect(c.el.classList.contains('op-carousel--overlay')).toBe(true);
    const active = () => [...c.el.querySelectorAll('.op-carousel__track > *')].map((e) => e.classList.contains('is-active'));
    expect(active()).toEqual([true, false]);
    expect(c.el.querySelector('.op-carousel__caption')!.textContent).toBe('One');
    c.next();
    expect(active()).toEqual([false, true]);
    expect(c.el.querySelector('.op-carousel__caption')!.textContent).toBe('Two');
    c.setCaptions([]);
    expect((c.el.querySelector('.op-carousel__caption') as HTMLElement).hidden).toBe(true);
  });

  it('fade shows one item at a time whatever perView says', () => {
    const c = create<Carousel>({ type: 'carousel', transition: 'fade', perView: 3, items: [slide('a'), slide('b'), slide('c')], renderTo: document.body });
    c.goTo(2);
    expect(c.getActive()).toBe(2);
    c.goTo(3);
    expect(c.getActive()).toBe(2);
  });
});

describe('Label with a heading tag and an image', () => {
  it('tag makes a heading; src or icon go before the text', () => {
    const l = create<Label>({ type: 'label', tag: 'h1', text: 'Sign in', src: '/logo.svg', alt: 'Acme', variant: 'title', renderTo: document.body });
    expect(l.el.tagName).toBe('H1');
    const img = l.el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/logo.svg');
    expect(img.getAttribute('alt')).toBe('Acme');
    expect(l.el.textContent).toBe('Sign in');
    l.setImage(undefined);
    l.setIcon('home');
    expect(l.el.querySelector('img')).toBeNull();
    expect(l.el.querySelector('svg')).toBeTruthy();
    l.setText('Hi');
    expect(l.el.textContent).toBe('Hi');
  });
});

describe('Stat as a button or a link', () => {
  it('handler: focusable, Enter and Space run it, named by label and value', () => {
    const calls: string[] = [];
    const s = create<Stat>({ type: 'stat', label: 'Open orders', value: 12, handler: () => calls.push('x'), renderTo: document.body });
    expect(s.el.getAttribute('role')).toBe('button');
    expect(s.el.tabIndex).toBe(0);
    expect(s.el.getAttribute('aria-label')).toBe('Open orders: 12');
    s.el.click();
    s.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    s.el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(calls).toHaveLength(3);
    s.setValue(7);
    expect(s.el.getAttribute('aria-label')).toBe('Open orders: 7');
  });

  it('href makes a link; without either it stays a plain tile', () => {
    expect(create<Stat>({ type: 'stat', label: 'a', value: 1, href: '/orders', renderTo: document.body }).el.tagName).toBe('A');
    const plain = create<Stat>({ type: 'stat', label: 'a', value: 1, renderTo: document.body });
    expect(plain.el.getAttribute('role')).toBeNull();
    expect(plain.el.classList.contains('is-interactive')).toBe(false);
  });
});

describe('NavMenu railWidth', () => {
  it('the parent container takes the rail width while collapsed and gets its own back', () => {
    const box = create<Panel>({ type: 'panel', width: 240, items: [{ type: 'navmenu', items: [{ id: 'a', text: 'A', icon: 'home' }], railWidth: 56, collapsed: false }], renderTo: document.body });
    const nav = box.items[0] as NavMenu;
    expect(box.el.style.inlineSize).toBe('');
    nav.setCollapsed(true);
    expect(box.el.style.inlineSize).toBe('56px');
    nav.setCollapsed(false);
    expect(box.el.style.inlineSize).toBe('');
  });
});

describe('theme as a string, narrowBelow on containers', () => {
  it('a string theme sets data-op-theme on the component', () => {
    const c = create<Container>({ type: 'container', theme: 'dark tenant-dark', renderTo: document.body });
    expect(c.el.getAttribute('data-op-theme')).toBe('dark tenant-dark');
    c.setTheme('');
    expect(c.el.hasAttribute('data-op-theme')).toBe(false);
  });

  it('narrowBelow reaches the layout, beside a string or an object layout', () => {
    const seen: unknown[] = [];
    registerLayout('probe', (cfg) => ({ init: () => void seen.push(cfg.narrowBelow) }));
    new Viewport({ layout: 'probe', narrowBelow: 600 }).mount(document.body);
    new Container({ layout: { type: 'probe' }, narrowBelow: 500 }).mount(document.body);
    new Container({ layout: { type: 'probe', narrowBelow: 400 }, narrowBelow: 500 }).mount(document.body);
    expect(seen).toEqual([600, 500, 400]);
  });
});

describe('DateTimeField defaultTime', () => {
  it('a date alone gets the default time', () => {
    const f = create<DateTimeField>({ type: 'datetimefield', name: 'end', defaultTime: '23:59', renderTo: document.body });
    const date = f.el.querySelectorAll<HTMLInputElement>('input')[0];
    date.value = '2026-11-20';
    date.dispatchEvent(new Event('input', { bubbles: true }));
    date.dispatchEvent(new Event('change', { bubbles: true }));
    expect(f.getValue()).toBe('2026-11-20T23:59');
  });
});

describe('MaskField stored value', () => {
  const mk = () => create<MaskField>({ type: 'maskfield', mask: '000.000.000-00', raw: true, stored: '***.***.***-12', required: true, renderTo: document.body });

  it('shows the masked value read-only; the value is null and counts as filled in', () => {
    const f = mk();
    expect(f.el.querySelector('input')!.value).toBe('***.***.***-12');
    expect(f.el.querySelector('input')!.readOnly).toBe(true);
    expect(f.getValue()).toBeNull();
    expect(f.isStored()).toBe(true);
    expect(f.validate()).toBe(true);
  });

  it('Enter opens it for a new value; Esc on an empty one gives the saved one back', () => {
    const f = mk();
    const input = f.el.querySelector('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(f.isStored()).toBe(false);
    expect(input.readOnly).toBe(false);
    expect(input.value).toBe('');
    input.value = '12345678900';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(f.getValue()).toBe('12345678900');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(f.isStored()).toBe(true);
    expect(input.value).toBe('***.***.***-12');
  });
});

describe('quickSearch', () => {
  const rows = [{ name: 'Ana', city: 'Rio' }, { name: 'Bia', city: 'Sao Paulo' }, { name: 'Rita', city: 'Recife' }];
  it('filters rows where any field contains the text, keeps other filters, clears with the box', async () => {
    const store = new Store<any>({ data: rows });
    const g = create<Grid>({ type: 'grid', store, plugins: [quickSearch({ fields: ['name', 'city'], delay: 0 })], columns: [{ field: 'name' }, { field: 'city' }], renderTo: document.body });
    const input = g.el.querySelector<HTMLInputElement>('.op-quicksearch input')!;
    expect(g.el.querySelector('.op-grid__footer .op-quicksearch')).toBeTruthy();
    input.value = 'ri';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 10));
    expect(store.getFiltered().map((r) => r.get('name'))).toEqual(['Ana', 'Rita']);
    await store.filter([{ field: 'name', op: 'eq', value: 'zzz' }]);
    expect(input.value).toBe('');
    input.value = 'ri';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 10));
    expect(store.getFilters()).toHaveLength(2);
  });
});
