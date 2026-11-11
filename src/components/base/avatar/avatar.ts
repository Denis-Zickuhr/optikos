import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';

export interface AvatarConfig extends ComponentConfig {
  /** A person's or team's name: the initials when there is no picture, and the accessible name. */
  name?: string;
  /** Picture URL. If it fails to load the initials show. */
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'away' | 'busy' | 'offline';
}

const initials = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
};
const hue = (name: string) => [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 8;

/** A picture or the initials of a name, on a color picked from the name (so the same person always looks the same). */
export class Avatar extends Component<AvatarConfig> {
  protected override baseCls = 'op-avatar';
  private img?: HTMLImageElement;
  private text!: HTMLElement;
  private dot!: HTMLElement;

  protected override build() {
    this.text = h('span', 'op-avatar__text', { 'aria-hidden': 'true' });
    this.dot = h('span', 'op-avatar__status');
    return h('span', this.baseCls, { role: 'img' }, this.text, this.dot);
  }

  protected override onRender() {
    const c = this.config;
    this.el.classList.add(`op-avatar--${c.size ?? 'md'}`, `op-avatar--${c.shape ?? 'circle'}`);
    this.setName(c.name ?? '');
    this.setSrc(c.src);
    this.setStatus(c.status);
  }

  setName(name: string) {
    this.config.name = name;
    if (!this.rendered) return;
    this.text.textContent = initials(name);
    this.el.style.setProperty('--op-avatar-c', hue(name) ? `var(--op-chart-${hue(name) + 1})` : 'var(--op-chart-1, var(--op-color-primary))');
    this.el.setAttribute('aria-label', this.config.ariaLabel ?? name);
    if (this.img) this.img.alt = '';
  }

  setSrc(src: string | undefined) {
    this.config.src = src;
    if (!this.rendered) return;
    this.img?.remove();
    this.img = undefined;
    this.el.classList.remove('has-image');
    if (!src) return;
    const img = (this.img = h('img', 'op-avatar__img', { src, alt: '', draggable: 'false' }));
    img.addEventListener('load', () => this.el.classList.add('has-image'));
    img.addEventListener('error', () => (img.remove(), this.el.classList.remove('has-image')));
    this.el.prepend(img);
  }

  setStatus(status: AvatarConfig['status']) {
    this.config.status = status;
    if (!this.rendered) return;
    this.dot.hidden = !status;
    this.dot.className = `op-avatar__status${status ? ` is-${status}` : ''}`;
  }
}
register('avatar', Avatar);
