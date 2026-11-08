// Motion lab: one card per rule of the 20 motion rules, live settings, a global on/off switch and a slow-motion control. Public API only.
import {
  create, motion, isBouncy, popIn, stagger, staggerDelay, staggerDetails, pulse, enter, exit, moveArc, rubberBand, rubberScroll, dragKnob, swap, reveal, wipeColor, layoutId, iconEl,
  Dropdown, Menu, toast, type Button, type Slider, type Container,
} from 'optikos';

const $ = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), { className: cls, textContent: text });

const style = $('style');
style.textContent = `html,body{margin:0;min-height:100%}body{background:var(--op-color-bg);color:var(--op-color-fg);font:var(--op-font-size)/var(--op-line-height) var(--op-font-family)}
.ml-top{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:var(--op-space-4);align-items:center;padding:var(--op-space-3) var(--op-space-5);background:var(--op-color-surface);border-bottom:1px solid var(--op-color-border)}
.ml-top h1{margin:0;font-size:var(--op-font-size-xl)}.ml-top .grow{flex:1}
.ml-wrap{display:grid;grid-template-columns:minmax(17rem,22rem) 1fr;gap:var(--op-space-4);padding:var(--op-space-4) var(--op-space-5);align-items:start}
@media (max-width:60rem){.ml-wrap{grid-template-columns:1fr}}
.ml-cfg{position:sticky;top:5rem;display:flex;flex-direction:column;gap:var(--op-space-2);padding:var(--op-space-3);background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);max-height:calc(100vh - 6.5rem);overflow:auto}
.ml-cfg h2,.ml-card h2{margin:0;font-size:var(--op-font-size-lg)}.ml-cfg small{color:var(--op-color-fg-muted)}
.ml-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(21rem,1fr));gap:var(--op-space-4)}
.ml-card{display:flex;flex-direction:column;gap:var(--op-space-2);padding:var(--op-space-4);background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius-lg);min-width:0}
.ml-card p{margin:0;color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}.ml-card .n{color:var(--op-color-primary);font-weight:700;margin-inline-end:.4rem}
.ml-play{display:flex;flex-wrap:wrap;gap:var(--op-space-2);align-items:center;min-height:7rem;padding:var(--op-space-3);background:var(--op-color-surface-2);border-radius:var(--op-radius);position:relative;overflow:hidden}
.ml-read{font:var(--op-font-size-sm) var(--op-font-mono);color:var(--op-color-fg-muted)}
.ml-box{inline-size:3rem;block-size:3rem;background:var(--op-color-primary);border-radius:var(--op-radius)}
.ml-row{padding:.35rem .7rem;background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius-sm);min-inline-size:9rem}
.ml-tile{display:grid;place-items:center;inline-size:6rem;block-size:4.5rem;background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius);cursor:pointer;user-select:none}
.ml-stage{position:relative;inline-size:100%;block-size:6.5rem}.ml-dot{position:absolute;inline-size:1.5rem;block-size:1.5rem;border-radius:50%}
.ml-track{position:relative;inline-size:100%;block-size:.5rem;margin-block:1.2rem;background:var(--op-color-border-strong);border-radius:99px}.ml-knob{position:absolute;inset-block-start:50%;inline-size:1.6rem;block-size:1.6rem;margin:-.8rem 0 0 -.8rem;background:var(--op-color-primary);border:3px solid var(--op-color-surface);border-radius:50%;cursor:grab;touch-action:none;box-shadow:var(--op-shadow-sm)}
.ml-pop{padding:var(--op-space-3);max-inline-size:14rem}.ml-chip{display:inline-flex;align-items:center;justify-content:center;min-inline-size:7rem;min-block-size:2rem;padding:0 .8rem;border-radius:99px;background:var(--op-color-primary-soft);color:var(--op-color-primary);font-weight:600}
.ml-scroll{block-size:8rem;inline-size:100%;overflow:auto;background:var(--op-color-surface);border-radius:var(--op-radius);padding:.25rem}.ml-photo{inline-size:100%;block-size:6rem;border-radius:var(--op-radius);background:linear-gradient(135deg,#6366f1,#ec4899,#f59e0b)}
.ml-hold{transition:background .6s ease,box-shadow .6s ease}.ml-hold:hover{background:var(--op-color-primary-soft);box-shadow:var(--op-shadow)}
.ml-big{inline-size:100%;block-size:9rem;border-radius:var(--op-radius-lg)}`;
document.head.append(style);

// ---- slow motion: scales every Web Animation of the page, so the details can be watched -------------------------------------------------
let slow = 1;
const nativeAnimate = Element.prototype.animate;
Element.prototype.animate = function (this: Element, frames: Keyframe[] | PropertyIndexedKeyframes | null, o?: number | KeyframeAnimationOptions) {
  const opts = typeof o === 'number' ? { duration: o * slow } : { ...o, duration: Number(o?.duration ?? 0) * slow, delay: Number(o?.delay ?? 0) * slow };
  return nativeAnimate.call(this, frames, opts);
};

// ---- top bar and settings --------------------------------------------------------------------------------------------------------------------
const top = $('header', 'ml-top');
top.append($('h1', '', 'Motion lab'));
const toggle = create({ type: 'checkbox', boxLabel: 'Motion enabled (global switch)', value: motion.get().enabled, stableSize: false, listeners: { change: (v: boolean) => (v ? motion.enable() : motion.disable()) } } as never) as any;
const reduce = create({ type: 'checkbox', boxLabel: 'Respect OS "reduce motion"', value: motion.get().respectReducedMotion, stableSize: false, listeners: { change: (v: boolean) => motion.set({ respectReducedMotion: v }) } } as never) as any;
const slowSl = create<Slider>({ type: 'slider', min: 1, max: 8, step: 1, value: 1, width: 150, stableSize: false, format: (v: number) => `×${v}`, showValue: 'always', listeners: { change: (v: number) => (slow = v) } } as never);
top.append(toggle.el, reduce.el, $('span', 'grow'), $('span', 'ml-read', 'slow motion'), slowSl.el, create<Button>({ type: 'button', text: 'Reset defaults', handler: () => motion.reset() }).el);

const cfg = $('aside', 'ml-cfg');
cfg.append($('h2', '', 'Settings'), $('small', '', 'Everything here is motion.set(...). Defaults are the numbers of the rules.'));
const sliders: Array<() => void> = [];
const num = (label: string, get: () => number, set: (v: number) => void, min: number, max: number, step: number, fmt = (v: number) => String(v)) => {
  const s = create<Slider>({ type: 'slider', label, min, max, step, value: get(), format: fmt, showValue: 'always', stableSize: false, listeners: { change: (v: number) => set(v) } } as never);
  cfg.append(s.el);
  sliders.push(() => s.setValue(get(), true));
};
const sec = (t: string) => cfg.append($('h2', '', t));
sec('Timing');
num('Dropdown duration (clamped 150–250 ms)', () => motion.get().duration.dropdown, (v) => motion.set({ duration: { dropdown: v } }), 50, 500, 10, (v) => `${v} ms → ${Math.max(150, Math.min(250, v))}`);
num('Popover duration', () => motion.get().duration.popover, (v) => motion.set({ duration: { popover: v } }), 80, 600, 10, (v) => `${v} ms`);
num('Modal duration', () => motion.get().duration.modal, (v) => motion.set({ duration: { modal: v } }), 80, 600, 10, (v) => `${v} ms`);
num('Entrance duration', () => motion.get().duration.enter, (v) => motion.set({ duration: { enter: v } }), 80, 800, 10, (v) => `${v} ms`);
num('Exit ratio (exit = enter × ratio)', () => motion.get().exitRatio, (v) => motion.set({ exitRatio: v }), 0.3, 1, 0.05, (v) => `${v} (${Math.round((1 - v) * 100)}% shorter)`);
num('Stagger step', () => motion.get().stagger.step, (v) => motion.set({ stagger: { step: v } }), 0, 120, 5, (v) => `${v} ms`);
num('Move duration (arc, layoutId)', () => motion.get().duration.move, (v) => motion.set({ duration: { move: v } }), 150, 1500, 50, (v) => `${v} ms`);
num('Pulse duration', () => motion.get().duration.pulse, (v) => motion.set({ duration: { pulse: v } }), 150, 1200, 50, (v) => `${v} ms`);
sec('Scale and shape');
num('Press scale', () => motion.get().press.scale, (v) => motion.set({ press: { scale: v } }), 0.8, 1, 0.01);
num('Popover start scale', () => motion.get().popover.scale, (v) => motion.set({ popover: { scale: v } }), 0.7, 1, 0.01);
num('Knob stretch', () => motion.get().stretch.amount, (v) => motion.set({ stretch: { amount: v } }), 0, 0.5, 0.01, (v) => `${Math.round(v * 100)}%`);
num('Arc bend', () => motion.get().arc.bend, (v) => motion.set({ arc: { bend: v } }), 0, 0.7, 0.05);
num('Crossfade blur', () => motion.get().blur, (v) => motion.set({ blur: v }), 0, 14, 1, (v) => `${v}px`);
num('Rubber resistance', () => motion.get().rubber.resistance, (v) => motion.set({ rubber: { resistance: v } }), 0.2, 1, 0.05);
motion.on(() => {
  sliders.forEach((f) => f());
  toggle.setValue(motion.get().enabled, true);
  reduce.setValue(motion.get().respectReducedMotion, true);
});

// ---- cards ---------------------------------------------------------------------------------------------------------------------------------------
const grid = $('div', 'ml-grid');
const card = (n: number, title: string, rule: string, play: (host: HTMLElement) => void) => {
  const c = $('section', 'ml-card');
  const h = $('h2');
  h.append($('span', 'n', String(n).padStart(2, '0')), title);
  const host = $('div', 'ml-play');
  c.append(h, $('p', '', rule), host);
  grid.append(c);
  play(host);
};
const btn = (host: HTMLElement, text: string, fn: (b: Button) => void, variant: 'primary' | 'default' | 'ghost' = 'default') => host.append(create<Button>({ type: 'button', text, variant, handler: (b: Button) => fn(b) }).el);
const read = (host: HTMLElement) => host.appendChild($('div', 'ml-read'));
const fx = (el: HTMLElement, frames: Keyframe[], phase: 'enter' | 'exit' | 'move', kind: 'enter' | 'move' = 'enter') => el.animate(frames, { duration: motion.ms(kind, phase === 'exit' ? 'exit' : 'enter'), easing: motion.easing(phase), fill: 'both' });

card(1, 'Entrance easing', 'Things that enter use ease-out: they arrive fast and settle softly.', (host) => {
  const ball = $('div', 'ml-box');
  const r = read(host);
  const go = () => { fx(ball, [{ transform: 'translateX(-9rem)', opacity: 0 }, { transform: 'none', opacity: 1 }], 'enter'); r.textContent = `${motion.get().ease.out} · ${motion.ms('enter')}ms`; };
  host.prepend(ball);
  btn(host, 'Replay', go, 'primary');
  go();
});

card(2, 'Dropdown speed', 'Dropdowns and menus open in 150–250 ms: the value is clamped. Open the menu; raise the duration in Settings past 250 and nothing changes.', (host) => {
  const menu = create<Menu>({ type: 'menu', items: ['Rename', 'Duplicate', 'Move…', '-', 'Delete'].map((t) => (t === '-' ? '-' : { text: t, handler: () => undefined })) } as never);
  const r = read(host);
  const upd = () => (r.textContent = `dropdown: ${motion.get().duration.dropdown}ms set → ${motion.dropdownMs()}ms used`);
  motion.on(upd);
  upd();
  btn(host, 'Open menu ▾', (b) => menu.showBy(b), 'primary');
});

card(3, 'Stagger in lists', 'List rows enter 30 ms apart, each ease-out (capped after 12 rows).', (host) => {
  const list = $('div');
  list.style.cssText = 'display:flex;flex-direction:column;gap:.3rem;inline-size:100%';
  const rows = ['Inbox', 'Starred', 'Sent', 'Drafts', 'Archive', 'Spam', 'Trash'].map((t) => list.appendChild($('div', 'ml-row', t)));
  const r = read(host);
  host.prepend(list);
  const go = () => { void stagger(rows); r.textContent = `delays: ${rows.map((_, i) => staggerDelay(i)).join(', ')} ms`; };
  btn(host, 'Replay', go, 'primary');
  go();
});

card(4, 'Press scale', 'Anything interactive shrinks to 0.97 under the finger. Press and hold each one.', (host) => {
  btn(host, 'Button', () => undefined, 'primary');
  for (const t of ['Card', 'Tile']) { const c = $('div', 'ml-tile', t); c.dataset.opPress = ''; host.append(c); }
  read(host).textContent = 'CSS: transform: scale(var(--op-motion-press-scale))';
});

card(5, 'Knob stretch', 'A knob stretches ~12 % in the direction it moves while dragged, and relaxes when you let go. The first is dragKnob(); the second is the Slider component.', (host) => {
  const track = $('div', 'ml-track');
  const knob = $('div', 'ml-knob');
  track.append(knob);
  const r = read(host);
  dragKnob(knob, track, { min: 0, max: 100, value: 30, onChange: (v) => (r.textContent = `value ${v}`) });
  host.append(track);
  host.append(create<Slider>({ type: 'slider', min: 0, max: 100, value: 60, showValue: 'always', width: 260 } as never).el);
});

card(6, 'Stagger the details', 'The parts of a card settle in order: title, text, chips, buttons.', (host) => {
  const c = $('div');
  c.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;inline-size:100%';
  c.append($('strong', 't', 'Weekend in Lisbon'), $('span', 'x', '3 nights · 2 travellers'), $('span', 'x', 'Flights and hotel included'));
  const chips = $('div'); chips.style.cssText = 'display:flex;gap:.4rem';
  for (const t of ['Flight', 'Hotel', 'Tour']) chips.append($('span', 'ml-chip c', t));
  c.append(chips, create<Button>({ type: 'button', text: 'Book now', variant: 'primary', cls: 'b' }).el);
  host.prepend(c);
  const go = () => void staggerDetails(c, ['.t', '.x', '.c', '.b']);
  btn(host, 'Replay', go, 'primary');
  go();
});

card(7, 'Arc motion', 'Moving things follow a curve, not a ruler line. Top: arc. Bottom: straight (for comparison).', (host) => {
  const st = $('div', 'ml-stage');
  const a = $('div', 'ml-dot'); const b = $('div', 'ml-dot');
  a.style.cssText = 'background:var(--op-color-primary);left:.5rem;top:.3rem'; b.style.cssText = 'background:var(--op-color-fg-muted);left:.5rem;bottom:.3rem';
  st.append(a, b);
  host.prepend(st);
  let to = true;
  const go = () => {
    const w = st.clientWidth - 40;
    a.getAnimations().forEach((x) => x.cancel()); b.getAnimations().forEach((x) => x.cancel());
    const dx = to ? w : 0;
    // `from` stays where it is: arc one way, back the other
    const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect();
    const target = { x: ra.left + ra.width / 2 + (to ? w : -w), y: ra.top + ra.height / 2 + 30 * (to ? 1 : -1) };
    moveArc(a, target)?.finished.then(() => { a.style.transform = `translate(${to ? w : 0}px, ${to ? 30 : 0}px)`; }).catch(() => undefined);
    b.animate([{ transform: `translate(${to ? 0 : w}px,0)` }, { transform: `translate(${dx}px,0)` }], { duration: motion.get().duration.move, easing: motion.easing('move'), fill: 'forwards' });
    void rb;
    to = !to;
  };
  btn(host, 'Replay', go, 'primary');
});

card(8, 'Success pulse', 'A subtle ring confirms that something worked.', (host) => {
  btn(host, 'Save', (b) => { void pulse(b.el); toast({ type: 'success', text: 'Saved' }); }, 'primary');
  btn(host, 'Button.pulse()', (b) => b.pulse());
  const ok = $('span', 'ml-chip', '✓ Done'); host.append(ok);
  btn(host, 'Pulse this', () => void pulse(ok));
});

card(9, 'Ease-in-out for travel', 'Crossing the screen from A to B accelerates, then decelerates. Top: ease-in-out. Bottom: linear.', (host) => {
  const st = $('div', 'ml-stage');
  const a = $('div', 'ml-dot'); const b = $('div', 'ml-dot');
  a.style.cssText = 'background:var(--op-color-primary);left:0;top:.3rem'; b.style.cssText = 'background:var(--op-color-fg-muted);left:0;bottom:.3rem';
  st.append(a, b); host.prepend(st);
  let right = true;
  const go = () => {
    const w = st.clientWidth - 30;
    const frames = (r: boolean): Keyframe[] => [{ transform: `translateX(${r ? 0 : w}px)` }, { transform: `translateX(${r ? w : 0}px)` }];
    a.animate(frames(right), { duration: motion.get().duration.move, easing: motion.easing('move'), fill: 'forwards' });
    b.animate(frames(right), { duration: motion.get().duration.move, easing: 'linear', fill: 'forwards' });
    right = !right;
  };
  btn(host, 'Replay', go, 'primary');
});

card(10, 'Popover starts at 0.95', 'Popovers and floating panels grow from scale 0.95 while fading in.', (host) => {
  const dd = create<Dropdown>({ type: 'dropdown', content: Object.assign($('div', 'ml-pop'), { innerHTML: '<strong>Share this link</strong><br><small>Anyone with it can view.</small>' }), placement: 'bottom-start', closeOnOutside: true } as never);
  const open = create<Button>({ type: 'button', text: 'Open popover', variant: 'primary', handler: (b: Button) => { dd.setAnchor(b.el); dd.toggle(); } });
  host.append(open.el);
  read(host).textContent = `scale ${motion.get().popover.scale} → 1`;
  motion.on(() => (host.lastElementChild!.textContent = `scale ${motion.get().popover.scale} → 1`));
});

card(11, 'Enter from the trigger', 'The popover grows out of the exact button that opened it (transform-origin). Try the three buttons: left, centre, right.', (host) => {
  host.style.justifyContent = 'space-between';
  for (const t of ['Left', 'Centre', 'Right']) {
    const dd = create<Dropdown>({ type: 'dropdown', content: Object.assign($('div', 'ml-pop'), { textContent: `Opened from “${t}”` }), placement: 'bottom-start' } as never);
    const b = create<Button>({ type: 'button', text: t, handler: (x: Button) => { dd.setAnchor(x.el); dd.toggle(); } });
    host.append(b.el);
  }
});

card(12, 'Exit toward the trigger', 'Closing is the inverse: it shrinks back toward the trigger, 20 % faster. Open and close (click the button again, or Esc).', (host) => {
  const dd = create<Dropdown>({ type: 'dropdown', content: Object.assign($('div', 'ml-pop'), { textContent: 'Watch me shrink back to the button.' }), placement: 'bottom-start' } as never);
  btn(host, 'Toggle', (b) => { dd.setAnchor(b.el); dd.toggle(); }, 'primary');
  const r = read(host);
  const upd = () => (r.textContent = `in ${motion.ms('popover')}ms · out ${motion.ms('popover', 'exit')}ms`);
  motion.on(upd);
  upd();
});

card(13, 'No bounce', 'Everyday UI does not overshoot: curves that go past the target are refused (until you allow them).', (host) => {
  const list = $('div', 'ml-read');
  list.style.whiteSpace = 'pre-line';
  const input = create({ type: 'textfield', value: 'cubic-bezier(0.3, 1.6, 0.3, 1)', width: 260, stableSize: false } as never) as any;
  const out = $('div', 'ml-read');
  const verdict = () => (list.textContent = ['cubic-bezier(0, 0, 0.2, 1)', 'cubic-bezier(0.4, 0, 0.2, 1)', 'cubic-bezier(0.3, 1.6, 0.3, 1)', 'spring(1, 80, 10)'].map((e) => `${isBouncy(e) ? '✗ bounces ' : '✓ ok       '} ${e}`).join('\n'));
  verdict();
  host.append(list, input.el);
  btn(host, 'Try as ease.out', () => { const r = motion.set({ ease: { out: input.getValue() } }); out.textContent = r.rejected.length ? `refused: ${r.rejected[0]}` : `accepted: ${motion.get().ease.out}`; });
  host.append(out);
  host.append(create({ type: 'checkbox', boxLabel: 'allowBounce', value: motion.get().allowBounce, stableSize: false, listeners: { change: (v: boolean) => motion.set({ allowBounce: v }) } } as never).el);
});

card(14, 'No tweening while held', 'Hover tweens the colour and shadow, but while you press and hold only the scale may animate.', (host) => {
  const c = $('div', 'ml-tile ml-hold', 'Hold me');
  c.dataset.opPress = '';
  const r = read(host);
  const show = () => (r.textContent = `transition-property: ${getComputedStyle(c).transitionProperty}`);
  c.addEventListener('pointerdown', () => requestAnimationFrame(show));
  for (const e of ['pointerup', 'pointerleave', 'pointercancel']) c.addEventListener(e, () => requestAnimationFrame(show));
  host.prepend(c);
  show();
});

card(15, 'Exits are 20 % shorter', 'The same element leaves faster than it came, and with ease-in.', (host) => {
  const box = $('div', 'ml-box');
  const r = read(host);
  let shown = true;
  host.prepend(box);
  btn(host, 'Toggle', () => {
    shown = !shown;
    if (shown) { void enter(box, { dy: 16 }); r.textContent = `enter ${motion.ms('enter')}ms · ${motion.get().ease.out}`; }
    else { void exit(box, { dy: 16 }); r.textContent = `exit ${motion.ms('enter', 'exit')}ms · ${motion.get().ease.in}`; }
  }, 'primary');
});

card(16, 'Cross-state overlap', 'Old and new states overlap during the change: no flash, no blank frame. Left: overlap. Right: hard swap.', (host) => {
  const states = ['Draft', 'In review', 'Approved', 'Published'];
  let i = 0;
  const a = $('span', 'ml-chip', states[0]); const b = $('span', 'ml-chip', states[0]);
  host.prepend(a, b);
  btn(host, 'Next state', () => { i = (i + 1) % states.length; void swap(a, states[i]); b.textContent = states[i]; }, 'primary');
});

card(17, 'Masks', 'Reveal content and change colour through a mask that wipes across, instead of a plain fade.', (host) => {
  const photo = $('div', 'ml-photo');
  host.prepend(photo);
  for (const f of ['left', 'right', 'top', 'center'] as const) btn(host, `reveal ${f}`, () => void reveal(photo, f));
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7'];
  const sw = $('div', 'ml-tile', 'Wipe colour'); sw.style.cssText += ';color:#fff;background:#3b82f6;inline-size:8rem';
  let k = 0;
  sw.addEventListener('click', () => void wipeColor(sw, colors[k++ % colors.length], k % 2 ? 'left' : 'right'));
  host.append(sw);
});

card(18, 'Crossfade with blur', 'Icons and states swap with an opacity crossfade plus a soft blur.', (host) => {
  const icons = ['heart', 'bell', 'search', 'settings'];
  let k = 0;
  const holder = $('span');
  holder.style.cssText = 'display:inline-grid;place-items:center;inline-size:3rem;block-size:3rem;font-size:1.8rem;background:var(--op-color-surface);border-radius:50%';
  holder.append(iconEl(icons[0]));
  host.prepend(holder);
  btn(host, 'Swap icon', () => void swap(holder, iconEl(icons[++k % icons.length])), 'primary');
  read(host).textContent = `blur ${motion.get().blur}px · ${motion.get().duration.swap}ms`;
});

card(19, 'Rubber band at the limits', 'Resistance only when you push past the ends: scroll the list up at the top or down at the bottom (wheel or touch). The pill is dragged with rubberBand().', (host) => {
  const sc = $('div', 'ml-scroll');
  for (let n = 1; n <= 12; n++) sc.append($('div', 'ml-row', `Row ${n}`));
  sc.querySelectorAll<HTMLElement>('.ml-row').forEach((r) => (r.style.marginBlock = '.25rem'));
  host.prepend(sc);
  rubberScroll(sc);
  const lane = $('div'); lane.style.cssText = 'position:relative;inline-size:100%;block-size:2.5rem;border:1px dashed var(--op-color-border-strong);border-radius:99px';
  const pill = $('div', 'ml-chip', 'drag me'); pill.style.cssText = 'position:absolute;left:0;top:.25rem;cursor:grab;touch-action:none';
  lane.append(pill); host.append(lane);
  pill.addEventListener('pointerdown', (e) => {
    const x0 = e.clientX; const max = lane.clientWidth - pill.offsetWidth; pill.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => { const d = m.clientX - x0; pill.style.transform = `translateX(${d < 0 ? rubberBand(d, 60) : d > max ? max + rubberBand(d - max, 60) : d}px)`; };
    const up = () => { pill.removeEventListener('pointermove', move); pill.removeEventListener('pointerup', up); const from = pill.style.transform; pill.style.transform = ''; pill.animate([{ transform: from }, { transform: 'none' }], { duration: motion.get().rubber.settle, easing: motion.easing('enter') }); };
    pill.addEventListener('pointermove', move); pill.addEventListener('pointerup', up);
  });
});

card(20, 'Shared layout (layoutId)', 'The same element keeps its identity between two places: click a tile and it flies into the detail, then back.', (host) => {
  const row = $('div'); row.style.cssText = 'display:flex;gap:.5rem;inline-size:100%';
  const bg = ['linear-gradient(135deg,#6366f1,#22d3ee)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#10b981,#84cc16)'];
  const tiles = bg.map((g, i) => { const t = $('div', 'ml-tile'); t.style.cssText = `background:${g};flex:1;block-size:4rem`; t.dataset.id = `photo-${i}`; row.append(t); return t; });
  const detail = $('div'); detail.style.cssText = 'inline-size:100%;min-block-size:9rem';
  host.prepend(row, detail);
  tiles.forEach((t, i) => t.addEventListener('click', () => {
    layoutId.snapshot(`photo-${i}`, t);
    t.style.visibility = 'hidden';
    const big = $('div', 'ml-big'); big.style.background = bg[i]; big.style.cursor = 'pointer';
    detail.replaceChildren(big);
    layoutId.mount(`photo-${i}`, big);
    big.addEventListener('click', () => { layoutId.snapshot(`photo-${i}`, big); t.style.visibility = ''; layoutId.mount(`photo-${i}`, t); detail.replaceChildren(); });
  }));
});

const wrap = $('div', 'ml-wrap');
wrap.append(cfg, grid);
document.body.append(top, wrap);
void popIn; void (null as unknown as Container);
