import { Container, type ContainerConfig } from '../../../core/container';
import { register } from '../../../core/registry';
import { h, uid } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

export interface FieldSetConfig extends ContainerConfig {
  title?: string;
  /** A line under the legend, read as the group's description. */
  description?: string;
  /** `box` (a framed group, default), `line` (a rule under the legend, no frame) or `plain` (just the legend). */
  variant?: 'box' | 'line' | 'plain';
  /** Shortcut for a responsive grid layout; items take `colspan` (a number or `'full'`). */
  columns?: number;
  collapsible?: boolean;
  collapsed?: boolean;
}

export class FieldSet extends Container<FieldSetConfig> {
  protected override baseCls = 'op-fieldset';
  protected override tag = 'fieldset' as const;
  private legend!: HTMLElement;
  private bodyEl!: HTMLElement;
  private toggleBtn?: HTMLButtonElement;
  private descEl!: HTMLElement;

  override getBody() {
    return this.bodyEl;
  }

  protected override build() {
    const el = super.build();
    this.legend = h('legend', 'op-fieldset__legend');
    this.descEl = h('p', 'op-fieldset__desc', { id: uid('op-fs-desc') });
    this.bodyEl = h('div', 'op-fieldset__body');
    el.append(this.legend, this.descEl, this.bodyEl);
    return el;
  }

  protected override onRender() {
    this.config.layout ??= this.config.columns ? { type: 'grid', columns: this.config.columns } : { type: 'vbox' };
    super.onRender();
    this.setVariant(this.config.variant ?? 'box');
    this.setDescription(this.config.description ?? '');
    if (this.config.collapsible) {
      this.toggleBtn = h('button', 'op-fieldset__toggle', { type: 'button' }, iconEl('chevron-up'));
      this.listen(this.toggleBtn, 'click', () => this.toggle());
      this.legend.prepend(this.toggleBtn);
    }
    this.setTitle(this.config.title ?? '');
    this.setCollapsed(!!this.config.collapsed);
  }

  setTitle(title: string) {
    this.config.title = title;
    if (!this.rendered) return;
    let text = this.legend.querySelector('.op-fieldset__title');
    if (!text) {
      this.legend.append((text = h('span', 'op-fieldset__title')));
      if (this.config.collapsible) this.listen(text, 'click', () => this.toggle()); // the title toggles too (the chevron is the button)
    }
    text.textContent = title;
    this.legend.hidden = !title && !this.config.collapsible;
  }

  setDescription(text: string) {
    this.config.description = text;
    if (!this.rendered) return;
    this.descEl.textContent = text;
    this.descEl.hidden = !text;
    if (text) this.el.setAttribute('aria-describedby', this.descEl.id);
    else this.el.removeAttribute('aria-describedby');
  }

  setVariant(variant: 'box' | 'line' | 'plain') {
    this.config.variant = variant;
    if (!this.rendered) return;
    for (const v of ['box', 'line', 'plain']) this.el.classList.toggle(`op-fieldset--${v}`, v === variant);
  }

  setCollapsed(collapsed: boolean) {
    this.config.collapsed = collapsed;
    if (!this.rendered) return;
    this.el.classList.toggle('is-collapsed', collapsed);
    this.bodyEl.hidden = collapsed;
    if (collapsed) this.descEl.hidden = true;
    else this.descEl.hidden = !this.config.description;
    this.toggleBtn?.setAttribute('aria-expanded', String(!collapsed));
    this.toggleBtn?.setAttribute('aria-label', t(collapsed ? 'expand' : 'collapse'));
  }
  collapse() {
    if (this.config.collapsed || this.emit('before-collapse') === false) return;
    this.setCollapsed(true);
    this.emit('collapse');
  }
  expand() {
    if (!this.config.collapsed || this.emit('before-expand') === false) return;
    this.setCollapsed(false);
    this.emit('expand');
  }
  toggle() {
    if (this.config.collapsed) this.expand();
    else this.collapse();
  }
}
register('fieldset', FieldSet);
