// Events landing page demo ("Maison Runway Week"): fashion week landing with countdown, schedule, models, sponsored partner picks (editorial, nothing to buy), gallery, FAQ and an invitation form. Public API only.
import { create, register, Component, ui, Window, MessageBox, toast, validators, type Container, type Form, type Model as Rec, type DataView, type Button, type ComponentConfig } from 'optikos';
import { models, partners, schedule, faqs, portrait, still, EVENT_START, type Model, type Partner } from './data';

const css = document.createElement('style');
css.textContent = `html{scroll-behavior:smooth}body{background:var(--op-color-bg);color:var(--op-color-fg)}
.ev-serif,.ev h1,.ev h2,.ev h3{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:.01em}
.ev-nav{position:sticky;inset-block-start:0;z-index:20;flex-wrap:nowrap!important;backdrop-filter:blur(10px)}.ev-brand{font-family:Georgia,serif;font-size:1.2rem;letter-spacing:.14em;text-transform:uppercase;padding-inline:var(--op-space-3);white-space:nowrap}
.ev-links{display:contents}@media (max-width:52rem){.ev-links{display:none}}
.ev-hero{min-block-size:36rem;display:grid;place-items:center;text-align:center;padding:5rem 1.25rem;background:radial-gradient(ellipse at 50% 0,var(--op-color-primary-soft),transparent 70%),linear-gradient(var(--op-color-surface),var(--op-color-bg))}
.ev-eyebrow{text-transform:uppercase;letter-spacing:.3em;font-size:var(--op-font-size-sm);color:var(--op-color-primary)}
.ev-hero h1{font-size:clamp(2.6rem,8vw,5.5rem);line-height:1.02;margin:.75rem 0}.ev-hero p{max-inline-size:36rem;margin:0 auto 1.5rem;color:var(--op-color-fg-muted);font-size:1.1rem}
.ev-count{display:flex;justify-content:center;gap:1rem;margin:2rem 0}.ev-count div{min-inline-size:4.5rem}.ev-count b{display:block;font:400 2.4rem Georgia,serif;font-variant-numeric:tabular-nums}.ev-count span{font-size:var(--op-font-size-sm);text-transform:uppercase;letter-spacing:.15em;color:var(--op-color-fg-muted)}
.ev-cta{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
.ev-sec{padding:4.5rem 1.25rem;max-inline-size:68rem;margin:0 auto;scroll-margin-top:3.5rem}.ev-sec>h2{font-size:2.2rem;margin:0 0 .35rem;text-align:center}.ev-sec>.ev-sub{text-align:center;color:var(--op-color-fg-muted);margin:0 auto 2.5rem;max-inline-size:38rem}
.ev-band{background:var(--op-color-surface-2)}.ev-band>.ev-sec{max-inline-size:68rem}
.ev-card{display:flex;flex-direction:column;gap:.35rem;text-align:start}.ev-card img{inline-size:100%;display:block;border-radius:var(--op-radius)}.ev-card h3{margin:.4rem 0 0;font-size:1.15rem}.ev-card small{color:var(--op-color-fg-muted)}
.ev-tag{align-self:flex-start;padding:.1rem .55rem;border:1px solid var(--op-color-primary);color:var(--op-color-primary);border-radius:var(--op-radius-pill);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase}
.ev-card .op-button{align-self:flex-start;margin-block-start:.25rem}
.ev-pub{font-size:var(--op-font-size-sm);color:var(--op-color-fg-muted);text-align:center;margin-block-start:1.5rem}
.ev-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1.25rem}.ev-info h3{margin:0 0 .4rem}
.ev-form{max-inline-size:34rem;margin:0 auto}.ev-story img{inline-size:100%;border-radius:var(--op-radius);margin-block-end:.75rem}
.ev-foot{text-align:center;padding:3rem 1rem;color:var(--op-color-fg-muted);border-block-start:1px solid var(--op-color-border)}`;
document.head.append(css);

/** Holds a ready-made DOM node as a component, so it can sit in a window or any layout. */
class Html extends Component<ComponentConfig & { node?: Node }> {
  protected override onRender() {
    if (this.config.node) this.el.append(this.config.node);
  }
}
register('ev-html', Html);

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = '', parent?: HTMLElement) => {
  const e = Object.assign(document.createElement(tag), { className: cls, innerHTML: html });
  parent?.append(e);
  return e;
};
const root = node('div', 'ev', '', document.body);
const section = (id: string, title: string, sub: string, band = false) => {
  const wrap = node('div', band ? 'ev-band' : '', '', root);
  const sec = node('section', 'ev-sec', `<h2>${title}</h2><p class="ev-sub">${sub}</p>`, wrap);
  sec.id = id;
  return sec;
};
const go = (id: string) => document.getElementById(id)?.scrollIntoView();

// ---- nav ---------------------------------------------------------------------------------------------------------------------------------------------------------
const navHost = node('div', '', '', root);
create({
  type: 'toolbar', cls: 'ev-nav', renderTo: navHost, ariaLabel: 'Site',
  items: [{ type: 'label', cls: 'ev-brand', text: 'Maison Runway Week' }, '->',
    ...[['schedule', 'Schedule'], ['models', 'Models'], ['partners', 'Partners'], ['faq', 'FAQ']].map(([id, text]) => ui.button(text, () => go(id), { variant: 'ghost' })),
    ui.primary('Request invite', () => go('invite'))] as never,
});

// ---- hero + countdown --------------------------------------------------------------------------------------------------------------------------------------
const hero = node('header', 'ev-hero', `<div><div class="ev-eyebrow">March 5 – 7, 2027 · The Grand Hall</div><h1>Three nights.<br>One runway.</h1><p>Twelve collections, forty models and the people who make fashion move. Come for the shows, stay for the stories behind them.</p><div class="ev-count" role="timer" aria-label="Countdown to the opening night"></div><div class="ev-cta"></div></div>`, root);
const countEl = hero.querySelector<HTMLElement>('.ev-count')!;
const tickCount = () => {
  let s = Math.max(0, Math.floor((EVENT_START.getTime() - Date.now()) / 1000));
  const parts: [number, string][] = [[Math.floor(s / 86400), 'days'], [Math.floor((s % 86400) / 3600), 'hours'], [Math.floor((s % 3600) / 60), 'min'], [s % 60, 'sec']];
  s = 0;
  countEl.innerHTML = parts.map(([n, l]) => `<div><b>${String(n).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
};
tickCount();
const timer = setInterval(tickCount, 1000);
addEventListener('pagehide', () => clearInterval(timer));
const cta = hero.querySelector<HTMLElement>('.ev-cta')!;
create({ type: 'container', renderTo: cta, layout: 'hbox', gap: 12, items: [ui.primary('Request an invite', () => go('invite'), { icon: 'chevron-right', iconPos: 'right' }), ui.button('See the schedule', () => go('schedule'))] as never });

// ---- schedule (tabs of tables) ---------------------------------------------------------------------------------------------------------------------------
const days = ['Fri 5 · Opening', 'Sat 6 · Collections', 'Sun 7 · Finale'];
create({
  type: 'tabs', renderTo: section('schedule', 'Schedule', 'Three days across four venues. Evening shows are by invitation; daytime sessions are open with a free pass.'), lazy: false,
  items: days.map((title, d) => ({ title, items: [{ type: 'table', data: schedule.filter((s) => s.day === d), columns: [{ field: 'time', header: 'Time', width: 80 }, { field: 'title', header: 'Show' }, { field: 'designer', header: 'House' }, { field: 'venue', header: 'Venue' }], striped: true, caption: `Programme for ${title}` }] })),
} as never);

// ---- models ----------------------------------------------------------------------------------------------------------------------------------------------------------------
const followed = new Set<number>();
function openModel(m: Model) {
  const body = node('div', 'ev-story', `<img alt="${m.name}" src="${portrait(m.hue)}" style="max-inline-size:18rem;display:block;margin-inline:auto"><p class="ev-serif" style="font-size:1.05rem">${m.bio}</p><p><b>${m.agency}</b> · ${m.city} · ${m.height}</p><b>On the runway</b><ul>${m.looks.map((l) => `<li>${l}</li>`).join('')}</ul>`);
  const follow = ui.button(followed.has(m.id) ? 'Following' : 'Follow', () => { followed.has(m.id) ? followed.delete(m.id) : followed.add(m.id); follow.setText(followed.has(m.id) ? 'Following' : 'Follow'); follow.setPressed?.(followed.has(m.id)); }, { toggle: true, pressed: followed.has(m.id), icon: 'star' }) as Button;
  const win: Window = create<Window>({ type: 'window', title: m.name, width: 460, closeOnBackdrop: true, closeAction: 'destroy', layout: 'fit', items: [{ type: 'ev-html', node: body }], buttons: [follow, ui.primary('Close', () => win.close())] } as never);
  win.show();
}
const modelCard = (r: Rec<Model>) => {
  const m = r.data;
  const c = node('span', 'ev-card', `<img alt="" loading="lazy" src="${portrait(m.hue)}"><h3>${m.name}</h3><small>${m.agency} · ${m.city}</small>`);
  return c;
};
create<DataView>({ type: 'dataview', renderTo: section('models', 'The faces of the week', 'Forty models across the three nights. Tap a portrait for the story and the looks.'), data: models, itemWidth: '12rem', gap: '1.25rem', selection: 'none', renderer: modelCard, ariaLabel: 'Models',
  listeners: { 'item-click': (r: Rec<Model>) => openModel(r.data), 'item-activate': (r: Rec<Model>) => openModel(r.data) } } as never);

// ---- partner picks (sponsored, editorial, nothing to buy) ------------------------------------------------------------------------------------------
function openPartner(p: Partner) {
  const body = node('div', 'ev-story', `<img alt="${p.product}" src="${still(p)}"><span class="ev-tag">Partner content · ${p.brand}</span><h3 class="ev-serif" style="margin:.5rem 0">${p.product}</h3><p>${p.story}</p><p class="ev-pub">Partner content. ${p.brand} supports Maison Runway Week; our editors wrote this piece.</p>`);
  const win: Window = create<Window>({ type: 'window', title: p.brand, width: 480, closeOnBackdrop: true, closeAction: 'destroy', layout: 'fit', items: [{ type: 'ev-html', node: body }],
    buttons: [ui.button('Save for later', () => toast({ type: 'success', text: `${p.product} saved to your notes` })), ui.primary('Close', () => win.close())] } as never);
  win.show();
}
const partnerSec = section('partners', 'Backstage, with our partners', 'The pieces you will see all week, and the stories behind them. Presented in partnership with the houses below.', true);
create<DataView>({ type: 'dataview', renderTo: partnerSec, data: partners, itemWidth: '14rem', gap: '1.25rem', selection: 'none', ariaLabel: 'Partner picks',
  renderer: (r: Rec<Partner>) => {
    const p = r.data;
    const c = node('span', 'ev-card', `<span class="ev-tag">Partner content</span><img alt="" loading="lazy" src="${still(p)}"><small>${p.brand}</small><h3>${p.product}</h3><span>${p.tagline}</span>`);
    const more = Object.assign(node('button', 'op-button op-button--ghost', 'Read the story'), { type: 'button' });
    more.dataset.opAction = 'story';
    c.append(more);
    return c;
  },
  listeners: { 'item-action': (_a: string, r: Rec<Partner>) => openPartner(r.data), 'item-click': (r: Rec<Partner>) => openPartner(r.data) } } as never);
node('p', 'ev-pub', 'Partner content is paid for by the brands named on each card. Nothing here is for sale: this is the festival programme, not a shop.', partnerSec);

// ---- gallery ----------------------------------------------------------------------------------------------------------------------------------------------------------------
const shots = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, label: `Backstage ${i + 1}`, hue: (i * 53 + 8) % 360 }));
create<DataView>({ type: 'dataview', renderTo: section('gallery', 'Last year, backstage', 'Fittings, hair, hand-offs and the minute before the lights.'), data: shots, itemWidth: '9rem', gap: '.75rem', selection: 'none', ariaLabel: 'Gallery',
  renderer: (r: Rec<(typeof shots)[number]>) => node('span', 'ev-card', `<img alt="${r.data.label}" loading="lazy" src="${portrait(r.data.hue, r.data.label)}">`),
  listeners: { 'item-click': (r: Rec<(typeof shots)[number]>) => {
    const body = Object.assign(document.createElement('img'), { src: portrait(r.data.hue, r.data.label), alt: r.data.label, style: 'inline-size:100%;display:block' });
    const win: Window = create<Window>({ type: 'window', title: r.data.label, width: 420, closeOnBackdrop: true, closeAction: 'destroy', layout: 'fit', items: [{ type: 'ev-html', node: body }], buttons: [ui.primary('Close', () => win.close())] } as never);
    win.show();
  } } } as never);

// ---- venue info ------------------------------------------------------------------------------------------------------------------------------------------------------------
const infoSec = section('venue', 'Plan your visit', 'Everything on one page.', true);
const info = node('div', 'ev-info', '', infoSec);
for (const [t, b] of [['Where', 'The Grand Hall, 14 Quay Street, with satellite shows in the Glass Gallery, Library and Studio B, all within a five-minute walk.'], ['When', 'Doors open one hour before each show. Daytime sessions start at 10:00. Last entry to evening shows is 15 minutes before curtain.'], ['Getting there', 'Metro line 2 to Quay station, then a two-minute walk. Bicycle parking on Quay Street; no public car park on site.']]) node('div', '', `<h3>${t}</h3><p>${b}</p>`, info);

// ---- FAQ (collapsible panels) -------------------------------------------------------------------------------------------------------------------------------------
create<Container>({ type: 'container', renderTo: section('faq', 'Questions', 'The ones we hear every year.'), layout: 'vbox', gap: 8, style: 'max-inline-size:44rem;margin:0 auto',
  items: faqs.map(([title, text]) => ({ type: 'panel', title, collapsible: true, collapsed: true, items: [{ type: 'label', text }] })) } as never);

// ---- invitation form -----------------------------------------------------------------------------------------------------------------------------------------------------
const invite = section('invite', 'Request an invite', 'Free daytime pass for everyone; evening shows by invitation, confirmed by email within a week.', true);
const form: Form = ui.form([
  ui.text('name', 'Full name', { required: true, minLength: 3 }),
  ui.email('email', 'Email', { required: true, validators: [validators.email()] }),
  ui.select('role', 'I am a', ['Guest', 'Press', 'Buyer', 'Model scout / agent', 'Student'], { required: true, value: 'Guest' }),
  ui.radio('days', 'Days I plan to attend', ['Opening night', 'Collections day', 'Finale', 'All three'], { value: 'All three' }),
  ui.area('note', 'Anything we should know?', { rows: 3, maxLength: 300 }),
  ui.check('news', 'Send me programme updates', { value: true }),
  ui.check('terms', 'I accept the privacy notice', { required: true }),
  ui.primary('Send request', undefined, { htmlType: 'submit', width: '100%' }),
], { cls: 'ev-form' }) as unknown as Form;
form.mount(invite);
form.on('submit', (v: Record<string, any>) => {
  form.setLoading?.('Sending…');
  setTimeout(() => {
    form.setLoading?.(false);
    form.reset();
    void MessageBox.alert(`Thank you, ${String(v.name).split(' ')[0]}. We will write to ${v.email} within a week.`, { title: 'Request received', icon: 'info' });
  }, 800);
});

node('footer', 'ev-foot', 'Maison Runway Week is a fictional event for the Optikos demo. Models, brands and products are invented.', root);
