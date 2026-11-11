import { create, Button, Icon, Label, registerIcons } from 'optikos';
import { page } from '../../dev/kit';

const p = page('base');

p.section('Button · variants', 'default, primary, danger, ghost; text, icon, both; icon on the right.', (host, { watch }) => {
  for (const variant of ['default', 'primary', 'danger', 'ghost'] as const) {
    watch(create<Button>({ type: 'button', text: variant, variant, renderTo: host }), ['click']);
  }
  create({ type: 'button', icon: 'plus', text: 'Add', variant: 'primary', renderTo: host });
  create({ type: 'button', icon: 'chevron-right', iconPos: 'right', text: 'Next', renderTo: host });
  create({ type: 'button', icon: 'trash', variant: 'danger', ariaLabel: 'Delete', tooltip: 'Delete', renderTo: host });
});

p.section('Button · states', 'disabled, loading (click ignored), toggle (aria-pressed).', (host, { watch }) => {
  create({ type: 'button', text: 'Disabled', disabled: true, renderTo: host });
  const loading = create<Button>({ type: 'button', text: 'Saving', variant: 'primary', loading: true, renderTo: host });
  create({ type: 'button', text: 'Toggle loading', renderTo: host, handler: () => loading.setLoading(!loading.config.loading) });
  watch(create<Button>({ type: 'button', text: 'Bold', icon: 'edit', toggle: true, renderTo: host }), ['toggle']);
});

p.section('Button · stableSize', 'same button twice: with stableSize (default) the width does not change when loading starts; with stableSize:false it fits the current face. Loading text differs from the normal text on purpose.', (host) => {
  const mk = (stableSize: boolean) =>
    create<Button>({ type: 'button', text: 'Save', loadingText: 'Saving…', variant: 'primary', stableSize, renderTo: host });
  const stable = mk(true);
  create({ type: 'label', text: '← stableSize: true', variant: 'muted', renderTo: host });
  const loose = mk(false);
  create({ type: 'label', text: '← stableSize: false', variant: 'muted', renderTo: host });
  create({ type: 'button', text: 'Toggle loading', renderTo: host, handler: () => [stable, loose].forEach((b) => b.setLoading(!b.config.loading)) });
});

p.section('Button · component theme', 'config `theme` scopes tokens to one instance: --op-button-radius, --op-button-primary-bg.', (host) => {
  create({ type: 'button', text: 'Square', variant: 'primary', theme: { radius: '0' }, renderTo: host });
  create({ type: 'button', text: 'Pill orange', variant: 'primary', theme: { radius: '62.5rem', primaryBg: '#ea580c', primaryHoverBg: '#c2410c' }, renderTo: host });
});

p.section('Icon', 'built-in set, color follows the text; custom icon through registerIcons().', (host) => {
  registerIcons({ star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z"/>' });
  const names = ['plus', 'minus', 'check', 'x', 'search', 'calendar', 'info', 'alert', 'error', 'success', 'menu', 'user', 'home', 'trash', 'edit', 'sun', 'moon', 'bell', 'chart', 'settings', 'users', 'star'];
  for (const name of names) create({ type: 'icon', name, label: name, style: 'font-size:1.5rem', renderTo: host });
  create<Icon>({ type: 'icon', name: 'success', style: 'font-size:2rem;color:var(--op-color-success)', renderTo: host });
});

p.section('Label', 'default, muted, title; associated to a field with `for`; `tag: h1` makes a heading, `src` / `icon` go before the text (a logo).', (host) => {
  for (const variant of ['default', 'muted', 'title'] as const) create<Label>({ type: 'label', text: `Label ${variant}`, variant, renderTo: host });
  create<Label>({ type: 'label', tag: 'h1', variant: 'title', text: 'Sign in', icon: 'home', renderTo: host });
  create<Label>({ type: 'label', tag: 'h2', text: 'With a logo', src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%232d6cdf'/%3E%3C/svg%3E", alt: '', renderTo: host });
});

p.section('Badge and Chip', 'badges in every tone (with a dot, an icon, a count); chips as filters (toggle, aria-pressed), removable tags (× or Delete) and disabled.', (host, { watch, log }) => {
  for (const tone of ['neutral', 'primary', 'success', 'warning', 'danger', 'info']) create({ type: 'badge', text: tone, tone, dot: tone !== 'neutral', renderTo: host } as never);
  create({ type: 'badge', text: 3, tone: 'danger', renderTo: host } as never);
  for (const text of ['Open', 'Paid', 'Shipped']) watch(create({ type: 'chip', text, selectable: true, renderTo: host } as never), ['change']);
  for (const text of ['Lisbon', 'Porto']) {
    const chip = create({ type: 'chip', text, icon: 'home', removable: true, renderTo: host } as never);
    chip.on('remove', () => (log('remove', text), chip.destroy()));
  }
  create({ type: 'chip', text: 'Disabled', disabled: true, renderTo: host } as never);
});

p.section('CodeViewer', 'read-only code: syntax colors per language, line numbers (CSS counters: a selection copies only the code), marked lines, startLine, wrap vs scroll, maxHeight, and a copy button that says "Copied".', (host, { watch }) => {
  const ts = "import { create } from 'optikos';\n\n// one form, two fields\nconst form = create({\n  type: 'form',\n  items: [{ type: 'textfield', name: 'name', label: 'Name', required: true }, { type: 'textfield', name: 'email', label: 'Email', inputType: 'email' }],\n});";
  watch(create({ type: 'codeviewer', code: ts, highlight: '4-7', width: 560, renderTo: host }), ['copy']);
  create({ type: 'codeviewer', language: 'json', title: 'package.json', code: '{\n  "name": "my-app",\n  "private": true,\n  "dependencies": { "optikos": "^0.1.0" }\n}', width: 560, renderTo: host });
  create({ type: 'codeviewer', language: 'css', title: 'theme.css (an excerpt)', startLine: 120, highlight: [121], code: "[data-op-theme~='ocean'] {\n  --op-color-primary: #0e7490;\n  --op-radius: 0.125rem;\n}", width: 560, renderTo: host });
  create({ type: 'codeviewer', language: 'html', code: '<!-- the stylesheet, then a scoped theme -->\n<link rel="stylesheet" href="optikos/optikos.css" />\n<section data-op-theme="dark">…</section>', width: 560, renderTo: host });
  create({ type: 'codeviewer', language: 'sh', bar: false, lineNumbers: false, code: 'npm i optikos   # no runtime dependencies', width: 560, renderTo: host });
  create({ type: 'codeviewer', title: 'wrap: true', wrap: true, code: ts, width: 360, renderTo: host });
  create({ type: 'codeviewer', title: 'maxHeight: 140', maxHeight: 140, code: Array.from({ length: 40 }, (_, i) => `console.log('line ${i + 1}');`).join('\n'), width: 560, renderTo: host });
});

const pic = (n: number, w = 800, h = 600) => {
  const hue = (n * 67) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="hsl(${hue} 55% 55%)"/><circle cx="${w * 0.3}" cy="${h * 0.35}" r="${h * 0.12}" fill="#fff8"/><path d="M0 ${h}L${w * 0.35} ${h * 0.5}L${w * 0.6} ${h * 0.8}L${w * 0.8} ${h * 0.6}L${w} ${h}Z" fill="hsl(${hue} 45% 30%)"/><text x="${w / 2}" y="${h * 0.2}" font-size="${h * 0.08}" fill="#fff" text-anchor="middle" font-family="sans-serif">Picture ${n}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

p.section('ImageCanvas', 'contain and cover; zoom with the buttons, + / - / 0, Ctrl+wheel, double click or a pinch; drag or use the arrows to pan while zoomed.', (host, { watch }) => {
  watch(create({ type: 'imagecanvas', src: pic(1), alt: 'Mountains', width: 320, renderTo: host } as never), ['load', 'zoom']);
  create({ type: 'imagecanvas', src: pic(2, 600, 900), alt: 'Tall picture, contain', width: 320, renderTo: host } as never);
  create({ type: 'imagecanvas', src: pic(2, 600, 900), alt: 'Tall picture, cover', fit: 'cover', width: 320, ratio: '16 / 9', renderTo: host } as never);
});

p.section('ImageCanvas · states', 'a broken URL shows a message; zoomable: false is just a picture; setSrc swaps the image and resets the zoom.', (host) => {
  create({ type: 'imagecanvas', src: '/nope.png', alt: 'Missing', width: 320, renderTo: host } as never);
  create({ type: 'imagecanvas', src: pic(3), alt: 'Fixed', zoomable: false, width: 320, renderTo: host } as never);
  let n = 4;
  const c = create({ type: 'imagecanvas', src: pic(4), alt: 'Swappable', width: 320, renderTo: host, showTools: false } as never) as unknown as { setSrc(s: string): void };
  create({ type: 'button', text: 'Next picture', renderTo: host, handler: () => c.setSrc(pic(++n)) });
});

p.section('Avatar', 'initials on a color picked from the name (the same person always looks the same), a picture with a fallback when it fails, sizes, shapes and status.', (host) => {
  for (const [name, extra] of [['Ada Lovelace', { size: 'sm' }], ['Grace Hopper', { status: 'online' }], ['Alan Turing', { size: 'lg', status: 'busy' }], ['Mary Jackson', { size: 'lg', shape: 'square', status: 'away' }], ['Katherine Johnson', { size: 'xl', src: '/missing.png' }]] as const) {
    create({ type: 'avatar', name, renderTo: host, ...extra });
  }
});

p.section('Image', 'keeps its aspect ratio while loading (no jump), lazy by default, an icon or a second URL when the file is missing.', (host) => {
  const svg = (c: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="100%" height="100%" fill="${c}"/></svg>`)}`;
  create({ type: 'image', width: 200, ratio: '16/9', rounded: true, alt: 'Poster', src: svg('#b45309'), renderTo: host });
  create({ type: 'image', width: 200, ratio: '16/9', rounded: true, src: '/missing.png', renderTo: host });
  create({ type: 'image', width: 200, ratio: '16/9', rounded: true, src: '/missing.png', fallback: svg('#1e7a4d'), renderTo: host });
  create({ type: 'image', width: 90, ratio: '1', rounded: true, src: '/missing.png', fallback: 'user', renderTo: host });
});
