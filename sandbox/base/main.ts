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

p.section('Label', 'default, muted, title; associated to a field with `for`.', (host) => {
  for (const variant of ['default', 'muted', 'title'] as const) create<Label>({ type: 'label', text: `Label ${variant}`, variant, renderTo: host });
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
