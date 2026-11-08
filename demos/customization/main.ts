// Customization demo: custom component + layout (bundle), a defineTheme theme and a plain-CSS theme. Public API only.
import { create, setTheme, toast } from 'optikos';
import { installBundle } from './bundle';

installBundle();

const css = document.createElement('style');
css.textContent = `
.demo-stars__row{display:flex;gap:2px}.demo-stars__star{font-size:1.75rem;line-height:1;background:none;border:0;cursor:pointer;color:var(--op-color-border-strong)}
.demo-stars__star.is-on{color:var(--op-color-warning)}
.demo-polaroid{display:flex;gap:var(--op-space-4);flex-wrap:wrap;padding:var(--op-space-3)}
.demo-polaroid>*{transform:rotate(var(--tilt));box-shadow:var(--op-shadow)}
.demo-page{padding:var(--op-space-4);max-width:56rem;margin:0 auto}
`;
document.head.append(css);

const themes: Record<string, string> = { Light: 'light', Dark: 'dark', 'Compact': 'compact', 'defineTheme (violet)': 'violet', 'CSS file (ocean)': 'ocean' };

// a dark theme scoped to this one container: everything inside repaints, the rest of the page does not
const scoped = create({ type: 'container', style: 'padding:.75rem;border-radius:.5rem', items: [{ type: 'button', text: 'Inside data-op-theme="dark"', variant: 'primary' }] });
setTheme('dark', scoped.el);

create({
  type: 'container', renderTo: document.body, cls: 'demo-page', layout: { type: 'vbox', gap: 16 },
  items: [
    { type: 'toolbar', items: [
      { type: 'label', text: 'Customization', variant: 'title' }, '->',
      { type: 'select', width: 220, ariaLabel: 'Theme', value: 'light', options: Object.entries(themes).map(([label, value]) => ({ value, label })), listeners: { change: (v: string) => setTheme(v) } },
    ] },
    { type: 'panel', title: 'A custom field (Stars) inside a stock Form', items: [{
      type: 'form', labelPos: 'left', items: [
        { type: 'textfield', name: 'product', label: 'Product', value: 'Optikos' },
        { type: 'stars', name: 'rating', label: 'Rating', required: true, max: 5 },
        { type: 'button', text: 'Submit', variant: 'primary', htmlType: 'submit' },
      ],
      listeners: { submit: (v: unknown) => toast({ type: 'success', title: 'Submitted', text: JSON.stringify(v) }) },
    }] },
    { type: 'panel', title: 'A custom layout (polaroid)', items: [{ type: 'container', layout: 'polaroid', items: ['One', 'Two', 'Three'].map((text) => ({ type: 'panel', title: text, width: 150, items: [{ type: 'label', text: 'A panel in a custom layout' }] })) }] },
    { type: 'panel', title: 'Scoped theme + per-component tokens', items: [{ type: 'container', layout: { type: 'hbox', gap: 12 }, items: [
      { type: 'button', text: 'Global theme button', variant: 'primary' },
      { type: 'button', text: 'Per-instance tokens', variant: 'primary', theme: { radius: '0', primaryBg: '#16a34a', primaryHoverBg: '#15803d' } },
      scoped,
    ] }] },
  ],
});
