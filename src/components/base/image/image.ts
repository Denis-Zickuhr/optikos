import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../icon/icon';

export interface ImageConfig extends ComponentConfig {
  src?: string;
  /** What the picture shows, for screen readers. Empty (the default) marks it decorative. */
  alt?: string;
  /** Aspect ratio as CSS: `'16/9'`, `'1'`. The box keeps it while the picture loads, so the page does not jump. */
  ratio?: string;
  fit?: 'cover' | 'contain';
  /** Shown while the picture is missing or fails: an icon name, or a second URL if it contains a `/` or a `.`. Default `image`. */
  fallback?: string;
  /** `lazy` (default) waits until the picture is near the screen. */
  eager?: boolean;
  rounded?: boolean;
}

/** A picture in a box that keeps its aspect ratio and shows a fallback when the file is missing. */
export class Image extends Component<ImageConfig> {
  protected override baseCls = 'op-image';
  private img?: HTMLImageElement;
  private ph!: HTMLElement;

  protected override build() {
    this.ph = h('div', 'op-image__fallback', { 'aria-hidden': 'true' });
    return h('div', this.baseCls, {}, this.ph);
  }

  protected override onRender() {
    const c = this.config;
    if (c.ratio) this.el.style.aspectRatio = c.ratio;
    this.el.classList.add(`op-image--${c.fit ?? 'cover'}`);
    this.el.classList.toggle('op-image--rounded', !!c.rounded);
    this.setSrc(c.src);
  }

  setSrc(src: string | undefined, fallback = false) {
    if (!fallback) this.config.src = src;
    if (!this.rendered) return;
    this.img?.remove();
    this.img = undefined;
    this.el.classList.toggle('has-image', false);
    const fb = this.config.fallback ?? 'image';
    this.ph.replaceChildren(/[/.]/.test(fb) ? '' : iconEl(fb));
    if (!src) return;
    const img = (this.img = h('img', 'op-image__img', { src, alt: this.config.alt ?? '', draggable: 'false', loading: this.config.eager ? 'eager' : 'lazy', decoding: 'async' }));
    img.addEventListener('load', () => this.el.classList.add('has-image'));
    img.addEventListener('error', () => {
      img.remove();
      this.img = undefined;
      // a second URL is tried once; anything else leaves the icon
      if (!fallback && /[/.]/.test(this.config.fallback ?? '')) this.setSrc(this.config.fallback, true);
      this.emit('error');
    });
    this.el.append(img);
  }

  setAlt(alt: string) {
    this.config.alt = alt;
    if (this.img) this.img.alt = alt;
  }

  setRatio(ratio: string) {
    this.config.ratio = ratio;
    if (this.rendered) this.el.style.aspectRatio = ratio;
  }
}
register('image', Image);
