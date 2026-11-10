import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { addMessages, t } from '../../../core/i18n';
import { Field } from '../../../core/field';
import type { Form } from '../form/form';

addMessages('en', { feOne: 'Fix 1 problem before saving', feMany: 'Fix {n} problems before saving' });
addMessages('pt-BR', { feOne: 'Corrija 1 problema antes de salvar', feMany: 'Corrija {n} problemas antes de salvar' });

export interface FormErrorsConfig extends ComponentConfig {
  /** The heading: a function of the number of problems, or a fixed text. */
  title?: string | ((n: number) => string);
  /** Take the focus after a failed submit (instead of the first invalid field). */
  focus?: boolean;
}

/** An error summary: after a failed validation, every problem as a button that takes you to its field. */
export class FormErrors extends Component<FormErrorsConfig> {
  protected override baseCls = 'op-formerrors';
  private titleEl!: HTMLElement;
  private listEl!: HTMLElement;
  private form?: Form;
  /** Shown only once the form was validated with errors (not while the user is still filling it in). */
  private active = false;

  protected override build() {
    this.titleEl = h('div', 'op-formerrors__title');
    this.listEl = h('ul', 'op-formerrors__list');
    return h('div', 'op-formerrors', { role: 'alert', tabindex: -1 }, this.titleEl, this.listEl);
  }

  protected override onRender() {
    this.el.hidden = true;
    let p = this.parent as Component | undefined;
    while (p && !('focusField' in p && 'getFields' in p)) p = p.parent as Component | undefined; // the Form, by its methods (no import)
    const form = (this.form = p as Form | undefined);
    if (!form) return;
    form.on('invalid', () => {
      this.active = true;
      this.refresh();
      if (this.config.focus) this.el.focus();
    });
    for (const f of form.getFields()) for (const ev of ['invalid', 'valid']) f.on(ev, () => this.active && this.refresh());
    this.listen(this.listEl, 'click', (e: Event) => {
      const i = Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i);
      const field = this.getErrors()[i];
      if (!field) return;
      form.focusField(field);
      this.emit('go', field);
    });
  }

  /** The form fields that have an error, in order. */
  getErrors(): Field<any>[] {
    return this.form?.getFields().filter((f) => f.getError()) ?? [];
  }

  /** Redraws the list from the current errors (hides when there are none). */
  refresh(): void {
    const errs = this.getErrors();
    const n = errs.length;
    const title = this.config.title;
    this.titleEl.textContent = typeof title === 'function' ? title(n) : (title ?? t(n === 1 ? 'feOne' : 'feMany', { n }));
    this.listEl.replaceChildren(...errs.map((f, i) => h('li', '', {}, h('button', 'op-formerrors__link', { type: 'button', 'data-i': i }, `${f.config.label ?? f.name ?? ''}: ${f.getError()}`))));
    this.el.hidden = !n;
  }
}
register('formerrors', FormErrors);
