// Dev index: one card per sandbox category and per demo. Built with Optikos components.
import { create } from 'optikos';
import { page } from './kit';
import { loadPages, type DevPage } from './nav';

const p = page('index');
const pages = await loadPages();

// the same identity as the docs site: logo mark, title, and a way over there
const hero = p.main.appendChild(Object.assign(document.createElement('header'), { className: 'dev-hero' }));
hero.append(Object.assign(document.createElement('span'), { className: 'dev-logo' }));
const title = hero.appendChild(document.createElement('div'));
title.append(Object.assign(document.createElement('h1'), { textContent: 'Optikos dev' }), Object.assign(document.createElement('p'), { textContent: `${pages.filter((x) => x.kind === 'sandbox').length} sandboxes and ${pages.filter((x) => x.kind === 'demo').length} demos, with live reload. Docs site: npm run site.` }));
hero.append(Object.assign(document.createElement('a'), { href: 'http://localhost:5180/site/', textContent: 'Docs site →' }));

const card = (pg: DevPage) => ({
  type: 'panel',
  title: pg.name,
  icon: pg.kind === 'demo' ? 'chart' : 'menu',
  items: [
    { type: 'label', text: pg.description || `${pg.sections.length} section${pg.sections.length === 1 ? '' : 's'}`, style: 'display:block;margin-bottom:.5rem' },
    { type: 'label', variant: 'muted', text: pg.sections.join(' · '), style: 'display:block;font-size:var(--op-font-size-sm)' },
  ],
  buttons: [{ text: 'Open', variant: 'primary', icon: 'chevron-right', iconPos: 'right', handler: () => (location.href = pg.href) }],
});

const group = (title: string, description: string, kind: DevPage['kind']) =>
  p.section(title, description, (host) => {
    host.style.display = 'block';
    create({ type: 'container', renderTo: host, layout: { type: 'grid', columns: 'repeat(auto-fill, minmax(16rem, 1fr))', gap: 16 }, items: pages.filter((x) => x.kind === kind).map(card) });
  });

group('Sandboxes', 'One page per component category: every case of the spec sheets, with an event log and a theme bar.', 'sandbox');
group('Demos', 'Complete apps that use only the public API.', 'demo');
