import { create, Container, Panel } from 'optikos';
import { page } from '../../dev/kit';

const p = page('layout');
const box = (text: string, extra: object = {}) => ({ type: 'label', text, style: 'padding:.5rem;background:var(--op-color-primary-soft);border:1px dashed var(--op-color-primary);border-radius:var(--op-radius-sm)', ...extra });

p.section('hbox / vbox', 'flex children, align/justify/gap from the layout config.', (host) => {
  create({ type: 'container', layout: { type: 'hbox', gap: 8 }, style: 'width:100%', renderTo: host, items: [box('A', { flex: 1 }), box('B', { flex: 2 }), box('C')] });
  create({ type: 'container', layout: { type: 'vbox', gap: 8, align: 'flex-start' }, renderTo: host, items: [box('one'), box('two'), box('three')] });
});

p.section('border', 'regions north/south/west/east/center.', (host) => {
  create({
    type: 'container',
    layout: { type: 'border', gap: 8 },
    style: 'width:100%;height:14rem',
    renderTo: host,
    items: [box('north', { region: 'north' }), box('west', { region: 'west', width: 100 }), box('center', { region: 'center' }), box('east', { region: 'east', width: 100 }), box('south', { region: 'south' })],
  });
});

p.section('grid', '3 columns, one item spanning 2.', (host) => {
  create({ type: 'container', layout: { type: 'grid', columns: 3, gap: 8 }, style: 'width:100%', renderTo: host, items: [box('1'), box('2 (span 2)', { colspan: 2 }), box('3'), box('4'), box('5')] });
});

p.section('fit + card', 'fit fills the parent; card shows one child, switched by buttons.', (host, { log }) => {
  const card = create<Container>({ type: 'container', layout: 'card', style: 'width:16rem;height:6rem', renderTo: host, items: [box('card 1'), box('card 2'), box('card 3')] });
  card.on('activate', (c: any) => log('activate', c.id));
  create({ type: 'toolbar', renderTo: host, items: [0, 1, 2].map((i) => ({ type: 'button', text: `Show ${i + 1}`, handler: () => card.setActiveItem(i) })) });
});

p.section('Panel', 'title, tools, collapsible, closable, reloadable (the ↻ runs onReload; a Promise shows the loading mask), tbar/bbar/buttons, loading.', (host, { watch }) => {
  const mk = (cfg: object) => create<Panel>({ type: 'panel', width: 280, renderTo: host, items: [box('Panel body')], ...cfg });
  mk({ title: 'Simple', icon: 'user' });
  watch(mk({ title: 'Collapsible', collapsible: true }), ['collapse', 'expand']);
  watch(mk({ title: 'Closable', closable: true, closeAction: 'hide' }), ['before-close', 'close']);
  watch(mk({ title: 'Reloadable', reloadable: true, onReload: () => new Promise((r) => setTimeout(r, 1200)) }), ['before-reload', 'reload']);
  mk({ title: 'Bars', tbar: [{ type: 'button', text: 'New', icon: 'plus' }, '->', { type: 'button', icon: 'search', ariaLabel: 'Search', variant: 'ghost' }], bbar: [{ type: 'label', text: 'status', variant: 'muted' }], buttons: [{ text: 'Cancel' }, { text: 'Save', variant: 'primary' }] });
  const loading = mk({ title: 'Loading', loading: 'Please wait' });
  create({ type: 'button', text: 'Toggle loading', renderTo: host, handler: () => loading.setLoading(loading.config.loading ? false : 'Please wait') });
});

p.section('Toolbar', 'arrow keys move between buttons (single Tab stop); `->` fill, `-` separator.', (host) => {
  create({ type: 'toolbar', ariaLabel: 'Formatting', style: 'width:100%', renderTo: host, items: [{ type: 'button', text: 'Cut' }, { type: 'button', text: 'Copy' }, '-', { type: 'button', text: 'Paste' }, '->', { type: 'button', text: 'Help', variant: 'ghost' }] });
});

const slide = (n: number) => ({ type: 'imagecanvas', src: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="hsl(${n * 67} 55% 55%)"/><text x="400" y="250" font-size="90" fill="#fff" text-anchor="middle" font-family="sans-serif">${n}</text></svg>`), alt: `Picture ${n}`, zoomable: false, ratio: '16 / 9' });
const card = (n: number) => ({ type: 'panel', title: `Card ${n}`, items: [{ type: 'label', text: `Anything that is a component fits: card number ${n}.` }] });

p.section('Carousel · images', 'arrows, dots, ← → Home End on the controls, swipe or trackpad. The slides out of view are inert.', (host, { watch }) => {
  watch(create({ type: 'carousel', width: 480, renderTo: host, ariaLabel: 'Pictures', items: [1, 2, 3, 4].map(slide) } as never), ['change']);
});

p.section('Carousel · fade, captions over the content', 'transition: fade (cross-fade, one at a time), overlay: dots, play and caption over the content, autoplay 6 s with loop.', (host, { watch }) => {
  watch(create({ type: 'carousel', transition: 'fade', overlay: true, autoplay: 6000, loop: true, width: 480, captions: ['Plan the night', 'Sell the tickets', 'Count the votes'], renderTo: host, items: [1, 2, 3].map(slide) } as never), ['change']);
});

p.section('Carousel · cards', 'perView 3 with a gap: it moves one card at a time; loop wraps around.', (host) => {
  create({ type: 'carousel', perView: 3, gap: 12, loop: true, renderTo: host, items: [1, 2, 3, 4, 5, 6].map(card) } as never);
});

p.section('Carousel · autoplay', 'every 2.5 s; it pauses under the pointer or focus, stops for good after any use of the controls, and never runs with prefers-reduced-motion.', (host, { watch }) => {
  watch(create({ type: 'carousel', autoplay: 2500, width: 480, renderTo: host, items: [1, 2, 3].map(slide) } as never), ['change']);
});

p.section('Carousel · runtime', 'add and remove items; one item shows no controls.', (host) => {
  const c = create({ type: 'carousel', width: 480, renderTo: host, items: [slide(1), slide(2)] } as never) as unknown as Container;
  let n = 2;
  create({ type: 'button', text: 'Add', renderTo: host, handler: () => c.add(slide(++n)) });
  create({ type: 'button', text: 'Remove last', renderTo: host, handler: () => c.remove(c.items.length - 1) });
  create({ type: 'carousel', width: 480, renderTo: host, items: [slide(9)] } as never);
});
