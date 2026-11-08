import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';

export interface LabelConfig extends ComponentConfig {
  text?: string;
  /** Id of the field this label names (renders a `<label for>`). */
  for?: string;
  variant?: 'default' | 'muted' | 'title';
}

export class Label extends Component<LabelConfig> {
  protected override baseCls = 'op-label';
  protected override build() {
    const el = document.createElement(this.config.for ? 'label' : 'span');
    el.className = 'op-label';
    if (this.config.for) (el as HTMLLabelElement).htmlFor = this.config.for;
    return el;
  }
  protected override onRender() {
    this.setText(this.config.text ?? '');
    this.setVariant(this.config.variant ?? 'default');
  }
  setText(text: string) {
    this.config.text = text;
    if (this.rendered) this.el.textContent = text;
  }
  setVariant(variant: NonNullable<LabelConfig['variant']>) {
    this.config.variant = variant;
    if (!this.rendered) return;
    for (const v of ['default', 'muted', 'title']) this.el.classList.toggle(`op-label--${v}`, v === variant);
  }
}
register('label', Label);
