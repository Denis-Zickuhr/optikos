import { Container, type ContainerConfig } from '../../../core/container';
import { register } from '../../../core/registry';
import { h, clamp, px } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl, registerIcons } from '../../base/icon/icon';

registerIcons({ play: '<path d="m6 3 14 9-14 9z"/>', pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>' });

addMessages('en', { carousel: 'Carousel', carouselSlide: '{n} of {total}', carouselGo: 'Go to {n}', carouselPrev: 'Previous', carouselNext: 'Next', carouselPause: 'Pause', carouselPlay: 'Play' });
addMessages('pt-BR', { carousel: 'Carrossel', carouselSlide: '{n} de {total}', carouselGo: 'Ir para {n}', carouselPrev: 'Anterior', carouselNext: 'Próximo', carouselPlay: 'Tocar', carouselPause: 'Pausar' });

export interface CarouselConfig extends ContainerConfig {
  /** Items shown together. Default 1. */
  perView?: number;
  /** Space between items (px or CSS length). */
  gap?: number | string;
  /** Past the last item goes to the first (and the other way). */
  loop?: boolean;
  /** ms between items; 0 (default) is off. */
  autoplay?: number;
  /** Default `true`. */
  dots?: boolean;
  /** Default `true`. */
  arrows?: boolean;
  active?: number;
}

/** Pages through its items on a scroll-snap row: images, cards or any component. */
export class Carousel extends Container<CarouselConfig> {
  protected override baseCls = 'op-carousel';
  private track!: HTMLElement;
  private prevBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private dotsEl!: HTMLElement;
  private toggleBtn!: HTMLButtonElement;
  private index = 0;
  private stopped = false;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private playTimer?: ReturnType<typeof setInterval>;

  private get perView() {
    return Math.max(1, this.config.perView ?? 1);
  }
  /** Positions the row can rest on: it moves one item at a time. */
  private get last() {
    return Math.max(0, this.items.length - this.perView);
  }

  protected override build(): HTMLElement {
    const btn = (cls: string, icon: string, key: string, fn: () => void) => {
      const b = h('button', `op-carousel__${cls}`, { type: 'button', 'aria-label': t(key) }, iconEl(icon));
      this.listen(b, 'click', () => {
        this.interact();
        fn();
      });
      return b;
    };
    this.prevBtn = btn('prev', 'chevron-left', 'carouselPrev', () => this.prev());
    this.nextBtn = btn('next', 'chevron-right', 'carouselNext', () => this.next());
    this.toggleBtn = btn('toggle', 'pause', 'carouselPause', () => (this.isPlaying() ? this.pause() : this.play()));
    this.track = h('div', 'op-carousel__track', { tabindex: 0 });
    this.dotsEl = h('div', 'op-carousel__dots');
    return h('div', this.baseCls, { role: 'region', 'aria-roledescription': 'carousel' },
      h('div', 'op-carousel__viewport', {}, this.track, this.prevBtn, this.nextBtn),
      h('div', 'op-carousel__bar', {}, this.dotsEl, this.toggleBtn));
  }

  override getBody(): HTMLElement {
    return this.track;
  }

  protected override onRender() {
    const c = this.config;
    this.el.setAttribute('aria-label', c.ariaLabel ?? t('carousel'));
    this.track.setAttribute('aria-label', c.ariaLabel ?? t('carousel'));
    this.el.style.setProperty('--op-carousel-per-view', String(this.perView));
    if (c.gap != null) this.el.style.setProperty('--op-carousel-gap', px(c.gap));
    super.onRender();
    this.index = clamp(c.active ?? 0, 0, this.last);
    this.on('add', () => this.refresh());
    this.on('remove', () => this.refresh());
    this.listen(this.track, 'scroll', () => {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => this.settle(), 90);
    });
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el !== this.track && !el.closest('.op-carousel__prev, .op-carousel__next, .op-carousel__dots, .op-carousel__toggle')) return;
      const keys: Record<string, () => void> = { ArrowLeft: () => this.step(-1), ArrowRight: () => this.step(1), Home: () => this.goTo(0), End: () => this.goTo(this.last) };
      if (!keys[e.key]) return;
      e.preventDefault();
      this.interact();
      keys[e.key]();
    });
    this.listen(this.track, 'pointerdown', () => this.interact());
    for (const ev of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) this.listen(this.el, ev, () => this.tick());
    this.own(() => {
      clearTimeout(this.scrollTimer);
      clearInterval(this.playTimer);
    });
    this.refresh();
    this.tick();
  }

  protected override onMount() {
    this.align(false);
  }

  /** Reads the item at the left edge from the scroll position (after a swipe or a trackpad scroll). */
  private settle() {
    const stride = this.stride();
    if (!stride || this.destroyed) return;
    const i = clamp(Math.round(Math.abs(this.track.scrollLeft) / stride), 0, this.last);
    if (i !== this.index) this.set(i);
  }

  private stride(): number {
    const [a, b] = this.items;
    return b ? Math.abs(b.el.offsetLeft - a.el.offsetLeft) : 0;
  }

  private align(smooth: boolean) {
    const sign = getComputedStyle(this.track).direction === 'rtl' ? -1 : 1;
    this.track.style.scrollBehavior = smooth ? '' : 'auto';
    this.track.scrollLeft = sign * this.index * this.stride();
  }

  private set(i: number) {
    const old = this.index;
    this.index = i;
    this.config.active = i;
    this.refresh();
    this.emit('change', i, old);
  }

  /** Slides, dots, arrows: everything that follows the item count or the active one. */
  private refresh() {
    if (this.destroyed) return;
    const n = this.items.length;
    this.index = clamp(this.index, 0, this.last);
    this.items.forEach((c, i) => {
      c.el.setAttribute('role', 'group');
      c.el.setAttribute('aria-roledescription', 'slide');
      c.el.setAttribute('aria-label', t('carouselSlide', { n: i + 1, total: n }));
      c.el.toggleAttribute('inert', i < this.index || i >= this.index + this.perView);
    });
    const paged = n > this.perView;
    const dots = this.config.dots !== false && paged;
    this.dotsEl.hidden = !dots;
    if (dots && this.dotsEl.children.length !== this.last + 1) {
      this.dotsEl.replaceChildren(...Array.from({ length: this.last + 1 }, (_, i) => {
        const d = h('button', 'op-carousel__dot', { type: 'button', 'aria-label': t('carouselGo', { n: i + 1 }) });
        this.listen(d, 'click', () => {
          this.interact();
          this.goTo(i);
        });
        return d;
      }));
    }
    [...this.dotsEl.children].forEach((d, i) => (i === this.index ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    const arrows = this.config.arrows !== false && paged;
    this.prevBtn.hidden = this.nextBtn.hidden = !arrows;
    const loop = !!this.config.loop;
    this.prevBtn.disabled = !loop && this.index === 0;
    this.nextBtn.disabled = !loop && this.index === this.last;
    this.el.classList.toggle('is-first', this.index === 0);
    this.el.classList.toggle('is-last', this.index === this.last);
    this.toggleBtn.hidden = !this.config.autoplay || !paged;
    const playing = this.isPlaying();
    this.el.classList.toggle('is-playing', playing);
    this.toggleBtn.replaceChildren(iconEl(playing ? 'pause' : 'play'));
    this.toggleBtn.setAttribute('aria-label', t(playing ? 'carouselPause' : 'carouselPlay'));
    this.track.setAttribute('aria-live', playing ? 'off' : 'polite');
  }

  getActive(): number {
    return this.index;
  }

  /** Goes to item `i` (kept between 0 and the last position). `before-change` can cancel. */
  goTo(i: number): void {
    i = clamp(i, 0, this.last);
    if (i === this.index || this.emit('before-change', i) === false) return;
    this.set(i);
    if (this.rendered) this.align(true);
  }
  setActive(i: number): void {
    this.goTo(i);
  }
  private step(d: 1 | -1) {
    const to = this.index + d;
    this.goTo(this.config.loop ? (to < 0 ? this.last : to > this.last ? 0 : to) : to);
  }
  next(): void {
    this.step(1);
  }
  prev(): void {
    this.step(-1);
  }

  // ---- autoplay -----------------------------------------------------------------------------

  isPlaying(): boolean {
    return !!this.config.autoplay && !this.stopped && !this.reduced();
  }
  private reduced(): boolean {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }
  play(): void {
    this.stopped = false;
    this.refresh();
    this.tick();
  }
  pause(): void {
    this.stopped = true;
    this.refresh();
    this.tick();
  }
  /** Any use of the controls ends autoplay for good (WCAG 2.2.2). */
  private interact() {
    if (!this.stopped) this.pause();
  }
  /** Runs the timer only while playing and nothing holds the pointer or the focus. */
  private tick() {
    clearInterval(this.playTimer);
    this.playTimer = undefined;
    if (!this.isPlaying() || this.el.matches(':hover, :focus-within') || this.items.length <= this.perView) return;
    this.playTimer = setInterval(() => this.goTo(this.index >= this.last ? 0 : this.index + 1), this.config.autoplay);
  }
}
register('carousel', Carousel);
