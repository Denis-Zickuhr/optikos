import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { addMessages, t } from '../../../core/i18n';
import { Button, type ButtonConfig } from '../../base/button/button';
import type { Form } from '../form/form';

addMessages('en', { faSave: 'Save', faDirty: 'Unsaved changes' });
addMessages('pt-BR', { faSave: 'Salvar', faDirty: 'Alterações não salvas' });

export interface FormActionsConfig extends ComponentConfig {
  submitText?: string;
  /** `false` hides Cancel. */
  cancelText?: string | false;
  /** Extra buttons, before Cancel. */
  buttons?: ButtonConfig[];
  /** Sticks to the bottom of the scrolling area. */
  sticky?: boolean;
  /** Save is disabled until the form has changes. */
  requireChanges?: boolean;
  /** The "Unsaved changes" line. Default true. */
  status?: boolean;
}

/** The form's action bar: Cancel (resets), Save (submits) and an "Unsaved changes" status. */
export class FormActions extends Component<FormActionsConfig> {
  protected override baseCls = 'op-formactions';
  private statusEl!: HTMLElement;
  private buttonsEl!: HTMLElement;
  private form?: Form;
  private save!: Button;
  private cancel?: Button;
  private extra: Button[] = [];

  protected override build() {
    this.statusEl = h('span', 'op-formactions__status', { 'aria-live': 'polite' });
    this.buttonsEl = h('div', 'op-formactions__buttons');
    return h('div', 'op-formactions', {}, this.statusEl, this.buttonsEl);
  }

  protected override onRender() {
    const c = this.config;
    let p = this.parent as Component | undefined;
    while (p && !('focusField' in p && 'getFields' in p)) p = p.parent as Component | undefined; // the Form, by its methods (no import)
    this.form = p as Form | undefined;
    this.extra = (c.buttons ?? []).map((b) => new Button(b));
    this.save = new Button({ text: c.submitText ?? t('faSave'), variant: 'primary', htmlType: 'submit' });
    this.buttonsEl.append(...this.extra.map((b) => b.el), this.save.el);
    this.setCancelText(c.cancelText ?? t('cancel'));
    this.setSticky(!!c.sticky);
    this.form?.on('dirty-change', () => this.paint());
    this.own(() => [...this.extra, this.save, this.cancel].forEach((b) => b?.destroy()));
    this.paint();
  }

  private paint() {
    const dirty = !!this.form?.isDirty();
    this.el.classList.toggle('is-dirty', dirty);
    this.statusEl.textContent = dirty && this.config.status !== false ? t('faDirty') : '';
    this.save.setDisabled(!!this.config.requireChanges && !dirty);
  }

  getForm(): Form | undefined {
    return this.form;
  }

  setSubmitText(text: string) {
    this.config.submitText = text;
    this.save?.setText(text);
  }

  /** The Cancel button's text, or `false` to hide it. Cancel emits `cancel` (return false to keep the changes), then resets. */
  setCancelText(text: string | false) {
    this.config.cancelText = text;
    if (!this.rendered) return;
    if (text === false) return void (this.cancel?.destroy(), (this.cancel = undefined));
    if (this.cancel) return this.cancel.setText(text);
    this.cancel = new Button({ text, handler: () => this.emit('cancel') !== false && this.form?.reset() });
    this.buttonsEl.insertBefore(this.cancel.el, this.save.el);
  }

  setSticky(sticky: boolean) {
    this.config.sticky = sticky;
    if (this.rendered) this.el.classList.toggle('is-sticky', sticky);
  }
}
register('formactions', FormActions);
