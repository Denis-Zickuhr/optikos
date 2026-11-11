import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../icon/icon';

export interface LabelConfig extends ComponentConfig {
  text?: string;
  /** Id of the field this label names (renders a `<label for>`). */
  for?: string;
  variant?: 'default' | 'muted' | 'title';
  /** The element: `h1`…`h6` make it a heading, `p` a paragraph. Default `span` (`label` with `for`). */
  tag?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** An icon before the text. */
  icon?: string;
  /** An image before the text (a logo): `alt` names it (empty for a decorative one). */
  src?: string;
  alt?: string;
}

export class Label extends Component<LabelConfig> {
  protected override baseCls = 'op-label';
  protected override build() {
    const el = document.createElement(this.config.for ? 'label' : (this.config.tag ?? 'span'));
    el.className = 'op-label';
    if (this.config.for) (el as HTMLLabelElement).htmlFor = this.config.for;
    return el;
  }
  protected override onRender() {
    this.paint();
    this.setVariant(this.config.variant ?? 'default');
  }
  private paint() {
    const { src, alt, icon, text } = this.config;
    const media = src ? h('img', 'op-label__image', { src, alt: alt ?? '' }) : icon ? iconEl(icon) : null;
    this.el.classList.toggle('op-label--media', !!media);
    this.el.replaceChildren(...(media ? [media] : []), text ?? '');
  }
  setText(text: string) {
    this.config.text = text;
    if (this.rendered) this.paint();
  }
  setIcon(icon: string | undefined) {
    this.config.icon = icon;
    if (this.rendered) this.paint();
  }
  setImage(src: string | undefined, alt?: string) {
    Object.assign(this.config, { src, alt });
    if (this.rendered) this.paint();
  }
  setVariant(variant: NonNullable<LabelConfig['variant']>) {
    this.config.variant = variant;
    if (!this.rendered) return;
    for (const v of ['default', 'muted', 'title']) this.el.classList.toggle(`op-label--${v}`, v === variant);
  }
}
register('label', Label);
