import { describe, it, expect, afterEach } from 'vitest';
import { create, Timeline, Stat, Avatar } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const q = (c: { el: HTMLElement }, sel: string) => Array.from(c.el.querySelectorAll<HTMLElement>(sel));

describe('Timeline', () => {
  it('list mode: one item per event, select on click and Enter', () => {
    const tl = create<Timeline>({ type: 'timeline', renderTo: document.body, items: [{ title: 'Opened', time: '2026-11-10T09:00', tone: 'success' }, { title: 'Closed', text: 'done' }] });
    expect(q(tl, '.op-timeline__item')).toHaveLength(2);
    expect(q(tl, '.op-timeline__item')[0].classList.contains('is-success')).toBe(true);
    let got: any;
    tl.on('select', (it: unknown) => (got = it));
    q(tl, '.op-timeline__item')[1].click();
    expect(got.title).toBe('Closed');
  });

  it('range mode: lanes in order, bars placed over the window', () => {
    const tl = create<Timeline>({
      type: 'timeline', mode: 'range', now: false, lanes: ['Stage', 'Bar'], renderTo: document.body,
      items: [
        { title: 'Setup', lane: 'Bar', start: '2026-11-10', end: '2026-11-11' },
        { title: 'Show', lane: 'Stage', start: '2026-11-12', end: '2026-11-12' },
      ],
    });
    expect(q(tl, '.op-timeline__lane').map((l) => l.getAttribute('aria-label'))).toEqual(['Stage', 'Bar']);
    const [show] = q(tl, '.op-timeline__lane:first-of-type .op-timeline__bar, .op-timeline__bar').filter((b) => b.textContent === 'Show');
    expect(show.style.insetInlineStart).toMatch(/^6\d\./);
    expect(show.getAttribute('aria-label')).toContain('Show');
  });
});

describe('Stat', () => {
  it('shows value, delta with the right tone, and a sparkline', () => {
    const s = create<Stat>({ type: 'stat', label: 'Votes', value: 1234, delta: 0.125, trend: [1, 3, 2, 5], renderTo: document.body });
    expect(q(s, '.op-stat__value')[0].textContent).toBe('1,234');
    expect(q(s, '.op-stat__delta')[0].classList.contains('is-good')).toBe(true);
    expect(q(s, '.op-stat__delta')[0].textContent).toContain('+12.5%');
    expect(q(s, '.op-chart')).toHaveLength(1);
    s.setDelta(-0.1);
    expect(q(s, '.op-stat__delta')[0].classList.contains('is-bad')).toBe(true);
    const cost = create<Stat>({ type: 'stat', label: 'Cost', value: 5, delta: -0.1, good: 'down', renderTo: document.body });
    expect(q(cost, '.op-stat__delta')[0].classList.contains('is-good')).toBe(true);
    s.setTrend(undefined);
    expect(q(s, '.op-chart')).toHaveLength(0);
  });
});

describe('Avatar', () => {
  it('shows initials and a stable color from the name, and falls back when the picture fails', () => {
    const a = create<Avatar>({ type: 'avatar', name: 'Ada Lovelace', src: '/nope.png', status: 'online', renderTo: document.body });
    expect(q(a, '.op-avatar__text')[0].textContent).toBe('AL');
    expect(a.el.getAttribute('aria-label')).toBe('Ada Lovelace');
    const b = create<Avatar>({ type: 'avatar', name: 'Ada Lovelace', renderTo: document.body });
    expect(b.el.style.getPropertyValue('--op-avatar-c')).toBe(a.el.style.getPropertyValue('--op-avatar-c'));
    a.el.querySelector('img')!.dispatchEvent(new Event('error'));
    expect(a.el.querySelector('img')).toBeNull();
    expect(q(a, '.op-avatar__status.is-online')).toHaveLength(1);
  });
});

describe('Image', () => {
  it('keeps its ratio, shows the icon, and tries a fallback URL once when the file fails', async () => {
    const { create: mk } = await import('optikos');
    const i = mk<any>({ type: 'image', src: '/a.png', alt: 'Logo', ratio: '16/9', fallback: '/b.png', renderTo: document.body });
    expect(i.el.style.aspectRatio.replace(/\s/g, '')).toBe('16/9');
    expect(i.el.querySelector('img').alt).toBe('Logo');
    i.el.querySelector('img').dispatchEvent(new Event('error'));
    expect(i.el.querySelector('img').getAttribute('src')).toBe('/b.png');
    i.el.querySelector('img').dispatchEvent(new Event('error'));
    expect(i.el.querySelector('img')).toBeNull();
    expect(mk<any>({ type: 'image', renderTo: document.body }).el.querySelector('.op-image__fallback svg')).not.toBeNull();
  });

  it('range mode, vertical: one column per lane, bars placed along the block axis', () => {
    const tl = create<Timeline>({
      type: 'timeline', mode: 'range', direction: 'vertical', now: false, from: '08:00', to: '18:00', lanes: ['Mon', 'Tue'], renderTo: document.body,
      items: [{ title: 'Stand-up', lane: 'Mon', start: '08:00', end: '09:00' }, { title: 'Build', lane: 'Tue', start: '13:00', end: '18:00' }],
    });
    expect(tl.el.classList.contains('op-timeline--vertical')).toBe(true);
    expect(tl.el.style.gridTemplateColumns).toContain('repeat(2');
    const [build] = q(tl, '.op-timeline__bar').filter((b) => b.textContent === 'Build');
    expect(build.style.insetBlockStart).toBe('50.000%');
    expect(build.style.insetInlineStart).toBe('');
    expect(tl.getScale()!.vertical).toBe(true);
  });
});
