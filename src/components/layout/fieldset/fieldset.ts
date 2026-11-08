import { Container, type ContainerConfig } from '../../../core/container';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

export interface FieldSetConfig extends ContainerConfig {
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
}

export class FieldSet extends Container<FieldSetConfig> {
  protected override baseCls = 'op-fieldset';
  protected override tag = 'fieldset' as const;
  private legend!: HTMLElement;
  private bodyEl!: HTMLElement;
  private toggleBtn?: HTMLButtonElement;

  override getBody() {
    return this.bodyEl;
  }

  protected override build() {
    const el = super.build();
    this.legend = h('legend', 'op-fieldset__legend');
    this.bodyEl = h('div', 'op-fieldset__body');
    el.append(this.legend, this.bodyEl);
    return el;
  }

  protected override onRender() {
    this.config.layout ??= { type: 'vbox' };
    super.onRender();
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
    if (!text) this.legend.append((text = h('span', 'op-fieldset__title')));
    text.textContent = title;
    this.legend.hidden = !title && !this.config.collapsible;
  }

  setCollapsed(collapsed: boolean) {
    this.config.collapsed = collapsed;
    if (!this.rendered) return;
    this.el.classList.toggle('is-collapsed', collapsed);
    this.bodyEl.hidden = collapsed;
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
