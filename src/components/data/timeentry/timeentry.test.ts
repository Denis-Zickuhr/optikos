import { describe, it, expect, afterEach } from 'vitest';
import { create, Timeline, timeEntry, formatDuration, Store, type TimeEntryOptions } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const q = (c: { el: HTMLElement }, sel: string) => Array.from(c.el.querySelectorAll<HTMLElement>(sel));
const items = () => [
  { title: 'Spec', lane: 'Mon', start: '08:00', end: '10:00' },
  { title: 'Review', lane: 'Mon', start: '10:00', end: '11:00' },
  { title: 'Build', lane: 'Tue', start: '09:00', end: '12:00' },
];
const mk = (opts: TimeEntryOptions = {}, cfg: object = {}) =>
  create<Timeline>({ type: 'timeline', mode: 'range', now: false, from: '08:00', to: '18:00', lanes: ['Mon', 'Tue'], items: items(), plugins: [timeEntry(opts)], renderTo: document.body, ...cfg } as any);
const key = (el: HTMLElement, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const bar = (tl: Timeline, title: string) => q(tl, '.op-timeline__bar').find((b) => b.textContent === title)!;
const lane = (tl: Timeline, name: string) => q(tl, '.op-timeline__lane').find((l) => l.getAttribute('aria-label') === name)!;

/** happy-dom has no layout: the tracks are 1000 px wide (100 px per hour, from 08:00), lanes 40 px tall. */
function layout(tl: Timeline, vertical = false) {
  q(tl, '.op-timeline__lane').forEach((l, i) => {
    l.getBoundingClientRect = () => (vertical ? { top: 0, bottom: 1000, left: i * 40, right: i * 40 + 40, width: 40, height: 1000 } : { top: i * 40, bottom: i * 40 + 40, left: 0, right: 1000, width: 1000, height: 40 }) as DOMRect;
  });
  q(tl, '.op-timeline__track').forEach((t) => (t.getBoundingClientRect = () => (vertical ? { top: 0, bottom: 1000, left: 0, right: 40, width: 40, height: 1000 } : { top: 0, bottom: 40, left: 0, right: 1000, width: 1000, height: 40 }) as DOMRect));
}
const ptr = (el: HTMLElement, type: string, x: number, y = 5) => {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.assign(e, { pointerId: 1, pointerType: 'mouse' });
  el.dispatchEvent(e);
};

describe('formatDuration', () => {
  it('writes minutes the way people do', () => {
    expect(formatDuration(450)).toBe('7h30');
    expect(formatDuration(480)).toBe('8h');
    expect(formatDuration(45)).toBe('45m');
  });
});

describe('timeEntry', () => {
  it('shows each lane total and a grand total', () => {
    const tl = mk();
    expect(lane(tl, 'Mon').querySelector('.op-timeline__lane-name')!.textContent).toContain('3h');
    expect(q(tl, '.op-timeentry__grand strong')[0].textContent).toBe('6h');
  });

  it('target marks a lane under, met or over', () => {
    const tl = mk({ target: 180 });
    expect(lane(tl, 'Mon').classList.contains('is-met')).toBe(true);
    expect(lane(tl, 'Tue').classList.contains('is-met')).toBe(true);
    const tl2 = mk({ target: 240 }, { renderTo: undefined });
    tl2.mount(document.body);
    expect(lane(tl2, 'Mon').classList.contains('is-under')).toBe(true);
  });

  it('keyboard: arrows move a bar by a step, Shift resizes, Delete removes', () => {
    const tl = mk({ step: 30 });
    const events: string[] = [];
    tl.on('change', (it: any) => events.push(it.title));
    key(bar(tl, 'Build'), 'ArrowRight');
    expect(tl.getItems().find((i) => i.title === 'Build')).toMatchObject({ start: '09:30', end: '12:30' });
    key(bar(tl, 'Build'), 'ArrowRight', { shiftKey: true });
    expect(tl.getItems().find((i) => i.title === 'Build')).toMatchObject({ start: '09:30', end: '13:00' });
    key(bar(tl, 'Build'), 'ArrowLeft', { shiftKey: true, altKey: true });
    expect(tl.getItems().find((i) => i.title === 'Build')).toMatchObject({ start: '09:00', end: '13:00' });
    expect(events).toHaveLength(3);
    let removed: any;
    tl.on('remove', (it: unknown) => (removed = it));
    key(bar(tl, 'Build'), 'Delete');
    expect(removed.title).toBe('Build');
    expect(tl.getItems()).toHaveLength(2);
  });

  it('keyboard: Enter on a lane adds an entry at its cursor', () => {
    const tl = mk({ step: 30, duration: 60 });
    let made: any;
    tl.on('create', (it: unknown) => (made = it));
    key(lane(tl, 'Tue'), 'ArrowRight');
    key(lane(tl, 'Tue'), 'Enter');
    expect(made).toMatchObject({ lane: 'Tue', start: '08:30', end: '09:30' });
    expect(tl.getItems()).toHaveLength(4);
  });

  it('overlap: false refuses a move into a neighbour and stops a resize at it', () => {
    const tl = mk({ step: 30, overlap: false });
    key(bar(tl, 'Spec'), 'ArrowRight');
    expect(tl.getItems()[0]).toMatchObject({ start: '08:00', end: '10:00' });
    key(bar(tl, 'Spec'), 'ArrowRight', { shiftKey: true });
    expect(tl.getItems()[0].end).toBe('10:00');
  });

  it('editable: false locks an entry', () => {
    const tl = mk({ editable: (it) => it.title !== 'Spec' });
    expect(bar(tl, 'Spec').classList.contains('is-locked')).toBe(true);
    key(bar(tl, 'Spec'), 'Delete');
    expect(tl.getItems()).toHaveLength(3);
  });

  it('before-change can cancel', () => {
    const tl = mk({ step: 30 });
    tl.on('before-change', () => false);
    key(bar(tl, 'Build'), 'ArrowRight');
    expect(tl.getItems().find((i) => i.title === 'Build')!.start).toBe('09:00');
  });

  it('moveAcrossLanes: ↑/↓ change the lane', () => {
    const tl = mk({ moveAcrossLanes: true });
    key(bar(tl, 'Build'), 'ArrowUp');
    expect(tl.getItems().find((i) => i.title === 'Build')!.lane).toBe('Mon');
  });

  it('with a store, the records are updated, not the items', () => {
    const store = new Store<any>({ data: items() });
    const tl = mk({ step: 30 }, { items: undefined, store });
    key(bar(tl, 'Build'), 'ArrowRight');
    expect(store.getRange().find((r) => r.get('title') === 'Build')!.get('start')).toBe('09:30');
  });

  it('pointer: drag an empty lane to create, a bar to move, its end to resize', () => {
    const tl = mk({ step: 30 });
    layout(tl);
    const track = lane(tl, 'Tue').querySelector<HTMLElement>('.op-timeline__track')!;
    ptr(track, 'pointerdown', 700);
    ptr(track, 'pointermove', 900);
    ptr(track, 'pointerup', 900);
    expect(tl.getItems().find((i) => i.lane === 'Tue' && i.title !== 'Build')).toMatchObject({ start: '15:00', end: '17:00' });

    layout(tl);
    const b = bar(tl, 'Spec');
    ptr(b, 'pointerdown', 50);
    ptr(b, 'pointermove', 150);
    ptr(b, 'pointerup', 150);
    expect(tl.getItems()[0]).toMatchObject({ start: '09:00', end: '11:00' });

    layout(tl);
    const end = bar(tl, 'Spec').querySelector<HTMLElement>('.op-timeentry__handle--end')!;
    ptr(end, 'pointerdown', 300);
    ptr(end, 'pointermove', 400);
    ptr(end, 'pointerup', 400);
    expect(tl.getItems()[0]).toMatchObject({ start: '09:00', end: '12:00' });
  });

  it('Escape cancels a drag', () => {
    const tl = mk({ step: 30 });
    layout(tl);
    const b = bar(tl, 'Spec');
    ptr(b, 'pointerdown', 50);
    ptr(b, 'pointermove', 250);
    key(b, 'Escape');
    ptr(b, 'pointerup', 250);
    expect(tl.getItems()[0]).toMatchObject({ start: '08:00', end: '10:00' });
  });

  it('a list-mode timeline is left alone, and destroy releases everything', () => {
    const list = create<Timeline>({ type: 'timeline', items: [{ title: 'A' }], plugins: [timeEntry()], renderTo: document.body });
    expect(q(list, '.op-timeline__item')).toHaveLength(1);
    const tl = mk();
    tl.destroy();
    expect(document.querySelector('.op-timeentry__grand')).toBeNull();
  });

  it('form: fills a new entry from your dialog, and cancels on false', async () => {
    const asked: string[] = [];
    let answer: any = { title: 'Client call', text: 'Q4 plan' };
    const tl = mk({ step: 30, form: (it, mode) => (asked.push(`${mode}:${it.start}-${it.end}`), answer) });
    key(lane(tl, 'Tue'), 'Enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(asked).toEqual(['create:08:00-09:00']);
    expect(tl.getItems().find((i) => i.title === 'Client call')).toMatchObject({ lane: 'Tue', text: 'Q4 plan', start: '08:00' });
    answer = false;
    key(lane(tl, 'Tue'), 'Enter');
    await Promise.resolve();
    await Promise.resolve();
    expect(tl.getItems()).toHaveLength(4);
  });

  it('form: edit (Enter on a block) changes only what the dialog returns', async () => {
    const changes: any[] = [];
    const tl = mk({ form: async (it, mode) => (mode === 'edit' ? { title: `${it.title}!` } : false) });
    tl.on('change', (it: any, next: any) => changes.push(next));
    key(bar(tl, 'Build'), 'Enter');
    await new Promise((r) => setTimeout(r, 0));
    expect(tl.getItems().find((i) => i.title === 'Build!')).toMatchObject({ start: '09:00', end: '12:00' });
    expect(changes).toEqual([{ title: 'Build!' }]);
  });

  it('vertical: ↑/↓ move in time, ←/→ change lane, the pointer reads y', () => {
    const tl = mk({ step: 30, moveAcrossLanes: true }, { direction: 'vertical' });
    expect(tl.el.classList.contains('op-timeline--vertical')).toBe(true);
    key(bar(tl, 'Build'), 'ArrowDown');
    expect(tl.getItems().find((i) => i.title === 'Build')).toMatchObject({ start: '09:30', end: '12:30' });
    key(bar(tl, 'Build'), 'ArrowLeft');
    expect(tl.getItems().find((i) => i.title === 'Build')!.lane).toBe('Mon');
    layout(tl, true);
    const b = bar(tl, 'Spec');
    ptr(b, 'pointerdown', 5, 50);
    ptr(b, 'pointermove', 5, 150);
    ptr(b, 'pointerup', 5, 150);
    expect(tl.getItems()[0]).toMatchObject({ start: '09:00', end: '11:00' });
    expect(b.style.insetBlockStart).toMatch(/%$/);
  });
});
