import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../icon/icon';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export interface BadgeConfig extends ComponentConfig {
  text?: string | number;
  tone?: Tone;
  icon?: string;
  /** A small colored dot before the text (a status light). */
  dot?: boolean;
}

/** A small status label or count: "Paid", "3 new", "Beta". Not interactive (see Chip for that). */
export class Badge extends Component<BadgeConfig> {
  protected override baseCls = 'op-badge';
  protected override tag = 'span' as const;
  private textEl!: HTMLElement;

  protected override onRender() {
    const c = this.config;
    if (c.dot) this.el.append(h('span', 'op-badge__dot', { 'aria-hidden': 'true' }));
    if (c.icon) this.el.append(iconEl(c.icon));
    this.textEl = this.el.appendChild(h('span', 'op-badge__text'));
    this.setText(c.text ?? '');
    this.setTone(c.tone ?? 'neutral');
  }

  setText(text: string | number) {
    this.config.text = text;
    if (this.rendered) this.textEl.textContent = String(text);
  }
  setTone(tone: Tone) {
    this.config.tone = tone;
    if (!this.rendered) return;
    this.el.className = this.el.className.replace(/\bop-badge--\w+/g, '').trim();
    this.el.classList.add(`op-badge--${tone}`);
  }
}
register('badge', Badge);
