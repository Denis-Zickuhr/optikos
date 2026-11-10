import { Container, type ContainerConfig } from '../../../core/container';
import { Field } from '../../../core/field';
import { register } from '../../../core/registry';
import { h, uid } from '../../../core/dom';
import type { Component } from '../../../core/component';

export interface FieldGroupConfig extends ContainerConfig {
  label?: string;
  help?: string;
  /** The `*` marker (also shown when any field inside is required). */
  required?: boolean;
  /** Default: the form's `labelPos`. */
  labelPos?: 'top' | 'left';
  /** Under this width (px) the row becomes a column. */
  stackBelow?: number;
}

/** Several inputs read as one field: one label, one help line and one error line over a row of fields. */
export class FieldGroup extends Container<FieldGroupConfig> {
  protected override baseCls = 'op-field op-fieldgroup';
  private labelEl!: HTMLElement;
  private bodyEl!: HTMLElement;
  private helpEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private error = '';

  constructor(config: FieldGroupConfig = {}) {
    super(config);
    // the fields keep their labels for screen readers only: their own label position must not shape the row
    // a field that sets a width keeps it; the others share what is left
    for (const c of this.items) if (c.config.width != null && c.config.flex == null) c.config.flex = 'none' as never;
    for (const f of this.getFields()) {
      f.config.labelPos = 'top';
      for (const ev of ['invalid', 'valid']) f.on(ev, () => this.paintError()); // also before the group is rendered
    }
  }

  override getBody() {
    return this.bodyEl;
  }

  /** The fields inside (also inside nested containers). */
  getFields(): Field<any>[] {
    return this.query((c) => c instanceof Field) as Field<any>[];
  }

  getError(): string {
    return this.error;
  }

  protected override build() {
    const el = super.build();
    this.labelEl = h('div', 'op-field__label', { id: uid('op-fg') });
    this.bodyEl = h('div', 'op-fieldgroup__body');
    this.helpEl = h('div', 'op-field__help', { id: uid('op-fg-help') });
    this.errorEl = h('div', 'op-field__error', { id: uid('op-fg-err'), role: 'alert' });
    el.append(this.labelEl, h('div', 'op-field__control', {}, this.bodyEl), this.helpEl, this.errorEl);
    el.setAttribute('role', 'group');
    el.setAttribute('aria-labelledby', this.labelEl.id);
    return el;
  }

  protected override onRender() {
    const c = this.config;
    c.layout ??= { type: 'hbox', stackBelow: c.stackBelow };
    super.onRender();
    let pos = c.labelPos;
    for (let p: Component | undefined = this.parent as Component | undefined; !pos && p; p = p.parent as Component | undefined) pos = (p.config as FieldGroupConfig).labelPos;
    this.el.classList.toggle('op-field--label-left', pos === 'left');
    this.setLabel(c.label ?? '');
    this.setHelp(c.help ?? '');
    this.el.classList.toggle('is-required', !!c.required || this.getFields().some((f) => f.config.required));
    this.listen(this.labelEl, 'click', () => this.getFields()[0]?.focus());
    this.error = '';
    this.paintError();
  }

  /** The group shows the first error of its fields, in one line. */
  private paintError() {
    const msg = this.getFields().map((f) => f.getError()).find(Boolean) ?? '';
    if (msg === this.error) return;
    this.error = msg;
    if (!this.rendered) return;
    this.errorEl.textContent = msg;
    this.el.classList.toggle('is-invalid', !!msg);
    this.describe();
    this.emit(msg ? 'invalid' : 'valid', msg);
  }

  private describe() {
    const ids = [this.error && this.errorEl.id, this.config.help && this.helpEl.id].filter(Boolean);
    if (ids.length) this.el.setAttribute('aria-describedby', ids.join(' '));
    else this.el.removeAttribute('aria-describedby');
  }

  setLabel(label: string) {
    this.config.label = label;
    if (!this.rendered) return;
    this.labelEl.textContent = label;
    this.labelEl.hidden = !label;
  }

  setHelp(help: string) {
    this.config.help = help;
    if (!this.rendered) return;
    this.helpEl.textContent = help;
    this.helpEl.hidden = !help;
    this.describe();
  }
}
register('fieldgroup', FieldGroup);
