import { Container, type ContainerConfig } from '../../../core/container';
import { register } from '../../../core/registry';
import { h, uid } from '../../../core/dom';

export interface FormSectionConfig extends ContainerConfig {
  title?: string;
  description?: string;
  /** Title and description in a column beside the fields (default); `false` stacks them above. */
  aside?: boolean;
  /** Shortcut for a responsive grid layout of the fields; items take `colspan` (a number or `'full'`). */
  columns?: number;
  /** A rule between consecutive sections. Default true. */
  divider?: boolean;
}

/** A titled part of a long form, "settings page" style: title and description on the left, fields on the right. */
export class FormSection extends Container<FormSectionConfig> {
  protected override baseCls = 'op-formsection';
  protected override tag = 'section' as const;
  private titleEl!: HTMLElement;
  private descEl!: HTMLElement;
  private bodyEl!: HTMLElement;

  override getBody() {
    return this.bodyEl;
  }

  protected override build() {
    const el = super.build();
    this.titleEl = h('h3', 'op-formsection__title', { id: uid('op-fsec') });
    this.descEl = h('p', 'op-formsection__desc', { id: uid('op-fsec-desc') });
    this.bodyEl = h('div', 'op-formsection__body');
    el.append(h('div', 'op-formsection__aside', {}, this.titleEl, this.descEl), this.bodyEl);
    el.setAttribute('aria-labelledby', this.titleEl.id);
    return el;
  }

  protected override onRender() {
    const c = this.config;
    c.layout ??= c.columns ? { type: 'grid', columns: c.columns } : { type: 'vbox' };
    super.onRender();
    this.el.classList.toggle('op-formsection--divided', c.divider !== false);
    this.setTitle(c.title ?? '');
    this.setDescription(c.description ?? '');
    this.setAside(c.aside !== false);
  }

  setTitle(title: string) {
    this.config.title = title;
    if (!this.rendered) return;
    this.titleEl.textContent = title;
    this.titleEl.hidden = !title;
  }

  setDescription(text: string) {
    this.config.description = text;
    if (!this.rendered) return;
    this.descEl.textContent = text;
    this.descEl.hidden = !text;
    if (text) this.el.setAttribute('aria-describedby', this.descEl.id);
    else this.el.removeAttribute('aria-describedby');
  }

  /** Title beside the fields (true) or always above them (false). */
  setAside(aside: boolean) {
    this.config.aside = aside;
    if (this.rendered) this.el.classList.toggle('op-formsection--stacked', !aside);
  }
}
register('formsection', FormSection);
